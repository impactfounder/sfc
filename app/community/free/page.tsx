import Link from "next/link"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty"
import { PostListItem } from "@/components/ui/post-list-item"
import { createClient } from "@/lib/supabase/server"

const FREE_BOARD_SLUG = "free-board"

export default async function FreeBoardPage() {
  const supabase = await createClient()

  const [{ data: posts }, { data: category }, { data: { user } }] = await Promise.all([
    supabase
      .from("posts")
      .select(
        `
        id,
        title,
        content,
        created_at,
        board_categories!inner(name, slug),
        profiles:author_id(full_name)
      `,
      )
      .eq("board_categories.slug", FREE_BOARD_SLUG)
      .order("created_at", { ascending: false }),
    supabase
      .from("board_categories")
      .select("*")
      .eq("slug", FREE_BOARD_SLUG)
      .eq("is_active", true)
      .single(),
    supabase.auth.getUser(),
  ])

  const pageTitle = category?.name || "자유게시판"
  const pageDescription =
    category?.description || "자유롭게 의견을 나누고 정보를 공유하는 공간입니다."

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-5xl px-4 py-10 md:px-8">
        <div className="mb-10 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">Community</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">{pageTitle}</h1>
            <p className="mt-2 text-base text-slate-600">{pageDescription}</p>
          </div>
          <div className="flex flex-col gap-2 text-sm text-slate-500">
            <Button asChild size="lg">
              <Link href="/community/free/write">글쓰기</Link>
            </Button>
            {!user && (
              <p className="text-center text-xs text-slate-500">
                글쓰기는 로그인이 필요합니다.
              </p>
            )}
          </div>
        </div>

        {posts && posts.length > 0 ? (
          <div className="space-y-4">
            {posts.map((post) => {
              const subtitle = post.content
                ? `${post.content.replace(/\s+/g, " ").trim().slice(0, 80)}${
                    post.content.length > 80 ? "…" : ""
                  }`
                : undefined

              return (
                <PostListItem
                  key={post.id}
                  post={post}
                  href={`/community/board/${FREE_BOARD_SLUG}/${post.id}`}
                  subtitle={subtitle}
                />
              )
            })}
          </div>
        ) : (
          <Card className="border-0 bg-transparent shadow-none">
            <Empty>
              <EmptyHeader>
                <EmptyTitle>아직 게시글이 없어요</EmptyTitle>
                <EmptyDescription>첫 번째 글을 작성해 커뮤니티를 시작해보세요.</EmptyDescription>
              </EmptyHeader>
              <EmptyContent>
                <Button asChild>
                  <Link href="/community/free/write">글쓰기</Link>
                </Button>
              </EmptyContent>
            </Empty>
          </Card>
        )}
      </div>
    </div>
  )
}



