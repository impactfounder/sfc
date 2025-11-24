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
 * 최신 게시글 목록 가져오기 (ID 기반 조회로 안정화)
 * @param supabase Supabase 클라이언트
 * @param limit 가져올 게시글 수 (기본값: 50)
 * @param categorySlug 특정 카테고리 슬러그 (예: 'vangol', 'hightalk'). 없거나 'all'이면 공지사항/자유게시판 제외한 모든 글
 */
export async function getLatestPosts(
  supabase: SupabaseClient,
  limit: number = 50,
  categorySlug?: string | null
): Promise<PostForDisplay[]> {
  try {
    let categoryIds: string[] = []

    // Step 1: categorySlug에 따라 board_categories에서 ID 목록 가져오기
    if (!categorySlug || categorySlug === 'all') {
      // 통합 피드: announcement, free-board를 제외한 나머지 카테고리들의 ID 가져오기
      const { data: categories, error: categoryError } = await supabase
        .from("board_categories")
        .select("id")
        .neq("slug", "announcement")
        .neq("slug", "free-board")
        .eq("is_active", true)

      if (categoryError) {
        console.error("🚨 [getLatestPosts] 카테고리 조회 에러:", {
          error: categoryError,
          categorySlug: categorySlug,
        })
        return []
      }

      categoryIds = (categories || []).map((cat) => cat.id)
    } else {
      // 개별 게시판: 해당 slug의 ID 가져오기
      const { data: category, error: categoryError } = await supabase
        .from("board_categories")
        .select("id")
        .eq("slug", categorySlug)
        .eq("is_active", true)
        .single()

      if (categoryError) {
        console.error("🚨 [getLatestPosts] 카테고리 조회 에러:", {
          error: categoryError,
          categorySlug: categorySlug,
        })
        return []
      }

      if (!category) {
        console.warn(`[getLatestPosts] 카테고리를 찾을 수 없습니다: "${categorySlug}"`)
        return []
      }

      categoryIds = [category.id]
    }

    // Step 2: categoryIds를 가진 posts 가져오기 (ID 기반 조회)
    const { data: posts, error: postsError } = await supabase
      .from("posts")
      .select(`
        id,
        title,
        content,
        created_at,
        visibility,
        likes_count,
        comments_count,
        author_id,
        board_category_id
      `)
      .in("board_category_id", categoryIds)
      .order("created_at", { ascending: false })
      .limit(limit)

    if (postsError) {
      console.error("🚨 [getLatestPosts] 게시글 조회 에러:", {
        error: postsError,
        categorySlug: categorySlug,
        categoryIds: categoryIds,
      })
      return []
    }

    if (!posts || posts.length === 0) {
      console.log(`[getLatestPosts] 게시글이 없습니다. categorySlug: "${categorySlug || 'all'}", categoryIds: ${categoryIds.length}개`)
      return []
    }

    // Step 3: 작성자 정보 가져오기 (author_id 목록)
    const authorIds = [...new Set(posts.map((p) => p.author_id).filter(Boolean))]
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, full_name")
      .in("id", authorIds)

    // Step 4: 카테고리 정보 가져오기 (board_category_id 목록)
    const categoryIdList = [...new Set(posts.map((p) => p.board_category_id).filter(Boolean))]
    const { data: boardCategories } = await supabase
      .from("board_categories")
      .select("id, name, slug")
      .in("id", categoryIdList)

    // Step 5: 데이터 변환 및 조합
    const profileMap = new Map((profiles || []).map((p) => [p.id, p]))
    const categoryMap = new Map((boardCategories || []).map((c) => [c.id, c]))

    const transformed: PostForDisplay[] = posts.map((post) => {
      const profile = profileMap.get(post.author_id)
      const category = categoryMap.get(post.board_category_id)

      return {
        id: post.id,
        title: post.title,
        content: post.content,
        created_at: post.created_at,
        visibility: (post.visibility as "public" | "group") || "public",
        likes_count: post.likes_count || 0,
        comments_count: post.comments_count || 0,
        profiles: profile ? { full_name: profile.full_name } : null,
        board_categories: category
          ? { name: category.name, slug: category.slug }
          : null,
        communities: null,
      }
    })

    console.log(
      `[getLatestPosts] ✅ 완료 - categorySlug: "${categorySlug || 'all'}", 게시글: ${transformed.length}개`
    )

    return transformed
  } catch (error) {
    console.error("🚨 [getLatestPosts] 예상치 못한 에러:", {
      error,
      categorySlug: categorySlug,
    })
    return []
  }
}

