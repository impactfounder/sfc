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
  Settings,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "@/hooks/use-toast"
import { joinCommunity, leaveCommunity } from "@/lib/actions/community"
import { CommunitySettingsModal } from "./community-settings-modal"

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
  communityName: string | null
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

export function CommunityInfoSidebar({ communityName }: CommunityInfoSidebarProps) {
  const [community, setCommunity] = useState<CommunityData | null>(null)
  const [membershipStatus, setMembershipStatus] = useState<MembershipStatus>("none")
  const [isLoading, setIsLoading] = useState(true)
  const [isJoining, setIsJoining] = useState(false)
  const [rulesOpen, setRulesOpen] = useState(false)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [settingsOpen, setSettingsOpen] = useState(false)

  // 운영자 여부 확인 (owner, admin, master)
  const canManage = membershipStatus === "owner" || membershipStatus === "admin"

  const supabase = createClient()

  console.log("[CommunityInfoSidebar] 렌더링됨, communityName:", communityName)

  useEffect(() => {
    console.log("[CommunityInfoSidebar] useEffect 실행, communityName:", communityName)
    if (communityName) {
      fetchCommunityData()
    } else {
      console.log("[CommunityInfoSidebar] communityName이 null이므로 로딩 중지")
      setIsLoading(false)
    }
  }, [communityName])

  async function fetchCommunityData() {
    if (!communityName) {
      setIsLoading(false)
      return
    }

    try {
      setIsLoading(true)
      console.log("[CommunityInfoSidebar] fetchCommunityData 시작, communityName:", communityName)

      // communities 테이블에서 name으로 조회 - fetch API 직접 사용
      console.log("[CommunityInfoSidebar] fetch API로 직접 쿼리 시작...")
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

      let communityData = null
      let communityError = null

      try {
        const response = await fetch(
          `${supabaseUrl}/rest/v1/communities?name=eq.${encodeURIComponent(communityName)}&select=id,name,description,rules,thumbnail_url,is_private,join_type,created_by`,
          {
            headers: {
              'apikey': supabaseKey!,
              'Authorization': `Bearer ${supabaseKey}`,
              'Content-Type': 'application/json',
            },
          }
        )

        console.log("[CommunityInfoSidebar] fetch 응답 상태:", response.status)

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        const data = await response.json()
        console.log("[CommunityInfoSidebar] fetch 결과:", data)

        // 배열 결과에서 첫 번째 항목 가져오기
        communityData = data.length > 0 ? data[0] : null
      } catch (fetchErr) {
        console.error("[CommunityInfoSidebar] fetch 오류:", fetchErr)
        communityError = fetchErr
      }

      console.log("[CommunityInfoSidebar] 쿼리 완료:", { communityData, communityError })

      if (communityError) {
        console.error("[CommunityInfoSidebar] 커뮤니티 조회 오류:", communityError)
        setIsLoading(false)
        return
      }

      if (!communityData) {
        // communities 테이블에 없으면 기본 정보만 표시
        setCommunity({
          id: communityName,
          name: communityName,
          description: null,
          rules: null,
          thumbnail_url: null,
          is_private: false,
          join_type: "free",
          created_by: "",
          member_count: 0,
          creator: null,
          moderators: [],
        })
        setMembershipStatus("member")
        setIsLoading(false)
        return
      }

      // 현재 사용자 확인 (fetch API 사용)
      let user = null
      try {
        const sessionRes = await fetch(`${supabaseUrl}/auth/v1/user`, {
          headers: {
            'apikey': supabaseKey!,
            'Authorization': `Bearer ${supabaseKey}`,
          },
        })
        if (sessionRes.ok) {
          user = await sessionRes.json()
        }
      } catch {
        // 로그인 안됨
      }
      setCurrentUserId(user?.id || null)

      // 멤버 수 조회 (fetch API 사용)
      let memberCount = 0
      try {
        const memberCountRes = await fetch(
          `${supabaseUrl}/rest/v1/community_members?community_id=eq.${communityData.id}&select=id`,
          {
            headers: {
              'apikey': supabaseKey!,
              'Authorization': `Bearer ${supabaseKey}`,
              'Prefer': 'count=exact',
            },
          }
        )
        const countHeader = memberCountRes.headers.get('content-range')
        if (countHeader) {
          const match = countHeader.match(/\/(\d+)$/)
          if (match) memberCount = parseInt(match[1], 10)
        }
      } catch (err) {
        console.error("[CommunityInfoSidebar] 멤버 수 조회 오류:", err)
      }

      // 운영자 목록 조회 (fetch API 사용)
      let moderatorsData: any[] = []
      try {
        const modsRes = await fetch(
          `${supabaseUrl}/rest/v1/community_members?community_id=eq.${communityData.id}&role=in.(owner,admin)&select=role,profiles:user_id(id,full_name,avatar_url)`,
          {
            headers: {
              'apikey': supabaseKey!,
              'Authorization': `Bearer ${supabaseKey}`,
            },
          }
        )
        if (modsRes.ok) {
          moderatorsData = await modsRes.json()
        }
      } catch (err) {
        console.error("[CommunityInfoSidebar] 운영자 조회 오류:", err)
      }

      // 현재 사용자의 멤버십 상태 확인 (fetch API 사용)
      if (user?.id) {
        try {
          const membershipRes = await fetch(
            `${supabaseUrl}/rest/v1/community_members?community_id=eq.${communityData.id}&user_id=eq.${user.id}&select=role`,
            {
              headers: {
                'apikey': supabaseKey!,
                'Authorization': `Bearer ${supabaseKey}`,
              },
            }
          )
          if (membershipRes.ok) {
            const membershipData = await membershipRes.json()
            if (membershipData.length > 0) {
              setMembershipStatus(membershipData[0].role as MembershipStatus)
            } else {
              // 가입 신청 상태 확인
              const joinReqRes = await fetch(
                `${supabaseUrl}/rest/v1/community_join_requests?community_id=eq.${communityData.id}&user_id=eq.${user.id}&status=eq.pending&select=status`,
                {
                  headers: {
                    'apikey': supabaseKey!,
                    'Authorization': `Bearer ${supabaseKey}`,
                  },
                }
              )
              if (joinReqRes.ok) {
                const joinReqData = await joinReqRes.json()
                setMembershipStatus(joinReqData.length > 0 ? "pending" : "none")
              }
            }
          }
        } catch (err) {
          console.error("[CommunityInfoSidebar] 멤버십 조회 오류:", err)
        }
      }

      setCommunity({
        id: communityData.id,
        name: communityData.name,
        description: communityData.description,
        rules: communityData.rules || null,
        thumbnail_url: communityData.thumbnail_url,
        is_private: communityData.is_private,
        join_type: communityData.join_type || "free",
        created_by: communityData.created_by,
        member_count: memberCount || 0,
        creator: null, // 외래키 관계 조회 제거로 인해 null
        moderators: (moderatorsData || []).map((m: any) => ({
          ...m.profiles,
          role: m.role,
        })),
      })
    } catch (error) {
      console.error("[CommunityInfoSidebar] 커뮤니티 정보 로드 실패:", error)
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

          {/* 운영자 설정 버튼 */}
          {canManage && (
            <Button
              className="w-full"
              variant="outline"
              onClick={() => setSettingsOpen(true)}
            >
              <Settings className="h-4 w-4 mr-2" />
              설정
            </Button>
          )}

          {/* 가입/탈퇴 버튼 */}
          {currentUserId && !canManage && (
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

      {/* 설정 모달 */}
      {community && canManage && (
        <CommunitySettingsModal
          open={settingsOpen}
          onOpenChange={setSettingsOpen}
          community={{
            id: community.id,
            name: community.name,
            description: community.description,
            is_private: community.is_private,
            rules: community.rules,
            thumbnail_url: community.thumbnail_url,
          }}
          onSuccess={fetchCommunityData}
        />
      )}
    </div>
  )
}
