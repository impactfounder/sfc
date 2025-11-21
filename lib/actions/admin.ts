"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function updateUserRole(userId: string, role: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error("Unauthorized")
  }

  // Check if current user is admin or master
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()

  if (!profile || (profile.role !== "admin" && profile.role !== "master")) {
    throw new Error("Unauthorized")
  }

  // Update role
  const { error } = await supabase.from("profiles").update({ role }).eq("id", userId)

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath("/admin/users")
  return { success: true }
}

export async function updateUserMembershipTier(userId: string, membershipTier: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error("Unauthorized")
  }

  // Check if current user is admin or master
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()

  if (!profile || (profile.role !== "admin" && profile.role !== "master")) {
    throw new Error("Unauthorized")
  }

  // Update membership tier
  const { error } = await supabase.from("profiles").update({ membership_tier: membershipTier }).eq("id", userId)

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath("/admin/users")
  return { success: true }
}
