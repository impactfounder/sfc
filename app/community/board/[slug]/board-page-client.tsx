"use client"

import { useSearchParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { PostsSection } from "@/components/home/posts-section"
import Link from "next/link"
import { Plus } from 'lucide-react'
import { usePosts } from "@/lib/hooks/usePosts"
import { Skeleton } from "@/components/ui/skeleton"
import { StandardRightSidebar } from "@/components/standard-right-sidebar"
import { PageHeader } from "@/components/page-header"

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
      <div className="max-w-[1600px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10 px-4 lg:px-8 pt-8 pb-20">
        <div className="lg:col-span-9">
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
    <div className="max-w-[1600px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10 px-4 lg:px-8 pt-8 pb-20">
      {/* [LEFT] 중앙 콘텐츠 영역 (9칸) */}
      <div className="lg:col-span-9 flex flex-col gap-10 min-w-0">
        {/* PageHeader 적용 */}
        <PageHeader
          title={category.name}
          description={category.description || undefined}
        >
          {(slug !== "announcements" || isUserAdmin) && (
            <>
              {user ? (
                <Link href={`/community/board/${slug}/new`}>
                  <Button className="bg-white text-slate-900 hover:bg-slate-100 transition-all font-bold border-0 shadow-sm">
                    <Plus className="h-4 w-4 mr-2" />
                    글쓰기
                  </Button>
                </Link>
              ) : (
                <Link href="/auth/login">
                  <Button className="bg-white text-slate-900 hover:bg-slate-100 transition-all font-bold border-0 shadow-sm">
                    <Plus className="h-4 w-4 mr-2" />
                    글 작성하기
                  </Button>
                </Link>
              )}
            </>
          )}
        </PageHeader>
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
              selectedBoard={dbSlug}
              hideTabs={true}
              isLoading={isLoading}
              isInsight={slug === "insights"}
              viewMode={slug === "insights" ? "blog" : undefined}
            />
          )}
        </div>

        {/* [RIGHT] 우측 사이드바 영역 (3칸) */}
        <div className="hidden lg:flex lg:col-span-3 flex-col gap-6">
          <div className="sticky top-8 flex flex-col gap-6 h-fit">
            <StandardRightSidebar />
          </div>
        </div>
    </div>
  )
}

