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
  customFieldResponses?: Record<string, string>,
  asWaitlist: boolean = false
) {
  const supabase = await createClient()

  // 이벤트 정보 및 현재 등록 수 확인 (confirmed 상태만)
  const [eventResult, confirmedCountResult, waitlistCountResult] = await Promise.all([
    supabase.from("events").select("max_participants, status, event_date, end_date").eq("id", eventId).single(),
    supabase.from("event_registrations").select("id", { count: "exact", head: true }).eq("event_id", eventId).eq("status", "confirmed"),
    supabase.from("event_registrations").select("id", { count: "exact", head: true }).eq("event_id", eventId).eq("status", "waitlist"),
  ])

  if (eventResult.error || !eventResult.data) {
    throw new Error("이벤트를 찾을 수 없습니다.")
  }

  const event = eventResult.data
  const confirmedCount = confirmedCountResult.count || 0
  const waitlistCount = waitlistCountResult.count || 0

  // 종료된 이벤트 체크
  const now = new Date()
  const eventEndDate = event.end_date
    ? new Date(event.end_date)
    : new Date(new Date(event.event_date).getTime() + 3 * 60 * 60 * 1000)

  if (event.status === "completed" || eventEndDate < now) {
    throw new Error("종료된 이벤트입니다.")
  }

  // 정원 초과 여부 확인
  const isFull = event.max_participants && confirmedCount >= event.max_participants

  // 정원이 찼는데 대기자 신청이 아니면 에러
  if (isFull && !asWaitlist) {
    throw new Error("정원이 마감되었습니다. 대기자로 신청해주세요.")
  }

  // 등록 상태 결정
  const registrationStatus = isFull ? "waitlist" : "confirmed"
  const waitlistPosition = isFull ? waitlistCount + 1 : null

  // 게스트 등록 (user_id는 null)
  const { data: regData, error } = await supabase
    .from("event_registrations")
    .insert({
      event_id: eventId,
      user_id: null,
      guest_name: guestName.trim(),
      guest_contact: guestContact.trim(),
      payment_status: paymentStatus,
      status: registrationStatus,
      waitlist_position: waitlistPosition,
    })
    .select("id, status, waitlist_position")
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

  return {
    success: true,
    registrationId,
    status: regData.status as "confirmed" | "waitlist",
    waitlistPosition: regData.waitlist_position as number | null,
  }
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
  customFieldResponses?: Record<string, string>,
  asWaitlist: boolean = false
) {
  const supabase = await createClient()

  // 현재 사용자 확인
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user || user.id !== userId) {
    throw new Error("Unauthorized")
  }

  // 이벤트 정보 및 현재 등록 수 확인
  const [eventResult, confirmedCountResult, waitlistCountResult, existingRegResult] = await Promise.all([
    supabase.from("events").select("max_participants, status, event_date, end_date").eq("id", eventId).single(),
    supabase.from("event_registrations").select("id", { count: "exact", head: true }).eq("event_id", eventId).eq("status", "confirmed"),
    supabase.from("event_registrations").select("id", { count: "exact", head: true }).eq("event_id", eventId).eq("status", "waitlist"),
    supabase.from("event_registrations").select("id, status").eq("event_id", eventId).eq("user_id", userId).maybeSingle(),
  ])

  if (eventResult.error || !eventResult.data) {
    throw new Error("이벤트를 찾을 수 없습니다.")
  }

  const event = eventResult.data
  const confirmedCount = confirmedCountResult.count || 0
  const waitlistCount = waitlistCountResult.count || 0
  const existingReg = existingRegResult.data

  // 종료된 이벤트 체크
  const now = new Date()
  const eventEndDate = event.end_date
    ? new Date(event.end_date)
    : new Date(new Date(event.event_date).getTime() + 3 * 60 * 60 * 1000)

  if (event.status === "completed" || eventEndDate < now) {
    throw new Error("종료된 이벤트입니다.")
  }

  // 이미 등록된 경우 (정보 업데이트만)
  if (existingReg) {
    const { data: regData, error } = await supabase
      .from("event_registrations")
      .update({
        guest_name: guestName?.trim() || null,
        guest_contact: guestContact?.trim() || null,
      })
      .eq("id", existingReg.id)
      .select("id, status, waitlist_position")
      .single()

    if (error) {
      throw new Error(error.message || "정보 업데이트에 실패했습니다.")
    }

    revalidatePath("/e")
    revalidatePath("/events")
    revalidatePath("/")

    return {
      success: true,
      registrationId: regData.id,
      status: regData.status as "confirmed" | "waitlist",
      waitlistPosition: regData.waitlist_position as number | null,
    }
  }

  // 정원 초과 여부 확인
  const isFull = event.max_participants && confirmedCount >= event.max_participants

  // 정원이 찼는데 대기자 신청이 아니면 에러
  if (isFull && !asWaitlist) {
    throw new Error("정원이 마감되었습니다. 대기자로 신청해주세요.")
  }

  // 등록 상태 결정
  const registrationStatus = isFull ? "waitlist" : "confirmed"
  const waitlistPosition = isFull ? waitlistCount + 1 : null

  // 사용자 등록
  const { data: regData, error } = await supabase
    .from("event_registrations")
    .insert({
      event_id: eventId,
      user_id: userId,
      guest_name: guestName?.trim() || null,
      guest_contact: guestContact?.trim() || null,
      payment_status: paymentStatus,
      status: registrationStatus,
      waitlist_position: waitlistPosition,
    })
    .select("id, status, waitlist_position")
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

  return {
    success: true,
    registrationId,
    status: regData.status as "confirmed" | "waitlist",
    waitlistPosition: regData.waitlist_position as number | null,
  }
}

