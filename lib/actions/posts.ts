"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { isMasterAdmin, isAdmin } from "@/lib/utils"

export async function createPost(data: {
  title: string
  content: string
  visibility?: "public" | "group"
  boardCategoryId?: string
  communityId?: string
  category?: string
  categoryId?: string // categories 테이블의 id (insight/partner 타입)
  // ★ 보안: authorId 등은 무시됨 (클라이언트에서 보내도 사용하지 않음)
}) {
  const supabase = await createClient()

  // ★ 보안: 무조건 현재 로그인한 세션의 ID만 사용
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error("Unauthorized")
  }

  // ★ 보안: 클라이언트에서 보낸 authorId 등은 무시하고, 세션의 user.id만 사용
  const insertData: any = {
    title: data.title.trim(),
    content: data.content.trim(),
    author_id: user.id, // ★ 무조건 세션의 user.id만 사용
    visibility: data.visibility || "public",
  }

  if (data.boardCategoryId) {
    insertData.board_category_id = data.boardCategoryId
  }

  if (data.communityId) {
    insertData.community_id = data.communityId
  }

  if (data.category) {
    insertData.category = data.category
  }

  if (data.categoryId) {
    insertData.category_id = data.categoryId
  }

  const { data: newPost, error } = await supabase.from("posts").insert(insertData).select("id").single()

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath("/community")
  revalidatePath("/community/posts")
  return newPost?.id || null
}

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

  // Check if user is author or admin/master
  const isAuthor = post.author_id === user.id
  const isMaster = profile ? isMasterAdmin(profile.role, profile.email) : false
  const isUserAdmin = profile ? isAdmin(profile.role, profile.email) : false

  if (!isAuthor && !isMaster && !isUserAdmin) {
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

/**
 * 익명 좋아요 (비로그인 사용자용)
 * posts.likes_count를 직접 증가시키는 RPC 함수를 호출합니다.
 */
export async function likePostAnonymously(postId: string) {
  const supabase = await createClient()

  // RPC 함수 호출
  const { error } = await supabase.rpc('increment_post_likes', {
    post_id: postId
  })

  if (error) {
    console.error('익명 좋아요 실패:', error)
    throw new Error(error.message)
  }

  // 관련 경로 재검증
  revalidatePath("/community")
  revalidatePath("/community/board")

  return { success: true }
}
