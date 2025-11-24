import { createClient } from "@/lib/supabase/server";
import { notFound } from 'next/navigation';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PostsSection } from "@/components/home/posts-section";
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
  
  const { data: category } = await supabase
    .from("board_categories")
    .select("name, description")
    .eq("slug", slug)
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

  const [categoryResult, userResult, postsResult] = await Promise.all([
    supabase
      .from("board_categories")
      .select("*")
      .eq("slug", slug)
      .eq("is_active", true)
      .single(),
    supabase.auth.getUser(),
    supabase
      .from("posts")
      .select(`
        *,
        profiles:author_id (
          id,
          full_name
        ),
        board_categories:board_category_id (
          name,
          slug
        )
      `)
      .eq("board_categories.slug", slug)
      .order("created_at", { ascending: false })
  ]);

  const category = categoryResult.data;
  const user = userResult.data.user;
  const posts = postsResult.data;

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
  
  const structuredData = isPublic && posts ? {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "name": category.name,
    "description": category.description || `${category.name} 게시판입니다.`,
    "url": `${siteUrl}/community/board/${slug}`,
    "mainEntity": {
      "@type": "ItemList",
      "itemListElement": posts.slice(0, 10).map((post: any, index: number) => ({
        "@type": "ListItem",
        "position": index + 1,
        "item": {
          "@type": "Article",
          "headline": post.title,
          "description": post.content?.substring(0, 200) || "",
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

  // 게시글 데이터 변환 (PostsSection 형식에 맞춤)
  const transformedPosts = (posts || []).map((post: any) => ({
    id: post.id,
    title: post.title,
    content: post.content,
    created_at: post.created_at,
    visibility: post.visibility || "public",
    likes_count: post.likes_count || 0,
    comments_count: post.comments_count || 0,
    profiles: post.profiles ? { full_name: post.profiles.full_name } : null,
    board_categories: post.board_categories || {
      name: category.name,
      slug: slug,
    },
    isMember: true, // 개별 게시판에서는 항상 true (나중에 멤버십 체크 추가 가능)
  }))

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
                    <Button className="gap-2">
                      <Plus className="h-4 w-4" />
                      글쓰기
                    </Button>
                  </Link>
                ) : (
                  <Link href="/auth/login">
                    <Button variant="outline" className="gap-2">
                      <Plus className="h-4 w-4" />
                      로그인하고 글쓰기
                    </Button>
                  </Link>
                )}
              </div>
            )}
          </div>

          {/* Posts Section - 카드형 피드로 통일 */}
          <Card>
            <CardContent className="pt-6">
              <PostsSection
                posts={transformedPosts}
                boardCategories={[]}
                hideTabs={true}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
