"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

/**
 * 게스트 이벤트 신청 (서버 액션)
 * 안드로이드에서 네트워크 요청이 완료되지 않는 문제를 해결하기 위해 서버 액션 사용
 */
export async function registerGuestForEvent(
  eventId: string,
  guestName: string,
  guestContact: string,
  paymentStatus: "pending" | null = null,
  customFieldResponses?: Record<string, string>
) {
  const supabase = await createClient()

  // 게스트 등록 (user_id는 null)
  const { data: regData, error } = await supabase
    .from("event_registrations")
    .insert({
      event_id: eventId,
      user_id: null,
      guest_name: guestName.trim(),
      guest_contact: guestContact.trim(),
      payment_status: paymentStatus,
    })
    .select("id")
    .single()

  if (error) {
    console.error("[registerGuestForEvent] Error:", error)
    throw new Error(error.message || "이벤트 신청에 실패했습니다.")
  }

  if (!regData?.id) {
    throw new Error("등록 데이터를 받지 못했습니다.")
  }

  const registrationId = regData.id

  // 커스텀 필드 응답 저장
  if (customFieldResponses && Object.keys(customFieldResponses).length > 0) {
    const responsesToInsert = Object.entries(customFieldResponses)
      .filter(([_, value]) => value && value.trim() !== "")
      .map(([fieldId, value]) => ({
        registration_id: registrationId,
        field_id: fieldId,
        response_value: value.trim(),
      }))

    if (responsesToInsert.length > 0) {
      const { error: responseError } = await supabase
        .from("event_registration_responses")
        .upsert(responsesToInsert, { onConflict: "registration_id, field_id" })

      if (responseError) {
        console.warn("[registerGuestForEvent] Failed to save custom field responses:", responseError)
        // 커스텀 필드 저장 실패해도 신청은 완료된 것으로 처리
      }
    }
  }

  revalidatePath("/e")
  revalidatePath("/events")
  revalidatePath("/")

  return { success: true, registrationId }
}

/**
 * 로그인 사용자 이벤트 신청 (서버 액션)
 */
export async function registerUserForEvent(
  eventId: string,
  userId: string,
  guestName?: string | null,
  guestContact?: string | null,
  paymentStatus: "pending" | null = null,
  customFieldResponses?: Record<string, string>
) {
  const supabase = await createClient()

  // 현재 사용자 확인
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user || user.id !== userId) {
    throw new Error("Unauthorized")
  }

  // 사용자 등록 (upsert 사용)
  const { data: regData, error } = await supabase
    .from("event_registrations")
    .upsert(
      {
        event_id: eventId,
        user_id: userId,
        guest_name: guestName?.trim() || null,
        guest_contact: guestContact?.trim() || null,
        payment_status: paymentStatus,
      },
      { onConflict: "event_id, user_id" }
    )
    .select("id")
    .single()

  if (error) {
    console.error("[registerUserForEvent] Error:", error)
    throw new Error(error.message || "이벤트 신청에 실패했습니다.")
  }

  if (!regData?.id) {
    throw new Error("등록 데이터를 받지 못했습니다.")
  }

  const registrationId = regData.id

  // 커스텀 필드 응답 저장
  if (customFieldResponses && Object.keys(customFieldResponses).length > 0) {
    const responsesToInsert = Object.entries(customFieldResponses)
      .filter(([_, value]) => value && value.trim() !== "")
      .map(([fieldId, value]) => ({
        registration_id: registrationId,
        field_id: fieldId,
        response_value: value.trim(),
      }))

    if (responsesToInsert.length > 0) {
      const { error: responseError } = await supabase
        .from("event_registration_responses")
        .upsert(responsesToInsert, { onConflict: "registration_id, field_id" })

      if (responseError) {
        console.warn("[registerUserForEvent] Failed to save custom field responses:", responseError)
        // 커스텀 필드 저장 실패해도 신청은 완료된 것으로 처리
      }
    }
  }

  revalidatePath("/e")
  revalidatePath("/events")
  revalidatePath("/")

  return { success: true, registrationId }
}

