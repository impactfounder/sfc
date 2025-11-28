"use client"

import { useSearchParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { PostsSection } from "@/components/home/posts-section"
import Link from "next/link"
import { Plus } from 'lucide-react'
import { usePosts } from "@/lib/hooks/usePosts"
import { Skeleton } from "@/components/ui/skeleton"
import { StandardRightSidebar } from "@/components/standard-right-sidebar"
import { CommunityRightSidebar } from "@/components/community-right-sidebar"
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

  // 시스템 게시판 목록 (기존 사이드바 사용)
  const systemBoards = ['announcement', 'announcements', 'free', 'free-board', 'event-requests', 'insights', 'reviews']
  const isSystemBoard = systemBoards.includes(dbSlug)

  // 게시글 데이터에 isMember 추가 (PostsSection 형식에 맞춤)
  const postsWithMembership = posts.map((post: any) => ({
    ...post,
    isMember: true, // 개별 게시판에서는 항상 true (나중에 멤버십 체크 추가 가능)
  }))

  if (isError) {
    return (
      <div className="w-full flex flex-col lg:flex-row gap-10">
        <div className="flex-1 min-w-0">
          <div className="text-center py-16">
            <h2 className="text-xl font-semibold text-slate-900 mb-2">데이터를 불러오는데 실패했습니다</h2>
            <p className="text-slate-500 mb-4">잠시 후 다시 시도해주세요.</p>
            <Button onClick={() => router.refresh()}>다시 시도</Button>
          </div>
        </div>
      </div>
    )
  }

  // 인사이트 게시판의 경우 description 오버라이드
  const displayDescription = slug === "insights" 
    ? "성장에 필요한 인사이트 있는 칼럼과 팁을 공유합니다"
    : (category.description || undefined)

  return (
    <div className="w-full flex flex-col lg:flex-row gap-10">
      {/* [LEFT] 중앙 콘텐츠 영역 */}
      <div className="flex-1 min-w-0 flex flex-col gap-10">
        {/* PageHeader 적용 */}
        <PageHeader
          title={category.name}
          description={displayDescription}
        />
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
              viewMode={
                slug === "insights" 
                  ? "blog" 
                  : (slug === "free" || dbSlug === "free-board") 
                    ? "feed" 
                    : undefined
              }
            />
          )}
        </div>

        {/* [RIGHT] 우측 사이드바 영역 */}
        <div className="hidden lg:flex w-72 shrink-0 flex-col gap-6">
          <div className="sticky top-8 flex flex-col gap-6 h-fit">
            {isSystemBoard ? (
              <StandardRightSidebar />
            ) : (
              <CommunityRightSidebar slug={dbSlug} />
            )}
          </div>
        </div>
    </div>
  )
}

