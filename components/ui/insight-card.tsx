"use client"

import Link from "next/link"
import Image from "next/image"
import { formatRelativeTime } from "@/lib/format-time"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"

type Post = {
  id: string
  title: string
  content?: string | null
  created_at: string
  thumbnail_url?: string | null
  profiles?: {
    full_name?: string | null
    id?: string
    avatar_url?: string | null
  } | null
  board_categories?: {
    name?: string | null
    slug?: string | null
  } | null
}

type InsightCardProps = {
  post: Post
  href: string
  className?: string
}

export function InsightCard({ post, href, className }: InsightCardProps) {
  // HTML 태그 제거하고 텍스트만 추출
  const getPlainText = (html?: string | null) => {
    if (!html) return ""
    return html.replace(/<[^>]*>/g, "").trim()
  }

  const contentPreview = getPlainText(post.content)
  const categoryName = post.board_categories?.name || "인사이트"

  return (
    <Link href={href} className={cn("block group", className)}>
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden hover:shadow-lg hover:border-slate-300 transition-all duration-300">
        <div className="flex flex-col md:flex-row">
          {/* 좌측: 콘텐츠 영역 */}
          <div className="flex-1 p-6 md:p-8 flex flex-col justify-between">
            <div>
              {/* 태그 및 카테고리 */}
              <div className="flex items-center gap-2 mb-3">
                <span className="inline-flex items-center px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold">
                  #{categoryName}
                </span>
              </div>

              {/* 제목 */}
              <h3 className="text-xl md:text-2xl font-bold text-slate-900 mb-3 leading-tight group-hover:text-blue-600 transition-colors line-clamp-2">
                {post.title}
              </h3>

              {/* 본문 미리보기 (2-3줄) */}
              {contentPreview && (
                <p className="text-slate-600 text-sm md:text-base leading-relaxed line-clamp-3 mb-4">
                  {contentPreview}
                </p>
              )}
            </div>

            {/* 작성자 정보 */}
            <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
              <Avatar className="h-10 w-10 flex-shrink-0">
                <AvatarImage src={post.profiles?.avatar_url || undefined} />
                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white text-sm font-semibold">
                  {(post.profiles?.full_name || "익명")[0]?.toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-semibold text-slate-900">
                    {post.profiles?.full_name || "익명"}
                  </span>
                  <span className="text-xs text-slate-400">·</span>
                  <span className="text-xs text-slate-400">
                    {formatRelativeTime(post.created_at)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* 우측: 썸네일 이미지 */}
          {post.thumbnail_url && (
            <div className="relative w-full md:w-64 lg:w-80 h-48 md:h-auto flex-shrink-0">
              <Image
                src={post.thumbnail_url}
                alt={post.title}
                fill
                className="object-cover transition-transform duration-300 group-hover:scale-105"
              />
            </div>
          )}
        </div>
      </div>
    </Link>
  )
}

