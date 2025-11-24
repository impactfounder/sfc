import { SupabaseClient } from "@supabase/supabase-js"

export type PostForDisplay = {
  id: string
  title: string
  content?: string | null
  created_at: string
  visibility?: "public" | "group"
  likes_count?: number
  comments_count?: number
  profiles?: {
    full_name?: string | null
  } | null
  board_categories?: {
    name?: string | null
    slug?: string | null
  } | null
  communities?: {
    name?: string | null
  } | null
}

/**
 * 최신 게시글 목록 가져오기
 */
export async function getLatestPosts(
  supabase: SupabaseClient,
  limit: number = 50
): Promise<PostForDisplay[]> {
  const { data, error } = await supabase
    .from("posts")
    .select(`
      id,
      title,
      content,
      created_at,
      visibility,
      likes_count,
      comments_count,
      profiles:author_id (full_name),
      board_categories:board_category_id (name, slug),
      communities:community_id (name)
    `)
    .not("board_category_id", "is", null) // board_category_id가 있는 글만 가져오기
    .order("created_at", { ascending: false })
    .limit(limit)

  if (error) {
    console.error("Error fetching posts:", error)
    return []
  }

  // Transform posts data to match PostForDisplay type
  return (data || []).map((post: any) => ({
    id: post.id,
    title: post.title,
    content: post.content,
    created_at: post.created_at,
    visibility: post.visibility || "public",
    likes_count: post.likes_count || 0,
    comments_count: post.comments_count || 0,
    profiles: post.profiles ? { full_name: post.profiles.full_name } : null,
    board_categories: Array.isArray(post.board_categories)
      ? post.board_categories[0]
      : post.board_categories,
    communities: Array.isArray(post.communities)
      ? post.communities[0]
      : post.communities,
  }))
}

