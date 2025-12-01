"use server"

import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { revalidatePath } from "next/cache"
import { isAdmin } from "@/lib/utils"

/**
 * 커뮤니티 관리자 추가
 */
export async function addModerator(communityId: string, userId: string, role: "owner" | "moderator" = "moderator") {
    const supabase = await createClient()

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        throw new Error("로그인이 필요합니다.")
    }

    // 현재 사용자가 관리자 권한이 있는지 확인
    const { data: profile } = await supabase
        .from("profiles")
        .select("role, email")
        .eq("id", user.id)
        .single()

    const isGlobalAdmin = isAdmin(profile?.role, profile?.email)

    // 글로벌 관리자가 아니면 커뮤니티 owner인지 확인
    if (!isGlobalAdmin) {
        const { data: moderator } = await supabase
            .from("community_moderators")
            .select("role")
            .eq("community_id", communityId)
            .eq("user_id", user.id)
            .single()

        if (!moderator || moderator.role !== "owner") {
            throw new Error("권한이 없습니다. 커뮤니티 소유자만 관리자를 추가할 수 있습니다.")
        }
    }

    // Service Role Key를 사용하여 관리자 추가
    const supabaseAdmin = createAdminClient()

    const { error } = await supabaseAdmin
        .from("community_moderators")
        .insert({
            community_id: communityId,
            user_id: userId,
            role: role,
        })

    if (error) {
        console.error("관리자 추가 오류:", error)
        throw new Error("관리자 추가에 실패했습니다.")
    }

    revalidatePath("/community")
    return { success: true }
}

/**
 * 커뮤니티 관리자 제거
 */
export async function removeModerator(communityId: string, userId: string) {
    const supabase = await createClient()

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        throw new Error("로그인이 필요합니다.")
    }

    // 현재 사용자가 관리자 권한이 있는지 확인
    const { data: profile } = await supabase
        .from("profiles")
        .select("role, email")
        .eq("id", user.id)
        .single()

    const isGlobalAdmin = isAdmin(profile?.role, profile?.email)

    // 글로벌 관리자가 아니면 커뮤니티 owner인지 확인
    if (!isGlobalAdmin) {
        const { data: moderator } = await supabase
            .from("community_moderators")
            .select("role")
            .eq("community_id", communityId)
            .eq("user_id", user.id)
            .single()

        if (!moderator || moderator.role !== "owner") {
            throw new Error("권한이 없습니다. 커뮤니티 소유자만 관리자를 제거할 수 있습니다.")
        }
    }

    // Service Role Key를 사용하여 관리자 제거
    const supabaseAdmin = createAdminClient()

    const { error } = await supabaseAdmin
        .from("community_moderators")
        .delete()
        .eq("community_id", communityId)
        .eq("user_id", userId)

    if (error) {
        console.error("관리자 제거 오류:", error)
        throw new Error("관리자 제거에 실패했습니다.")
    }

    revalidatePath("/community")
    return { success: true }
}

/**
 * 커뮤니티 관리자 권한 확인
 */
export async function checkModeratorRole(communityId: string, userId: string) {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from("community_moderators")
        .select("role")
        .eq("community_id", communityId)
        .eq("user_id", userId)
        .single()

    if (error && error.code !== "PGRST116") {
        console.error("관리자 권한 확인 오류:", error)
        return null
    }

    return data?.role || null
}
