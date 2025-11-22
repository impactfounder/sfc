"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { isMasterAdmin } from "@/lib/utils"

export async function deletePost(postId: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error("Unauthorized")
  }

  // Get user profile to check role
  const { data: profile } = await supabase
    .from("profiles")
    .select("role, email")
    .eq("id", user.id)
    .single()

  // Verify post ownership
  const { data: post } = await supabase.from("posts").select("author_id").eq("id", postId).single()

  if (!post) {
    throw new Error("Post not found")
  }

  // Check if user is author or master admin
  const isAuthor = post.author_id === user.id
  const isMaster = profile ? isMasterAdmin(profile.role, profile.email) : false

  if (!isAuthor && !isMaster) {
    throw new Error("Unauthorized")
  }

  // Delete post (comments will be cascade deleted by DB)
  const { error } = await supabase.from("posts").delete().eq("id", postId)

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath("/community/posts")
  revalidatePath(`/community/board`)
  return { success: true }
}
