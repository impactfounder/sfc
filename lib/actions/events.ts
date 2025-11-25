"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { isAdmin } from "@/lib/utils"

/**
 * 이벤트 생성 (보안 강화: 세션 기반)
 * 클라이언트에서 보낸 created_by는 무시하고, 무조건 현재 로그인한 세션의 ID만 사용
 */
export async function createEvent(data: {
  title: string
  description: string
  event_date: string
  end_date?: string | null
  location?: string | null
  price?: number | null
  max_participants?: number | null
  thumbnail_url?: string | null
  // ★ 보안: created_by는 무시됨 (클라이언트에서 보내도 사용하지 않음)
}) {
  const supabase = await createClient()

  // ★ 보안: 무조건 현재 로그인한 세션의 ID만 사용
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error("Unauthorized")
  }

  // ★ 보안: 클라이언트에서 보낸 created_by는 무시하고, 세션의 user.id만 사용
  const insertData: any = {
    title: data.title.trim(),
    description: data.description.trim(),
    event_date: data.event_date,
    location: data.location || null,
    price: data.price && data.price > 0 ? data.price : null,
    max_participants: data.max_participants || null,
    thumbnail_url: data.thumbnail_url || null,
    created_by: user.id, // ★ 무조건 세션의 user.id만 사용
  }

  // end_date가 있으면 추가
  if (data.end_date) {
    insertData.end_date = data.end_date
  }

  const { error } = await supabase.from("events").insert(insertData).select("id").single()

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath("/events")
  revalidatePath("/")
  return { success: true }
}

export async function deleteEvent(eventId: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error("Unauthorized")
  }

  // Verify event exists and get creator info
  const { data: event } = await supabase
    .from("events")
    .select("id, created_by")
    .eq("id", eventId)
    .single()

  if (!event) {
    throw new Error("Event not found")
  }

  // Check if current user is the creator
  const isCreator = event.created_by === user.id

  // Check if current user is admin or master
  const { data: profile } = await supabase
    .from("profiles")
    .select("role, email")
    .eq("id", user.id)
    .single()

  const isAdminUser = profile && isAdmin(profile.role, profile.email)

  // Only creator or admin can delete
  if (!isCreator && !isAdminUser) {
    throw new Error("Unauthorized: Only event creators or admins can delete events")
  }

  // Delete event (registrations will be cascade deleted by DB)
  const { error } = await supabase.from("events").delete().eq("id", eventId)

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath("/admin/events")
  revalidatePath("/events")
  revalidatePath("/")
  return { success: true }
}

export async function addGuestParticipant(eventId: string, guestName: string, guestContact?: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error("Unauthorized")
  }

  // Verify event exists and user is the creator
  const { data: event } = await supabase
    .from("events")
    .select("created_by, max_participants")
    .eq("id", eventId)
    .single()

  if (!event) {
    throw new Error("Event not found")
  }

  if (event.created_by !== user.id) {
    throw new Error("Unauthorized: Only event creators can add guest participants")
  }

  // Validate guest name
  if (!guestName || !guestName.trim()) {
    throw new Error("Guest name is required")
  }

  // Check if event is full
  if (event.max_participants) {
    const { count } = await supabase
      .from("event_registrations")
      .select("*", { count: "exact", head: true })
      .eq("event_id", eventId)

    if (count && count >= event.max_participants) {
      throw new Error("Event is full")
    }
  }

  // Insert guest registration
  const { error } = await supabase.from("event_registrations").insert({
    event_id: eventId,
    user_id: null, // Guest registration
    guest_name: guestName.trim(),
    guest_contact: guestContact?.trim() || null,
  })

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath(`/events/${eventId}/manage`)
  revalidatePath(`/events/${eventId}`)
  return { success: true }
}
