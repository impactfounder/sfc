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

  return { posts: data || [], count: count || 0 }
}

