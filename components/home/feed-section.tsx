"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useInfiniteQuery } from "@tanstack/react-query"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FeedPostCard } from "@/components/ui/feed-post-card"
import { fetchFeedPosts } from "@/lib/actions/feed"
import type { PostForDisplay } from "@/lib/types/posts"

type SortOption = "latest" | "popular"

type FeedSectionProps = {
  initialPosts: PostForDisplay[]
}

export function FeedSection({ initialPosts }: FeedSectionProps) {
  const PAGE_SIZE = 10
  const [sort, setSort] = useState<SortOption>("latest")
  const loadMoreRef = useRef<HTMLDivElement | null>(null)

  const initialData = useMemo(() => {
    return {
      pages: [initialPosts],
      pageParams: [1],
    }
  }, [initialPosts])

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    refetch,
  } = useInfiniteQuery<PostForDisplay[]>({
    queryKey: ["feed", sort],
    queryFn: async ({ pageParam = 1 }) => fetchFeedPosts(pageParam as number, sort),
    getNextPageParam: (lastPage, pages) => (lastPage.length < PAGE_SIZE ? undefined : pages.length + 1),
    initialData,
    initialPageParam: 1,
    refetchOnWindowFocus: false,
  })

  useEffect(() => {
    const node = loadMoreRef.current
    if (!node) return
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage()
        }
      },
      { rootMargin: "200px" }
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [fetchNextPage, hasNextPage, isFetchingNextPage])

  const posts = data?.pages.flat() ?? []

  return (
    <section className="space-y-4">
      <Tabs value={sort} onValueChange={(v) => setSort(v as SortOption)} className="w-full">
        <TabsList>
          <TabsTrigger value="latest">최신</TabsTrigger>
          <TabsTrigger value="popular">인기</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="flex flex-col gap-4">
        {isLoading && posts.length === 0 ? (
          [...Array(3)].map((_, i) => (
            <div key={i} className="h-32 rounded-lg border border-slate-200 bg-white" />
          ))
        ) : (
          posts.map((post) => (
            <FeedPostCard
              key={post.id}
              postId={post.id}
              href={`/community/board/${post.board_categories?.slug ?? "community"}/${post.id}`}
              source={{
                name: post.board_categories?.name ?? "커뮤니티",
                href: `/community/board/${post.board_categories?.slug ?? "community"}`,
              }}
              createdAt={post.created_at}
              title={post.title}
              content={post.content ?? undefined}
              contentRaw={(post as any).content ?? undefined}
              thumbnailUrl={post.thumbnail_url ?? undefined}
              commentsCount={post.comments_count ?? 0}
            />
          ))
        )}
      </div>

      <div ref={loadMoreRef} className="h-10" aria-hidden />
      {isFetchingNextPage && <div className="text-xs text-slate-500">불러오는 중...</div>}
    </section>
  )
}

