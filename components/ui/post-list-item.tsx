import Link from "next/link"
import type { FC } from "react"

import { cn } from "@/lib/utils"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

type Post = {
  id: string
  title: string
  created_at: string
  board_categories?: {
    name?: string | null
  } | null
  profiles?: {
    full_name?: string | null
  } | null
}

type PostListItemProps = {
  post: Post
  href: string
  className?: string
  subtitle?: string
}

export const PostListItem: FC<PostListItemProps> = ({ post, href, className, subtitle }) => {
  return (
    <Link href={href} className={cn("block", className)}>
      <Card className="gap-0 rounded-2xl border bg-white p-0 shadow-xs transition hover:border-primary/40 hover:shadow-sm">
        <CardHeader className="px-5 py-4">
          <CardDescription className="text-xs font-medium uppercase tracking-wide text-blue-600">
            {post.board_categories?.name}
          </CardDescription>
          <CardTitle className="text-lg">{post.title}</CardTitle>
          {subtitle && <CardDescription>{subtitle}</CardDescription>}
        </CardHeader>
        <CardContent className="px-5 pb-4 text-sm text-muted-foreground">
          {post.profiles?.full_name || "익명"} · {new Date(post.created_at).toLocaleDateString("ko-KR")}
        </CardContent>
      </Card>
    </Link>
  )
}


