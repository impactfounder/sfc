import { createClient } from "@/lib/supabase/server";
import { notFound } from 'next/navigation';
import { isAdmin } from "@/lib/utils";
import { BoardPageClient } from "./board-page-client";

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

  const [categoryResult, userResult] = await Promise.all([
    supabase
      .from("board_categories")
      .select("id, name, description, slug, is_active")
      .eq("slug", dbSlug) // ★ dbSlug 사용 (매핑된 실제 DB 슬러그)
      .eq("is_active", true)
      .single(),
    supabase.auth.getUser(),
  ]);

  const category = categoryResult.data;
  const user = userResult.data.user;

  if (!category) {
    notFound();
  }

  // 관리자 여부 확인
  let isUserAdmin = false;
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role, email")
      .eq("id", user.id)
      .single();
    isUserAdmin = isAdmin(profile?.role, profile?.email);
  }

  return (
    <BoardPageClient
      slug={slug}
      dbSlug={dbSlug}
      category={category}
      isUserAdmin={isUserAdmin}
      user={user}
    />
  );
}
