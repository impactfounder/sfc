"use client"

import Link from "next/link"
import { Heart, MessageSquare, Share2 } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import { LikeButton } from "@/components/like-button"
import { useRouter } from "next/navigation"

type PostCardProps = {
  postId: string
  href: string
  community: { name: string; href?: string; iconUrl?: string | null }
  author: { name: string; href?: string }
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
}: PostCardProps) {
  const router = useRouter()
  const timeLabel = formatRelativeTime(createdAt)
  const derivedThumb = thumbnailUrl || extractFirstImage(contentRaw || content)

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
        "bg-white rounded-md border border-gray-300 hover:border-gray-400 transition-colors mb-4",
        "overflow-hidden cursor-pointer"
      )}
    >
      {/* Header */}
      <div className="px-4 pt-3 pb-2 flex items-center text-xs text-gray-500 gap-2">
        <Avatar className="h-5 w-5">
          <AvatarImage src={community.iconUrl || undefined} />
          <AvatarFallback className="text-[10px]">r/</AvatarFallback>
        </Avatar>
        {community.href ? (
          <Link
            href={community.href}
            onClick={(e) => e.stopPropagation()}
            className="font-bold text-black hover:underline"
          >
            {community.name}
          </Link>
        ) : (
          <span className="font-bold text-black">{community.name}</span>
        )}
        <span className="mx-1">•</span>
        <span className="text-gray-500">
          Posted by{" "}
          <Link href={author.href || "#"} onClick={(e) => e.stopPropagation()} className="hover:underline">
            u/{author.name}
          </Link>
        </span>
        <span className="mx-1">•</span>
        <span>{timeLabel}</span>
      </div>

      {/* Body */}
      <div className="px-4 pb-2">
        <h3 className="text-lg font-medium text-gray-900 leading-snug mb-2">{title}</h3>
        {content && (
          <p className="text-sm text-gray-800 leading-relaxed line-clamp-4 mb-2 whitespace-pre-line">{content}</p>
        )}
        {derivedThumb && (
          <div
            className="w-full bg-gray-100 rounded-md overflow-hidden border border-gray-200"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              if (typeof window !== "undefined") {
                window.open(derivedThumb, "_blank", "noopener,noreferrer")
              }
            }}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault()
                e.stopPropagation()
                if (typeof window !== "undefined") {
                  window.open(derivedThumb, "_blank", "noopener,noreferrer")
                }
              }
            }}
          >
            <img
              src={derivedThumb}
              alt={title}
              className="w-full h-auto object-contain max-h-[420px] sm:max-h-[520px] cursor-zoom-in"
              loading="lazy"
            />
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-2 bg-gray-50/50 border-t border-gray-100 flex items-center gap-2 text-xs font-bold">
        <div className="flex items-center">
          <LikeButton
            postId={postId}
            userId={userId}
            initialLiked={initialLiked}
            initialCount={likesCount}
            onLikeChange={() => {}}
          />
        </div>
        <button
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full hover:bg-gray-200 transition-colors text-gray-500"
          type="button"
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
          }}
        >
          <MessageSquare className="h-4 w-4" />
          <span>{commentsCount} Comments</span>
        </button>
        <button
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full hover:bg-gray-200 transition-colors text-gray-500"
          type="button"
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
  if (sec < 60) return `${sec}s ago`
  const min = Math.floor(sec / 60)
  if (min < 60) return `${min}m ago`
  const hr = Math.floor(min / 60)
  if (hr < 24) return `${hr}h ago`
  const day = Math.floor(hr / 24)
  if (day < 30) return `${day}d ago`
  const mo = Math.floor(day / 30)
  if (mo < 12) return `${mo}mo ago`
  const yr = Math.floor(mo / 12)
  return `${yr}y ago`
}

function extractFirstImage(content?: string | null): string | null {
  if (!content) return null
  const match = content.match(/<img[^>]+src=["']([^"']+)["']/i)
  return match ? match[1] : null
}

