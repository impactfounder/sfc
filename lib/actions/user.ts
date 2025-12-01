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

export async function updateProfileVisibility(isPublic: boolean) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error("Unauthorized")
  }

  // Update is_profile_public in profiles table
  const { error } = await supabase
    .from("profiles")
    .update({ is_profile_public: isPublic })
    .eq("id", user.id)

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath("/community/profile")
  revalidatePath("/member")
  return { success: true }
}

export async function updateProfileInfo(data: {
  full_name?: string
  company?: string
  position?: string
  company_2?: string
  position_2?: string
  introduction?: string
  is_profile_public?: boolean
  linkedin_url?: string
  instagram_url?: string
  threads_url?: string
  website_url?: string
}) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      throw new Error("Unauthorized")
    }

    // URL 유효성 검사 함수
    const isValidUrl = (url: string | undefined): boolean => {
      if (!url || !url.trim()) return true // 빈 값은 허용
      try {
        new URL(url)
        return true
      } catch {
        return false
      }
    }

    // 각 소셜 링크 유효성 검사
    if (data.linkedin_url && !isValidUrl(data.linkedin_url)) {
      throw new Error("LinkedIn URL 형식이 올바르지 않습니다.")
    }
    if (data.instagram_url && !isValidUrl(data.instagram_url)) {
      throw new Error("Instagram URL 형식이 올바르지 않습니다.")
    }
    if (data.threads_url && !isValidUrl(data.threads_url)) {
      throw new Error("Threads URL 형식이 올바르지 않습니다.")
    }
    if (data.website_url && !isValidUrl(data.website_url)) {
      throw new Error("웹사이트 URL 형식이 올바르지 않습니다.")
    }

    // Update profile info
    // null 값 처리를 명확하게 하여 DB 에러 방지
    const updates: any = {
      full_name: data.full_name?.trim() || null,
      company: data.company?.trim() || null,
      position: data.position?.trim() || null,
      company_2: data.company_2?.trim() || null,
      position_2: data.position_2?.trim() || null,
      introduction: data.introduction?.trim() || null,
      is_profile_public: data.is_profile_public ?? false,
      updated_at: new Date().toISOString(),
    }

    // 소셜 링크도 일단 포함 시도
    const socialUpdates = {
      linkedin_url: data.linkedin_url?.trim() || null,
      instagram_url: data.instagram_url?.trim() || null,
      threads_url: data.threads_url?.trim() || null,
      website_url: data.website_url?.trim() || null,
    }

    // 1. 전체 업데이트 시도
    const { error } = await supabase
      .from("profiles")
      .update({ ...updates, ...socialUpdates })
      .eq("id", user.id)

    if (error) {
      console.error("Supabase Update Error (Full):", error)
      
      // 2. 만약 컬럼 없음 에러라면 기본 정보만이라도 업데이트 시도
      // company_2, position_2도 없을 수 있으므로, 가장 기본 컬럼들만 업데이트 시도
      if (error.code === 'PGRST204' || error.message.includes("Could not find the")) {
        console.log("Retrying update with minimal columns...")
        const basicUpdates = {
          full_name: updates.full_name,
          company: updates.company,
          position: updates.position,
          introduction: updates.introduction,
          is_profile_public: updates.is_profile_public,
          updated_at: updates.updated_at,
        }
        const { error: retryError } = await supabase
          .from("profiles")
          .update(basicUpdates)
          .eq("id", user.id)
          
        if (retryError) {
          throw new Error(retryError.message)
        }
        // 부분 성공
        return { success: true, warning: "기본 정보는 저장되었으나, 추가 정보(두 번째 소속, 소셜 링크 등) 저장에 실패했습니다. (DB 업데이트 필요)" }
      }
      
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
