import { createClient } from "@/lib/supabase/server";
import { notFound } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { PostsSection } from "@/components/home/posts-section";
import { getLatestPosts } from "@/lib/queries/posts";
import Link from "next/link";
import { Plus } from 'lucide-react';
import { isAdmin } from "@/lib/utils";
import type { Metadata } from "next";

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

  // 디버깅용 로그: 서버 로그에서 확인 가능
  console.log('Current Slug:', slug, 'Mapped DB Slug:', dbSlug);

  // 매핑 검증: 유효한 슬러그인지 확인
  const validSlugs = ['announcement', 'free-board', 'vangol', 'hightalk'];
  if (!validSlugs.includes(dbSlug)) {
    console.error(`[BoardPage] ❌ 유효하지 않은 슬러그: "${slug}" -> "${dbSlug}"`);
    notFound();
  }

  const [categoryResult, userResult, transformedPosts] = await Promise.all([
    supabase
      .from("board_categories")
      .select("*")
      .eq("slug", dbSlug) // ★ dbSlug 사용 (매핑된 실제 DB 슬러그)
      .eq("is_active", true)
      .single(),
    supabase.auth.getUser(),
    getLatestPosts(supabase, 50, dbSlug) // ★ dbSlug 사용 (매핑된 실제 DB 슬러그)
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

  // 구조화된 데이터 (JSON-LD) - 전체 공개 게시판만
  const isPublic = PUBLIC_BOARDS.includes(slug);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://seoulfounders.club";
  
  const structuredData = isPublic && transformedPosts.length > 0 ? {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "name": category.name,
    "description": category.description || `${category.name} 게시판입니다.`,
    "url": `${siteUrl}/community/board/${slug}`,
    "mainEntity": {
      "@type": "ItemList",
      "itemListElement": transformedPosts.slice(0, 10).map((post: any, index: number) => ({
        "@type": "ListItem",
        "position": index + 1,
        "item": {
          "@type": "Article",
          "headline": post.title,
          "description": post.content?.replace(/<[^>]*>/g, "").substring(0, 200) || "",
          "url": `${siteUrl}/community/board/${slug}/${post.id}`,
          "author": {
            "@type": "Person",
            "name": post.profiles?.full_name || "익명"
          },
          "datePublished": post.created_at,
        }
      }))
    }
  } : null;

  // 게시글 데이터에 isMember 추가 (PostsSection 형식에 맞춤)
  let postsWithMembership = transformedPosts.map((post: any) => ({
    ...post,
    isMember: true, // 개별 게시판에서는 항상 true (나중에 멤버십 체크 추가 가능)
  }))

  // 디버깅: 데이터 확인
  console.log(`[BoardPage] ✅ slug: "${slug}", dbSlug: "${dbSlug}", 게시글 수: ${postsWithMembership.length}`)
  
  // 게시글이 없을 때 경고 (테스트 데이터는 제거 - DB에 반드시 데이터가 있어야 함)
  if (postsWithMembership.length === 0) {
    console.warn(`[BoardPage] ⚠️ 게시글이 없습니다. slug: "${slug}", dbSlug: "${dbSlug}", category: ${category?.name}`)
    console.warn(`[BoardPage] 💡 scripts/099_rebuild_community_schema.sql을 실행하여 테스트 데이터를 생성하세요.`)
  }

  return (
    <>
      {structuredData && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
      )}
      <div className="min-h-screen bg-white">
        <div className="mx-auto max-w-7xl px-4 py-8 md:px-8">
          {/* Header */}
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-slate-900">{category.name}</h1>
              {category.description && (
                <p className="mt-2 text-slate-600">{category.description}</p>
              )}
            </div>
            {(slug !== "announcements" || isUserAdmin) && (
              <div>
                {user ? (
                  <Link href={`/community/board/${slug}/new`}>
                    <Button className="gap-2 transition-all active:scale-[0.98] hover:shadow-lg">
                      <Plus className="h-4 w-4" />
                      글쓰기
                    </Button>
                  </Link>
                ) : (
                  <Link href="/auth/login">
                    <Button variant="outline" className="gap-2 transition-all active:scale-[0.98] hover:shadow-lg">
                      <Plus className="h-4 w-4" />
                      로그인하고 글쓰기
                    </Button>
                  </Link>
                )}
              </div>
            )}
          </div>

          {/* Posts Section - 투명 배경으로 통일 */}
          <PostsSection
            posts={postsWithMembership}
            boardCategories={[]}
            hideTabs={true}
          />
        </div>
      </div>
    </>
  );
}
