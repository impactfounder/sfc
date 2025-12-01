"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

/**
 * 커뮤니티 가입
 */
export async function joinCommunity(communityId: string) {
    const supabase = await createClient()

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        throw new Error("로그인이 필요합니다.")
    }

    // 이미 가입되어 있는지 확인
    const { data: existing } = await supabase
        .from("community_members")
        .select("id")
        .eq("community_id", communityId)
        .eq("user_id", user.id)
        .single()

    if (existing) {
        throw new Error("이미 참여 중인 커뮤니티입니다.")
    }

    // 커뮤니티 멤버로 추가
    const { error } = await supabase
        .from("community_members")
        .insert({
            community_id: communityId,
            user_id: user.id,
        })

    if (error) {
        console.error("커뮤니티 가입 오류:", error)
        throw new Error("커뮤니티 가입에 실패했습니다.")
    }

    revalidatePath("/community")
    return { success: true }
}

/**
 * 커뮤니티 탈퇴
 */
export async function leaveCommunity(communityId: string) {
    const supabase = await createClient()

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        throw new Error("로그인이 필요합니다.")
    }

    // 커뮤니티 멤버에서 제거
    const { error } = await supabase
        .from("community_members")
        .delete()
        .eq("community_id", communityId)
        .eq("user_id", user.id)

    if (error) {
        console.error("커뮤니티 탈퇴 오류:", error)
        throw new Error("커뮤니티 탈퇴에 실패했습니다.")
    }

    revalidatePath("/community")
    return { success: true }
}

/**
 * 멤버십 확인
 */
export async function checkMembership(communityId: string, userId: string) {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from("community_members")
        .select("id")
        .eq("community_id", communityId)
        .eq("user_id", userId)
        .single()

    if (error && error.code !== "PGRST116") {
        console.error("멤버십 확인 오류:", error)
        return false
    }

    return !!data
}

/**
 * 커뮤니티 ID 조회 (board_categories slug로부터)
 */
export async function getCommunityIdBySlug(slug: string) {
    const supabase = await createClient()

    // board_categories에서 커뮤니티 이름 가져오기
    const { data: category } = await supabase
        .from("board_categories")
        .select("name")
        .eq("slug", slug)
        .single()

    if (!category) {
        return null
    }

    // communities 테이블에서 ID 가져오기
    const { data: community } = await supabase
        .from("communities")
        .select("id")
        .eq("name", category.name)
        .single()

    return community?.id || null
}
