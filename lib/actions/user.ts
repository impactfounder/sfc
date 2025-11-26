"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function updateProfileAvatar(avatarUrl: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error("Unauthorized")
  }

  // Update avatar_url in profiles table
  const { error } = await supabase
    .from("profiles")
    .update({ avatar_url: avatarUrl })
    .eq("id", user.id)

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath("/community/profile")
  return { success: true }
}

export async function updateProfileInfo(data: {
  full_name?: string
  company?: string
  position?: string
  introduction?: string
  is_profile_public?: boolean
}) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      throw new Error("Unauthorized")
    }

    // Update profile info
    // null 값 처리를 명확하게 하여 DB 에러 방지
    const updates = {
      full_name: data.full_name?.trim() || null,
      company: data.company?.trim() || null,
      position: data.position?.trim() || null,
      introduction: data.introduction?.trim() || null,
      is_profile_public: data.is_profile_public ?? false,
      updated_at: new Date().toISOString(), // 업데이트 시간 갱신
    }

    const { error } = await supabase
      .from("profiles")
      .update(updates)
      .eq("id", user.id)

    if (error) {
      console.error("Supabase Update Error:", error)
      throw new Error(error.message)
    }

    revalidatePath("/community/profile")
    revalidatePath("/member")
    return { success: true }
    
  } catch (error) {
    console.error("updateProfileInfo Error:", error)
    const errorMessage = error instanceof Error ? error.message : "Failed to update profile"
    return { success: false, error: errorMessage }
  }
}