/**
 * 대기자 참가 확정 (서버 액션)
 * 알림을 받은 대기자가 참가를 확정할 때 호출
 */
export async function confirmWaitlistRegistration(
  eventId: string,
  userId: string
) {
  const supabase = await createClient()

  // 현재 사용자 확인
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user || user.id !== userId) {
    throw new Error("Unauthorized")
  }

  // 현재 등록 정보 확인
  const { data: registration, error: regError } = await supabase
    .from("event_registrations")
    .select("id, status, waitlist_notified_at")
    .eq("event_id", eventId)
    .eq("user_id", userId)
    .single()

  if (regError || !registration) {
    throw new Error("등록 정보를 찾을 수 없습니다.")
  }

  if (registration.status !== "waitlist") {
    throw new Error("이미 참가가 확정되었습니다.")
  }

  if (!registration.waitlist_notified_at) {
    throw new Error("아직 참가 가능 알림을 받지 않았습니다.")
  }

  // 이벤트 정원 확인
  const [eventResult, confirmedCountResult] = await Promise.all([
    supabase.from("events").select("max_participants").eq("id", eventId).single(),
    supabase.from("event_registrations").select("id", { count: "exact", head: true }).eq("event_id", eventId).eq("status", "confirmed"),
  ])

  if (eventResult.error || !eventResult.data) {
    throw new Error("이벤트를 찾을 수 없습니다.")
  }

  const event = eventResult.data
  const confirmedCount = confirmedCountResult.count || 0

  // 정원이 다시 찼는지 확인
  if (event.max_participants && confirmedCount >= event.max_participants) {
    throw new Error("죄송합니다. 다른 대기자가 먼저 확정하여 자리가 없습니다.")
  }

  // 상태를 confirmed로 변경
  const { error: updateError } = await supabase
    .from("event_registrations")
    .update({
      status: "confirmed",
      waitlist_position: null,
    })
    .eq("id", registration.id)

  if (updateError) {
    throw new Error("참가 확정에 실패했습니다.")
  }

  revalidatePath("/e")
  revalidatePath("/events")
  revalidatePath("/")

  return { success: true }
}

/**
 * 참가 취소 및 대기자 승격 (서버 액션)
 */
export async function cancelRegistration(
  eventId: string,
  userId: string
) {
  const supabase = await createClient()

  // 현재 사용자 확인
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user || user.id !== userId) {
    throw new Error("Unauthorized")
  }

  // 현재 등록 정보 확인
  const { data: registration, error: regError } = await supabase
    .from("event_registrations")
    .select("id, status")
    .eq("event_id", eventId)
    .eq("user_id", userId)
    .single()

  if (regError || !registration) {
    throw new Error("등록 정보를 찾을 수 없습니다.")
  }

  const wasConfirmed = registration.status === "confirmed"

  // 등록 삭제
  const { error: deleteError } = await supabase
    .from("event_registrations")
    .delete()
    .eq("id", registration.id)

  if (deleteError) {
    throw new Error("취소에 실패했습니다.")
  }

  // 확정자가 취소한 경우, 다음 대기자에게 알림 (DB 트리거가 처리)
  // 추가적으로 앱에서 직접 처리할 수도 있음

  revalidatePath("/e")
  revalidatePath("/events")
  revalidatePath("/")

  return { success: true, wasConfirmed }
}
