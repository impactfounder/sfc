"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { isAdmin } from "@/lib/utils"

export async function deleteEvent(eventId: string) {
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

  if (!profile || !isAdmin(profile.role, profile.email)) {
    throw new Error("Unauthorized: Only admins can delete events")
  }

  // Verify event exists
  const { data: event } = await supabase.from("events").select("id").eq("id", eventId).single()

  if (!event) {
    throw new Error("Event not found")
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

