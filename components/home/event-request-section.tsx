"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Plus, Heart, MessageSquare, Loader2, Send } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"
import { formatRelativeTime } from "@/lib/format-time"
import { LikeButton } from "@/components/like-button"
import { CommentSection } from "@/components/comment-section"
import { Button } from "@/components/ui/button"

type Post = {
  id: string
  title: string
  content?: string | null
  likes_count?: number
  comments_count?: number
  created_at: string
  profiles?: {
    full_name?: string | null
    id?: string
    avatar_url?: string | null
  } | null
}

interface EventRequestSectionProps {
  posts: Post[]
  isLoading: boolean
  user: any
}

// 개별 요청 카드 컴포넌트 (인라인 댓글 확장을 위해 분리)
function RequestCard({ post, user }: { post: Post; user: any }) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [commentCount, setCommentCount] = useState(post.comments_count || 0)
  const [isLiked, setIsLiked] = useState(false)
  
  // 초기 좋아요 상태 확인
  useEffect(() => {
    const checkLikeStatus = async () => {
      if (!user) return
      const supabase = createClient()
      const { data } = await supabase
        .from("post_likes")
        .select("id")
        .eq("post_id", post.id)
        .eq("user_id", user.id)
        .maybeSingle()
      setIsLiked(!!data)
    }
    checkLikeStatus()
  }, [post.id, user])

  // 본문 텍스트 정리 (HTML 태그 제거)
  const cleanContent = post.content?.replace(/<[^>]*>/g, "").trim() || post.title

  return (
    <Card className={cn(
      "border-slate-200 bg-white shadow-sm transition-all duration-200 flex flex-col overflow-hidden group h-fit",
      isExpanded ? "ring-1 ring-slate-900 shadow-md" : "hover:shadow-md hover:-translate-y-0.5"
    )}>
      <CardContent className="p-5 flex flex-col h-full">
        {/* 본문 영역 */}
        <div className="mb-5 min-h-[60px]">
          <p className="text-[15px] font-medium text-slate-800 leading-relaxed whitespace-pre-wrap line-clamp-4">
            {cleanContent}
          </p>
        </div>

        {/* 하단 정보 및 액션 */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-50 mt-auto">
          
          {/* 좌측: 작성자 프로필 */}
          <div className="flex items-center gap-2.5">
            <Avatar className="h-7 w-7 border border-slate-100">
              <AvatarImage src={post.profiles?.avatar_url || undefined} />
              <AvatarFallback className="bg-slate-100 text-slate-500 text-[10px] font-bold">
                {post.profiles?.full_name?.[0] || "U"}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-slate-900 max-w-[80px] truncate">
                {post.profiles?.full_name || "익명"}
              </span>
              <span className="text-[10px] text-slate-400">
                {formatRelativeTime(post.created_at)}
              </span>
            </div>
          </div>

          {/* 우측: 액션 버튼들 */}
          <div className="flex items-center gap-1.5">
            <LikeButton
              postId={post.id}
              userId={user?.id}
              initialLiked={isLiked}
              initialCount={post.likes_count || 0}
            />
            
            {/* 댓글 토글 버튼 */}
            <button
              onClick={(e) => {
                e.stopPropagation()
                setIsExpanded(!isExpanded)
              }}
              className={cn(
                "flex items-center gap-1.5 px-2 py-1.5 rounded-lg transition-colors",
                isExpanded ? "bg-blue-50 text-blue-600" : "hover:bg-slate-50 text-slate-400 hover:text-slate-600"
              )}
            >
              <MessageSquare className={cn("h-4 w-4", isExpanded && "fill-current")} />
              <span className="text-xs font-medium">{commentCount}</span>
            </button>
          </div>
        </div>

        {/* 인라인 댓글 섹션 (확장됨) */}
        {isExpanded && (
          <div className="mt-4 pt-4 border-t border-slate-100 bg-slate-50/50 -mx-5 -mb-5 px-5 pb-5 animate-in slide-in-from-top-2 fade-in duration-200">
            <CommentSection
              postId={post.id}
              userId={user?.id}
              comments={[]} // CommentSection 내부에서 fetch하도록 빈 배열 전달
              onCommentAdded={() => setCommentCount(prev => prev + 1)}
            />
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// 메인 섹션 컴포넌트
export function EventRequestSection({ posts, isLoading, user }: EventRequestSectionProps) {
  const [isWriteDialogOpen, setIsWriteDialogOpen] = useState(false)
  const [content, setContent] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const router = useRouter()

  // 작성 핸들러
  const handleSubmit = async () => {
    if (!content.trim()) return
    if (!user) {
      router.push("/auth/login")
      return
    }

    setIsSubmitting(true)
    const supabase = createClient()

    try {
      const { data: category } = await supabase
        .from("board_categories")
        .select("id")
        .eq("slug", "event-requests")
        .single()

      if (!category) throw new Error("카테고리를 찾을 수 없습니다.")

      // 제목은 내용의 앞부분을 사용
      const title = content.length > 30 ? content.substring(0, 30) + "..." : content

      const { error } = await supabase.from("posts").insert({
        title: title,
        content: content,
        author_id: user.id,
        board_category_id: category.id,
        visibility: "public",
      })

      if (error) throw error

      setContent("")
      setIsWriteDialogOpen(false)
      router.refresh()
      
    } catch (error) {
      console.error("요청 작성 실패:", error)
      alert("요청을 저장하지 못했습니다.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleWriteClick = () => {
    if (!user) {
      router.push("/auth/login")
    } else {
      setIsWriteDialogOpen(true)
    }
  }

  // 표시할 포스트 목록 (작성 카드를 포함해 최대 6개 슬롯에 맞춤)
  // 작성 카드(1개) + 포스트(최대 5개)
  const displayPosts = posts.slice(0, 5)

  return (
    <div className="w-full">
      {/* 헤더 */}
      <div className="flex items-center justify-between w-full mb-6">
        <h2 className="text-2xl md:text-3xl font-bold text-slate-900">열어주세요</h2>
        {/* 전체보기 버튼 제거 요청 반영 */}
      </div>

      {/* 작성 모달 */}
      <Dialog open={isWriteDialogOpen} onOpenChange={setIsWriteDialogOpen}>
        <DialogContent className="sm:max-w-[500px] p-6 bg-white rounded-2xl">
          <DialogHeader className="mb-4">
            <DialogTitle className="text-xl font-bold text-slate-900">
              어떤 이벤트를 열고 싶으신가요?
            </DialogTitle>
          </DialogHeader>
          
          <div className="relative">
            <Textarea
              placeholder="자유롭게 아이디어를 적어주세요. (예: 강남역 근처에서 AI 창업가 네트워킹 파티 열어주세요!)"
              className="min-h-[180px] resize-none text-base p-4 bg-slate-50 border-slate-200 focus:bg-white focus:ring-1 focus:ring-slate-900 transition-colors rounded-xl"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              maxLength={500}
            />
            <div className="absolute bottom-4 right-4 text-xs text-slate-400 pointer-events-none">
              {content.length} / 500
            </div>
          </div>

          <div className="flex justify-end gap-2 mt-4">
            <Button variant="ghost" onClick={() => setIsWriteDialogOpen(false)} className="rounded-xl">
              취소
            </Button>
            <Button 
              onClick={handleSubmit} 
              disabled={!content.trim() || isSubmitting}
              className="bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-xl px-6"
            >
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "등록하기"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* 그리드 레이아웃 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        
        {/* 1. 포스트 리스트 먼저 렌더링 */}
        {isLoading ? (
          [1, 2].map((i) => (
            <Card key={i} className="h-[200px] border-slate-200 p-5">
              <Skeleton className="h-4 w-3/4 mb-4" />
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-2/3" />
              <div className="mt-auto flex items-center justify-between pt-4">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <Skeleton className="h-3 w-16" />
                </div>
                <Skeleton className="h-4 w-16" />
              </div>
            </Card>
          ))
        ) : (
          <>
            {displayPosts.map((post) => (
              <RequestCard key={post.id} post={post} user={user} />
            ))}

            {/* 2. 작성 트리거 카드 (맨 뒤로 이동 & 디자인 수정) */}
            <div onClick={handleWriteClick} className="h-full min-h-[200px]">
              <Card className="h-full border-slate-200 border-dashed border-2 bg-white hover:border-blue-300 hover:shadow-md transition-all duration-300 cursor-pointer group flex flex-col items-center justify-center gap-3 p-6">
                <div className="w-12 h-12 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center group-hover:bg-blue-50 group-hover:border-blue-100 transition-colors">
                  <Plus className="h-5 w-5 text-slate-400 group-hover:text-blue-500" />
                </div>
                <div className="text-center">
                  <h3 className="text-sm font-bold text-slate-700 group-hover:text-blue-600 transition-colors mb-0.5">
                    새로운 요청하기
                  </h3>
                  <p className="text-[11px] text-slate-400 group-hover:text-blue-400/80">
                    원하는 이벤트를 제안해보세요
                  </p>
                </div>
              </Card>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
