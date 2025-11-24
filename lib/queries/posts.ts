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
// 제외할 슬러그 목록 (통합 피드에서 제외)
const EXCLUDED_SLUGS = ['announcement', 'free-board']

export async function getLatestPosts(
  supabase: SupabaseClient,
  limit: number = 50,
  categorySlug?: string | null
): Promise<PostForDisplay[]> {
  // board_categories와 left join (INNER JOIN 제거하여 데이터 유실 방지)
  // board_category_id가 null이 아닌 게시글만 가져오기 (필수)
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
      board_categories:board_category_id (name, slug)
    `)
    .not("board_category_id", "is", null) // board_category_id가 null이 아닌 게시글만

  // categorySlug가 있고 'all'이 아니면 해당 슬러그로 필터링
  if (categorySlug && categorySlug !== 'all') {
    // 디버깅: 개별 게시판 쿼리 확인
    console.log(`[getLatestPosts] 개별 게시판 쿼리 - categorySlug: "${categorySlug}"`)
    query = query.eq("board_categories.slug", categorySlug)
  } else {
    // 'all'이거나 없을 때: 'announcement'와 'free-board'를 제외한 모든 활성 카테고리 글 가져오기
    // Supabase의 not.in 필터는 각 슬러그에 대해 neq를 체이닝하는 것이 더 안전함
    console.log(`[getLatestPosts] 통합 피드 쿼리 - 제외 슬러그: ${EXCLUDED_SLUGS.join(', ')}`)
    EXCLUDED_SLUGS.forEach((excludedSlug) => {
      query = query.neq("board_categories.slug", excludedSlug)
    })
  }

  const { data, error } = await query
    .order("created_at", { ascending: false })
    .limit(limit)

  if (error) {
    console.error("🚨 CRITICAL POST QUERY ERROR:", {
      message: error.message,
      details: error.details,
      hint: error.hint,
      code: error.code,
      name: error.name,
      // 쿼리 컨텍스트 정보
      categorySlug: categorySlug,
      limit: limit,
      // 전체 오류 객체 (추가 정보 포함)
      fullError: error,
    })
    return []
  }

  // 디버깅: 쿼리 결과 확인
  if (categorySlug && categorySlug !== 'all') {
    console.log(`[getLatestPosts] 개별 게시판 결과 - categorySlug: "${categorySlug}", 게시글 수: ${data?.length || 0}`)
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
    // communities 조인 제거 (community_id 컬럼이 posts 테이블에 없음)
    communities: null,
  }))

  // board_categories가 없는 게시글 필터링 (null 체크)
  transformed = transformed.filter((post) => post.board_categories?.slug)

  return transformed
}

