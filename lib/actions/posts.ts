"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function deletePost(postId: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error("Unauthorized")
  }

  // Verify post ownership
  const { data: post } = await supabase.from("posts").select("author_id").eq("id", postId).single()

  if (!post || post.author_id !== user.id) {
    throw new Error("Unauthorized")
  }

  // Delete post (comments will be cascade deleted by DB)
  const { error } = await supabase.from("posts").delete().eq("id", postId)

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath("/community/posts")
  return { success: true }
}
