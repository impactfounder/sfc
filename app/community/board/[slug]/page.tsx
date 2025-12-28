import { createClient } from "@/lib/supabase/server";
import { notFound } from 'next/navigation';
import { isAdmin } from "@/lib/utils";
import { BoardPageClient } from "./board-page-client";

// ISR: 30초마다 재검증 (게시판은 비교적 짧은 캐시)
export const revalidate = 30;

// 전체 공개 게시판 slug 목록 (참고용, 메타데이터 생성에선 안 쓰지만 로직엔 필요할 수 있음)
const PUBLIC_BOARDS = ["free", "vangol", "hightalk"];

export default async function BoardPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();

  // ★ URL 슬러그 -> DB 슬러그 변환 (강제 적용)
  let dbSlug = slug;

  // ★ URL이 'free'면 DB의 'free-board'를 찾아라!
  if (slug === 'free') {
    dbSlug = 'free-board';
  }

  // 공지사항도 마찬가지
  if (slug === 'announcements') {
    dbSlug = 'announcement';
  }

  // 디버깅용 로그: 개발 환경에서만 출력
  if (process.env.NODE_ENV === 'development') {
    console.log('Current Slug:', slug, 'Mapped DB Slug:', dbSlug);
  }

  // insights slug 매핑
  if (slug === 'insights') {
    dbSlug = 'insights';
  }

  // 매핑 검증: 유효한 슬러그인지 확인
  const validSlugs = ['announcement', 'free-board', 'vangol', 'hightalk', 'event-requests', 'insights'];
  if (!validSlugs.includes(dbSlug)) {
    console.error(`[BoardPage] ❌ 유효하지 않은 슬러그: "${slug}" -> "${dbSlug}"`);
    notFound();
  }

  // 세션 먼저 확인 (비로그인 최적화 - getUser 네트워크 호출 방지)
  const [categoryResult, sessionResult] = await Promise.all([
    supabase
      .from("board_categories")
      .select("id, name, description, slug, is_active")
      .eq("slug", dbSlug) // ★ dbSlug 사용 (매핑된 실제 DB 슬러그)
      .eq("is_active", true)
      .single(),
    supabase.auth.getSession(),
  ]);

  const category = categoryResult.data;
  const session = sessionResult.data.session;

  if (!category) {
    notFound();
  }

  // 관리자 여부 확인 (세션이 있을 때만 getUser 호출)
  let user = null;
  let isUserAdmin = false;
  let userProfile: any = null;

  if (session) {
    const { data: { user: authUser } } = await supabase.auth.getUser();
    user = authUser;

    if (user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("role, email")
        .eq("id", user.id)
        .single();
      userProfile = profile;
      isUserAdmin = isAdmin(profile?.role, profile?.email);
    }
  }

  // 커뮤니티 ID 및 멤버십 확인 (시스템 게시판 제외)
  const systemBoards = ['announcement', 'free-board', 'event-requests', 'insights'];
  const isSystemBoard = systemBoards.includes(dbSlug);

  // 서버 사이드에서 초기 posts 데이터 가져오기 (RLS 문제 방지)
  const postsResult = await supabase
    .from("posts")
    .select(`
      *,
      profiles:author_id(full_name, avatar_url),
      board_categories!inner(name, slug),
      post_images(id, image_url, sort_order)
    `, { count: "exact" })
    .eq("board_categories.slug", dbSlug)
    .order("created_at", { ascending: false })
    .range(0, 14);

  // 디버깅 로그 (프로덕션에서도 출력)
  if (postsResult.error) {
    console.error('[BoardPage] Posts query error:', postsResult.error);
  }
  console.log('[BoardPage] dbSlug:', dbSlug, 'posts count:', postsResult.data?.length || 0);

  const initialPosts = postsResult.data || [];
  const initialPostsCount = postsResult.count || 0;

  // 댓글 수 조회 (좋아요는 posts.likes_count를 그대로 사용)
  // ✅ 수정: post_likes 별도 조회 제거 - 익명 좋아요가 posts.likes_count에만 반영되므로
  let postsWithCounts = initialPosts;
  if (initialPosts.length > 0) {
    const postIds = initialPosts.map((post: any) => post.id);

    const commentsResult = await supabase
      .from("comments")
      .select("post_id")
      .in("post_id", postIds);

    const commentsCountMap = new Map<string, number>();
    (commentsResult.data || []).forEach((comment: any) => {
      commentsCountMap.set(comment.post_id, (commentsCountMap.get(comment.post_id) || 0) + 1);
    });

    postsWithCounts = initialPosts.map((post: any) => ({
      ...post,
      likes_count: post.likes_count || 0,  // DB 값 그대로 사용
      comments_count: commentsCountMap.get(post.id) || 0,
    }));
  }

  let communityId: string | null = null;
  let isMember = false;
  let canEditDescription = false;

  if (!isSystemBoard) {
    // communities 테이블에서 커뮤니티 ID 및 description 가져오기
    const { data: community } = await supabase
      .from("communities")
      .select("id, created_by, description")
      .eq("name", category.name)
      .single();

    communityId = community?.id || null;

    // communities 테이블의 description이 있으면 그것을 사용
    if (community?.description) {
      category.description = community.description;
    }

    // 멤버십 확인
    if (communityId && user) {
      const { data: membership } = await supabase
        .from("community_members")
        .select("id")
        .eq("community_id", communityId)
        .eq("user_id", user.id)
        .single();

      isMember = !!membership;

      // 소개글 수정 권한 확인: 리더 또는 master
      const isLeader = community?.created_by === user.id;
      const isMaster = userProfile?.role === 'master';
      canEditDescription = isLeader || isMaster;
    }
  }

  return (
    <BoardPageClient
      slug={slug}
      dbSlug={dbSlug}
      category={category}
      isUserAdmin={isUserAdmin}
      user={user}
      communityId={communityId}
      isMember={isMember}
      canEditDescription={canEditDescription}
      initialPosts={postsWithCounts}
      initialPostsCount={initialPostsCount}
    />
  );
}
