"use client"

import { useSearchParams, useRouter } from "next/navigation"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { PostsSection } from "@/components/home/posts-section"
import Link from "next/link"
import { Plus, Pencil } from 'lucide-react'
import { usePosts } from "@/lib/hooks/usePosts"
import { Skeleton } from "@/components/ui/skeleton"
import { StandardRightSidebar } from "@/components/standard-right-sidebar"
import { CommunityRightSidebar } from "@/components/community-right-sidebar"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { NewPostForm } from "@/components/new-post-form"
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
  const [isWriteModalOpen, setIsWriteModalOpen] = useState(false)

  // ★ 수정: 커스텀 훅 사용
  const { data, isLoading, isError } = usePosts(dbSlug, currentPage)

  const posts = data?.posts || []
  const totalPosts = data?.count || 0

  // 시스템 게시판 목록 (기존 사이드바 사용)
  const systemBoards = ['announcement', 'announcements', 'free', 'free-board', 'event-requests', 'insights', 'reviews']
  const isSystemBoard = systemBoards.includes(dbSlug)

  // 공지사항 여부 확인
  const isAnnouncement = dbSlug === 'announcement' || slug === 'announcements'

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

  // 버튼 텍스트 및 기능 결정
  const getButtonConfig = () => {
    if (slug === "insights") {
      return { text: "새 인사이트", onClick: () => setIsWriteModalOpen(true) }
    } else if (isAnnouncement) {
      return { text: "새 공지사항", onClick: () => setIsWriteModalOpen(true), showOnlyIfAdmin: true }
    } else if (slug === "free" || dbSlug === "free-board") {
      return { text: "새 글 작성", onClick: () => setIsWriteModalOpen(true) }
    } else {
      return { text: "새 글 작성", onClick: () => setIsWriteModalOpen(true) }
    }
  }

  const buttonConfig = getButtonConfig()
  const shouldShowButton = !buttonConfig.showOnlyIfAdmin || (buttonConfig.showOnlyIfAdmin && isUserAdmin)

  // 배너 타이틀 및 설명 결정
  const getBannerConfig = () => {
    if (slug === "insights") {
      return { title: "인사이트", description: "비즈니스 인사이트를 공유합니다." }
    } else if (isAnnouncement) {
      return { title: "공지사항", description: "SFC의 새로운 소식을 알려드립니다." }
    } else if (slug === "free" || dbSlug === "free-board") {
      return { title: "자유게시판", description: "자유롭게 이야기를 나누세요." }
    } else {
      return { title: category.name, description: category.description || undefined }
    }
  }

  // 섹션 타이틀 결정
  const getSectionTitle = () => {
    if (slug === "insights") {
      return "전체 인사이트"
    } else if (isAnnouncement) {
      return "공지사항"
    } else if (slug === "free" || dbSlug === "free-board") {
      return "자유게시판"
    } else {
      return category.name
    }
  }

  const bannerConfig = getBannerConfig()

  return (
    <>
      {/* 배너 (최상단, full width) */}
      <PageHeader
        title={bannerConfig.title}
        description={bannerConfig.description}
        className="w-full"
      />

      <div className="w-full flex flex-col lg:flex-row gap-10">
        {/* [LEFT] 중앙 콘텐츠 영역 */}
        <div className="flex-1 min-w-0 flex flex-col gap-10">
          {/* 배너 아래 헤더 영역 */}
          <div className="mt-8 mb-6 flex justify-between items-center">
            <h2 className="text-xl font-bold text-slate-900">{getSectionTitle()}</h2>
          {shouldShowButton && (
            <Button
              onClick={buttonConfig.onClick}
              className="bg-white border border-gray-200 shadow-sm hover:bg-gray-50 text-black rounded-full px-4 h-10 inline-flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              {buttonConfig.text}
            </Button>
          )}
        </div>

        {/* 글쓰기 모달 (모든 게시판 공통) */}
        <Dialog open={isWriteModalOpen} onOpenChange={setIsWriteModalOpen}>
          <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {slug === "insights" ? "인사이트 작성" : 
                 isAnnouncement ? "공지사항 작성" : 
                 "글 작성"}
              </DialogTitle>
            </DialogHeader>
            <div className="mt-4">
              <NewPostForm 
                slug={slug}
                boardCategoryId={category.id}
                onSuccess={() => setIsWriteModalOpen(false)}
                onCancel={() => setIsWriteModalOpen(false)}
              />
            </div>
          </DialogContent>
        </Dialog>

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
    </>
  )
}

