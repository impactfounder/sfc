"use server"

import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { revalidatePath } from "next/cache"
import { isAdmin } from "@/lib/utils"

/**
 * 뱃지 카테고리 순서 업데이트
 * 
 * 주의: badge_categories 테이블에 sort_order 컬럼이 있어야 합니다.
 * 만약 컬럼이 없다면 다음 SQL을 실행하세요:
 * 
 * ALTER TABLE public.badge_categories
 * ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0 NOT NULL;
 * 
 * CREATE INDEX IF NOT EXISTS idx_badge_categories_sort_order 
 * ON public.badge_categories(sort_order);
 */
export async function updateBadgeCategoryOrder(items: { category_value: string; sort_order: number }[]) {
  // 사용자 인증 확인 (일반 클라이언트 사용)
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error("Unauthorized")
  }

  // 관리자 권한 확인
  const { data: profile } = await supabase
    .from("profiles")
    .select("role, email")
    .eq("id", user.id)
    .single()

  if (!profile || !isAdmin(profile.role, profile.email)) {
    throw new Error("Unauthorized: Only admins can update badge category order")
  }

  // RLS 우회를 위해 Service Role Key를 사용하는 관리자 클라이언트 사용
  const supabaseAdmin = createAdminClient()

  // 트랜잭션으로 일괄 업데이트
  const updates = items.map((item) =>
    supabaseAdmin
      .from("badge_categories")
      .update({ sort_order: item.sort_order, updated_at: new Date().toISOString() })
      .eq("category_value", item.category_value)
  )

  const results = await Promise.all(updates)

  // 에러 확인 및 상세 로깅
  const errors = results.filter((result) => result.error)
  if (errors.length > 0) {
    console.error("Failed to update badge category order:")
    console.error("Error details:", JSON.stringify(errors, null, 2))
    
    // 각 에러의 상세 정보 출력
    errors.forEach((result, index) => {
      console.error(`Error ${index + 1}:`, {
        message: result.error?.message,
        code: result.error?.code,
        details: result.error?.details,
        hint: result.error?.hint,
      })
    })
    
    throw new Error(
      `카테고리 순서 업데이트에 실패했습니다. ${errors.length}개의 항목에서 오류가 발생했습니다.` +
      ` 첫 번째 오류: ${errors[0]?.error?.message || "Unknown error"}`
    )
  }

  revalidatePath("/admin")
  revalidatePath("/about")
  return { success: true }
}

export async function createBadgeCategory(label: string, value: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    throw new Error("Unauthorized")
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, email")
    .eq("id", user.id)
    .single()

  if (!profile || !isAdmin(profile.role, profile.email)) {
    throw new Error("Unauthorized: Only admins can create badge categories")
  }

  const supabaseAdmin = createAdminClient()

  // 마지막 순서 조회
  const { data: lastCategory } = await supabaseAdmin
    .from("badge_categories")
    .select("sort_order")
    .order("sort_order", { ascending: false })
    .limit(1)
    .single()

  const nextOrder = (lastCategory?.sort_order ?? 0) + 1

  const { error } = await supabaseAdmin
    .from("badge_categories")
    .insert({
      category_label: label,
      category_value: value,
      sort_order: nextOrder,
    })

  if (error) {
    console.error("Failed to create badge category:", error)
    throw new Error(error.message)
  }

  revalidatePath("/admin")
  revalidatePath("/about")
  return { success: true }
}

export async function updateBadgeCategory(oldValue: string, label: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    throw new Error("Unauthorized")
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, email")
    .eq("id", user.id)
    .single()

  if (!profile || !isAdmin(profile.role, profile.email)) {
    throw new Error("Unauthorized: Only admins can update badge categories")
  }

  const supabaseAdmin = createAdminClient()

  const { error } = await supabaseAdmin
    .from("badge_categories")
    .update({
      category_label: label,
      updated_at: new Date().toISOString(),
    })
    .eq("category_value", oldValue)

  if (error) {
    console.error("Failed to update badge category:", error)
    throw new Error(error.message)
  }

  revalidatePath("/admin")
  revalidatePath("/about")
  return { success: true }
}

export async function deleteBadgeCategory(value: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    throw new Error("Unauthorized")
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, email")
    .eq("id", user.id)
    .single()

  if (!profile || !isAdmin(profile.role, profile.email)) {
    throw new Error("Unauthorized: Only admins can delete badge categories")
  }

  const supabaseAdmin = createAdminClient()

  // 1. 해당 카테고리에 속한 뱃지가 있는지 확인
  const { count, error: countError } = await supabaseAdmin
    .from("badges")
    .select("*", { count: 'exact', head: true })
    .eq("category", value)

  if (countError) {
    throw new Error(countError.message)
  }

  if (count && count > 0) {
    throw new Error("이 카테고리에 속한 뱃지가 있어 삭제할 수 없습니다. 뱃지를 먼저 삭제하거나 다른 카테고리로 이동해주세요.")
  }

  const { error } = await supabaseAdmin
    .from("badge_categories")
    .delete()
    .eq("category_value", value)

  if (error) {
    console.error("Failed to delete badge category:", error)
    throw new Error(error.message)
  }

  revalidatePath("/admin")
  revalidatePath("/about")
  return { success: true }
}
