import Link from "next/link"
import type { FC } from "react"
import { Heart, MessageSquare, Lock } from "lucide-react"

import { cn } from "@/lib/utils"
import { formatRelativeTime } from "@/lib/format-time"

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
}

type PostListItemProps = {
  post: Post
  href: string
  className?: string
  isMember?: boolean // 해당 커뮤니티 멤버 여부
  viewMode?: "feed" | "list" // 뷰 모드
}

export const PostListItem: FC<PostListItemProps> = ({ post, href, className, isMember = true, viewMode = "feed" }) => {
  // content에서 HTML 태그 제거하고 텍스트만 추출
  const getPlainText = (html?: string | null) => {
    if (!html) return ""
    return html.replace(/<[^>]*>/g, "").trim()
  }

  const contentPreview = getPlainText(post.content)
  
  // 카테고리/커뮤니티 이름 결정
  const categoryName = post.board_categories?.name || post.communities?.name || "게시판"
  const isGroupOnly = post.visibility === "group" && !isMember

  // 리스트형 뷰
  if (viewMode === "list") {
    return (
      <Link href={href} className={cn("block", className)}>
        <div className="flex items-center gap-3 bg-white border border-slate-200 rounded-lg p-4 hover:shadow-md transition-all duration-200">
          {/* 좌측: 커뮤니티 이름 뱃지 */}
          <span className="bg-blue-50 text-blue-600 rounded-full px-2.5 py-1 text-xs font-bold flex-shrink-0">
            {categoryName}
          </span>
          
          {/* 중앙: 제목 */}
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-semibold text-slate-900 line-clamp-1">
              {post.title}
            </h3>
          </div>

          {/* 우측: 메타 정보 */}
          <div className="flex items-center gap-4 text-xs text-slate-500 flex-shrink-0">
            <span className="hidden sm:inline">{post.profiles?.full_name || "익명"}</span>
            <span className="hidden sm:inline">·</span>
            <span>{formatRelativeTime(post.created_at)}</span>
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

  // 피드형 뷰 (기본)
  return (
    <Link href={href} className={cn("block", className)}>
      <div className="flex flex-col bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-all duration-200">
        {/* 헤더: 커뮤니티 이름 + 작성자 및 시간 */}
        <div className="flex justify-between items-center mb-3">
          {/* 좌측: 커뮤니티 이름 뱃지 */}
          <span className="bg-blue-50 text-blue-600 rounded-full px-2.5 py-1 text-xs font-bold">
            {categoryName}
          </span>
          {/* 우측: 작성자 및 시간 */}
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span>{post.profiles?.full_name || "익명"}</span>
            <span>·</span>
            <span>{formatRelativeTime(post.created_at)}</span>
          </div>
        </div>

        {/* 본문: 제목 + 내용 미리보기 */}
        <div className="flex-1 mb-4 relative">
          {/* 제목 */}
          <h3 className="text-lg font-bold text-slate-900 mb-2 line-clamp-2">
            {post.title}
          </h3>
          
          {/* 내용 미리보기 */}
          {contentPreview && (
            <div className="relative">
              <p
                className={cn(
                  "text-slate-600 leading-relaxed",
                  isGroupOnly ? "line-clamp-3 blur-sm select-none" : "line-clamp-3"
                )}
              >
                {contentPreview}
              </p>
              
              {/* 그룹 전용 오버레이 */}
              {isGroupOnly && (
                <div className="absolute inset-0 flex items-center justify-center bg-white/80 backdrop-blur-sm rounded-lg">
                  <div className="flex flex-col items-center gap-2 text-center px-4">
                    <Lock className="h-6 w-6 text-slate-400" />
                    <p className="text-sm font-medium text-slate-700">
                      🔒 멤버 전용 글입니다
                    </p>
                    <p className="text-xs text-slate-500">
                      가입하면 전체 내용을 볼 수 있습니다
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 푸터: 좋아요, 댓글 아이콘 */}
        <div className="flex items-center gap-4 text-sm text-slate-500">
          <div className="flex items-center gap-1.5">
            <Heart className="h-4 w-4" />
            <span>{post.likes_count || 0}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <MessageSquare className="h-4 w-4" />
            <span>{post.comments_count || 0}</span>
          </div>
        </div>
      </div>
    </Link>
  )
}
