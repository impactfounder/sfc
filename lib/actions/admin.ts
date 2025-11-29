"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { isMasterAdmin } from "@/lib/utils"

export async function updateUserRole(userId: string, role: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error("Unauthorized")
  }

  // Check if current user is master admin (only master can change roles)
  const { data: profile } = await supabase
    .from("profiles")
    .select("role, email")
    .eq("id", user.id)
    .single()

  if (!profile || !isMasterAdmin(profile.role, profile.email)) {
    throw new Error("Unauthorized: Only master admins can change user roles")
  }

  // Validate role value
  if (!["member", "admin", "master"].includes(role)) {
    throw new Error("Invalid role value")
  }

  // Prevent changing own role from master to something else
  if (user.id === userId && profile.role === "master" && role !== "master") {
    throw new Error("Cannot change your own master role")
  }

  // Update role
  const { error } = await supabase.from("profiles").update({ role }).eq("id", userId)

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath("/admin/users")
  revalidatePath("/admin/roles")
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
  const { data: profile } = await supabase
    .from("profiles")
    .select("role, email")
    .eq("id", user.id)
    .single()

  if (!profile) {
    throw new Error("Unauthorized")
  }

  // Use isAdmin helper to check admin or master
  const { isAdmin } = await import("@/lib/utils")
  if (!isAdmin(profile.role, profile.email)) {
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

export async function updateBadgeStatus(userBadgeId: string, status: 'approved' | 'rejected') {
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

  if (!profile) {
    throw new Error("Unauthorized")
  }

  // Use isAdmin helper to check admin or master
  const { isAdmin } = await import("@/lib/utils")
  if (!isAdmin(profile.role, profile.email)) {
    throw new Error("Unauthorized: Only admins can update badge status")
  }

  // Update badge status
  const updateData: { status: string; is_visible?: boolean } = { status }
  
  // 승인 시 is_visible을 true로 설정
  if (status === 'approved') {
    updateData.is_visible = true
  } else {
    // 거절 시 is_visible을 false로 유지
    updateData.is_visible = false
  }

  const { error } = await supabase
    .from("user_badges")
    .update(updateData)
    .eq("id", userBadgeId)

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath("/admin/badges")
  return { success: true }
}

export async function createBadge(name: string, icon: string, category: string, description: string | null) {
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

  if (!profile) {
    throw new Error("Unauthorized")
  }

  // Use isAdmin helper to check admin or master
  const { isAdmin } = await import("@/lib/utils")
  if (!isAdmin(profile.role, profile.email)) {
    throw new Error("Unauthorized: Only admins can create badges")
  }

  // Insert new badge
  const { error } = await supabase
    .from("badges")
    .insert({
      name,
      icon,
      category,
      description,
    })

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath("/admin")
  revalidatePath("/about")
  return { success: true }
}

export async function updateBadge(badgeId: string, name: string, icon: string, category: string, description: string | null) {
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

  if (!profile) {
    throw new Error("Unauthorized")
  }

  // Use isAdmin helper to check admin or master
  const { isAdmin } = await import("@/lib/utils")
  if (!isAdmin(profile.role, profile.email)) {
    throw new Error("Unauthorized: Only admins can update badges")
  }

  // Update badge
  const { error } = await supabase
    .from("badges")
    .update({
      name,
      icon,
      category,
      description,
    })
    .eq("id", badgeId)

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath("/admin")
  revalidatePath("/about")
  return { success: true }
}

export async function deleteBadge(badgeId: string) {
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

  if (!profile) {
    throw new Error("Unauthorized")
  }

  // Use isAdmin helper to check admin or master
  const { isAdmin } = await import("@/lib/utils")
  if (!isAdmin(profile.role, profile.email)) {
    throw new Error("Unauthorized: Only admins can delete badges")
  }

  // Delete badge (cascade delete will handle user_badges)
  const { error } = await supabase
    .from("badges")
    .delete()
    .eq("id", badgeId)

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath("/admin")
  revalidatePath("/about")
  return { success: true }
}