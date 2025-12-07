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

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 space-y-3">
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
                author={{ name: post.profiles?.full_name ?? "익명" }}
                createdAt={post.created_at}
                title={post.title}
                content={post.content ?? undefined}
                contentRaw={(post as any).content ?? undefined}
                thumbnailUrl={post.thumbnail_url ?? undefined}
                likesCount={post.likes_count ?? 0}
                commentsCount={post.comments_count ?? 0}
                userId={undefined}
                initialLiked={false}
              />
            ))
          )}
        </div>

        <aside className="lg:col-span-4 space-y-3">
          <Card className="border-slate-200">
            <CardContent className="p-4 space-y-2">
              <h3 className="text-sm font-semibold text-slate-900">공지사항</h3>
              <p className="text-sm text-slate-500">새로운 공지사항이 곧 업데이트됩니다.</p>
              <Button asChild size="sm" variant="outline">
                <Link href="/notice">공지 보기</Link>
              </Button>
            </CardContent>
          </Card>
          <Card className="border-slate-200">
            <CardContent className="p-4 space-y-2">
              <h3 className="text-sm font-semibold text-slate-900">인기 태그</h3>
              <div className="flex flex-wrap gap-2 text-xs text-slate-600">
                {["스타트업", "투자", "네트워킹", "이벤트"].map((tag) => (
                  <span key={tag} className="px-2 py-1 rounded-full bg-slate-100 border border-slate-200">
                    #{tag}
                  </span>
                ))}
              </div>
            </CardContent>
          </Card>
        </aside>
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

