import { SupabaseClient } from "@supabase/supabase-js"

export type PostForDisplay = {
  id: string
  title: string
  created_at: string
  profiles?: {
    full_name?: string | null
  } | null
  board_categories?: {
    name?: string | null
    slug?: string | null
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
      created_at,
      profiles:author_id (full_name),
      board_categories (name, slug)
    `)
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
    created_at: post.created_at,
    profiles: post.profiles ? { full_name: post.profiles.full_name } : null,
    board_categories: Array.isArray(post.board_categories)
      ? post.board_categories[0]
      : post.board_categories,
  }))
}

