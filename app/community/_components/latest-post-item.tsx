import Link from "next/link"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Clock } from "lucide-react"

type Post = {
  id: string
  title: string
  content: string
  created_at: string
  comments_count?: number | null
  likes_count?: number | null
  profiles?: {
    full_name?: string | null
    avatar_url?: string | null
  } | null
  board_categories?: {
    name: string
    slug: string
  } | null
}

interface LatestPostItemProps {
  post: Post
}

export function LatestPostItem({ post }: LatestPostItemProps) {
  const boardSlug = post.board_categories?.slug || "free-board"
  const boardName = post.board_categories?.name || "자유게시판"

  return (
    <Link
      href={`/community/board/${boardSlug}/${post.id}`}
      className="block"
    >
      <div className="rounded-lg border border-slate-200 p-4 transition-colors hover:bg-slate-50 hover:border-slate-300">
        <div className="flex items-start gap-3">
          <Avatar className="h-10 w-10 shrink-0">
            <AvatarImage src={post.profiles?.avatar_url || undefined} />
            <AvatarFallback>
              {post.profiles?.full_name?.[0] || "U"}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="outline" className="text-xs">
                {boardName}
              </Badge>
              <span className="text-sm font-medium text-slate-900">
                {post.profiles?.full_name || "Unknown"}
              </span>
            </div>
            <h3 className="mb-1 font-semibold text-slate-900 line-clamp-1">
              {post.title}
            </h3>
            <p className="mb-2 text-sm text-slate-600 line-clamp-2">
              {post.content}
            </p>
            <div className="flex items-center gap-4 text-xs text-slate-500">
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {new Date(post.created_at).toLocaleDateString("ko-KR")}
              </span>
              {post.comments_count !== null && post.comments_count !== undefined && (
                <span>{post.comments_count} 댓글</span>
              )}
              {post.likes_count !== null && post.likes_count !== undefined && (
                <span>{post.likes_count} 좋아요</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}




