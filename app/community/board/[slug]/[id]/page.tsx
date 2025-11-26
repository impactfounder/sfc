import { createClient } from "@/lib/supabase/server";
import { notFound } from 'next/navigation';
import { Card, CardContent } from "@/components/ui/card";
import { Heart, MessageSquare, Bookmark, Share2, ArrowLeft, Info, Users, Crown, ChevronRight } from 'lucide-react';
import { LikeButton } from "@/components/like-button";
import { CommentSection } from "@/components/comment-section";
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { UserBadges } from "@/components/user-badges";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { Metadata } from "next";

// 전체 공개 게시판 slug 목록
const PUBLIC_BOARDS = ["free", "vangol", "hightalk", "insights"];

// 동적 metadata 생성
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; id: string }>;
}): Promise<Metadata> {
  const { slug, id } = await params;
  const supabase = await createClient();
  
  // ★ URL 슬러그를 DB 슬러그로 변환 (필수!)
  let dbSlug = slug;
  if (slug === 'free') dbSlug = 'free-board';
  if (slug === 'announcements') dbSlug = 'announcement';
  
  // ★ ID로만 조회 (ID는 고유하므로 category 조건 불필요)
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
    .single();

  if (!post) {
    return {
      title: "게시글을 찾을 수 없습니다",
    };
  }

  const isPublic = PUBLIC_BOARDS.includes(slug);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://seoulfounders.club";
  const cleanContent = post.content?.replace(/<[^>]*>/g, "").substring(0, 200) || "";
  const ogTitle = `${post.title} | Seoul Founders Club`; // OpenGraph용 (공유 시 게시글 제목 표시)
  const description = cleanContent || "서울 파운더스 클럽 커뮤니티";
  const authorName = (post.profiles as any)?.full_name || "익명";

  return {
    title: "SEOUL FOUNDERS CLUB", // 브라우저 탭 제목 고정
    description,
    openGraph: isPublic ? {
      title: ogTitle, // 공유할 때는 게시글 제목이 나오는 게 좋음
      description,
      url: `${siteUrl}/community/board/${slug}/${id}`,
      siteName: "Seoul Founders Club",
      type: "article",
      publishedTime: post.created_at,
      authors: authorName !== "익명" ? [authorName] : undefined,
    } : undefined,
    twitter: isPublic ? {
      card: "summary_large_image",
      title: ogTitle, // 공유할 때는 게시글 제목이 나오는 게 좋음
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

  // ★ URL 슬러그를 DB 슬러그로 변환 (필수!)
  let dbSlug = slug;
  if (slug === 'free') dbSlug = 'free-board';
  if (slug === 'announcements') dbSlug = 'announcement';

  // 병렬로 초기 데이터 가져오기
  const [categoryResult, userResult, postResult] = await Promise.all([
    slug !== "announcements" ? supabase
      .from("board_categories")
      .select("id, name, description, slug, is_active")
      .eq("slug", dbSlug) // ★ dbSlug 사용
      .eq("is_active", true)
      .single() : Promise.resolve({ data: null }),
    supabase.auth.getUser(),
    supabase
      .from("posts")
      .select(`
        *,
        thumbnail_url,
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
  
  // ISO 포맷으로 날짜 변환
  const datePublished = new Date(post.created_at).toISOString();
  const dateModified = new Date(post.updated_at || post.created_at).toISOString();
  
  // 이미지 URL 결정
  const imageUrl = (post as any).thumbnail_url 
    ? (post as any).thumbnail_url.startsWith('http') 
      ? (post as any).thumbnail_url 
      : `${siteUrl}${(post as any).thumbnail_url}`
    : `${siteUrl}/images/og-default.png`;
  
  // 게시판 이름 결정
  const boardName = (post as any)?.board_categories?.name || category?.name || (slug === "announcements" ? "공지사항" : slug === "insights" ? "인사이트" : "게시판");
  
  // 목업 데이터: 커뮤니티 리더
  const communityLeaders = [
    {
      id: "1",
      name: "김파운더",
      avatar: null,
    },
    {
      id: "2",
      name: "이리더",
      avatar: null,
    }
  ]

  // 목업 데이터: 함께하는 멤버 (아바타만 표시)
  const communityMembers = [
    { id: "3", name: "박창업", avatar: null },
    { id: "4", name: "최투자", avatar: null },
    { id: "5", name: "정크리에이터", avatar: null },
    { id: "6", name: "강성장", avatar: null },
    { id: "7", name: "윤혁신", avatar: null },
    { id: "8", name: "임성공", avatar: null }
  ]
  
  const articleSchema = isPublic ? {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": post.title,
    "description": post.content?.replace(/<[^>]*>/g, "").substring(0, 200) || "",
    "url": `${siteUrl}/community/board/${slug}/${id}`,
    "image": imageUrl,
    "author": {
      "@type": "Person",
      "name": post.profiles?.full_name || "익명"
    },
    "publisher": {
      "@type": "Organization",
      "name": "Seoul Founders Club",
      "url": siteUrl
    },
    "datePublished": datePublished,
    "dateModified": dateModified,
  } : null;
  
  const breadcrumbSchema = isPublic ? {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Home",
        "item": siteUrl
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": boardName,
        "item": `${siteUrl}/community/board/${slug}`
      },
      {
        "@type": "ListItem",
        "position": 3,
        "name": post.title,
        "item": `${siteUrl}/community/board/${slug}/${id}`
      }
    ]
  } : null;

  return (
    <>
      {articleSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
        />
      )}
      {breadcrumbSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
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

        {/* 본문: 조건부 레이아웃 */}
        <div className="w-full py-6 md:py-8">
          {/* 공지사항일 때: 2단 컬럼 (본문 + 건의사항 카드) */}
          {dbSlug === 'announcement' ? (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
              {/* 좌측: 본문 카드 (9칸) */}
              <div className="lg:col-span-9">
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

                    {/* 좋아요 버튼 */}
                    <div className="flex items-center gap-4 pt-4 border-t border-slate-200">
                      <LikeButton
                        postId={post.id}
                        userId={user?.id}
                        initialLiked={!!userLike}
                        initialCount={post.likes_count || 0}
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* 우측: 건의사항/오류신고 카드 (3칸) */}
              <div className="lg:col-span-3">
                <Card className="border-slate-200 bg-white shadow-sm">
                  <CardContent className="p-6">
                    <h3 className="font-bold text-slate-900 mb-2 flex items-center gap-2">
                      <MessageSquare className="h-4 w-4 text-slate-500" />
                      건의사항 / 오류신고
                    </h3>
                    <p className="text-sm text-slate-600 mb-4 leading-relaxed">
                      서비스 이용 중 불편한 점이나<br/>개선할 점이 있다면 알려주세요.
                    </p>
                    <Button asChild variant="outline" className="w-full border-slate-300 text-slate-700 hover:bg-slate-50">
                      <a href="mailto:support@seoulfounders.club">문의하기</a>
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          ) : (
            /* 일반 게시판일 때: 2단 컬럼 */
            <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
              {/* 좌측: 본문 카드 (9칸) */}
              <div className="lg:col-span-9">
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
                      <LikeButton
                        postId={post.id}
                        userId={user?.id}
                        initialLiked={!!userLike}
                        initialCount={post.likes_count || 0}
                      />
                      <div className="flex items-center gap-1.5 text-sm text-slate-500">
                        <MessageSquare className="h-4 w-4" />
                        <span>{post.comments_count || 0}</span>
                      </div>
                    </div>

                    {/* 댓글 섹션 */}
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

              {/* 우측: 사이드바 (3칸) */}
              <div className="lg:col-span-3 space-y-6">
                {/* 카드 1: 커뮤니티 가이드 */}
                <Card className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm mb-4">
                  <CardContent className="p-0">
                    <div className="flex items-center gap-2 mb-4">
                      <Info className="h-5 w-5 text-slate-700" />
                      <h3 className="text-lg font-semibold text-slate-900">커뮤니티 가이드</h3>
                    </div>
                    <div className="bg-slate-50 rounded-lg p-4 border border-slate-100">
                      {category?.description ? (
                        <>
                          <p className="text-sm text-slate-600 leading-relaxed mb-2">{category.description}</p>
                          <p className="text-sm text-slate-500 leading-relaxed">서로 존중하며 가치를 나누는 공간입니다.</p>
                        </>
                      ) : (
                        <p className="text-sm text-slate-600 leading-relaxed">서로 존중하며 가치를 나누는 공간입니다.</p>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* 카드 2: 운영진 (Leaders) */}
                <Card className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm mb-4">
                  <CardContent className="p-0">
                    <div className="flex items-center gap-2 mb-4">
                      <Crown className="h-5 w-5 text-amber-500" />
                      <h3 className="text-lg font-semibold text-slate-900">운영진 (Leaders)</h3>
                    </div>
                    <div className="space-y-3">
                      {communityLeaders.map((leader) => (
                        <div key={leader.id} className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={leader.avatar || undefined} />
                            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white text-sm font-semibold">
                              {leader.name[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-semibold text-slate-900 truncate">{leader.name}</p>
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-700">
                                커뮤니티 리더
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* 카드 3: 함께하는 멤버들 */}
                <Card className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm mb-4">
                  <CardContent className="p-0">
                    <div className="flex items-center gap-2 mb-4">
                      <Users className="h-5 w-5 text-slate-700" />
                      <h3 className="text-lg font-semibold text-slate-900">함께하는 멤버들</h3>
                    </div>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {communityMembers.map((member) => (
                        <Avatar key={member.id} className="h-10 w-10 border-2 border-white shadow-sm">
                          <AvatarImage src={member.avatar || undefined} />
                          <AvatarFallback className="bg-gradient-to-br from-slate-400 to-slate-600 text-white text-xs font-semibold">
                            {member.name[0]}
                          </AvatarFallback>
                        </Avatar>
                      ))}
                    </div>
                    <Link href={`/community/board/${slug}/members`} className="block">
                      <Button 
                        variant="ghost" 
                        className="w-full text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                      >
                        전체 보기 <ChevronRight className="h-4 w-4 ml-1" />
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
