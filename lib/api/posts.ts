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

  let query = supabase
    .from("posts")
    .select(
      `
      *,
      profiles:author_id(full_name, avatar_url),
      board_categories(name, slug),
      _count: comments(count)
    `,
      { count: "exact" }
    )
    .eq("visibility", "public")
    .order("created_at", { ascending: false })
    .range(from, to)

  if (categorySlug !== "all") {
    // board_categories와 inner join하여 필터링
    query = query.eq("board_categories.slug", dbSlug)
  } else {
    // all인 경우 공지사항/자유게시판/event-requests/reviews 제외
    query = query.not('board_categories.slug', 'in', '("announcement","free-board","event-requests","reviews")')
  }

  const { data, error, count } = await query

  if (error) throw error
  
  return { posts: data || [], count: count || 0 }
}

