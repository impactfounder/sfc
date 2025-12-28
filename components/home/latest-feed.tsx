"use client"

import Link from "next/link"
import { PostCard } from "@/components/ui/post-card"
import type { PostForDisplay } from "@/lib/types/posts"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

type LatestFeedProps = {
  posts: PostForDisplay[]
}

export function LatestFeed({ posts }: LatestFeedProps) {
  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg sm:text-xl font-bold text-slate-900">💬 최신 이야기</h2>
        <Link href="/community" className="text-sm font-medium text-indigo-600 hover:text-indigo-700">
          더 보기
        </Link>
      </div>

      <div className="w-full space-y-3">
        {posts.length === 0 ? (
          <EmptyState />
        ) : (
          posts.map((post) => (
            <PostCard
              key={post.id}
              postId={post.id}
              href={`/community/board/${post.board_categories?.slug ?? "community"}/${post.id}`}
              community={{
                name: post.board_categories?.name ?? "커뮤니티",
                href: `/community/board/${post.board_categories?.slug ?? "community"}`,
                iconUrl: post.thumbnail_url ?? undefined,
              }}
              author={{ name: post.profiles?.full_name ?? "익명", avatarUrl: post.profiles?.avatar_url }}
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
    </section>
  )
}

function EmptyState() {
  return (
    <Card className="border-dashed border-slate-200">
      <CardContent className="p-6 text-center space-y-3">
        <p className="text-sm text-slate-500">아직 게시글이 없습니다. 첫 글을 작성해보세요!</p>
        <Button asChild size="sm">
          <Link href="/community/posts/new">글쓰기</Link>
        </Button>
      </CardContent>
    </Card>
  )
}

