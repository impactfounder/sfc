"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BoardFilterButtons, type BoardFilter } from "./board-filter-buttons"
import { LatestPostItem } from "./latest-post-item"
import { MessageSquare } from "lucide-react"

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

interface LatestPostsSectionProps {
  posts: Post[]
}

export function LatestPostsSection({ posts }: LatestPostsSectionProps) {
  const [activeFilter, setActiveFilter] = useState<BoardFilter>("all")

  const filteredPosts = useMemo(() => {
    if (activeFilter === "all") {
      return posts
    }

    if (activeFilter === "other") {
      return posts.filter(
        (post) =>
          post.board_categories?.slug !== "bangol" &&
          post.board_categories?.slug !== "hightalk" &&
          post.board_categories?.slug !== "free-board" &&
          post.board_categories?.slug !== "announcement"
      )
    }

    return posts.filter(
      (post) => post.board_categories?.slug === activeFilter
    )
  }, [posts, activeFilter])

  return (
    <Card className="border-slate-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          최신 글
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <BoardFilterButtons
          activeFilter={activeFilter}
          onFilterChange={setActiveFilter}
        />
        <div className="space-y-3">
          {filteredPosts && filteredPosts.length > 0 ? (
            filteredPosts.map((post) => (
              <LatestPostItem key={post.id} post={post} />
            ))
          ) : (
            <p className="py-8 text-center text-slate-500">
              {activeFilter === "all"
                ? "아직 게시물이 없습니다"
                : "해당 게시판에 게시물이 없습니다"}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}




