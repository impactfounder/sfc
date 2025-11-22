import { createClient } from "@/lib/supabase/server";
import { notFound } from 'next/navigation';
import { Card, CardContent } from "@/components/ui/card";
import { Heart, MessageSquare, Bookmark, Share2, ArrowLeft } from 'lucide-react';
import { LikeButton } from "@/components/like-button";
import { CommentSection } from "@/components/comment-section";
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { UserBadges } from "@/components/user-badges";

export default async function BoardPostDetailPage({
  params,
}: {
  params: Promise<{ slug: string; id: string }>;
}) {
  const { slug, id } = await params;
  const supabase = await createClient();

  const categorySlug = slug === "announcements" ? "announcement" : slug;

  const { data: category } = await supabase
    .from("board_categories")
    .select("*")
    .eq("slug", slug)
    .eq("is_active", true)
    .single();

  if (!category && slug !== "announcements") {
    notFound();
  }

  const { data: { user } } = await supabase.auth.getUser();

  const { data: post } = await supabase
    .from("posts")
    .select(`
      *,
      profiles:author_id (
        id,
        full_name,
        avatar_url
      )
    `)
    .eq("id", id)
    .eq("category", categorySlug)
    .single();

  if (!post) {
    notFound();
  }

  let userLike = null;
  if (user) {
    const { data } = await supabase
      .from("post_likes")
      .select("id")
      .eq("post_id", id)
      .eq("user_id", user.id)
      .single();
    userLike = data;
  }

  const { data: comments } = await supabase
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
    .order("created_at", { ascending: true });

  // 작성자의 노출된 뱃지 가져오기
  let authorVisibleBadges: Array<{ icon: string; name: string }> = []
  if (post.author_id) {
    const { data: badgesData } = await supabase
      .from("user_badges")
      .select(`
        badges:badge_id (
          icon,
          name
        )
      `)
      .eq("user_id", post.author_id)
      .eq("is_visible", true)

    if (badgesData) {
      authorVisibleBadges = badgesData
        .map((ub: any) => ub.badges)
        .filter(Boolean)
        .map((badge: any) => ({
          icon: badge.icon,
          name: badge.name,
        }))
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="sticky top-0 z-10 bg-white border-b border-slate-200">
        <div className="flex items-center px-4 py-3">
          <Link href={`/community/board/${slug}`}>
            <button className="p-2 -ml-2 hover:bg-slate-100 rounded-full transition-colors">
              <ArrowLeft className="h-5 w-5 text-slate-700" />
            </button>
          </Link>
          <span className="ml-2 text-sm font-medium text-slate-700">
            {slug === "announcements" ? "공지사항" : category?.name}
          </span>
          <div className="ml-auto flex items-center gap-2">
            <button className="p-2 hover:bg-slate-100 rounded-full transition-colors">
              <Share2 className="h-5 w-5 text-slate-600" />
            </button>
            <button className="p-2 hover:bg-slate-100 rounded-full transition-colors">
              <svg className="h-5 w-5 text-slate-600" fill="currentColor" viewBox="0 0 24 24">
                <circle cx="12" cy="5" r="2"/>
                <circle cx="12" cy="12" r="2"/>
                <circle cx="12" cy="19" r="2"/>
              </svg>
            </button>
          </div>
        </div>
      </div>

      <div className="px-0 md:px-8 py-0 md:py-8">
        <div className="mx-auto max-w-4xl">
          <Card className="border-0 md:border border-slate-200 rounded-none md:rounded-lg overflow-hidden">
            <CardContent className="p-4 md:p-6">
              {/* Author Header */}
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-500 text-lg font-semibold text-white flex-shrink-0">
                  {post.profiles?.full_name?.[0] || "U"}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-slate-900 truncate">
                      {post.profiles?.full_name || "익명"}
                    </p>
                    {authorVisibleBadges.length > 0 && (
                      <UserBadges badges={authorVisibleBadges} />
                    )}
                  </div>
                  <p className="text-sm text-slate-500">
                    {new Date(post.created_at).toLocaleDateString("ko-KR", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                </div>
              </div>

              {/* Post Title & Content */}
              <h1 className="mb-3 text-xl md:text-2xl font-bold tracking-tight text-slate-900 leading-snug">
                {post.title}
              </h1>
              <p className="whitespace-pre-wrap text-slate-700 leading-relaxed text-sm md:text-base">
                {post.content}
              </p>

              <div className="mt-6 flex items-center gap-1 pt-4 border-t border-slate-200">
                <button className="flex items-center gap-2 px-4 py-2 rounded-full hover:bg-slate-100 transition-colors">
                  <svg className="h-5 w-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                  </svg>
                  <span className="text-sm font-semibold text-slate-700">{post.likes_count || 0}</span>
                  <svg className="h-5 w-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                <button className="flex items-center gap-2 px-4 py-2 rounded-full hover:bg-slate-100 transition-colors">
                  <MessageSquare className="h-5 w-5 text-slate-600" />
                  <span className="text-sm font-semibold text-slate-700">{post.comments_count || 0}</span>
                </button>
                <button className="flex items-center gap-2 px-4 py-2 rounded-full hover:bg-slate-100 transition-colors">
                  <Heart className="h-5 w-5 text-slate-600" />
                  <span className="text-sm font-semibold text-slate-700">{Math.floor((post.likes_count || 0) * 1.5)}</span>
                </button>
                <button className="flex items-center gap-2 px-4 py-2 rounded-full hover:bg-slate-100 transition-colors ml-auto">
                  <Bookmark className="h-5 w-5 text-slate-600" />
                  <span className="text-sm font-semibold text-slate-700">{Math.floor((post.likes_count || 0) * 0.8)}</span>
                </button>
              </div>
            </CardContent>
          </Card>

          <div className="mt-4 md:mt-6 bg-white border-0 md:border border-slate-200 rounded-none md:rounded-lg p-4 md:p-6">
            <h2 className="mb-4 text-lg font-bold text-slate-900">
              댓글 작성
            </h2>
            <CommentSection
              postId={post.id}
              userId={user?.id}
              comments={comments || []}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
