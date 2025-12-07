import { createClient } from "@/lib/supabase/server";
import { notFound } from 'next/navigation';
import { Card, CardContent } from "@/components/ui/card";
import { Heart, MessageSquare, ArrowLeft, Info, Users, Crown, ChevronRight, ShieldCheck, ChevronLeft } from 'lucide-react';
import { LikeButton } from "@/components/like-button";
import { ThreadedComments } from "@/components/threaded-comments";
import { PostActions } from "@/components/post-actions";
import { EventShareButton } from "@/components/event-share-button";
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { UserBadges } from "@/components/user-badges";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { StandardRightSidebar } from "@/components/standard-right-sidebar";
import { isMasterAdmin, isAdmin } from "@/lib/utils";
import { getComments } from "@/lib/actions/comments";

// 전체 공개 게시판 slug 목록
const PUBLIC_BOARDS = ["free", "vangol", "hightalk", "insights", "reviews"];

export default async function BoardPostDetailPage({
  params,
}: {
  params: Promise<{ slug: string; id: string }>;
}) {
  const { slug, id } = await params;
  const supabase = await createClient();

  let dbSlug = slug;
  if (slug === 'free') dbSlug = 'free-board';
  if (slug === 'announcements') dbSlug = 'announcement';

  // 데이터 병렬 조회
  const [userResult, postResult, categoryResult] = await Promise.all([
    supabase.auth.getUser(),
    supabase
      .from("posts")
      .select(`
        *,
        profiles:author_id (id, full_name, avatar_url, role, email),
        board_categories:board_category_id (name, slug)
      `)
      .eq("id", id)
      .single(),
    slug !== "announcements" 
      ? supabase.from("board_categories").select("name, description").eq("slug", dbSlug).single()
      : Promise.resolve({ data: null })
  ]);

  const { data: { user } } = userResult;
  const { data: post } = postResult;
  const { data: category } = categoryResult;

  if (!post) notFound();

  // 추가 데이터 조회
  const [userLikeResult, commentsResult, likesResult, badgesResult] = await Promise.all([
    user ? supabase.from("post_likes").select("id").eq("post_id", id).eq("user_id", user.id).maybeSingle() : Promise.resolve({ data: null }),
    getComments(id),
    supabase
      .from("post_likes")
      .select("id", { count: "exact" })
      .eq("post_id", id),
    post.author_id ? supabase
      .from("user_badges")
      .select(`badges:badge_id (icon, name)`)
      .eq("user_id", post.author_id)
      .eq("is_visible", true) : Promise.resolve({ data: null })
  ]);

  // 권한 확인
  let isMaster = false;
  let isUserAdmin = false;
  if (user) {
    const { data: currentUserProfile } = await supabase
      .from("profiles")
      .select("role, email")
      .eq("id", user.id)
      .single();
    isMaster = isMasterAdmin(currentUserProfile?.role, currentUserProfile?.email);
    isUserAdmin = isAdmin(currentUserProfile?.role, currentUserProfile?.email);
  }
  
  const isAuthor = Boolean(user && post.author_id === user.id);
  const boardName = post.board_categories?.name || (slug === "announcements" ? "공지사항" : "게시판");
  
  // 뱃지 데이터 가공
  const authorVisibleBadges = badgesResult.data?.map((ub: any) => ub.badges).filter(Boolean) || [];
  const comments = commentsResult || [];
  const actualCommentsCount = countTree(comments);
  const actualLikesCount = likesResult.count || 0;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* 본문 Flex Layout */}
      <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* [LEFT] 메인 콘텐츠 */}
        <div className="lg:col-span-9 flex flex-col gap-6">

          {/* 헤더 (카드 바로 위로 이동) */}
          <div className="flex items-center justify-between">
            <Link href={`/community/board/${slug}`} className="group flex items-center text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors">
              <div className="mr-2 flex h-8 w-8 items-center justify-center rounded-full bg-white border border-slate-200 group-hover:border-slate-300 shadow-sm transition-all">
                <ChevronLeft className="h-4 w-4" />
              </div>
              {boardName} 목록
            </Link>
            {(isAuthor || isUserAdmin) && (
              <PostActions 
                postId={post.id} 
                isAuthor={isAuthor} 
                isAdmin={isUserAdmin} 
                isMaster={isMaster}
                slug={slug}
                redirectUrl={`/community/board/${slug}`}
              />
            )}
          </div>
          <Card className="border border-slate-200 rounded-xl shadow-sm bg-white overflow-hidden">
            <CardContent className="p-6 md:p-8">
              {/* 게시판 태그 (자유게시판, 반골, 하이토크 제외) */}
              {dbSlug !== 'free-board' && dbSlug !== 'vangol' && dbSlug !== 'hightalk' && (
                <div className="mb-4">
                  <span className="bg-slate-100 text-slate-600 rounded-md px-2.5 py-1 text-xs font-bold">
                    {boardName}
                  </span>
                </div>
              )}

              {/* 작성자 정보 */}
              <div className="mb-6 flex items-center gap-3">
                <Avatar className="h-10 w-10 border border-slate-100">
                  <AvatarImage src={post.profiles?.avatar_url || undefined} />
                  <AvatarFallback className="bg-slate-100 text-slate-500 font-bold">
                    {post.profiles?.full_name?.[0] || "U"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-900 text-sm">
                      {post.profiles?.full_name || "익명"}
                    </span>
                    {authorVisibleBadges.length > 0 && (
                      <UserBadges badges={authorVisibleBadges} />
                    )}
                  </div>
                  <span className="text-xs text-slate-500">
                    {new Date(post.created_at).toLocaleDateString("ko-KR", {
                      year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit"
                    })}
                  </span>
                </div>
              </div>

              {/* 제목 */}
              <h1 className="text-2xl md:text-3xl font-bold text-slate-900 mb-8 leading-snug">
                {post.title}
              </h1>

              {/* 본문 */}
              <div 
                className="prose prose-slate max-w-none text-slate-800 leading-relaxed mb-10 min-h-[200px]"
                dangerouslySetInnerHTML={{ __html: post.content || "" }}
              />

              {/* 하단 액션 */}
              <div className="flex items-center justify-between pt-6 border-t border-slate-100">
                <div className="flex items-center gap-4">
                  <LikeButton
                    postId={post.id}
                    userId={user?.id}
                    initialLiked={!!userLikeResult.data}
                    initialCount={actualLikesCount}
                  />
                  <div className="flex items-center gap-1.5 text-slate-500 text-sm">
                    <MessageSquare className="h-4 w-4" />
                    <span>{actualCommentsCount}</span>
                  </div>
                </div>
                <EventShareButton
                  title={post.title}
                  variant="ghost"
                  size="sm"
                  className="text-slate-500"
                >
                  공유
                </EventShareButton>
              </div>

              {/* 댓글 섹션 */}
              <div className="mt-8 pt-8 border-t border-slate-100">
                <h3 className="text-lg font-bold text-slate-900 mb-6">댓글</h3>
                <ThreadedComments postId={post.id} userId={user?.id} comments={comments} />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* [RIGHT] 우측 사이드바 영역 */}
        <div className="hidden lg:block lg:col-span-3">
          <div className="sticky top-8 flex flex-col gap-6 h-fit">
            <StandardRightSidebar />
          </div>
        </div>

      </div>
    </div>
  );
}

function countTree(nodes: any[]): number {
  return nodes.reduce((acc, n) => acc + 1 + (n.children ? countTree(n.children) : 0), 0)
}
