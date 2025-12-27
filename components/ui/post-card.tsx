"use client"

import { Heart, MessageSquare, Share2, Tag } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import { useRouter } from "next/navigation"
import { useMemo } from "react"

type PostCardProps = {
  postId: string
  href: string
  community: { name: string; href?: string; iconUrl?: string | null }
  author: { name: string; href?: string; avatarUrl?: string | null }
  createdAt: string
  title: string
  content?: string | null
  contentRaw?: string | null
  thumbnailUrl?: string | null
  likesCount?: number
  commentsCount?: number
  userId?: string
  initialLiked?: boolean
  onShare?: () => void
  hideCategory?: boolean
}

export function PostCard({
  postId,
  href,
  community,
  author,
  createdAt,
  title,
  content,
  contentRaw,
  thumbnailUrl,
  likesCount = 0,
  commentsCount = 0,
  userId,
  initialLiked = false,
  onShare,
  hideCategory = false,
}: PostCardProps) {
  const router = useRouter()
  const timeLabel = formatRelativeTime(createdAt)
  const derivedThumb = thumbnailUrl || extractFirstImage(contentRaw || content)
  const previewHtml = useMemo(
    () => sanitizePreview(contentRaw || content || "", Boolean(derivedThumb)),
    [content, contentRaw, derivedThumb]
  )

  return (
    <div
      role="link"
      tabIndex={0}
      onClick={() => router.push(href)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault()
          router.push(href)
        }
      }}
      className={cn(
        "bg-white border border-slate-200 rounded-lg hover:border-slate-300 transition-colors mb-4",
        "cursor-pointer overflow-hidden shadow-sm hover:shadow-md"
      )}
    >
      {/* Header */}
      <div className="p-3 pb-1 flex items-center gap-2 text-xs text-slate-500">
        <Avatar className="h-6 w-6">
          <AvatarImage src={author.avatarUrl || undefined} />
          <AvatarFallback className="text-[10px]">
            {author.name?.charAt(0) || "·"}
          </AvatarFallback>
        </Avatar>
        <span className="font-bold text-slate-900 text-sm">{author.name}</span>
        <span className="text-slate-400">•</span>
        <span className="text-slate-400">{timeLabel}</span>
        {!hideCategory && (
          <>
            <span className="text-slate-400">•</span>
            <span className="inline-flex items-center gap-1 text-[11px] text-slate-500 bg-slate-100 px-2 py-1 rounded-full">
              <Tag className="h-3 w-3" />
              {community.name}
            </span>
          </>
        )}
      </div>

      {/* Title */}
      <div className="px-3 py-1">
        <h3 className="text-lg font-bold text-slate-900 leading-snug">
          {title}
        </h3>
      </div>

      {/* Content Preview + Image */}
      <div className="px-3 pb-2">
        {(contentRaw || content) && (
          <div
            className="prose prose-slate max-w-none text-sm leading-relaxed line-clamp-4"
            dangerouslySetInnerHTML={{ __html: previewHtml }}
          />
        )}
        {derivedThumb && (
          <div className="mt-3 w-full h-[300px] rounded-md bg-slate-100 overflow-hidden">
            <img
              src={derivedThumb}
              alt={title}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-3 py-2 bg-slate-50/50 border-t border-slate-100 flex items-center gap-1 text-xs text-slate-600">
        <button
          type="button"
          className="flex items-center gap-1 px-2 py-1 rounded-full hover:bg-slate-200 transition-colors"
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
          }}
        >
          <Heart className="h-4 w-4" />
          <span>{likesCount}</span>
        </button>
        <button
          type="button"
          className="flex items-center gap-1 px-2 py-1 rounded-full hover:bg-slate-200 transition-colors"
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
          }}
        >
          <MessageSquare className="h-4 w-4" />
          <span>{commentsCount} 댓글</span>
        </button>
        <button
          type="button"
          className="flex items-center gap-1 px-2 py-1 rounded-full hover:bg-slate-200 transition-colors"
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            if (onShare) {
              onShare()
            } else if (typeof navigator !== "undefined") {
              navigator.clipboard.writeText(window.location.origin + href).catch(() => {})
            }
          }}
        >
          <Share2 className="h-4 w-4" />
          <span>공유</span>
        </button>
      </div>
    </div>
  )
}

function formatRelativeTime(dateStr: string) {
  const date = new Date(dateStr)
  const diff = Date.now() - date.getTime()
  const sec = Math.floor(diff / 1000)
  if (sec < 60) return `${sec}초 전`
  const min = Math.floor(sec / 60)
  if (min < 60) return `${min}분 전`
  const hr = Math.floor(min / 60)
  if (hr < 24) return `${hr}시간 전`
  const day = Math.floor(hr / 24)
  if (day < 30) return `${day}일 전`
  const mo = Math.floor(day / 30)
  if (mo < 12) return `${mo}개월 전`
  const yr = Math.floor(mo / 12)
  return `${yr}년 전`
}

function extractFirstImage(content?: string | null): string | null {
  if (!content) return null
  const match = content.match(/<img[^>]+src=["']([^"']+)["']/i)
  return match ? match[1] : null
}

// 매우 제한적으로 스크립트/인라인 핸들러를 제거한 뒤 미리보기로 사용
function sanitizePreview(html: string, stripImages = false): string {
  if (!html) return ""
  let safe = html
  // 스크립트 태그 제거
  safe = safe.replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "")
  // 이벤트 핸들러(on...) 속성 제거
  safe = safe.replace(/\son\w+="[^"]*"/gi, "")
  safe = safe.replace(/\son\w+='[^']*'/gi, "")
  // 스타일 태그 제거(원치 않는 CSS 주입 방지)
  safe = safe.replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, "")
  if (stripImages) {
    safe = safe.replace(/<img[^>]*>/gi, "")
  }
  return safe
}

