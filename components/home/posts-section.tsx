"use client"

import { useMemo } from "react"
import { PostListItem } from "@/components/ui/post-list-item"
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty"
import { Button } from "@/components/ui/button"
import { FilterButtons } from "./filter-buttons"
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
  selectedBoard: string
  onBoardChange: (slug: string) => void
}

export function PostsSection({
  posts,
  boardCategories,
  selectedBoard,
  onBoardChange,
}: PostsSectionProps) {
  const filteredPosts = useMemo(() => {
    if (selectedBoard === "all") {
      return posts
    }
    return posts.filter((post) => post.board_categories?.slug === selectedBoard)
  }, [posts, selectedBoard])

  return (
    <div className="space-y-4">
      {/* Filter Buttons */}
      <FilterButtons
        categories={boardCategories}
        selectedSlug={selectedBoard}
        onSelect={onBoardChange}
      />

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

