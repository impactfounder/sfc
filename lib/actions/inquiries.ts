"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function createInquiry(data: {
  type: string
  title: string
  content: string
}) {
  const supabase = await createClient()

  // 현재 로그인한 사용자 정보 가져오기 (선택사항 - 비로그인 사용자도 문의 가능하도록)
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const insertData: any = {
    type: data.type.trim(),
    title: data.title.trim(),
    content: data.content.trim(),
    user_id: user?.id || null, // 로그인한 경우에만 user_id 저장
    status: "pending", // 기본 상태: 대기 중
  }

  const { error } = await supabase.from("inquiries").insert(insertData).select("id").single()

  if (error) {
    // 테이블이 없을 경우를 대비한 에러 처리
    if (error.code === "42P01") {
      throw new Error("문의 테이블이 아직 생성되지 않았습니다. 관리자에게 문의하세요.")
    }
    throw new Error(error.message)
  }

  revalidatePath("/customer-center")
  return { success: true }
}

