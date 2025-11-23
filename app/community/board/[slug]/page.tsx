import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from 'next/navigation';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Plus, MessageSquare, ThumbsUp } from 'lucide-react';
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
        )
      `)
      .eq("category", slug === "announcements" ? "announcement" : slug)
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

  return (
    <>
      {structuredData && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
      )}
      <div className="min-h-screen bg-white p-4 md:p-8 pt-20 md:pt-8">
        <div className="mx-auto max-w-4xl">
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

          {/* Posts List */}
          {posts && posts.length > 0 ? (
            <div className="space-y-4">
              {posts.map((post: any) => (
                <Link key={post.id} href={`/community/board/${slug}/${post.id}`}>
                  <Card className="border-slate-200 bg-white hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-slate-900 mb-2 line-clamp-2">
                            {post.title}
                          </h3>
                          {post.content && (
                            <p className="text-sm text-slate-600 line-clamp-2 mb-3">
                              {post.content.replace(/<[^>]*>/g, "").substring(0, 150)}
                            </p>
                          )}
                          <div className="flex items-center gap-3 text-xs text-slate-500">
                            <span>{post.profiles?.full_name || "익명"}</span>
                            <span>•</span>
                            <time dateTime={post.created_at}>
                              {new Date(post.created_at).toLocaleDateString("ko-KR", {
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                              })}
                            </time>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 text-slate-400">
                          <div className="flex items-center gap-1">
                            <MessageSquare className="h-4 w-4" />
                            <span className="text-xs">{post.comments_count || 0}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <ThumbsUp className="h-4 w-4" />
                            <span className="text-xs">{post.likes_count || 0}</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          ) : (
            <Card className="border-slate-200">
              <CardContent className="py-12 text-center">
                <MessageSquare className="mx-auto mb-4 h-12 w-12 text-slate-400" />
                <h3 className="mb-2 text-lg font-semibold text-slate-900">아직 게시글이 없습니다</h3>
                <p className="mb-4 text-sm text-slate-600">첫 번째 게시글을 작성해보세요</p>
                {user && (
                  <Link href={`/community/board/${slug}/new`}>
                    <Button>글쓰기</Button>
                  </Link>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </>
  );
}
