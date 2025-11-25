"use client"

import Link from "next/link"
import { useState, useEffect } from "react"
import { MessageSquare, Lock, Heart } from "lucide-react"
import { cn } from "@/lib/utils"
import { formatRelativeTime } from "@/lib/format-time"
import { LikeButton } from "@/components/like-button"
import { createClient } from "@/lib/supabase/client"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"

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
  
  // 대표 뱃지 (첫 번째 뱃지만)
  const primaryBadge = post.visible_badges && post.visible_badges.length > 0 ? post.visible_badges[0] : null

  // 리스트형 뷰 (밀도 높은 세련된 디자인)
  if (viewMode === "list") {
    return (
      <Link href={href} className={cn("block", className)}>
        <div className="flex items-center gap-3 py-2.5 px-4 bg-white border-b border-slate-100 hover:bg-slate-50/50 transition-all duration-200 first:rounded-t-xl last:rounded-b-xl">
          <span className="bg-blue-100 text-blue-700 rounded-md px-2 py-0.5 text-xs font-semibold flex-shrink-0">
            {categoryName}
          </span>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-slate-900 line-clamp-1">
              {post.title}
            </h3>
            {/* 모바일: 두 줄로 표시 */}
            <div className="flex items-center gap-1.5 mt-0.5 sm:hidden">
              <span className="text-xs text-slate-500">{post.profiles?.full_name || "익명"}</span>
              {primaryBadge && (
                <span className="inline-flex items-center gap-0.5 bg-slate-100 text-slate-700 rounded px-1 text-xs">
                  <span>{primaryBadge.icon}</span>
                </span>
              )}
              <span className="text-xs text-slate-400">·</span>
              <span className="text-xs text-slate-400">{formatRelativeTime(post.created_at)}</span>
            </div>
          </div>
          {/* 데스크탑: 우측 정렬 */}
          <div className="hidden sm:flex items-center gap-4 text-xs text-slate-500 flex-shrink-0">
            <span className="text-slate-500">{post.profiles?.full_name || "익명"}</span>
            {primaryBadge && (
              <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-700 rounded px-1.5 py-0.5 text-xs">
                <span>{primaryBadge.icon}</span>
                <span className="hidden md:inline">{primaryBadge.name}</span>
              </span>
            )}
            <span className="text-slate-400">·</span>
            <span>{formatRelativeTime(post.created_at)}</span>
            <div className="flex items-center gap-2.5 ml-2">
              <div className="flex items-center gap-1">
                <Heart className="h-3.5 w-3.5" />
                <span className="text-xs">{post.likes_count || 0}</span>
              </div>
              <div className="flex items-center gap-1">
                <MessageSquare className="h-3.5 w-3.5" />
                <span className="text-xs">{post.comments_count || 0}</span>
              </div>
            </div>
          </div>
          {/* 모바일: 아이콘만 우측에 */}
          <div className="flex sm:hidden items-center gap-2 text-xs text-slate-500 flex-shrink-0">
            <div className="flex items-center gap-0.5">
              <Heart className="h-3.5 w-3.5" />
              <span>{post.likes_count || 0}</span>
            </div>
            <div className="flex items-center gap-0.5">
              <MessageSquare className="h-3.5 w-3.5" />
              <span>{post.comments_count || 0}</span>
            </div>
          </div>
        </div>
      </Link>
    )
  }

  // 피드형 뷰 (카드형 링크, 단순화)
  return (
    <Link href={href} className={cn("block", className)}>
      <div 
        className={cn(
          "flex flex-col bg-white rounded-2xl overflow-hidden border border-slate-100 shadow-sm transition-all duration-300 hover:shadow-md hover:border-slate-300 hover:-translate-y-0.5",
          className
        )}
      >
        <div className="p-5">
          {/* 헤더: 작성자 아바타 + 메타 정보 */}
          <div className="flex items-center gap-3 mb-4">
            <Avatar className="h-8 w-8 flex-shrink-0">
              <AvatarImage src={post.profiles?.id ? `/api/avatar/${post.profiles.id}` : undefined} />
              <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white text-xs font-semibold">
                {(post.profiles?.full_name || "익명")[0]?.toUpperCase() || "U"}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-semibold text-slate-900">{post.profiles?.full_name || "익명"}</span>
                {primaryBadge && (
                  <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-700 rounded px-1.5 py-0.5 text-xs">
                    <span>{primaryBadge.icon}</span>
                    <span>{primaryBadge.name}</span>
                  </span>
                )}
                <span className="bg-blue-50 text-blue-600 rounded-full px-2 py-0.5 text-xs font-bold">
                  {categoryName}
                </span>
                <span className="text-xs text-slate-400">·</span>
                <span className="text-xs text-slate-400">{formatRelativeTime(post.created_at)}</span>
              </div>
            </div>
          </div>

          {/* 본문 영역 */}
          <div className="mb-4 relative">
            {/* 제목 */}
            <h3 className="text-lg font-bold tracking-tight text-slate-900 mb-2.5 leading-snug hover:text-blue-600 transition-colors">
              {post.title}
            </h3>
            
            {/* 내용 미리보기 */}
            <div className="relative">
              <p className={cn(
                "text-slate-600 leading-relaxed line-clamp-3",
                isGroupOnly ? "blur-sm select-none" : ""
              )}>
                {contentPreview}
              </p>
              
              {/* 그라데이션 마스크 (더 읽으려면 누르세요 뉘앙스) */}
              {!isGroupOnly && contentPreview.length > 150 && (
                <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-white via-white/80 to-transparent pointer-events-none" />
              )}
              
              {isGroupOnly && (
                <div className="absolute inset-0 flex items-center justify-center bg-white/60 backdrop-blur-[1px] rounded-lg">
                  <div className="flex flex-col items-center gap-2 text-center px-4">
                    <Lock className="h-5 w-5 text-slate-400" />
                    <p className="text-sm font-medium text-slate-700">멤버 전용 글입니다</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 푸터 (액션 버튼) */}
          <div className="flex items-center gap-4 pt-2" onClick={(e) => e.stopPropagation()}>
            <div className="z-10">
              <LikeButton 
                postId={post.id} 
                userId={userId || undefined} 
                initialLiked={isLiked}
                initialCount={likeCount}
                onLikeChange={(newCount) => setLikeCount(newCount)}
              />
            </div>
            
            {/* 댓글 정보 표시 (링크 없음, 카드 클릭 시 이동) */}
            <div className="flex items-center gap-1.5 text-sm text-slate-600 px-3 py-1.5 rounded-lg">
              <MessageSquare className="h-4 w-4" />
              <span className="font-medium">{post.comments_count || 0}</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}

