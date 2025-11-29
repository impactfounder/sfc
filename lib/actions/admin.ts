"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { isMasterAdmin } from "@/lib/utils"

export async function updateUserRole(userId: string, role: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error("Unauthorized")
  }

  // Check if current user is master admin (only master can change roles)
  const { data: profile } = await supabase
    .from("profiles")
    .select("role, email")
    .eq("id", user.id)
    .single()

  if (!profile || !isMasterAdmin(profile.role, profile.email)) {
    throw new Error("Unauthorized: Only master admins can change user roles")
  }

  // Validate role value
  if (!["member", "admin", "master"].includes(role)) {
    throw new Error("Invalid role value")
  }

  // Prevent changing own role from master to something else
  if (user.id === userId && profile.role === "master" && role !== "master") {
    throw new Error("Cannot change your own master role")
  }

  // Update role
  const { error } = await supabase.from("profiles").update({ role }).eq("id", userId)

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath("/admin/users")
  revalidatePath("/admin/roles")
  return { success: true }
}

export async function updateUserMembershipTier(userId: string, membershipTier: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error("Unauthorized")
  }

  // Check if current user is admin or master
  const { data: profile } = await supabase
    .from("profiles")
    .select("role, email")
    .eq("id", user.id)
    .single()

  if (!profile) {
    throw new Error("Unauthorized")
  }

  // Use isAdmin helper to check admin or master
  const { isAdmin } = await import("@/lib/utils")
  if (!isAdmin(profile.role, profile.email)) {
    throw new Error("Unauthorized")
  }

  // Update membership tier
  const { error } = await supabase.from("profiles").update({ membership_tier: membershipTier }).eq("id", userId)

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath("/admin/users")
  return { success: true }
}

export async function updateBadgeStatus(userBadgeId: string, status: 'approved' | 'rejected') {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error("Unauthorized")
  }

  // Check if current user is admin or master
  const { data: profile } = await supabase
    .from("profiles")
    .select("role, email")
    .eq("id", user.id)
    .single()

  if (!profile) {
    throw new Error("Unauthorized")
  }

  // Use isAdmin helper to check admin or master
  const { isAdmin } = await import("@/lib/utils")
  if (!isAdmin(profile.role, profile.email)) {
    throw new Error("Unauthorized: Only admins can update badge status")
  }

  // Update badge status
  const updateData: { status: string; is_visible?: boolean } = { status }
  
  // 승인 시 is_visible을 true로 설정
  if (status === 'approved') {
    updateData.is_visible = true
  } else {
    // 거절 시 is_visible을 false로 유지
    updateData.is_visible = false
  }

  const { error } = await supabase
    .from("user_badges")
    .update(updateData)
    .eq("id", userBadgeId)

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath("/admin/badges")
  return { success: true }
}

export async function createBadge(name: string, icon: string, category: string, description: string | null) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error("Unauthorized")
  }

  // Check if current user is admin or master
  const { data: profile } = await supabase
    .from("profiles")
    .select("role, email")
    .eq("id", user.id)
    .single()

  if (!profile) {
    throw new Error("Unauthorized")
  }

  // Use isAdmin helper to check admin or master
  const { isAdmin } = await import("@/lib/utils")
  if (!isAdmin(profile.role, profile.email)) {
    throw new Error("Unauthorized: Only admins can create badges")
  }

  // Insert new badge
  const { error } = await supabase
    .from("badges")
    .insert({
      name,
      icon,
      category,
      description,
    })

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath("/admin")
  revalidatePath("/about")
  return { success: true }
}

export async function updateBadge(badgeId: string, name: string, icon: string, category: string, description: string | null) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error("Unauthorized")
  }

  // Check if current user is admin or master
  const { data: profile } = await supabase
    .from("profiles")
    .select("role, email")
    .eq("id", user.id)
    .single()

  if (!profile) {
    throw new Error("Unauthorized")
  }

  // Use isAdmin helper to check admin or master
  const { isAdmin } = await import("@/lib/utils")
  if (!isAdmin(profile.role, profile.email)) {
    throw new Error("Unauthorized: Only admins can update badges")
  }

  // Update badge
  const { error } = await supabase
    .from("badges")
    .update({
      name,
      icon,
      category,
      description,
    })
    .eq("id", badgeId)

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath("/admin")
  revalidatePath("/about")
  return { success: true }
}

