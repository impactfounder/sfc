"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function toggleBadgeVisibility(badgeId: string, isVisible: boolean) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error("Unauthorized")
  }

  // Update badge visibility
  const { error } = await supabase
    .from("user_badges")
    .update({ is_visible: isVisible })
    .eq("user_id", user.id)
    .eq("badge_id", badgeId)

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath("/community/profile")
  return { success: true }
}

export async function grantBadge(userId: string, badgeId: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error("Unauthorized")
  }

  // Check if badge already exists for user
  const { data: existing } = await supabase
    .from("user_badges")
    .select("id")
    .eq("user_id", userId)
    .eq("badge_id", badgeId)
    .single()

  if (existing) {
    throw new Error("이미 부여된 뱃지입니다.")
  }

  // Insert new user_badge
  const { error } = await supabase
    .from("user_badges")
    .insert({
      user_id: userId,
      badge_id: badgeId,
      is_visible: true, // 기본값으로 노출 설정
    })

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath("/community/profile")
  return { success: true }
}

export async function removeBadge(userBadgeId: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error("Unauthorized")
  }

  // Delete user_badge
  const { error } = await supabase
    .from("user_badges")
    .delete()
    .eq("id", userBadgeId)
    .eq("user_id", user.id)

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath("/community/profile")
  return { success: true }
}

