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

