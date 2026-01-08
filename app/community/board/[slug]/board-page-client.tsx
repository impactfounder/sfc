"use client"

import { useSearchParams, useRouter } from "next/navigation"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { FeedPostCard } from "@/components/ui/feed-post-card"
import { Plus, UserPlus, UserCheck } from 'lucide-react'
import { usePosts } from "@/lib/hooks/usePosts"
import { Skeleton } from "@/components/ui/skeleton"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { NewPostForm } from "@/components/new-post-form"
import { CommunityBanner } from "@/components/community-banner"
import { CommunityMobileBar } from "@/components/community/community-mobile-bar"
import { CommunityHeader } from "@/components/community/community-header"
import { joinCommunity, leaveCommunity } from "@/lib/actions/community"
import { useToast } from "@/hooks/use-toast"

interface CommunityDataForMobile {
  id: string
  name: string
  description: string | null
  rules: string | null
  thumbnail_url: string | null
  banner_url?: string | null
  is_private: boolean
  join_type: "free" | "approval" | "invite"
  member_count: number
  moderators: Array<{
    id: string
    full_name: string | null
    avatar_url: string | null
    role: string
  }>
}

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
  membershipStatus: "none" | "member" | "pending" | "admin" | "owner"
  initialPosts?: any[]
  initialPostsCount?: number
  communityData?: CommunityDataForMobile | null
  isSystemBoard?: boolean
}

export function BoardPageClient({
  slug,
  dbSlug,
  category,
  isUserAdmin,
  user,
  communityId,
  isMember: initialIsMember,
  membershipStatus: initialMembershipStatus,
  initialPosts = [],
  initialPostsCount = 0,
  communityData,
  isSystemBoard: isSystemBoardProp,
}: BoardPageClientProps) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { toast } = useToast()
  const currentPage = Number(searchParams.get("page")) || 1
  const [isWriteModalOpen, setIsWriteModalOpen] = useState(false)
  const [isMember, setIsMember] = useState(initialIsMember)
  const [membershipStatus, setMembershipStatus] = useState(initialMembershipStatus)
  const [isJoining, setIsJoining] = useState(false)


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
  const isSystemBoard = isSystemBoardProp ?? systemBoards.includes(dbSlug)

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
      setMembershipStatus("member")
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
      setMembershipStatus("none")
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

  // 멤버십 변경 핸들러 (모바일 바용)
  const handleMembershipChange = () => {
    router.refresh()
  }

  return (
    <div className="w-full flex flex-col gap-8">
      {/* 커뮤니티 모바일 바 (시스템 게시판이 아닐 때만 표시) */}
      {!isSystemBoard && communityData && (
        <CommunityMobileBar
          community={communityData}
          membershipStatus={membershipStatus}
          currentUserId={user?.id || null}
          onMembershipChange={handleMembershipChange}
        />
      )}

      <div className="flex flex-col gap-6">
        {/* 시스템 게시판: 기존 CommunityBanner 사용 */}
        {isSystemBoard ? (
          <CommunityBanner
            title={bannerConfig.title}
            description={bannerConfig.description}
            actions={
              <div className="flex items-center gap-2">
                {shouldShowButton && (
                  <Button
                    onClick={buttonConfig.onClick}
                    className="bg-white/90 border border-white/20 shadow-sm hover:bg-white text-gray-900 rounded-full px-4 h-9 inline-flex items-center gap-2 text-sm font-semibold"
                  >
                    <Plus className="w-4 h-4" />
                    {buttonConfig.text}
                  </Button>
                )}
              </div>
            }
          />
        ) : (
          /* 커뮤니티: Reddit 스타일 CommunityHeader 사용 */
          communityData && (
            <CommunityHeader
              community={{
                id: communityData.id,
                name: communityData.name,
                banner_url: communityData.banner_url,
                thumbnail_url: communityData.thumbnail_url,
                description: communityData.description,
              }}
              isMember={isMember}
              membershipStatus={membershipStatus}
              canWrite={isMember || isUserAdmin}
              isLoading={isJoining}
              onJoin={handleJoin}
              onLeave={handleLeave}
              onNewPost={() => setIsWriteModalOpen(true)}
            />
          )
        )}

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

        <div className="flex flex-col bg-white rounded-xl border border-slate-200 overflow-hidden">
          {/* 서버에서 초기 데이터가 있으면 로딩 상태 건너뛰기 */}
          {/* 단, 서버에서 이미 빈 배열을 전달받은 경우(initialPosts.length === 0이고 page 1)에는 스켈레톤 표시 안함 */}
          {(isLoading && posts.length === 0 && !(currentPage === 1 && initialPosts.length === 0)) ? (
            [1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="w-full bg-white py-3 px-4 border-b border-slate-200 last:border-b-0">
                <Skeleton className="h-4 w-1/4 mb-2" />
                <Skeleton className="h-5 w-3/4 mb-2" />
                <Skeleton className="h-3 w-full mb-1" />
                <Skeleton className="h-3 w-2/3" />
              </div>
            ))
          ) : posts.length === 0 ? (
            <div className="text-center py-16 text-slate-500">
              아직 게시글이 없습니다. 첫 번째 글을 작성해보세요!
            </div>
          ) : (
            postsWithMembership.map((post, index) => {
              const postHref = `/community/board/${post.board_categories?.slug ?? "community"}/${post.id}`

              // Reddit 스타일 FeedPostCard 사용 (피드/리스트 뷰 모두)
              return (
                <FeedPostCard
                  key={post.id}
                  postId={post.id}
                  href={postHref}
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
                  isLast={index === postsWithMembership.length - 1}
                />
              )
            })
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

