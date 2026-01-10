"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { isAdmin } from "@/lib/utils"

/**
 * 파트너 혜택 신청 (클라이언트 컴포넌트에서 호출)
 */
export async function submitPartnerApplication(data: {
  partnerId?: string | null
  partnerName: string
  companyName: string
  contactEmail: string
  contactPhone?: string | null
  serviceDescription: string
  currentUsage?: string | null
}) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: "로그인이 필요합니다." }
  }

  const { error } = await supabase
    .from("partner_applications")
    .insert({
      user_id: user.id,
      partner_id: data.partnerId || null,
      partner_name: data.partnerName,
      company_name: data.companyName.trim(),
      contact_email: data.contactEmail.trim(),
      contact_phone: data.contactPhone?.trim() || null,
      service_description: data.serviceDescription.trim(),
      current_usage: data.currentUsage?.trim() || null,
      status: "pending",
    })

  if (error) {
    console.error("Partner application error:", error)
    return { success: false, error: "신청 처리 중 오류가 발생했습니다." }
  }

  revalidatePath("/partners")
  return { success: true }
}

export async function updatePartnerApplicationStatus(
  applicationId: string,
  status: "approved" | "rejected"
) {
  const supabase = await createClient()

  // 관리자 권한 확인
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error("Unauthorized")
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, email")
    .eq("id", user.id)
    .single()

  if (!profile || !isAdmin(profile.role, profile.email)) {
    throw new Error("Unauthorized: Only admins can update partner applications")
  }

  // 상태 업데이트
  const { error } = await supabase
    .from("partner_applications")
    .update({ status })
    .eq("id", applicationId)

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath("/admin")
  return { success: true }
}

