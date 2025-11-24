import { createClient } from "@/lib/supabase/server";
import { notFound } from 'next/navigation';
import { Card, CardContent } from "@/components/ui/card";
import { Heart, MessageSquare, Bookmark, Share2, ArrowLeft } from 'lucide-react';
import { LikeButton } from "@/components/like-button";
import { CommentSection } from "@/components/comment-section";
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { UserBadges } from "@/components/user-badges";
import type { Metadata } from "next";

// 전체 공개 게시판 slug 목록
const PUBLIC_BOARDS = ["free", "vangol", "hightalk"];

// 동적 metadata 생성
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; id: string }>;
}): Promise<Metadata> {
  const { slug, id } = await params;
  const supabase = await createClient();
  
  const categorySlug = slug === "announcements" ? "announcement" : slug;
  
  const { data: post } = await supabase
    .from("posts")
    .select(`
      title,
      content,
      created_at,
      profiles:author_id (
        full_name
      )
    `)
    .eq("id", id)
    .eq("category", categorySlug)
    .single();

  if (!post) {
    return {
      title: "게시글을 찾을 수 없습니다",
    };
  }

  const isPublic = PUBLIC_BOARDS.includes(slug);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://seoulfounders.club";
  const cleanContent = post.content?.replace(/<[^>]*>/g, "").substring(0, 200) || "";
  const title = `${post.title} | Seoul Founders Club`;
  const description = cleanContent || `${post.title} - Seoul Founders Club 게시글`;
  const authorName = (post.profiles as any)?.full_name || "익명";

  return {
    title,
    description,
    openGraph: isPublic ? {
      title,
      description,
      url: `${siteUrl}/community/board/${slug}/${id}`,
      siteName: "Seoul Founders Club",
      type: "article",
      publishedTime: post.created_at,
      authors: authorName !== "익명" ? [authorName] : undefined,
    } : undefined,
    twitter: isPublic ? {
      card: "summary_large_image",
      title,
      description,
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

export default async function BoardPostDetailPage({
  params,
}: {
  params: Promise<{ slug: string; id: string }>;
}) {
  const { slug, id } = await params;
  const supabase = await createClient();

  const categorySlug = slug === "announcements" ? "announcement" : slug;

  // 병렬로 초기 데이터 가져오기
  const [categoryResult, userResult, postResult] = await Promise.all([
    slug !== "announcements" ? supabase
      .from("board_categories")
      .select("*")
      .eq("slug", slug)
      .eq("is_active", true)
      .single() : Promise.resolve({ data: null }),
    supabase.auth.getUser(),
    supabase
      .from("posts")
      .select(`
        *,
        profiles:author_id (
          id,
          full_name,
          avatar_url
        ),
        board_categories:board_category_id (
          name,
          slug
        )
      `)
      .eq("id", id)
      .single()
  ]);

  const { data: category } = categoryResult;
  const { data: { user } } = userResult;
  const { data: post } = postResult;

  if (!category && slug !== "announcements") {
    notFound();
  }

  if (!post) {
    notFound();
  }

  // 병렬로 나머지 데이터 가져오기
  const [userLikeResult, commentsResult, badgesResult] = await Promise.all([
    user ? supabase
      .from("post_likes")
      .select("id")
      .eq("post_id", id)
      .eq("user_id", user.id)
      .maybeSingle() : Promise.resolve({ data: null }),
    supabase
      .from("comments")
      .select(`
        *,
        profiles:author_id (
          id,
          full_name,
          avatar_url
        )
      `)
      .eq("post_id", id)
      .order("created_at", { ascending: true }),
    post.author_id ? supabase
      .from("user_badges")
      .select(`
        badges:badge_id (
          icon,
          name
        )
      `)
      .eq("user_id", post.author_id)
      .eq("is_visible", true) : Promise.resolve({ data: null })
  ]);

  const userLike = userLikeResult.data;
  const { data: comments } = commentsResult;

  // 작성자의 노출된 뱃지 가져오기
  let authorVisibleBadges: Array<{ icon: string; name: string }> = []
  if (badgesResult.data) {
    authorVisibleBadges = badgesResult.data
      .map((ub: any) => ub.badges)
      .filter(Boolean)
      .map((badge: any) => ({
        icon: badge.icon,
        name: badge.name,
      }))
  }

  // 구조화된 데이터 (JSON-LD) - 전체 공개 게시판만
  const isPublic = PUBLIC_BOARDS.includes(slug);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://seoulfounders.club";
  
  const structuredData = isPublic ? {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": post.title,
    "description": post.content?.replace(/<[^>]*>/g, "").substring(0, 200) || "",
    "url": `${siteUrl}/community/board/${slug}/${id}`,
    "author": {
      "@type": "Person",
      "name": post.profiles?.full_name || "익명"
    },
    "publisher": {
      "@type": "Organization",
      "name": "Seoul Founders Club",
      "url": siteUrl
    },
    "datePublished": post.created_at,
    "dateModified": post.updated_at || post.created_at,
  } : null;

  // 게시판 이름 결정 (board_categories에서 가져오거나 fallback)
  const boardName = (post as any)?.board_categories?.name || category?.name || (slug === "announcements" ? "공지사항" : "게시판")

  return (
    <>
      {structuredData && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
      )}
      <div className="min-h-screen bg-white">
        {/* 헤더: 뒤로가기 + 게시판 이름 + 공유 버튼 */}
        <div className="sticky top-0 z-10 bg-white border-b border-slate-200">
          <div className="mx-auto max-w-4xl">
            <div className="flex items-center px-4 md:px-6 py-3">
              <Link href={`/community/board/${slug}`}>
                <Button variant="ghost" size="icon" className="h-9 w-9 -ml-2">
                  <ArrowLeft className="h-5 w-5 text-slate-700" />
                </Button>
              </Link>
              <span className="ml-2 text-sm font-medium text-slate-700">
                {boardName}
              </span>
              <div className="ml-auto flex items-center gap-1">
                <Button variant="ghost" size="icon" className="h-9 w-9">
                  <Share2 className="h-5 w-5 text-slate-600" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* 본문: 통합된 카드 */}
        <div className="mx-auto max-w-4xl px-4 md:px-6 py-6 md:py-8">
          <Card className="border border-slate-200 rounded-xl shadow-sm">
            <CardContent className="p-6 md:p-8">
              {/* 커뮤니티 이름 뱃지 */}
              <div className="mb-4">
                <span className="bg-blue-50 text-blue-600 rounded-full px-2.5 py-1 text-xs font-bold">
                  {boardName}
                </span>
              </div>

              {/* 작성자 정보 */}
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-500 text-sm font-semibold text-white flex-shrink-0">
                  {post.profiles?.full_name?.[0] || "U"}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-slate-900 truncate text-sm">
                      {post.profiles?.full_name || "익명"}
                    </p>
                    {authorVisibleBadges.length > 0 && (
                      <UserBadges badges={authorVisibleBadges} />
                    )}
                  </div>
                  <p className="text-xs text-slate-500">
                    {new Date(post.created_at).toLocaleDateString("ko-KR", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>

              {/* 제목 */}
              <h1 className="mb-4 text-2xl md:text-4xl font-bold text-slate-900 leading-snug">
                {post.title}
              </h1>

              {/* 본문 내용 */}
              <div 
                className="prose prose-base max-w-none text-slate-700 leading-relaxed mb-6"
                dangerouslySetInnerHTML={{ __html: post.content || "" }}
              />

              {/* 좋아요/댓글 버튼 */}
              <div className="flex items-center gap-4 pt-4 border-t border-slate-200">
                {user && (
                  <LikeButton
                    postId={post.id}
                    userId={user.id}
                    initialLiked={!!userLike}
                    initialCount={post.likes_count || 0}
                  />
                )}
                {!user && (
                  <div className="flex items-center gap-1.5 text-sm text-slate-500">
                    <Heart className="h-4 w-4" />
                    <span>{post.likes_count || 0}</span>
                  </div>
                )}
                <div className="flex items-center gap-1.5 text-sm text-slate-500">
                  <MessageSquare className="h-4 w-4" />
                  <span>{post.comments_count || 0}</span>
                </div>
              </div>

              {/* 댓글 섹션 (구분선으로 자연스럽게 연결) */}
              <div className="mt-6 pt-6 border-t border-slate-200">
                <h2 className="mb-4 text-lg font-bold text-slate-900">
                  댓글
                </h2>
                <CommentSection
                  postId={post.id}
                  userId={user?.id}
                  comments={comments || []}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
