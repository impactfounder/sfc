"use client"

import Link from "next/link"
import { useState, useEffect } from "react"
import { MessageSquare, Lock, Heart } from "lucide-react"
import { cn } from "@/lib/utils"
import { formatRelativeTime } from "@/lib/format-time"
import { LikeButton } from "@/components/like-button"
import { createClient } from "@/lib/supabase/client"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import Image from "next/image"
import { useRouter } from "next/navigation"

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
  thumbnail_url?: string | null
  board_categories?: {
    name?: string | null
    slug?: string | null
  } | null
  profiles?: {
    full_name?: string | null
    id?: string
    avatar_url?: string | null
  } | null
  visible_badges?: Badge[]
  communities?: {
    name?: string | null
  } | null
  isMember?: boolean
  post_images?: Array<{
    id: string
    image_url: string
    sort_order: number
  }>
}

type PostListItemProps = {
  post: Post
  href: string
  className?: string
  isMember?: boolean
  viewMode?: "feed" | "list"
  currentUserId?: string
  hideCategory?: boolean
}

export function PostListItem({
  post,
  href,
  className,
  isMember = true,
  viewMode = "feed",
  currentUserId,
  hideCategory = false
}: PostListItemProps) {
  const router = useRouter()
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
  // 카테고리 이름 표시 (hideCategory가 true이거나, 자유게시판/반골/하이토크인 경우 숨김)
  const boardSlug = post.board_categories?.slug
  const categoryName = hideCategory
    ? null
    : (boardSlug === "free-board" || boardSlug === "free" || boardSlug === "vangol" || boardSlug === "hightalk")
      ? null
      : (post.board_categories?.name || post.communities?.name || "게시판")
  const isGroupOnly = post.visibility === "group" && !isMember

  // 대표 뱃지 (첫 번째 뱃지만)
  const primaryBadge = post.visible_badges && post.visible_badges.length > 0 ? post.visible_badges[0] : null

  // 리스트형 뷰 (밀도 높은 세련된 디자인)
  if (viewMode === "list") {
    return (
      <div
        className={cn("block w-full group cursor-pointer", className)}
        onClick={() => router.push(href)}
      >
        {/* 패딩 축소: py-2.5 -> py-2, hover 효과 개선 */}
        <div className="flex items-center gap-3 py-2 pl-4 pr-4 bg-white border-b border-slate-100 group-hover:bg-slate-50/80 transition-colors duration-150">

          {/* 카테고리 뱃지 (크기 및 폰트 미세 조정) - 자유게시판 제외 */}
          {categoryName && (
            <span className="bg-slate-100 text-slate-600 rounded-md px-2 py-0.5 text-[11px] font-medium flex-shrink-0 w-16 text-center">
              {categoryName}
            </span>
          )}

          {/* 제목 및 내용 */}
          <div className="flex-1 min-w-0 flex items-center gap-2">
            {/* 제목 */}
            <h3 className="text-[15px] font-medium text-slate-900 truncate group-hover:text-blue-600 transition-colors">
              {post.title}
            </h3>
          </div>

          {/* 데스크탑 정보 (우측 정렬, 고정 너비) */}
          <div className="hidden sm:flex items-center gap-4 text-xs text-slate-400 flex-shrink-0">
            <span className="text-slate-500 w-24 text-left truncate">{post.profiles?.full_name || "익명"}</span>
            <span className="w-20 text-right whitespace-nowrap">{formatRelativeTime(post.created_at)}</span>

            {/* 좋아요 버튼 (클릭 가능) */}
            <div
              className="flex items-center justify-center w-12 flex-shrink-0"
              onClick={(e) => e.stopPropagation()}
            >
              <LikeButton
                postId={post.id}
                userId={userId || undefined}
                initialLiked={isLiked}
                initialCount={likeCount}
                onLikeChange={(newCount) => setLikeCount(newCount)}
              />
            </div>

            {/* 댓글 아이콘 영역 (클릭 시 상세 페이지 이동) */}
            <div
              className="flex items-center justify-center w-12 flex-shrink-0 cursor-pointer hover:bg-slate-100 rounded-full p-1"
              onClick={(e) => {
                e.stopPropagation()
                router.push(href)
              }}
            >
              {(post.comments_count || 0) > 0 ? (
                <div className="flex items-center gap-0.5 text-blue-500">
                  <MessageSquare className="h-3 w-3 fill-current" />
                  <span>{post.comments_count}</span>
                </div>
              ) : (
                <div className="flex items-center gap-0.5 text-slate-300">
                  <MessageSquare className="h-3 w-3" />
                  <span className="text-slate-300">0</span>
                </div>
              )}
            </div>
          </div>

          {/* 모바일 정보 (아이콘만 간략히, 고정 위치) */}
          <div className="flex sm:hidden items-center gap-2 text-xs text-slate-400 flex-shrink-0">
            {/* 좋아요 버튼 (클릭 가능) */}
            <div
              className="flex items-center justify-center w-10 flex-shrink-0"
              onClick={(e) => e.stopPropagation()}
            >
              <LikeButton
                postId={post.id}
                userId={userId || undefined}
                initialLiked={isLiked}
                initialCount={likeCount}
                onLikeChange={(newCount) => setLikeCount(newCount)}
              />
            </div>

            {/* 댓글 아이콘 영역 (클릭 시 상세 페이지 이동) */}
            <div
              className="flex items-center justify-center w-10 flex-shrink-0 cursor-pointer"
              onClick={(e) => {
                e.stopPropagation()
                router.push(href)
              }}
            >
              {(post.comments_count || 0) > 0 ? (
                <div className="flex items-center gap-0.5 text-blue-500">
                  <MessageSquare className="h-3 w-3 fill-current" />
                  <span>{post.comments_count}</span>
                </div>
              ) : (
                <div className="flex items-center gap-0.5 text-slate-300">
                  <MessageSquare className="h-3 w-3" />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
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
        {/* 썸네일 이미지 (피드형 뷰에서만 표시) */}
        {post.thumbnail_url && (
          <div className="relative w-full aspect-[2/1] md:aspect-[21/9] overflow-hidden">
            <Image
              src={post.thumbnail_url}
              alt={post.title}
              fill
              className="object-cover transition-transform duration-300 hover:scale-105"
            />
          </div>
        )}
        <div className="p-5">
          {/* 헤더: 작성자 아바타 + 메타 정보 */}
          <div className="flex items-center gap-3 mb-4">
            <Avatar className="h-8 w-8 flex-shrink-0">
              <AvatarImage src={post.profiles?.avatar_url || undefined} />
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
                {categoryName && (
                  <>
                    <span className="bg-blue-50 text-blue-600 rounded-full px-2 py-0.5 text-xs font-bold">
                      {categoryName}
                    </span>
                    <span className="text-xs text-slate-400">·</span>
                  </>
                )}
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