export async function deleteBadge(badgeId: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error("Unauthorized")
  }

  // Check if current user is admin or master
  const { data: profile } = await supabase
    .from("profiles")
    .select("role, email")
    .eq("id", user.id)
    .single()

  if (!profile) {
    throw new Error("Unauthorized")
  }

  // Use isAdmin helper to check admin or master
  const { isAdmin } = await import("@/lib/utils")
  if (!isAdmin(profile.role, profile.email)) {
    throw new Error("Unauthorized: Only admins can delete badges")
  }

  // Delete badge (cascade delete will handle user_badges)
  const { error } = await supabase
    .from("badges")
    .delete()
    .eq("id", badgeId)

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath("/admin")
  revalidatePath("/about")
  return { success: true }
}

export async function toggleBadgeActive(badgeId: string, isActive: boolean) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error("Unauthorized")
  }

  // Check if current user is admin or master
  const { data: profile } = await supabase
    .from("profiles")
    .select("role, email")
    .eq("id", user.id)
    .single()

  if (!profile) {
    throw new Error("Unauthorized")
  }

  // Use isAdmin helper to check admin or master
  const { isAdmin } = await import("@/lib/utils")
  if (!isAdmin(profile.role, profile.email)) {
    throw new Error("Unauthorized: Only admins can toggle badge active status")
  }

  // Update badge active status
  // is_active 컬럼이 없을 수 있으므로 에러 처리
  // ⚠️ RLS 정책 확인 필요: Supabase의 Row Level Security 정책이 UPDATE를 막고 있을 수 있습니다.
  //    badges 테이블에 관리자(admin, master)가 UPDATE할 수 있는 정책이 있는지 확인하세요.
  console.log(`[toggleBadgeActive] 시작: badgeId=${badgeId}, isActive=${isActive}, userId=${user.id}`)
  
  const { data, error } = await supabase
    .from("badges")
    .update({ is_active: isActive })
    .eq("id", badgeId)
    .select() // 업데이트된 데이터를 반환받기 위해 .select() 추가

  if (error) {
    console.error("[toggleBadgeActive] Supabase 에러:", {
      code: error.code,
      message: error.message,
      details: error.details,
      hint: error.hint,
      badgeId,
      isActive,
      userId: user.id,
    })
    
    // 컬럼이 없는 경우 (42703: undefined_column)
    if (error.code === '42703') {
      throw new Error("is_active 컬럼이 데이터베이스에 없습니다. 마이그레이션 스크립트(034_add_badge_is_active.sql)를 실행해주세요.")
    }
    
    // RLS 정책 문제 (42501: insufficient_privilege)
    if (error.code === '42501') {
      throw new Error(`권한 부족: 뱃지 업데이트 권한이 없습니다. 관리자 권한을 확인해주세요. (에러 코드: ${error.code})`)
    }
    
    // 기타 에러
    throw new Error(`뱃지 상태 변경 실패: ${error.message} (에러 코드: ${error.code})`)
  }
  
  // 실제로 업데이트된 행이 있는지 확인
  if (!data || data.length === 0) {
    console.error("[toggleBadgeActive] DB 업데이트 실패: 수정된 행이 없습니다.", {
      badgeId,
      isActive,
      userId: user.id,
      returnedData: data,
      possibleCauses: [
        "RLS 정책이 UPDATE를 막고 있을 수 있습니다",
        "badgeId가 존재하지 않을 수 있습니다",
        "조건에 맞는 행이 없을 수 있습니다",
      ],
    })
    throw new Error("DB 업데이트 실패: 수정된 행이 없습니다. RLS 정책 또는 badgeId를 확인해주세요.")
  }
  
  console.log(`[toggleBadgeActive] 성공: badgeId=${badgeId}, updatedData=`, data)
  console.log(`[toggleBadgeActive] 업데이트된 행 수: ${data.length}`)

  revalidatePath("/admin")
  revalidatePath("/about")
  return { success: true, updatedData: data[0] }
}