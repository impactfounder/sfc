import { SupabaseClient } from "@supabase/supabase-js"
import type { PostForDisplay, ReviewForDisplay } from "@/lib/types/posts"

// 타입 재export (하위 호환성 유지)
export type { PostForDisplay, ReviewForDisplay }

// Supabase 쿼리 결과 타입
type PostFromDB = {
  id: string
  title: string
  content: string | null
  created_at: string
  visibility: string | null
  likes_count: number | null
  comments_count: number | null
  thumbnail_url: string | null
  profiles: {
    id: string
    full_name: string | null
    avatar_url: string | null
  } | null
  board_categories: {
    name: string | null
    slug: string | null
  } | null
}

type ReviewFromDB = {
  id: string
  title: string
  content: string | null
  created_at: string
  likes_count: number | null
  comments_count: number | null
  profiles: {
    id: string
    full_name: string | null
    avatar_url: string | null
  } | null
  events: {
    id: string
    title: string | null
    thumbnail_url: string | null
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

    if (process.env.NODE_ENV === 'development') {
      console.log(`[getLatestPosts] Fetching for slug: ${categorySlug || 'all'}`);
    }

    // 1. 기본 쿼리 작성 (Select + Join)
    // Left Join을 사용하여 RLS 정책 충돌 방지
    // profiles 조인 시 id 필드를 반드시 포함하여 N+1 문제 예방
    let query = supabase
      .from("posts")
      .select(`
        id, title, thumbnail_url, created_at, visibility, likes_count, comments_count,
        profiles:author_id(id, full_name, avatar_url),
        board_categories(name, slug)
      `); // content 필드 제거하여 쿼리 경량화 (리스트에서는 본문 전체가 필요 없음)

    // 2. 필터링 조건 적용
    if (!categorySlug || categorySlug === 'all') {
      // [통합 피드] 공지사항, 자유게시판, '열어주세요', 후기 제외하고 나머지는 모두 가져옴
      // 카테고리가 있는 것만 필터링 (null 제외)
      query = query.not('board_categories', 'is', null);
      query = query.neq('board_categories.slug', 'announcement')
        .neq('board_categories.slug', 'free-board')
        .neq('board_categories.slug', 'event-requests')
        .neq('board_categories.slug', 'reviews');
      query = query.order("created_at", { ascending: false });
    } else if (categorySlug === 'event-requests') {
      // [Event Requests] likes_count 기준 내림차순 정렬
      query = query.eq('board_categories.slug', categorySlug);
      query = query.order("likes_count", { ascending: false });
    } else {
      // [개별 게시판] 해당 슬러그와 정확히 일치하는 글만
      query = query.eq('board_categories.slug', categorySlug);
      query = query.order("created_at", { ascending: false });
    }

    query = query.limit(limit);

    // 3. 쿼리 실행
    const { data: posts, error } = await query;

    if (error) {
      console.error("🚨 [getLatestPosts] Query Error:", JSON.stringify(error, null, 2));
      console.error("🚨 [getLatestPosts] Error Details:", {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });
      return [];
    }

    if (!posts || posts.length === 0) {
      return [];
    }

    // 4. 실제 좋아요 및 댓글 수 조회 (병렬 처리)
    const postIds = posts.map((p: PostFromDB) => p.id);
    
    const [likesResult, commentsResult] = await Promise.all([
      supabase
        .from("post_likes")
        .select("post_id")
        .in("post_id", postIds),
      supabase
        .from("comments")
        .select("post_id")
        .in("post_id", postIds)
    ]);

    // 카운트 맵 생성
    const likesCountMap = new Map<string, number>();
    const commentsCountMap = new Map<string, number>();

    (likesResult.data || []).forEach((like: { post_id: string }) => {
      likesCountMap.set(like.post_id, (likesCountMap.get(like.post_id) || 0) + 1);
    });

    (commentsResult.data || []).forEach((comment: { post_id: string }) => {
      commentsCountMap.set(comment.post_id, (commentsCountMap.get(comment.post_id) || 0) + 1);
    });

    // 5. 데이터 변환 (Type Mapping) - 실제 카운트 사용
    return (posts || []).map((post: PostFromDB): PostForDisplay => ({
      id: post.id,
      title: post.title,
      content: null, // 리스트에서는 본문 전체가 필요 없으므로 null로 설정
      created_at: post.created_at,
      visibility: (post.visibility as "public" | "group") || 'public',
      likes_count: likesCountMap.get(post.id) || 0,
      comments_count: commentsCountMap.get(post.id) || 0,
      thumbnail_url: post.thumbnail_url,
      profiles: post.profiles ? { 
        id: post.profiles.id,
        full_name: post.profiles.full_name,
        avatar_url: post.profiles.avatar_url
      } : null,
      board_categories: post.board_categories
        ? { name: post.board_categories.name, slug: post.board_categories.slug }
        : null,
      communities: null
    }));

  } catch (error) {
    console.error("🚨 [getLatestPosts] Unexpected Error:", JSON.stringify(error, null, 2));
    if (error instanceof Error) {
      console.error("🚨 [getLatestPosts] Error Stack:", error.stack);
    }
    return [];
  }
}

/**
 * 최신 후기 목록 가져오기
 * @param supabase Supabase 클라이언트
 * @param limit 가져올 후기 수 (기본값: 10)
 */
export async function getLatestReviews(
  supabase: SupabaseClient,
  limit: number = 10
): Promise<ReviewForDisplay[]> {
  try {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[getLatestReviews] Fetching latest reviews (limit: ${limit})`);
    }

    // 후기 전용 쿼리: board_categories.slug가 'reviews'인 게시글만
    // related_event_id를 통해 events 테이블 조인
    const { data: reviews, error } = await supabase
      .from("posts")
      .select(`
        id,
        title,
        content,
        created_at,
        likes_count,
        comments_count,
        profiles:author_id(
          id,
          full_name,
          avatar_url
        ),
        events:related_event_id(
          id,
          title,
          thumbnail_url
        ),
        board_categories!inner(name, slug)
      `)
      .eq('board_categories.slug', 'reviews')
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      console.error("🚨 [getLatestReviews] Query Error:", error);
      return [];
    }

    // 데이터 변환 (Type Mapping)
    return (reviews || []).map((review: ReviewFromDB): ReviewForDisplay => ({
      id: review.id,
      title: review.title,
      content: review.content,
      created_at: review.created_at,
      likes_count: review.likes_count || 0,
      comments_count: review.comments_count || 0,
      profiles: review.profiles ? {
        id: review.profiles.id,
        full_name: review.profiles.full_name,
        avatar_url: review.profiles.avatar_url
      } : null,
      events: review.events ? {
        id: review.events.id,
        title: review.events.title,
        thumbnail_url: review.events.thumbnail_url
      } : null
    }));

  } catch (error) {
    console.error("🚨 [getLatestReviews] Unexpected Error:", error);
    return [];
  }
}

