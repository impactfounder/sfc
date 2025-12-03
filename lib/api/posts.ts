import { createClient } from "@/lib/supabase/client"

export const fetchPosts = async ({
  categorySlug,
  page = 1,
  limit = 15,
}: {
  categorySlug: string
  page?: number
  limit?: number
}) => {
  const supabase = createClient()
  const from = (page - 1) * limit
  const to = from + limit - 1

  // 슬러그 정규화 (DB와 URL의 불일치 해결)
  let dbSlug = categorySlug
  if (categorySlug === 'free') {
    dbSlug = 'free-board'
  }
  if (categorySlug === 'announcements') {
    dbSlug = 'announcement'
  }
  if (categorySlug === 'insights') {
    dbSlug = 'insights'
  }

  // categorySlug가 "all"이 아닐 때는 !inner로 강제하여 엄격한 필터링
  let query
  if (categorySlug !== "all") {
    // 특정 카테고리: Inner Join으로 강제하여 정확한 필터링
    query = supabase
      .from("posts")
      .select(
        `
        *,
        profiles:author_id(full_name, avatar_url),
        board_categories!inner(name, slug),
        _count: comments(count),
        post_images(id, image_url, sort_order)
      `,
        { count: "exact" }
      )
      .eq("board_categories.slug", dbSlug)
      .order("created_at", { ascending: false })
      .range(from, to)
  } else {
    // all인 경우: Left Join 사용 (공지사항/자유게시판/event-requests/reviews 제외)
    query = supabase
      .from("posts")
      .select(
        `
        *,
        profiles:author_id(full_name, avatar_url),
        board_categories(name, slug),
        _count: comments(count),
        post_images(id, image_url, sort_order)
      `,
        { count: "exact" }
      )
      .not('board_categories.slug', 'in', '("announcement","free-board","event-requests","reviews")')
      .order("created_at", { ascending: false })
      .range(from, to)
  }

  const { data, error, count } = await query

  if (error) throw error

  if (!data || data.length === 0) {
    return { posts: [], count: count || 0 }
  }

  // 실제 좋아요 및 댓글 수 조회 (병렬 처리)
  const postIds = data.map((post: any) => post.id)
  
  const [likesResult, commentsResult] = await Promise.all([
    supabase
      .from("post_likes")
      .select("post_id")
      .in("post_id", postIds),
    supabase
      .from("comments")
      .select("post_id")
      .in("post_id", postIds)
  ])

  // 카운트 맵 생성
  const likesCountMap = new Map<string, number>()
  const commentsCountMap = new Map<string, number>()

  ;(likesResult.data || []).forEach((like: { post_id: string }) => {
    likesCountMap.set(like.post_id, (likesCountMap.get(like.post_id) || 0) + 1)
  })

  ;(commentsResult.data || []).forEach((comment: { post_id: string }) => {
    commentsCountMap.set(comment.post_id, (commentsCountMap.get(comment.post_id) || 0) + 1)
  })

  // 실제 카운트를 게시글 데이터에 추가
  const postsWithCounts = data.map((post: any) => ({
    ...post,
    likes_count: likesCountMap.get(post.id) || 0,
    comments_count: commentsCountMap.get(post.id) || 0,
  }))

  return { posts: postsWithCounts, count: count || 0 }
}

