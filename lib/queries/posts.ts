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
 * @param supabase Supabase 클라이언트
 * @param limit 가져올 게시글 수 (기본값: 50)
 * @param categorySlug 특정 카테고리 슬러그 (예: 'vangol', 'hightalk'). 없거나 'all'이면 소모임 글만 가져옴
 */
export async function getLatestPosts(
  supabase: SupabaseClient,
  limit: number = 50,
  categorySlug?: string | null
): Promise<PostForDisplay[]> {
  // board_categories와 inner join하여 slug가 있는 글만 가져오기
  let query = supabase
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
      board_categories:board_category_id!inner (name, slug),
      communities:community_id (name)
    `)

  // categorySlug가 있고 'all'이 아니면 해당 슬러그로 필터링
  if (categorySlug && categorySlug !== 'all') {
    query = query.eq("board_categories.slug", categorySlug)
  }
  // categorySlug가 없거나 'all'이면 쿼리 레벨에서는 필터링하지 않고, 결과를 받은 후 필터링

  const { data, error } = await query
    .order("created_at", { ascending: false })
    .limit(limit)

  if (error) {
    console.error("Error fetching posts:", error)
    return []
  }

  // Transform posts data to match PostForDisplay type
  let transformed = (data || []).map((post: any) => ({
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

  // categorySlug가 없거나 'all'이면 공지사항과 자유게시판 제외 (소모임 글만 반환)
  // 'vangol', 'hightalk' 등의 소모임 글만 포함
  if (!categorySlug || categorySlug === 'all') {
    const excludedSlugs = ['announcement', 'announcements', 'free', 'free-board']
    transformed = transformed.filter((post) => {
      const postSlug = post.board_categories?.slug
      return postSlug && !excludedSlugs.includes(postSlug)
    })
  }

  return transformed
}

