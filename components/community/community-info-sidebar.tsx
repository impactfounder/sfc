"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  Users,
  Shield,
  BookOpen,
  ChevronDown,
  UserPlus,
  UserMinus,
  Clock,
  Lock,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "@/hooks/use-toast"
import { joinCommunity, leaveCommunity } from "@/lib/actions/community"

/**
 * CommunityInfoSidebar - 커뮤니티 정보 사이드바
 *
 * 커뮤니티 페이지 우측에 표시되는 정보 사이드바
 * - 커뮤니티 소개
 * - 이용수칙 (접이식)
 * - 운영자 목록
 * - 멤버 수
 * - 가입/탈퇴 버튼
 */

interface CommunityInfoSidebarProps {
  slug: string
}

interface CommunityData {
  id: string
  name: string
  description: string | null
  rules: string | null
  thumbnail_url: string | null
  is_private: boolean
  join_type: "free" | "approval" | "invite"
  created_by: string
  member_count: number
  creator: {
    id: string
    full_name: string | null
    avatar_url: string | null
  } | null
  moderators: Array<{
    id: string
    full_name: string | null
    avatar_url: string | null
    role: string
  }>
}

type MembershipStatus = "none" | "member" | "pending" | "admin" | "owner"

export function CommunityInfoSidebar({ slug }: CommunityInfoSidebarProps) {
  const [community, setCommunity] = useState<CommunityData | null>(null)
  const [membershipStatus, setMembershipStatus] = useState<MembershipStatus>("none")
  const [isLoading, setIsLoading] = useState(true)
  const [isJoining, setIsJoining] = useState(false)
  const [rulesOpen, setRulesOpen] = useState(false)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)

  const supabase = createClient()

  useEffect(() => {
    fetchCommunityData()
  }, [slug])

  async function fetchCommunityData() {
    try {
      setIsLoading(true)

      // 현재 사용자 확인
      const { data: { user } } = await supabase.auth.getUser()
      setCurrentUserId(user?.id || null)

      // 먼저 board_categories에서 커뮤니티 이름 찾기
      const { data: boardCategory } = await supabase
        .from("board_categories")
        .select("name, description")
        .eq("slug", slug)
        .single()

      if (!boardCategory) {
        setIsLoading(false)
        return
      }

      // communities 테이블에서 name으로 커뮤니티 정보 조회
      // (slug 컬럼은 마이그레이션 후에만 존재할 수 있음)
      const { data: communityData, error: communityError } = await supabase
        .from("communities")
        .select(`
          id,
          name,
          description,
          thumbnail_url,
          is_private,
          created_by,
          profiles:created_by (
            id,
            full_name,
            avatar_url
          )
        `)
        .eq("name", boardCategory.name)
        .single()

      if (communityError || !communityData) {
        // communities 테이블에 없으면 board_categories 정보 사용
        setCommunity({
          id: slug,
          name: boardCategory.name,
          description: boardCategory.description,
          rules: null,
          thumbnail_url: null,
          is_private: false,
          join_type: "free",
          created_by: "",
          member_count: 0,
          creator: null,
          moderators: [],
        })
        setMembershipStatus("member") // 시스템 보드는 모두 멤버
        setIsLoading(false)
        return
      }

      // 멤버 수 조회
      const { count: memberCount } = await supabase
        .from("community_members")
        .select("*", { count: "exact", head: true })
        .eq("community_id", communityData.id)

      // 운영자 목록 조회
      const { data: moderatorsData } = await supabase
        .from("community_members")
        .select(`
          role,
          profiles:user_id (
            id,
            full_name,
            avatar_url
          )
        `)
        .eq("community_id", communityData.id)
        .in("role", ["owner", "admin"])

      // 현재 사용자의 멤버십 상태 확인
      if (user) {
        const { data: membership } = await supabase
          .from("community_members")
          .select("role")
          .eq("community_id", communityData.id)
          .eq("user_id", user.id)
          .single()

        if (membership) {
          setMembershipStatus(membership.role as MembershipStatus)
        } else {
          // 가입 신청 상태 확인 (테이블이 없을 수 있음)
          try {
            const { data: joinRequest } = await supabase
              .from("community_join_requests")
              .select("status")
              .eq("community_id", communityData.id)
              .eq("user_id", user.id)
              .eq("status", "pending")
              .single()

            setMembershipStatus(joinRequest ? "pending" : "none")
          } catch {
            // 테이블이 없으면 none으로 설정
            setMembershipStatus("none")
          }
        }
      }

      setCommunity({
        id: communityData.id,
        name: communityData.name,
        description: communityData.description,
        rules: (communityData as any).rules || null, // 마이그레이션 전에는 없을 수 있음
        thumbnail_url: communityData.thumbnail_url,
        is_private: communityData.is_private,
        join_type: (communityData as any).join_type || "free", // 마이그레이션 전에는 없을 수 있음
        created_by: communityData.created_by,
        member_count: memberCount || 0,
        creator: communityData.profiles as any,
        moderators: (moderatorsData || []).map((m: any) => ({
          ...m.profiles,
          role: m.role,
        })),
      })
    } catch (error) {
      console.error("커뮤니티 정보 로드 실패:", error)
    } finally {
      setIsLoading(false)
    }
  }

  async function handleJoin() {
    if (!currentUserId || !community) return

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
        toast({ description: "가입 신청이 완료되었습니다. 운영자 승인을 기다려주세요." })
      } else {
        // 자유 가입
        const result = await joinCommunity(community.id)
        if (result.error) throw new Error(result.error)

        setMembershipStatus("member")
        toast({ description: "커뮤니티에 가입되었습니다!" })
        fetchCommunityData() // 멤버 수 갱신
      }
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
    if (!community) return

    setIsJoining(true)
    try {
      const result = await leaveCommunity(community.id)
      if (result.error) throw new Error(result.error)

      setMembershipStatus("none")
      toast({ description: "커뮤니티에서 탈퇴했습니다." })
      fetchCommunityData() // 멤버 수 갱신
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

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Card>
          <CardContent className="p-4 space-y-3">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!community) {
    return null
  }

  return (
    <div className="space-y-4">
      {/* 커뮤니티 정보 카드 */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            {community.thumbnail_url ? (
              <Avatar className="h-12 w-12">
                <AvatarImage src={community.thumbnail_url} />
                <AvatarFallback>{community.name.charAt(0)}</AvatarFallback>
              </Avatar>
            ) : (
              <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-lg">
                {community.name.charAt(0)}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <CardTitle className="text-lg truncate">{community.name}</CardTitle>
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <Users className="h-4 w-4" />
                <span>{community.member_count} members</span>
                {community.is_private && (
                  <Badge variant="secondary" className="text-xs">
                    <Lock className="h-3 w-3 mr-1" />
                    비공개
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-0 space-y-4">
          {/* 소개글 */}
          {community.description && (
            <p className="text-sm text-slate-600 leading-relaxed">
              {community.description}
            </p>
          )}

          {/* 가입 버튼 */}
          {currentUserId && membershipStatus !== "owner" && membershipStatus !== "admin" && (
            <div>
              {membershipStatus === "none" && (
                <Button
                  className="w-full"
                  onClick={handleJoin}
                  disabled={isJoining}
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  {community.join_type === "approval" ? "가입 신청" : "가입하기"}
                </Button>
              )}
              {membershipStatus === "pending" && (
                <Button className="w-full" variant="secondary" disabled>
                  <Clock className="h-4 w-4 mr-2" />
                  승인 대기중
                </Button>
              )}
              {membershipStatus === "member" && (
                <Button
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

          {/* 이용수칙 */}
          {community.rules && (
            <Collapsible open={rulesOpen} onOpenChange={setRulesOpen}>
              <CollapsibleTrigger className="flex items-center justify-between w-full py-2 text-sm font-medium text-slate-700 hover:text-slate-900">
                <div className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4" />
                  <span>이용수칙</span>
                </div>
                <ChevronDown
                  className={cn(
                    "h-4 w-4 transition-transform",
                    rulesOpen && "rotate-180"
                  )}
                />
              </CollapsibleTrigger>
              <CollapsibleContent className="pt-2">
                <div className="text-sm text-slate-600 bg-slate-50 rounded-lg p-3 whitespace-pre-wrap">
                  {community.rules}
                </div>
              </CollapsibleContent>
            </Collapsible>
          )}
        </CardContent>
      </Card>

      {/* 운영자 카드 */}
      {community.moderators.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Shield className="h-4 w-4" />
              운영자
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-2">
              {community.moderators.map((mod) => (
                <div
                  key={mod.id}
                  className="flex items-center gap-2 py-1"
                >
                  <Avatar className="h-7 w-7">
                    <AvatarImage src={mod.avatar_url || undefined} />
                    <AvatarFallback className="text-xs">
                      {mod.full_name?.charAt(0) || "?"}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm text-slate-700 flex-1 truncate">
                    {mod.full_name || "익명"}
                  </span>
                  {mod.role === "owner" && (
                    <Badge variant="secondary" className="text-[10px]">
                      리더
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
