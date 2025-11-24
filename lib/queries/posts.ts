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
 * 최신 게시글 목록 가져오기 (Inner Join 필터링 방식)
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
    // ★ 슬러그 정규화 (DB와 URL의 불일치 해결) - 방어적 프로그래밍
    if (categorySlug === 'free') {
      categorySlug = 'free-board';
    }
    if (categorySlug === 'announcements') {
      categorySlug = 'announcement';
    }

    console.log(`[getLatestPosts] Fetching for slug: ${categorySlug || 'all'}`);

    // 1. 기본 쿼리 작성 (Select + Join)
    // !inner를 사용하여 카테고리가 있는 글만 확실하게 가져옴
    let query = supabase
      .from("posts")
      .select(`
        id, title, content, created_at, visibility, likes_count, comments_count,
        profiles:author_id(full_name),
        board_categories!inner(name, slug)
      `)
      .order("created_at", { ascending: false })
      .limit(limit);

    // 2. 필터링 조건 적용
    if (!categorySlug || categorySlug === 'all') {
      // [통합 피드] 공지사항/자유게시판 제외 (소모임 글만)
      // not.in 필터가 확실하게 작동하도록 설정
      query = query.not('board_categories.slug', 'in', '("announcement","free-board")');
    } else {
      // [개별 게시판] 해당 슬러그와 정확히 일치하는 글만
      query = query.eq('board_categories.slug', categorySlug);
    }

    // 3. 쿼리 실행
    const { data: posts, error } = await query;

    if (error) {
      console.error("🚨 [getLatestPosts] Query Error:", error);
      return [];
    }

    // 4. 데이터 변환 (Type Mapping)
    return (posts || []).map((post: any) => ({
      id: post.id,
      title: post.title,
      content: post.content,
      created_at: post.created_at,
      visibility: post.visibility || 'public',
      likes_count: post.likes_count || 0,
      comments_count: post.comments_count || 0,
      profiles: post.profiles ? { full_name: post.profiles.full_name } : null,
      board_categories: post.board_categories
        ? { name: post.board_categories.name, slug: post.board_categories.slug }
        : null,
      communities: null
    }));

  } catch (error) {
    console.error("🚨 [getLatestPosts] Unexpected Error:", error);
    return [];
  }
}

