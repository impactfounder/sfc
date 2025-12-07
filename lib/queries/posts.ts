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
    const postIds = posts.map((p) => p.id as string);

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
    return (posts || []).map((post: any): PostForDisplay => ({
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
      console.log(`[getLatestReviews] Fetching latest reviews (no-join)`);
    }

    // 1. Reviews 조회 (관계 조인 없이 순수 데이터만)
    const { data: reviews, error } = await supabase
      .from("reviews")
      .select("*")
      .eq("is_public", true)
      .order("is_best", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      console.error("🚨 [getLatestReviews] Query Error:", error);
      return [];
    }

    if (!reviews || reviews.length === 0) {
      return [];
    }

    // 2. User IDs 및 Event IDs 수집
    const userIds = Array.from(new Set(reviews.map((r: any) => r.user_id).filter(Boolean)));
    const eventIds = Array.from(new Set(reviews.map((r: any) => r.event_id).filter(Boolean)));

    // 3. Profiles 조회
    let profileMap = new Map();
    if (userIds.length > 0) {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url, role, company, position")
        .in("id", userIds);

      if (profiles) {
        profiles.forEach((p: any) => profileMap.set(p.id, p));
      }
    }

    // 4. Events 조회
    let eventMap = new Map();
    if (eventIds.length > 0) {
      const { data: events } = await supabase
        .from("events")
        .select("id, title, event_date, thumbnail_url")
        .in("id", eventIds);

      if (events) {
        events.forEach((e: any) => eventMap.set(e.id, e));
      }
    }

    // 5. 데이터 병합 (Mapping)
    const result = reviews.map((review: any): ReviewForDisplay | null => {
      const event = eventMap.get(review.event_id);

      // 이벤트 정보가 없으면 제외 (필수 필드)
      if (!event) return null;

      const profile = profileMap.get(review.user_id);

      return {
        id: review.id,
        user_id: review.user_id,
        event_id: review.event_id,
        rating: review.rating,
        keywords: review.keywords || [],
        one_liner: review.one_liner,
        detail_content: review.detail_content,
        images: review.images || [],
        is_best: review.is_best,
        is_public: review.is_public,
        created_at: review.created_at,
        updated_at: review.updated_at,
        title: review.one_liner,
        likes_count: 0,
        comments_count: 0,
        profiles: profile ? {
          id: profile.id,
          full_name: profile.full_name,
          avatar_url: profile.avatar_url,
          role: profile.role,
          company: profile.company,
          position: profile.position
        } : null,
        events: {
          id: event.id,
          title: event.title,
          event_date: event.event_date,
          thumbnail_url: event.thumbnail_url
        }
      };
    }).filter((item): item is ReviewForDisplay => item !== null);

    return result;

  } catch (error) {
    console.error("🚨 [getLatestReviews] Unexpected Error:", error);
    return [];
  }
}

/**
 * 특정 이벤트의 후기 목록 가져오기
 * @param supabase Supabase 클라이언트
 * @param eventId 이벤트 ID
 */
export async function getReviewsByEvent(
  supabase: SupabaseClient,
  eventId: string
): Promise<ReviewForDisplay[]> {
  try {
    // 1. Reviews 조회 (조인 없음)
    const { data: reviews, error } = await supabase
      .from("reviews")
      .select("*")
      .eq("event_id", eventId)
      .eq("is_public", true)
      .order("is_best", { ascending: false })
      .order("created_at", { ascending: false });

    if (error) {
      console.error("🚨 [getReviewsByEvent] Query Error:", error);
      return [];
    }

    if (!reviews || reviews.length === 0) {
      return [];
    }

    // 2. User IDs 수집 및 Profiles 조회
    const userIds = Array.from(new Set(reviews.map((r: any) => r.user_id).filter(Boolean)));

    let profileMap = new Map();
    if (userIds.length > 0) {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url, role, company, position")
        .in("id", userIds);

      if (profiles) {
        profiles.forEach((p: any) => profileMap.set(p.id, p));
      }
    }

    // 3. Event 정보 조회 (단일 이벤트이므로 한 번만 조회)
    const { data: event } = await supabase
      .from("events")
      .select("id, title, event_date, thumbnail_url")
      .eq("id", eventId)
      .single();

    if (!event) {
      console.error("🚨 [getReviewsByEvent] Event not found:", eventId);
      return [];
    }

    // 4. 데이터 병합
    return reviews.map((review: any): ReviewForDisplay | null => {
      const profile = profileMap.get(review.user_id);

      return {
        id: review.id,
        user_id: review.user_id,
        event_id: review.event_id,
        rating: review.rating,
        keywords: review.keywords || [],
        one_liner: review.one_liner,
        detail_content: review.detail_content,
        images: review.images || [],
        is_best: review.is_best,
        is_public: review.is_public,
        created_at: review.created_at,
        updated_at: review.updated_at,
        // PostForDisplay 인터페이스 호환용
        title: review.one_liner,
        likes_count: 0,
        comments_count: 0,
        profiles: profile ? {
          id: profile.id,
          full_name: profile.full_name,
          avatar_url: profile.avatar_url,
          role: profile.role,
          company: profile.company,
          position: profile.position
        } : null,
        events: {
          id: event.id,
          title: event.title,
          event_date: event.event_date,
          thumbnail_url: event.thumbnail_url
        }
      };
    }).filter((item): item is ReviewForDisplay => item !== null);

  } catch (error) {
    console.error("🚨 [getReviewsByEvent] Unexpected Error:", error);
    return [];
  }
}
