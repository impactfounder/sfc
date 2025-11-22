"use client"

import { useState, useMemo } from "react"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { PostListItem } from "@/components/ui/post-list-item"
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty"
import { Button } from "@/components/ui/button"
import Link from "next/link"

type Post = {
  id: string
  title: string
  created_at: string
  board_categories?: {
    name?: string | null
    slug?: string | null
  } | null
  profiles?: {
    full_name?: string | null
  } | null
}

type BoardCategory = {
  id: string
  name: string
  slug: string
}

interface PostsSectionProps {
  posts: Post[]
  boardCategories: BoardCategory[]
}

export function PostsSection({ posts, boardCategories }: PostsSectionProps) {
  const [selectedBoard, setSelectedBoard] = useState<string>("all")

  const filteredPosts = useMemo(() => {
    if (selectedBoard === "all") {
      return posts
    }
    return posts.filter(
      (post) => post.board_categories?.slug === selectedBoard
    )
  }, [posts, selectedBoard])

  return (
    <div className="space-y-4">
      {/* Filter Buttons */}
      <div className="overflow-x-auto">
        <ToggleGroup
          type="single"
          value={selectedBoard}
          onValueChange={(value) => setSelectedBoard(value || "all")}
          className="flex w-fit gap-0"
          variant="outline"
        >
          <ToggleGroupItem value="all" aria-label="전체">
            전체
          </ToggleGroupItem>
          {boardCategories.map((category) => (
            <ToggleGroupItem
              key={category.id}
              value={category.slug}
              aria-label={category.name}
            >
              {category.name}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>

      {/* Posts List */}
      <div className="space-y-3">
        {filteredPosts.length > 0 ? (
          filteredPosts.map((post) => {
            const boardSlug = post.board_categories?.slug || "free-board"
            return (
              <PostListItem
                key={post.id}
                post={post}
                href={`/community/board/${boardSlug}/${post.id}`}
              />
            )
          })
        ) : (
          <Empty className="bg-white/60">
            <EmptyHeader>
              <EmptyTitle>게시글이 없습니다</EmptyTitle>
              <EmptyDescription>첫 글을 작성해 커뮤니티를 시작해보세요.</EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Button asChild variant="outline">
                <Link href="/community/posts/new">글 작성하기</Link>
              </Button>
            </EmptyContent>
          </Empty>
        )}
      </div>
    </div>
  )
}

