"use client"

import { useSearchParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { PostsSection } from "@/components/home/posts-section"
import Link from "next/link"
import { Plus } from 'lucide-react'
import { usePosts } from "@/lib/hooks/usePosts"
import { Skeleton } from "@/components/ui/skeleton"
import { StandardRightSidebar } from "@/components/standard-right-sidebar"

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
          {/* 커뮤니티 헤더 (강조된 스타일) */}
          <div className="relative rounded-2xl overflow-hidden bg-gradient-to-r from-slate-900 to-slate-800 text-white">
            <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?q=80&w=2613&auto=format&fit=crop')] bg-cover bg-center opacity-10" />
            <div className="relative z-10 px-6 py-8 md:py-12">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                  <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-2">{category.name}</h1>
                  {category.description && (
                    <p className="text-slate-300 text-base md:text-lg max-w-2xl">{category.description}</p>
                  )}
                </div>
                {(slug !== "announcements" || isUserAdmin) && (
                  <div>
                    {user ? (
                      <Link href={`/community/board/${slug}/new`}>
                        <Button className="gap-2 bg-white text-slate-900 hover:bg-slate-100 transition-all active:scale-[0.98] hover:shadow-lg">
                          <Plus className="h-4 w-4" />
                          글쓰기
                        </Button>
                      </Link>
                    ) : (
                      <Link href="/auth/login">
                        <Button variant="outline" className="gap-2 border-white/20 bg-white/10 text-white hover:bg-white/20 transition-all active:scale-[0.98] hover:shadow-lg">
                          <Plus className="h-4 w-4" />
                          로그인하고 글쓰기
                        </Button>
                      </Link>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
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

