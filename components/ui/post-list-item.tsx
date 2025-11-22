import Link from "next/link"
import type { FC } from "react"

import { cn } from "@/lib/utils"
import { formatRelativeTime } from "@/lib/format-time"
import { UserBadges } from "@/components/user-badges"

type Badge = {
  icon: string
  name: string
}

type Post = {
  id: string
  title: string
  content?: string | null
  created_at: string
  board_categories?: {
    name?: string | null
  } | null
  profiles?: {
    full_name?: string | null
    id?: string
  } | null
  visible_badges?: Badge[]
}

type PostListItemProps = {
  post: Post
  href: string
  className?: string
}

export const PostListItem: FC<PostListItemProps> = ({ post, href, className }) => {
  // content에서 HTML 태그 제거하고 텍스트만 추출
  const getPlainText = (html?: string | null) => {
    if (!html) return ""
    return html.replace(/<[^>]*>/g, "").trim()
  }

  const contentPreview = getPlainText(post.content)

  return (
    <Link href={href} className={cn("block", className)}>
      <div className="rounded-xl border border-gray-200 bg-white px-5 py-4 shadow-sm hover:shadow-md transition cursor-pointer">
        {/* 상단: 카테고리 pill 배지 */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-xs font-medium">
            {post.board_categories?.name || "게시판"}
          </span>
          <span className="text-sm text-gray-500 flex-shrink-0">{formatRelativeTime(post.created_at)}</span>
        </div>

        {/* 제목 (최대 2줄) */}
        <h3 className="text-base font-semibold text-gray-900 mb-2 line-clamp-2 leading-tight">
          {post.title}
        </h3>

        {/* 본문 미리보기 (최대 2줄) */}
        {contentPreview && (
          <p className="text-gray-600 text-sm line-clamp-2 leading-relaxed mb-2">
            {contentPreview}
          </p>
        )}

        {/* 작성자 이름 및 뱃지 */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm text-gray-500 font-medium">
            {post.profiles?.full_name || "익명"}
          </span>
          {post.visible_badges && post.visible_badges.length > 0 && (
            <UserBadges badges={post.visible_badges} />
          )}
        </div>
      </div>
    </Link>
  )
}
