import Link from "next/link"
import type { FC } from "react"

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
  board_categories?: {
    name?: string | null
    slug?: string | null
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
  
  // 카테고리가 'announcement'이거나 없으면 뱃지를 렌더링하지 않음
  const categorySlug = post.board_categories?.slug
  const categoryName = post.board_categories?.name
  const shouldShowCategory = categorySlug && categorySlug !== "announcement" && categoryName

  return (
    <Link href={href} className={cn("block", className)}>
      <div className="flex flex-col bg-white border rounded-xl p-5 hover:shadow-sm transition-shadow">
        {/* 상단 (Header) - 메타 정보 */}
        <div className="flex justify-between items-center mb-3">
          {/* 좌측: 카테고리 뱃지 (조건부 렌더링) */}
          <div>
            {shouldShowCategory && (
              <span className="bg-blue-50 text-blue-600 rounded-full px-2 py-0.5 text-xs font-bold">
                {categoryName}
              </span>
            )}
          </div>
          {/* 우측: 작성일 */}
          <span className="text-xs text-slate-400">{formatRelativeTime(post.created_at)}</span>
        </div>

        {/* 중단 (Body) - 본문 */}
        <div className="flex-1 mb-3">
          {/* 제목 */}
          <h3 className="text-lg font-bold text-slate-900 mb-1 line-clamp-2">
            {post.title}
          </h3>
          {/* 내용 미리보기 */}
          {contentPreview && (
            <p className="text-sm text-slate-600 line-clamp-2 leading-relaxed">
              {contentPreview}
            </p>
          )}
        </div>

        {/* 하단 (Footer) - 작성자 */}
        <div className="mt-auto">
          <span className="text-xs font-medium text-slate-500">
            {post.profiles?.full_name || "익명"}
          </span>
        </div>
      </div>
    </Link>
  )
}
