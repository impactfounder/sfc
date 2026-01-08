"use client"

import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { UserCheck, UserPlus, Plus, Clock } from "lucide-react"
import { getDefaultBannerUrl } from "@/lib/utils/unsplash"

interface CommunityHeaderProps {
  community: {
    id: string
    name: string
    banner_url?: string | null
    thumbnail_url?: string | null
    description?: string | null
  }
  isMember: boolean
  membershipStatus?: "none" | "member" | "pending" | "owner" | "admin"
  canWrite: boolean
  isLoading?: boolean
  onJoin: () => void
  onLeave: () => void
  onNewPost: () => void
}

export function CommunityHeader({
  community,
  isMember,
  membershipStatus = "none",
  canWrite,
  isLoading,
  onJoin,
  onLeave,
  onNewPost
}: CommunityHeaderProps) {
  // 배너 이미지 URL 결정
  const bannerUrl = community.banner_url || getDefaultBannerUrl(community.description, community.id)

  // 멤버십 버튼 렌더링
  const renderMembershipButton = () => {
    if (isLoading) {
      return (
        <Button variant="outline" disabled>
          <Clock className="h-4 w-4 mr-1.5 animate-spin" />
          처리 중...
        </Button>
      )
    }

    if (membershipStatus === "pending") {
      return (
        <Button variant="outline" disabled>
          <Clock className="h-4 w-4 mr-1.5" />
          승인 대기중
        </Button>
      )
    }

    if (isMember) {
      return (
        <Button variant="outline" onClick={onLeave}>
          <UserCheck className="h-4 w-4 mr-1.5" />
          참여 중
        </Button>
      )
    }

    return (
      <Button onClick={onJoin}>
        <UserPlus className="h-4 w-4 mr-1.5" />
        참여하기
      </Button>
    )
  }

  return (
    <div className="mb-4">
      {/* 배너 이미지 */}
      <div className="relative h-28 md:h-36 rounded-t-xl overflow-hidden bg-slate-200">
        <Image
          src={bannerUrl}
          alt={`${community.name} 배너`}
          fill
          className="object-cover"
          priority
        />
        {/* 배너 하단 그래디언트 (텍스트 가독성) */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
      </div>

      {/* 커뮤니티 정보 바 */}
      <div className="flex items-center justify-between px-4 py-4 md:py-5 bg-white border border-t-0 border-slate-200 rounded-b-xl">
        <div className="flex items-center gap-3">
          {/* 아이콘 (배너 위로 살짝 올라감) */}
          <div className="-mt-10 relative z-10">
            <Avatar className="h-16 w-16 border-4 border-white shadow-md">
              {community.thumbnail_url ? (
                <AvatarImage src={community.thumbnail_url} alt={community.name} />
              ) : (
                <AvatarFallback className="text-xl font-bold bg-gradient-to-br from-slate-100 to-slate-200 text-slate-600">
                  {community.name.slice(0, 1)}
                </AvatarFallback>
              )}
            </Avatar>
          </div>
          {/* 이름 */}
          <h1 className="text-xl font-bold text-slate-900">{community.name}</h1>
        </div>

        {/* 액션 버튼 */}
        <div className="flex items-center gap-2">
          {renderMembershipButton()}
          {canWrite && (
            <Button onClick={onNewPost}>
              <Plus className="h-4 w-4 mr-1.5" />
              새 글 작성
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
