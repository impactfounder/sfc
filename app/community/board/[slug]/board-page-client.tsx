"use client"

import { useSearchParams, useRouter } from "next/navigation"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { PostCard } from "@/components/ui/post-card"
import Link from "next/link"
import { Plus, Pencil, UserPlus, UserCheck, LayoutGrid, List } from 'lucide-react'
import { usePosts } from "@/lib/hooks/usePosts"
import { Skeleton } from "@/components/ui/skeleton"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { NewPostForm } from "@/components/new-post-form"
import { CommunityBanner } from "@/components/community-banner"
import { joinCommunity, leaveCommunity } from "@/lib/actions/community"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"

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
  communityId: string | null
  isMember: boolean
  canEditDescription: boolean
  initialPosts?: any[]
  initialPostsCount?: number
}

export function BoardPageClient({
  slug,
  dbSlug,
  category,
  isUserAdmin,
  user,
  communityId,
  isMember: initialIsMember,
  canEditDescription,
  initialPosts = [],
  initialPostsCount = 0
}: BoardPageClientProps) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { toast } = useToast()
  const currentPage = Number(searchParams.get("page")) || 1
  const [isWriteModalOpen, setIsWriteModalOpen] = useState(false)
  const [isMember, setIsMember] = useState(initialIsMember)
  const [isJoining, setIsJoining] = useState(false)

  // 뷰 모드 상태 (기본값: 공지사항은 list, 자유게시판과 나머지는 feed)
  const defaultViewMode = (slug === "announcement" || slug === "announcements") ? "list" : "feed"
  const [viewMode, setViewMode] = useState<"feed" | "list">(defaultViewMode)

  // 서버에서 전달받은 초기 데이터가 있으면 사용, 없거나 페이지 변경 시 클라이언트에서 fetch
  const { data, isLoading, isError } = usePosts(dbSlug, currentPage)

  // 1페이지이고 서버 초기 데이터가 있으면 사용, 그 외에는 클라이언트 데이터 사용
  const posts = (currentPage === 1 && initialPosts.length > 0 && !data)
    ? initialPosts
    : (data?.posts || initialPosts)
  const totalPosts = (currentPage === 1 && initialPostsCount > 0 && !data)
    ? initialPostsCount
    : (data?.count || initialPostsCount)

  // 시스템 게시판 목록 (기존 사이드바 사용)
  const systemBoards = ['announcement', 'announcements', 'free', 'free-board', 'event-requests', 'insights', 'reviews']
  const isSystemBoard = systemBoards.includes(dbSlug)

  // 커뮤니티 가입 핸들러
  const handleJoin = async () => {
    if (!user) {
      toast({
        variant: "destructive",
        title: "로그인 필요",
        description: "커뮤니티에 참여하려면 로그인이 필요합니다.",
      })
      router.push("/auth/login")
      return
    }

    if (!communityId) {
      toast({
        variant: "destructive",
        title: "오류",
        description: "커뮤니티 정보를 찾을 수 없습니다.",
      })
      return
    }

    setIsJoining(true)
    try {
      await joinCommunity(communityId)
      setIsMember(true)
      toast({
        title: "참여 완료",
        description: "커뮤니티에 참여했습니다.",
      })
      router.refresh()
    } catch (error) {
      console.error("커뮤니티 가입 오류:", error)
      toast({
        variant: "destructive",
        title: "참여 실패",
        description: error instanceof Error ? error.message : "커뮤니티 참여에 실패했습니다.",
      })
    } finally {
      setIsJoining(false)
    }
  }

  // 커뮤니티 탈퇴 핸들러
  const handleLeave = async () => {
    if (!communityId) return

    if (!confirm("정말 이 커뮤니티에서 탈퇴하시겠습니까?")) {
      return
    }

    setIsJoining(true)
    try {
      await leaveCommunity(communityId)
      setIsMember(false)
      toast({
        title: "탈퇴 완료",
        description: "커뮤니티에서 탈퇴했습니다.",
      })
      router.refresh()
    } catch (error) {
      console.error("커뮤니티 탈퇴 오류:", error)
      toast({
        variant: "destructive",
        title: "탈퇴 실패",
        description: error instanceof Error ? error.message : "커뮤니티 탈퇴에 실패했습니다.",
      })
    } finally {
      setIsJoining(false)
    }
  }

  // 공지사항 여부 확인
  const isAnnouncement = dbSlug === 'announcement' || slug === 'announcements'

  // 게시글 데이터에 isMember 추가 (PostsSection 형식에 맞춤)
  const postsWithMembership = posts.map((post: any) => ({
    ...post,
    isMember: true, // 개별 게시판에서는 항상 true (나중에 멤버십 체크 추가 가능)
  }))

  if (isError) {
    return (
      <div className="w-full flex flex-col gap-6">
        <div className="text-center py-16">
          <h2 className="text-xl font-semibold text-slate-900 mb-2">데이터를 불러오는데 실패했습니다</h2>
          <p className="text-slate-500 mb-4">잠시 후 다시 시도해주세요.</p>
          <Button onClick={() => router.refresh()}>다시 시도</Button>
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
      return { title: "인사이트", description: "비즈니스 인사이트를 공유합니다.", canEdit: false }
    } else if (isAnnouncement) {
      return { title: "공지사항", description: "SFC의 새로운 소식을 알려드립니다.", canEdit: false }
    } else if (slug === "free" || dbSlug === "free-board") {
      return { title: "자유게시판", description: "자유롭게 이야기를 나누세요.", canEdit: false }
    } else {
      return { title: category.name, description: category.description || undefined, canEdit: true }
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
    <div className="w-full flex flex-col gap-8">
      <div className="flex flex-col gap-6">
        <CommunityBanner
          title={bannerConfig.title}
          description={bannerConfig.description}
          communityId={communityId}
          canEdit={bannerConfig.canEdit && canEditDescription}
          slug={dbSlug}
        />

        <div className="flex items-center justify-between bg-white p-2 rounded-lg border border-slate-200 shadow-sm">
          {slug !== "insights" ? (
            <div className="inline-flex items-center p-1 bg-slate-100/80 rounded-xl">
              <button
                onClick={() => setViewMode("feed")}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200",
                  viewMode === "feed"
                    ? "bg-white text-slate-900 shadow-sm font-bold"
                    : "text-slate-500 hover:text-slate-700"
                )}
              >
                <LayoutGrid className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">피드형</span>
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200",
                  viewMode === "list"
                    ? "bg-white text-slate-900 shadow-sm font-bold"
                    : "text-slate-500 hover:text-slate-700"
                )}
              >
                <List className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">리스트형</span>
              </button>
            </div>
          ) : (
            <div></div>
          )}
          
          <div className="flex items-center gap-2">
            {!isSystemBoard && communityId && (
              <>
                {!isMember ? (
                  <Button
                    onClick={handleJoin}
                    disabled={isJoining || !user}
                    className="rounded-full bg-white border border-gray-200 hover:bg-gray-50 hover:border-gray-300 transition-all text-gray-900 text-sm font-semibold shadow-sm px-4 py-2 h-10 inline-flex items-center gap-2"
                  >
                    <UserPlus className="w-4 h-4" />
                    {isJoining ? "처리 중..." : "참여하기"}
                  </Button>
                ) : (
                  <Button
                    onClick={handleLeave}
                    disabled={isJoining}
                    className="rounded-full bg-white border border-gray-200 hover:bg-gray-50 hover:border-gray-300 transition-all text-gray-700 text-sm font-semibold shadow-sm px-4 py-2 h-10 inline-flex items-center gap-2"
                  >
                    <UserCheck className="w-4 h-4" />
                    참여 중
                  </Button>
                )}
              </>
            )}

            {(isSystemBoard || isMember) && shouldShowButton && (
              <Button
                onClick={buttonConfig.onClick}
                className="bg-white border border-gray-200 shadow-sm hover:bg-gray-50 text-black rounded-full px-4 h-10 inline-flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                {buttonConfig.text}
              </Button>
            )}
          </div>
        </div>

        <Dialog open={isWriteModalOpen} onOpenChange={setIsWriteModalOpen}>
          <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {slug === "insights"
                  ? "인사이트 작성"
                  : isAnnouncement
                    ? "공지사항 작성"
                    : "글 작성"}
              </DialogTitle>
            </DialogHeader>
            <div className="mt-4">
              <NewPostForm
                slug={slug}
                boardCategoryId={category.id}
                onSuccess={() => setIsWriteModalOpen(false)}
              />
            </div>
          </DialogContent>
        </Dialog>

        <div className="flex flex-col gap-4">
          {/* 서버에서 초기 데이터가 있으면 로딩 상태 건너뛰기 */}
          {(isLoading && posts.length === 0) ? (
            [1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="w-full h-24 rounded-xl border border-gray-200 p-4">
                <Skeleton className="h-4 w-3/4 mb-2" />
                <Skeleton className="h-3 w-1/4" />
              </div>
            ))
          ) : posts.length === 0 ? (
            <div className="text-center py-16 text-slate-500">
              아직 게시글이 없습니다. 첫 번째 글을 작성해보세요!
            </div>
          ) : (
            postsWithMembership.map((post) => (
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
                likesCount={post.likes_count ?? 0}
                commentsCount={post.comments_count ?? 0}
                userId={user?.id}
                initialLiked={false}
                hideCategory={true}
              />
            ))
          )}
        </div>

        {isAnnouncement && (
          <div className="text-sm text-slate-500">
            공지사항은 관리자가 작성한 글만 표시됩니다.
          </div>
        )}
      </div>
    </div>
  )
}

