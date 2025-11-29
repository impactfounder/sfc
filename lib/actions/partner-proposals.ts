"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function createPartnerProposal(data: {
  contactName: string
  contactEmail: string
  companyName: string
  serviceName: string
  websiteUrl?: string
  benefitProposal: string
  thumbnailUrl?: string
}) {
  const supabase = await createClient()

  // 이메일 형식 검증
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(data.contactEmail)) {
    throw new Error("올바른 이메일 형식을 입력해주세요.")
  }

  // URL 형식 검증 (있는 경우)
  if (data.websiteUrl && data.websiteUrl.trim() !== "") {
    try {
      new URL(data.websiteUrl)
    } catch {
      throw new Error("올바른 웹사이트 URL 형식을 입력해주세요.")
    }
  }

  const { data: userData } = await supabase.auth.getUser()

  if (!userData.user) {
    return { success: false, error: "로그인이 필요합니다." }
  }

  const { error } = await supabase
    .from("partner_proposals")
    .insert({
      user_id: userData.user.id,
      contact_name: data.contactName.trim(),
      contact_email: data.contactEmail.trim(),
      company_name: data.companyName.trim(),
      service_name: data.serviceName.trim(),
      website_url: data.websiteUrl?.trim() || null,
      thumbnail_url: data.thumbnailUrl?.trim() || null,
      benefit_proposal: data.benefitProposal.trim(),
      status: "pending",
    })

  if (error) {
    console.error("Failed to create partner proposal:", error)
    
    // 테이블이 없는 경우 명확한 에러 메시지
    if (error.code === "42P01" || error.message.includes("does not exist") || error.message.includes("relation")) {
      return { 
        success: false, 
        error: "데이터베이스 테이블을 찾을 수 없습니다. 관리자에게 문의해주세요." 
      }
    }
    
    // 기타 에러
    return { 
      success: false, 
      error: error.message || "파트너스 신청에 실패했습니다. 잠시 후 다시 시도해주세요." 
    }
  }

  revalidatePath("/partners")
  return { success: true }
}

