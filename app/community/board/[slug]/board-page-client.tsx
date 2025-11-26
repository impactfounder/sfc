"use client"

import { useSearchParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { PostsSection } from "@/components/home/posts-section"
import Link from "next/link"
import { Plus } from 'lucide-react'
import { usePosts } from "@/lib/hooks/usePosts"
import { Skeleton } from "@/components/ui/skeleton"

interface BoardPageClientProps {
  slug: string
  dbSlug: string
  category: {
    id: string
    name: string
    description?: string | null
  }
  isUserAdmin: boolean
  user: any
}

export function BoardPageClient({
  slug,
  dbSlug,
  category,
  isUserAdmin,
  user
}: BoardPageClientProps) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const currentPage = Number(searchParams.get("page")) || 1

  // ★ 수정: 커스텀 훅 사용
  const { data, isLoading, isError } = usePosts(dbSlug, currentPage)

  const posts = data?.posts || []
  const totalPosts = data?.count || 0

  // 게시글 데이터에 isMember 추가 (PostsSection 형식에 맞춤)
  const postsWithMembership = posts.map((post: any) => ({
    ...post,
    isMember: true, // 개별 게시판에서는 항상 true (나중에 멤버십 체크 추가 가능)
  }))

  if (isError) {
    return (
      <div className="min-h-screen bg-white">
        <div className="mx-auto max-w-3xl px-4 py-8 md:px-8">
          <div className="text-center py-16">
            <h2 className="text-xl font-semibold text-slate-900 mb-2">데이터를 불러오는데 실패했습니다</h2>
            <p className="text-slate-500 mb-4">잠시 후 다시 시도해주세요.</p>
            <Button onClick={() => router.refresh()}>다시 시도</Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto max-w-3xl px-4 py-8 md:px-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">{category.name}</h1>
            {category.description && (
              <p className="mt-1.5 text-sm text-slate-600">{category.description}</p>
            )}
          </div>
          {(slug !== "announcements" || isUserAdmin) && (
            <div>
              {user ? (
                <Link href={`/community/board/${slug}/new`}>
                  <Button className="gap-2 transition-all active:scale-[0.98] hover:shadow-lg">
                    <Plus className="h-4 w-4" />
                    글쓰기
                  </Button>
                </Link>
              ) : (
                <Link href="/auth/login">
                  <Button variant="outline" className="gap-2 transition-all active:scale-[0.98] hover:shadow-lg">
                    <Plus className="h-4 w-4" />
                    로그인하고 글쓰기
                  </Button>
                </Link>
              )}
            </div>
          )}
        </div>

        {/* Posts Section - 투명 배경으로 통일 */}
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="w-full h-24 rounded-xl border border-gray-200 p-4">
                <Skeleton className="h-4 w-3/4 mb-2" />
                <Skeleton className="h-3 w-1/4" />
              </div>
            ))}
          </div>
        ) : (
          <PostsSection
            posts={postsWithMembership}
            boardCategories={[]}
            hideTabs={true}
            isLoading={isLoading}
          />
        )}
      </div>
    </div>
  )
}

