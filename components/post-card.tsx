"use client"

import Link from "next/link"
import { MessageSquare, Share2 } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { LikeButton } from "@/components/like-button"
import { cn } from "@/lib/utils"

export type PostCardData = {
  id: string
  title: string
  created_at: string
  content_preview?: string | null
  thumbnail_url?: string | null
  likes_count: number
  comments_count: number
  board_categories?: { name: string | null; slug: string | null } | null
  profiles?: { id: string; full_name: string | null; avatar_url: string | null } | null
  is_announcement?: boolean | null
}

type PostCardProps = {
  post: PostCardData
  href?: string
  userId?: string
  onLikeChange?: (count: number) => void
  className?: string
}

export function PostCard({ post, href = `/community/board/${post.board_categories?.slug ?? "community"}/${post.id}`, userId, onLikeChange, className }: PostCardProps) {
  const dateLabel = new Date(post.created_at).toLocaleDateString("ko-KR", {
    month: "short",
    day: "numeric",
  })

  return (
    <Card className={cn("border-0 bg-white shadow-sm shadow-slate-900/5 ring-1 ring-slate-900/[0.04] hover:shadow-md hover:ring-slate-900/[0.08] transition-all duration-200 group", className)}>
      <CardContent className="p-5 sm:p-6">
        {/* 헤더 */}
        <div className="flex items-center gap-3 mb-3">
          <Avatar className="h-8 w-8">
            <AvatarImage src={post.profiles?.avatar_url || undefined} />
            <AvatarFallback className="bg-slate-100 text-slate-500 text-xs font-semibold">
              {post.profiles?.full_name?.[0] || "U"}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span className="truncate">{post.profiles?.full_name || "익명"}</span>
              <span>•</span>
              <span>{dateLabel}</span>
            </div>
            {post.board_categories?.name && (
              <div className="flex items-center gap-1 mt-1">
                <Badge variant="secondary" className="text-[11px]">
                  {post.board_categories.name}
                </Badge>
                {post.is_announcement && (
                  <Badge variant="outline" className="text-[11px] border-amber-200 text-amber-700 bg-amber-50">
                    공지
                  </Badge>
                )}
              </div>
            )}
          </div>
        </div>

        {/* 본문 */}
        <Link href={href} className="block group">
          <h3 className="text-lg sm:text-xl font-semibold text-slate-900 group-hover:text-blue-600 transition-colors leading-snug">
            {post.title}
          </h3>
          {post.content_preview && (
            <p className="mt-2 text-sm text-slate-600 line-clamp-2 whitespace-pre-line">
              {post.content_preview}
            </p>
          )}
          {post.thumbnail_url && (
            <div className="mt-3 overflow-hidden rounded-lg border border-slate-100 bg-slate-50">
              <img
                src={post.thumbnail_url}
                alt={post.title}
                className="h-44 w-full object-cover transition-transform duration-200 group-hover:scale-[1.01]"
                loading="lazy"
              />
            </div>
          )}
        </Link>

        {/* 액션 바 */}
        <div className="mt-4 flex items-center gap-2 text-sm text-slate-500">
          <LikeButton
            postId={post.id}
            userId={userId}
            initialLiked={false}
            initialCount={post.likes_count || 0}
            onLikeChange={onLikeChange}
          />
          <Button variant="ghost" size="sm" className="gap-1.5 px-2 text-slate-500 hover:text-slate-700" asChild>
            <Link href={href}>
              <MessageSquare className="h-4 w-4" />
              <span className="text-xs">{post.comments_count || 0}</span>
            </Link>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="gap-1.5 px-2 text-slate-500 hover:text-slate-700"
            onClick={() => {
              if (typeof navigator !== "undefined") {
                navigator.clipboard.writeText(`${window.location.origin}${href}`).catch(() => {})
              }
            }}
          >
            <Share2 className="h-4 w-4" />
            <span className="text-xs">공유</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}


