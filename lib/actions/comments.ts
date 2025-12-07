"use server"

import { createClient } from "@/lib/supabase/server"

export type CommentNode = {
  id: string
  post_id: string
  author_id: string
  content: string
  created_at: string
  updated_at?: string | null
  parent_id?: string | null
  depth?: number
  profiles?: {
    id: string
    full_name: string | null
    avatar_url: string | null
  } | null
  children?: CommentNode[]
}

type CreateCommentInput = {
  postId: string
  content: string
  parentId?: string | null
}

export async function createComment({ postId, content, parentId = null }: CreateCommentInput) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error("Unauthorized")
  }

  const depth = parentId ? 1 : 0

  const { data, error } = await supabase
    .from("comments")
    .insert({
      post_id: postId,
      author_id: user.id,
      content: content.trim(),
      parent_id: parentId,
      depth,
    })
    .select(
      `
      *,
      profiles:author_id (
        id,
        full_name,
        avatar_url
      )
    `
    )
    .single()

  if (error) {
    throw new Error(error.message)
  }

  return data as CommentNode
}

export async function getComments(postId: string): Promise<CommentNode[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("comments")
    .select(
      `
      *,
      profiles:author_id (
        id,
        full_name,
        avatar_url
      )
    `
    )
    .eq("post_id", postId)
    .order("created_at", { ascending: true })

  if (error) {
    throw new Error(error.message)
  }

  const { buildCommentTree } = await import("@/lib/utils/comments-tree")
  return buildCommentTree((data || []) as CommentNode[])
}

