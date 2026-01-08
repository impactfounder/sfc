"use client"

import { useState } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Users,
  ChevronDown,
  Shield,
  BookOpen,
  Lock,
  UserPlus,
  UserMinus,
  Clock,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "@/hooks/use-toast"
import { joinCommunity, leaveCommunity } from "@/lib/actions/community"
import { createClient } from "@/lib/supabase/client"

/**
 * CommunityMobileBar - 모바일 커뮤니티 정보 바
 *
 * xl 미만 화면에서 사이드바 대신 상단에 표시되는 접이식 바
 * - 접힌 상태: 커뮤니티 이름 + 멤버 수 + 확장 버튼
 * - 펼친 상태: 소개글, 규칙, 운영자, 가입 버튼
 */

interface CommunityMobileBarProps {
  community: {
    id: string
    name: string
    description: string | null
    rules: string | null
    thumbnail_url: string | null
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
  membershipStatus: "none" | "member" | "pending" | "admin" | "owner"
  currentUserId: string | null
  onMembershipChange?: () => void
}

export function CommunityMobileBar({
  community,
  membershipStatus: initialStatus,
  currentUserId,
  onMembershipChange,
}: CommunityMobileBarProps) {
  const [expanded, setExpanded] = useState(false)
  const [membershipStatus, setMembershipStatus] = useState(initialStatus)
  const [isJoining, setIsJoining] = useState(false)
  const supabase = createClient()

  async function handleJoin() {
    if (!currentUserId) {
      toast({ description: "로그인이 필요합니다.", variant: "destructive" })
      return
    }

    setIsJoining(true)
    try {
      if (community.join_type === "approval") {
        // 승인제: 가입 신청
        const { error } = await supabase
          .from("community_join_requests")
          .insert({
            community_id: community.id,
            user_id: currentUserId,
          })

        if (error) throw error

        setMembershipStatus("pending")
        toast({ description: "가입 신청이 완료되었습니다." })
      } else {
        // 자유 가입
        const result = await joinCommunity(community.id)
        if (result.error) throw new Error(result.error)

        setMembershipStatus("member")
        toast({ description: "커뮤니티에 가입되었습니다!" })
      }
      onMembershipChange?.()
    } catch (error: any) {
      toast({
        title: "가입 실패",
        description: error.message || "다시 시도해주세요.",
        variant: "destructive",
      })
    } finally {
      setIsJoining(false)
    }
  }

  async function handleLeave() {
    setIsJoining(true)
    try {
      const result = await leaveCommunity(community.id)
      if (result.error) throw new Error(result.error)

      setMembershipStatus("none")
      toast({ description: "커뮤니티에서 탈퇴했습니다." })
      onMembershipChange?.()
    } catch (error: any) {
      toast({
        title: "탈퇴 실패",
        description: error.message || "다시 시도해주세요.",
        variant: "destructive",
      })
    } finally {
      setIsJoining(false)
    }
  }

  return (
    <div className="lg:hidden sticky top-14 z-30 bg-white border-b border-slate-200 shadow-sm">
      {/* 접힌 상태 - 항상 표시 */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-3 hover:bg-slate-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          {community.thumbnail_url ? (
            <Avatar className="h-8 w-8">
              <AvatarImage src={community.thumbnail_url} />
              <AvatarFallback className="text-xs">
                {community.name.charAt(0)}
              </AvatarFallback>
            </Avatar>
          ) : (
            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm">
              {community.name.charAt(0)}
            </div>
          )}
          <div className="text-left">
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-slate-900">
                {community.name}
              </span>
              {community.is_private && (
                <Lock className="h-3 w-3 text-slate-400" />
              )}
            </div>
            <div className="flex items-center gap-1 text-xs text-slate-500">
              <Users className="h-3 w-3" />
              <span>{community.member_count} members</span>
            </div>
          </div>
        </div>
        <ChevronDown
          className={cn(
            "h-5 w-5 text-slate-400 transition-transform duration-200",
            expanded && "rotate-180"
          )}
        />
      </button>

      {/* 펼친 상태 */}
      <div
        className={cn(
          "overflow-hidden transition-all duration-300 ease-in-out",
          expanded ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"
        )}
      >
        <div className="px-4 pb-4 space-y-4 border-t border-slate-100 bg-slate-50">
          {/* 소개글 */}
          {community.description && (
            <div className="pt-3">
              <p className="text-sm text-slate-600 leading-relaxed">
                {community.description}
              </p>
            </div>
          )}

          {/* 이용수칙 */}
          {community.rules && (
            <div>
              <div className="flex items-center gap-2 text-xs font-medium text-slate-500 mb-2">
                <BookOpen className="h-3 w-3" />
                <span>이용수칙</span>
              </div>
              <div className="text-xs text-slate-600 bg-white rounded-lg p-3 whitespace-pre-wrap max-h-32 overflow-y-auto">
                {community.rules}
              </div>
            </div>
          )}

          {/* 운영자 */}
          {community.moderators.length > 0 && (
            <div>
              <div className="flex items-center gap-2 text-xs font-medium text-slate-500 mb-2">
                <Shield className="h-3 w-3" />
                <span>운영자</span>
              </div>
              <div className="flex gap-2 flex-wrap">
                {community.moderators.map((mod) => (
                  <div
                    key={mod.id}
                    className="flex items-center gap-1.5 bg-white rounded-full px-2 py-1"
                  >
                    <Avatar className="h-5 w-5">
                      <AvatarImage src={mod.avatar_url || undefined} />
                      <AvatarFallback className="text-[10px]">
                        {mod.full_name?.charAt(0) || "?"}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-xs text-slate-700">
                      {mod.full_name || "익명"}
                    </span>
                    {mod.role === "owner" && (
                      <Badge variant="secondary" className="text-[8px] px-1 py-0">
                        리더
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 가입 버튼 */}
          {currentUserId && membershipStatus !== "owner" && membershipStatus !== "admin" && (
            <div className="pt-2">
              {membershipStatus === "none" && (
                <Button
                  size="sm"
                  className="w-full"
                  onClick={handleJoin}
                  disabled={isJoining}
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  {community.join_type === "approval" ? "가입 신청" : "가입하기"}
                </Button>
              )}
              {membershipStatus === "pending" && (
                <Button size="sm" className="w-full" variant="secondary" disabled>
                  <Clock className="h-4 w-4 mr-2" />
                  승인 대기중
                </Button>
              )}
              {membershipStatus === "member" && (
                <Button
                  size="sm"
                  className="w-full"
                  variant="outline"
                  onClick={handleLeave}
                  disabled={isJoining}
                >
                  <UserMinus className="h-4 w-4 mr-2" />
                  탈퇴하기
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
