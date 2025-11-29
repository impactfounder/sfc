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
  return { success: true }
}

