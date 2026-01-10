import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { MessageSquare, ChevronLeft } from "lucide-react"
import { ThreadedComments } from "@/components/threaded-comments"
import { PostActions } from "@/components/post-actions"
import { EventShareButton } from "@/components/event-share-button"
import Link from "next/link"
import { isMasterAdmin, isAdmin } from "@/lib/utils"
import { getComments } from "@/lib/actions/comments"
import { ClickableAvatar } from "@/components/ui/clickable-avatar"

// ISR 캐싱: 60초마다 재검증
export const revalidate = 60

// 공개 게시판 slug 목록
const PUBLIC_BOARDS = ["free", "vangol", "hightalk", "insights", "reviews"]

export default async function BoardPostDetailPage({
  params,
}: {
  params: Promise<{ slug: string; id: string }>
}) {
  const { slug, id } = await params
  const supabase = await createClient()

  let dbSlug = slug
  if (slug === "free") dbSlug = "free-board"
  if (slug === "announcements") dbSlug = "announcement"

  // Phase 1: 유저 + 게시물 병렬 조회
  const [userResult, postResult] = await Promise.all([
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
  ])

  const {
    data: { user },
  } = userResult
  const { data: post } = postResult

  if (!post) notFound()

  // Phase 2: 댓글, 유저 권한 병렬 조회
  const [commentsResult, profileResult] = await Promise.all([
    getComments(id),
    user
      ? supabase
          .from("profiles")
          .select("role, email")
          .eq("id", user.id)
          .single()
      : Promise.resolve({ data: null }),
  ])

  // 권한 확인
  const currentUserProfile = profileResult?.data
  const isMaster = user ? isMasterAdmin(currentUserProfile?.role, currentUserProfile?.email) : false
  const isUserAdmin = user ? isAdmin(currentUserProfile?.role, currentUserProfile?.email) : false

  const isAuthor = Boolean(user && post.author_id === user.id)
  const boardName = post.board_categories?.name || (slug === "announcements" ? "공지사항" : "게시판")

  const comments = commentsResult || []
  const actualCommentsCount = countTree(comments)

  return (
    <div className="w-full">
      <Card className="border border-slate-200 rounded-xl shadow-sm bg-white overflow-hidden">
        <CardContent className="px-6 md:px-8 pt-2.5 pb-6 md:pb-8">
          {/* 헤더 - 뒤로가기 + 액션 버튼 */}
          <div className="flex items-center justify-between mb-6">
            <Link
              href={`/community/board/${slug}`}
              className="group flex items-center text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors"
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
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
          {/* 게시판 태그 (자유게시판, 반골, 하이토크 제외) */}
          {dbSlug !== "free-board" && dbSlug !== "vangol" && dbSlug !== "hightalk" && (
            <div className="mb-4">
              <span className="bg-slate-100 text-slate-600 rounded-md px-2.5 py-1 text-xs font-bold">
                {boardName}
              </span>
            </div>
          )}

          {/* 작성자 정보 */}
          <div className="mb-5 flex items-center gap-3">
            <ClickableAvatar profile={post.profiles} size="md" />
            <div>
              <span className="font-semibold text-slate-900 text-sm">
                {post.profiles?.full_name || "익명"}
              </span>
              <span className="text-xs text-slate-500 block">
                {new Date(post.created_at).toLocaleDateString("ko-KR", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>
          </div>

          {/* 제목 */}
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 mb-8 leading-snug">{post.title}</h1>

          {/* 본문 */}
          <div
            className="prose prose-slate max-w-none text-slate-800 leading-relaxed mb-10 min-h-[200px]"
            dangerouslySetInnerHTML={{ __html: post.content || "" }}
          />

          {/* 하단 액션 */}
          <div className="flex items-center justify-between pt-6 border-t border-slate-100">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5 text-slate-500 text-sm">
                <MessageSquare className="h-4 w-4" />
                <span>{actualCommentsCount}</span>
              </div>
            </div>
            <EventShareButton title={post.title} variant="ghost" size="sm" className="text-slate-500">
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
  )
}

function countTree(nodes: any[]): number {
  return nodes.reduce((acc, n) => acc + 1 + (n.children ? countTree(n.children) : 0), 0)
}