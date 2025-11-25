"use client"

import Link from "next/link"
import { useState, useEffect } from "react"
import { MessageSquare, Lock, ChevronDown, ChevronUp, Loader2, Heart } from "lucide-react"
import { cn } from "@/lib/utils"
import { formatRelativeTime } from "@/lib/format-time"
import { LikeButton } from "@/components/like-button"
import { CommentSection } from "@/components/comment-section"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"

type Badge = {
  icon: string
  name: string
}

type Post = {
  id: string
  title: string
  content?: string | null
  created_at: string
  visibility?: "public" | "group"
  likes_count?: number
  comments_count?: number
  board_categories?: {
    name?: string | null
    slug?: string | null
  } | null
  profiles?: {
    full_name?: string | null
    id?: string
  } | null
  visible_badges?: Badge[]
  communities?: {
    name?: string | null
  } | null
  isMember?: boolean
}

type PostListItemProps = {
  post: Post
  href: string
  className?: string
  isMember?: boolean
  viewMode?: "feed" | "list"
  currentUserId?: string
}

export function PostListItem({ 
  post, 
  href, 
  className, 
  isMember = true, 
  viewMode = "feed",
  currentUserId 
}: PostListItemProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [comments, setComments] = useState<any[]>([])
  const [isLoadingComments, setIsLoadingComments] = useState(false)
  const [commentsLoaded, setCommentsLoaded] = useState(false)
  const [userId, setUserId] = useState<string | null>(currentUserId || null)
  const [isLiked, setIsLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(post.likes_count || 0)
  
  // 사용자 정보 및 좋아요 상태 가져오기
  useEffect(() => {
    const loadUserAndLikeStatus = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUserId(user.id)
        // 좋아요 상태 확인
        const { data } = await supabase
          .from("post_likes")
          .select("id")
          .eq("post_id", post.id)
          .eq("user_id", user.id)
          .maybeSingle()
        setIsLiked(!!data)
      }
    }
    if (!currentUserId) {
      loadUserAndLikeStatus()
    }
  }, [post.id, currentUserId])
  
  // content에서 HTML 태그 제거하고 텍스트만 추출 (미리보기용)
  const getPlainText = (html?: string | null) => {
    if (!html) return ""
    // 정규식 이스케이프 처리
    return html.replace(/<[^>]*>/g, "").trim()
  }

  const contentPreview = getPlainText(post.content)
  const categoryName = post.board_categories?.name || post.communities?.name || "게시판"
  const isGroupOnly = post.visibility === "group" && !isMember

  // 댓글 데이터 가져오기
  const loadComments = async () => {
    if (commentsLoaded || isLoadingComments) return
    
    setIsLoadingComments(true)
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from("comments")
        .select(`
          *,
          profiles:author_id (
            id,
            full_name,
            avatar_url
          )
        `)
        .eq("post_id", post.id)
        .order("created_at", { ascending: true })
      
      if (!error && data) {
        setComments(data)
        setCommentsLoaded(true)
      }
    } catch (error) {
      console.error("Failed to load comments:", error)
    } finally {
      setIsLoadingComments(false)
    }
  }

  // 펼치기 토글 핸들러
  const handleExpand = (e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation()
    }
    
    // 텍스트 드래그 선택 시 클릭 이벤트 방지
    if (window.getSelection()?.toString()) return

    if (!isGroupOnly) {
      const nextState = !isExpanded
      setIsExpanded(nextState)
      if (nextState) {
        loadComments()
      }
    }
  }

  // 리스트형 뷰
  if (viewMode === "list") {
    return (
      <Link href={href} className={cn("block", className)}>
        <div className="flex items-center gap-3 bg-white border border-slate-200 rounded-lg py-2.5 px-4 hover:bg-slate-50 transition-all duration-200">
          <span className="bg-blue-100 text-blue-700 rounded-md px-2.5 py-1 text-xs font-semibold flex-shrink-0">
            {categoryName}
          </span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-slate-900 line-clamp-1">
                {post.title}
              </h3>
              {isGroupOnly && <Lock className="w-3 h-3 text-slate-400" />}
              <span className="text-xs text-slate-500 hidden sm:inline">·</span>
              <span className="text-xs text-slate-500 hidden sm:inline">{post.profiles?.full_name || "익명"}</span>
            </div>
          </div>
          <div className="flex items-center gap-4 text-xs text-slate-500 flex-shrink-0">
            <span className="hidden md:inline">{formatRelativeTime(post.created_at)}</span>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                <Heart className="h-3.5 w-3.5" />
                <span>{post.likes_count || 0}</span>
              </div>
              <div className="flex items-center gap-1">
                <MessageSquare className="h-3.5 w-3.5" />
                <span>{post.comments_count || 0}</span>
              </div>
            </div>
          </div>
        </div>
      </Link>
    )
  }

  // 피드형 뷰 (인터랙티브)
  return (
    <div 
      className={cn(
        "flex flex-col bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm transition-all duration-300",
        !isExpanded && "hover:shadow-md cursor-pointer",
        isExpanded && "bg-blue-50/30 border-blue-300 border-2",
        className
      )}
      onClick={!isExpanded ? () => handleExpand() : undefined}
    >
      <div className="p-6">
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="bg-blue-50 text-blue-600 rounded-full px-2.5 py-1 text-xs font-bold">
              {categoryName}
            </span>
            <span className="text-xs text-slate-400">·</span>
            <span className="text-xs text-slate-500">{post.profiles?.full_name || "익명"}</span>
            <span className="text-xs text-slate-400">·</span>
            <span className="text-xs text-slate-400">{formatRelativeTime(post.created_at)}</span>
          </div>
        </div>

        {/* 본문 영역 */}
        <div className="mb-4 relative">
          {/* 제목 (클릭 시 상세 페이지 이동) */}
          <Link href={href} onClick={(e) => e.stopPropagation()}>
            <h3 className="text-xl font-bold text-slate-900 mb-3 leading-relaxed hover:text-blue-600 transition-colors">
              {post.title}
            </h3>
          </Link>
          
          {/* 내용 */}
          {isExpanded ? (
            <div 
              className="prose prose-slate max-w-none text-slate-700 [&_p]:mb-4 [&_p]:leading-relaxed [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:mb-4 [&_h2]:text-xl [&_h2]:font-bold [&_h2]:mb-3 [&_h3]:text-lg [&_h3]:font-bold [&_h3]:mb-2 [&_ul]:list-disc [&_ul]:ml-6 [&_ol]:list-decimal [&_ol]:ml-6 [&_li]:mb-2 [&_a]:text-blue-600 [&_a]:underline [&_code]:bg-slate-100 [&_code]:px-1 [&_code]:rounded [&_pre]:bg-slate-100 [&_pre]:p-4 [&_pre]:rounded-lg [&_pre]:overflow-x-auto [&_blockquote]:border-l-4 [&_blockquote]:border-slate-300 [&_blockquote]:pl-4 [&_blockquote]:italic"
              dangerouslySetInnerHTML={{ __html: post.content || "" }}
            />
          ) : (
            <div className="relative">
              <p className={cn(
                "text-slate-600 leading-relaxed",
                isGroupOnly ? "blur-sm select-none" : "",
                !isExpanded && "line-clamp-3"
              )}>
                {contentPreview}
              </p>
              
              {isGroupOnly && (
                <div className="absolute inset-0 flex items-center justify-center bg-white/60 backdrop-blur-[1px] rounded-lg">
                  <div className="flex flex-col items-center gap-2 text-center px-4">
                    <Lock className="h-5 w-5 text-slate-400" />
                    <p className="text-sm font-medium text-slate-700">멤버 전용 글입니다</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 푸터 (액션 버튼) */}
        <div className="flex items-center gap-4 pt-2" onClick={(e) => e.stopPropagation()}>
          <div className="z-10">
            {userId ? (
              <LikeButton 
                postId={post.id} 
                userId={userId} 
                initialLiked={isLiked}
                initialCount={likeCount}
                onLikeChange={(newCount) => setLikeCount(newCount)}
              />
            ) : (
              <div className="flex items-center gap-1.5 text-sm text-slate-500 px-3 py-1.5">
                <Heart className="h-4 w-4" />
                <span className="font-medium">{likeCount}</span>
              </div>
            )}
          </div>
          
          <Button 
            variant="ghost" 
            size="sm" 
            className="gap-2 text-slate-600 hover:bg-slate-100"
            onClick={handleExpand}
          >
            <MessageSquare className="h-4 w-4" />
            <span>{post.comments_count || 0}</span>
          </Button>

          {/* 펼치기/접기 버튼 */}
          <Button 
            variant="ghost" 
            size="sm" 
            className="ml-auto text-slate-400 hover:text-slate-600"
            onClick={handleExpand}
          >
            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* 댓글 섹션 (펼쳐졌을 때만 렌더링) */}
      {isExpanded && (
        <div className="border-t border-slate-100 bg-slate-50/50 p-6" onClick={(e) => e.stopPropagation()}>
          {isLoadingComments ? (
            <div className="flex justify-center py-4">
              <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
            </div>
          ) : (
            <CommentSection 
              postId={post.id} 
              userId={userId || undefined} 
              comments={comments}
              readOnly={false}
              onCommentAdded={async () => {
                // 댓글 추가 후 목록 새로고침
                const supabase = createClient()
                const { data } = await supabase
                  .from("comments")
                  .select(`
                    *,
                    profiles:author_id (
                      id,
                      full_name,
                      avatar_url
                    )
                  `)
                  .eq("post_id", post.id)
                  .order("created_at", { ascending: true })
                
                if (data) {
                  setComments(data)
                }
              }}
            />
          )}
        </div>
      )}
    </div>
  )
}
