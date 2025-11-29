"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { isAdmin } from "@/lib/utils"

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

