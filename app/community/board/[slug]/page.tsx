import { createClient } from "@/lib/supabase/server";
import { notFound } from 'next/navigation';
import { isAdmin } from "@/lib/utils";
import type { Metadata } from "next";
import { BoardPageClient } from "./board-page-client";

// 전체 공개 게시판 slug 목록
const PUBLIC_BOARDS = ["free", "vangol", "hightalk"];

// 동적 metadata 생성
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createClient();
  
  // URL 슬러그를 DB 슬러그로 매핑
  let dbSlug = slug;
  if (slug === 'free') dbSlug = 'free-board';
  if (slug === 'announcements') dbSlug = 'announcement';
  
  const { data: category } = await supabase
    .from("board_categories")
    .select("name, description")
    .eq("slug", dbSlug)
    .eq("is_active", true)
    .single();

  const isPublic = PUBLIC_BOARDS.includes(slug);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://seoulfounders.club";
  
  if (!category) {
    return {
      title: "게시판을 찾을 수 없습니다",
    };
  }

  const title = `${category.name} | Seoul Founders Club`;
  const description = category.description || `${category.name} 게시판입니다.`;

  return {
    title,
    description,
    openGraph: isPublic ? {
      title,
      description,
      url: `${siteUrl}/community/board/${slug}`,
      siteName: "Seoul Founders Club",
      type: "website",
    } : undefined,
    robots: isPublic ? {
      index: true,
      follow: true,
    } : {
      index: false,
      follow: false,
    },
  };
}

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

  // 매핑 검증: 유효한 슬러그인지 확인
  const validSlugs = ['announcement', 'free-board', 'vangol', 'hightalk', 'event-requests'];
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
