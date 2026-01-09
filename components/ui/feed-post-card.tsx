"use client"

import { MessageSquare, Share2, Tag, Check } from "lucide-react"
import { cn } from "@/lib/utils"
import { useRouter } from "next/navigation"
import { useEffect, useMemo, useState } from "react"
import { useToast } from "@/hooks/use-toast"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

/**
 * FeedPostCard - Reddit 스타일 피드 카드
 *
 * 메인 피드에서 사용하는 익명 스타일 포스트 카드
 * - 작성자 아바타/이름 숨김
 * - 출처 태그(게시판/커뮤니티명)만 표시
 * - 상세 페이지에서 작성자 정보 확인 가능
 *
 * showAuthor=true일 경우 작성자 정보 표시 (커뮤니티 세부 페이지용)
 */

type FeedPostCardProps = {
  postId: string
  href: string
  source: { name: string; href?: string }  // 출처 (게시판 또는 커뮤니티)
  createdAt: string
  title: string
  content?: string | null
  contentRaw?: string | null
  thumbnailUrl?: string | null
  commentsCount?: number
  isLast?: boolean  // 마지막 아이템 여부 (하단 border 제거용)
  showAuthor?: boolean  // 작성자 정보 표시 여부
  author?: {
    name: string | null
    avatarUrl: string | null
  } | null
}

export function FeedPostCard({
  postId,
  href,
  source,
  createdAt,
  title,
  content,
  contentRaw,
  thumbnailUrl,
  commentsCount = 0,
  isLast = false,
  showAuthor = false,
  author,
}: FeedPostCardProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [copied, setCopied] = useState(false)
  const [timeLabel, setTimeLabel] = useState<string>("")

  // Hydration 에러 방지: 클라이언트 마운트 후에만 시간 계산
  useEffect(() => {
    setTimeLabel(formatRelativeTime(createdAt))
  }, [createdAt])

  const derivedThumb = thumbnailUrl || extractFirstImage(contentRaw || content)
  const previewHtml = useMemo(
    () => sanitizePreview(contentRaw || content || "", Boolean(derivedThumb)),
    [content, contentRaw, derivedThumb]
  )

  // 공유 버튼 핸들러
  const handleShare = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    const shareUrl = window.location.origin + href
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)

    // 모바일: Web Share API 사용
    if (isMobile && navigator.share) {
      try {
        await navigator.share({
          title: title,
          url: shareUrl,
        })
        toast({ description: "공유되었습니다!", duration: 2000 })
        return
      } catch (error: any) {
        if (error.name === 'AbortError') return
      }
    }

    // PC: 클립보드 복사
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      toast({ description: "링크가 복사되었습니다!", duration: 2000 })
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast({
        title: "복사 실패",
        description: "링크를 복사할 수 없습니다.",
        variant: "destructive",
      })
    }
  }

  return (
    <article
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
        "bg-white hover:bg-slate-50/50 transition-colors py-3 px-4",
        "cursor-pointer",
        !isLast && "border-b border-slate-200"
      )}
    >
      {/* Header - 출처 태그와 시간 표시 (Reddit 스타일) */}
      <div className="pb-1 flex items-center justify-between text-xs text-slate-500">
        <div className="flex items-center gap-2">
          {/* 작성자 정보 (showAuthor가 true일 때만 표시) */}
          {showAuthor && author && (
            <>
              <Avatar className="h-6 w-6">
                <AvatarImage src={author.avatarUrl || undefined} />
                <AvatarFallback className="text-[10px] bg-slate-100">
                  {author.name?.charAt(0) || "?"}
                </AvatarFallback>
              </Avatar>
              <span className="font-medium text-slate-700">
                {author.name || "익명"}
              </span>
              <span className="text-slate-400">•</span>
            </>
          )}
          <span
            className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 bg-slate-100 px-2.5 py-1 rounded-full hover:bg-slate-200 transition-colors"
            onClick={(e) => {
              if (source.href) {
                e.preventDefault()
                e.stopPropagation()
                router.push(source.href)
              }
            }}
          >
            <Tag className="h-3 w-3" />
            {source.name}
          </span>
        </div>
        <span className="text-slate-400 shrink-0">{timeLabel}</span>
      </div>

      {/* Title */}
      <div className="py-1">
        <h3 className="text-lg font-bold text-slate-900 leading-snug">
          {title}
        </h3>
      </div>

      {/* Content Preview + Image */}
      <div className="pb-2">
        {(contentRaw || content) && (
          <div
            className="prose prose-slate max-w-none text-sm leading-relaxed line-clamp-4"
            dangerouslySetInnerHTML={{ __html: previewHtml }}
          />
        )}
        {derivedThumb && (
          <div className="mt-3 w-full h-[280px] rounded bg-slate-100 overflow-hidden">
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
      <div className="pt-2 flex items-center gap-1 text-xs text-slate-500">
        {/* 댓글 버튼 */}
        <button
          type="button"
          className="flex items-center gap-1 px-2 py-1 rounded-full hover:bg-slate-200 transition-colors"
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            router.push(href)
          }}
        >
          <MessageSquare className="h-4 w-4" />
          <span>{commentsCount}</span>
        </button>

        {/* 공유 버튼 */}
        <button
          type="button"
          className="flex items-center gap-1 px-2 py-1 rounded-full hover:bg-slate-200 transition-colors"
          onClick={handleShare}
        >
          {copied ? <Check className="h-4 w-4" /> : <Share2 className="h-4 w-4" />}
          <span>{copied ? "복사됨" : "공유"}</span>
        </button>
      </div>
    </article>
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

function sanitizePreview(html: string, stripImages = false): string {
  if (!html) return ""
  let safe = html
  safe = safe.replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "")
  safe = safe.replace(/\son\w+="[^"]*"/gi, "")
  safe = safe.replace(/\son\w+='[^']*'/gi, "")
  safe = safe.replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, "")
  if (stripImages) {
    safe = safe.replace(/<img[^>]*>/gi, "")
  }
  return safe
}
