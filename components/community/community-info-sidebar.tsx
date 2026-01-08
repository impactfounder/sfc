"use client"

import { useEffect, useState } from "react"
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
  Globe,
  Settings,
  Crown,
  Calendar,
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
  userId?: string | null
}

interface CommunityData {
  id: string
  name: string
  description: string | null
  rules: string | null
  thumbnail_url: string | null
  banner_url: string | null
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

export function CommunityInfoSidebar({ communityName, userId }: CommunityInfoSidebarProps) {
  const [community, setCommunity] = useState<CommunityData | null>(null)
  const [membershipStatus, setMembershipStatus] = useState<MembershipStatus>("none")
  const [isLoading, setIsLoading] = useState(true)
  const [isJoining, setIsJoining] = useState(false)
  const [rulesOpen, setRulesOpen] = useState(false)
  const [currentUserId, setCurrentUserId] = useState<string | null>(userId || null)
  const [settingsOpen, setSettingsOpen] = useState(false)

  // 운영자 여부 확인 (owner, admin, master)
  const canManage = membershipStatus === "owner" || membershipStatus === "admin"

  console.log("[CommunityInfoSidebar] 렌더링됨, communityName:", communityName, "userId:", userId, "canManage:", canManage, "membershipStatus:", membershipStatus)

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
          `${supabaseUrl}/rest/v1/communities?name=eq.${encodeURIComponent(communityName)}&select=id,name,description,rules,thumbnail_url,banner_url,is_private,join_type,created_by`,
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
          banner_url: null,
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

      // 현재 사용자 확인 (서버에서 전달받은 userId 사용)
      const currentUser = userId || null
      setCurrentUserId(currentUser)
      console.log("[CommunityInfoSidebar] 사용자:", currentUser || "비로그인")

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
      if (currentUser) {
        // 커뮤니티 생성자인 경우 바로 owner로 설정
        if (communityData.created_by === currentUser) {
          console.log("[CommunityInfoSidebar] 커뮤니티 생성자 확인됨, owner로 설정")
          setMembershipStatus("owner")
        } else {
          try {
            const membershipRes = await fetch(
              `${supabaseUrl}/rest/v1/community_members?community_id=eq.${communityData.id}&user_id=eq.${currentUser}&select=role`,
              {
                headers: {
                  'apikey': supabaseKey!,
                  'Authorization': `Bearer ${supabaseKey}`,
                },
              }
            )
            console.log("[CommunityInfoSidebar] 멤버십 조회 응답:", membershipRes.status)
            if (membershipRes.ok) {
              const membershipData = await membershipRes.json()
              console.log("[CommunityInfoSidebar] 멤버십 데이터:", membershipData)
              if (membershipData.length > 0) {
                const role = membershipData[0].role as MembershipStatus
                console.log("[CommunityInfoSidebar] 멤버십 role 설정:", role)
                // member role은 "member"로 유지
                if (role === "owner" || role === "admin") {
                  setMembershipStatus(role)
                } else {
                  setMembershipStatus("member")
                }
              } else {
                // 가입 신청 상태 확인
                const joinReqRes = await fetch(
                  `${supabaseUrl}/rest/v1/community_join_requests?community_id=eq.${communityData.id}&user_id=eq.${currentUser}&status=eq.pending&select=status`,
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
      }

      setCommunity({
        id: communityData.id,
        name: communityData.name,
        description: communityData.description,
        rules: communityData.rules || null,
        thumbnail_url: communityData.thumbnail_url,
        banner_url: communityData.banner_url || null,
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
        // 승인제: 가입 신청 (fetch API 사용)
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
        const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

        const response = await fetch(
          `${supabaseUrl}/rest/v1/community_join_requests`,
          {
            method: 'POST',
            headers: {
              'apikey': supabaseKey!,
              'Authorization': `Bearer ${supabaseKey}`,
              'Content-Type': 'application/json',
              'Prefer': 'return=minimal',
            },
            body: JSON.stringify({
              community_id: community.id,
              user_id: currentUserId,
            }),
          }
        )

        if (!response.ok) {
          throw new Error('가입 신청에 실패했습니다.')
        }

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
    <div className="space-y-2">
      {/* 통합 사이드바 카드 - 깔끔한 흰색 배경 */}
      <Card className="overflow-hidden bg-white shadow-sm border-slate-200">
        {/* 헤더 섹션 - 프로필 사진 제거, 이름만 표시 */}
        <div className="p-4">
          <h3 className="font-semibold text-slate-900 leading-tight">{community.name}</h3>
          <div className="flex items-center gap-2 mt-1.5 text-xs text-slate-500">
            <span>{community.member_count.toLocaleString()} members</span>
          </div>
        </div>

        {/* 소개글 */}
        {community.description && (
          <div className="px-4 pb-3">
            <p className="text-[13px] text-slate-600 leading-relaxed">
              {community.description}
            </p>
          </div>
        )}

        {/* 공개/비공개 상태 - Reddit 스타일 */}
        <div className="px-4 pb-3">
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            {community.is_private ? (
              <>
                <Lock className="h-3.5 w-3.5" />
                <span>비공개</span>
              </>
            ) : (
              <>
                <Globe className="h-3.5 w-3.5" />
                <span>공개</span>
              </>
            )}
          </div>
        </div>

        {/* 액션 버튼 */}
        {(canManage || (currentUserId && !canManage && (membershipStatus === "none" || membershipStatus === "pending"))) && (
          <div className="px-4 pb-4">
            {canManage && (
              <Button
                className="w-full h-9 bg-slate-900 hover:bg-slate-800 text-white"
                size="sm"
                onClick={() => setSettingsOpen(true)}
              >
                <Settings className="h-3.5 w-3.5 mr-1.5" />
                커뮤니티 설정
              </Button>
            )}
            {currentUserId && !canManage && membershipStatus === "none" && (
              <Button
                className="w-full h-9 bg-blue-600 hover:bg-blue-700 text-white"
                size="sm"
                onClick={handleJoin}
                disabled={isJoining}
              >
                <UserPlus className="h-3.5 w-3.5 mr-1.5" />
                {community.join_type === "approval" ? "가입 신청" : "커뮤니티 가입"}
              </Button>
            )}
            {currentUserId && !canManage && membershipStatus === "pending" && (
              <Button className="w-full h-9" variant="secondary" size="sm" disabled>
                <Clock className="h-3.5 w-3.5 mr-1.5" />
                승인 대기중
              </Button>
            )}
          </div>
        )}

        {/* 운영자 섹션 - 프로필 사진 제거, 리더 배지 스타일 변경 */}
        {community.moderators.length > 0 && (
          <>
            <div className="border-t border-slate-100" />
            <div className="p-4">
              <div className="space-y-2">
                {community.moderators.map((mod) => (
                  <div
                    key={mod.id}
                    className="flex items-center gap-2"
                  >
                    {mod.role === "owner" && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium text-amber-700 bg-amber-50 rounded">
                        <Crown className="h-3 w-3" />
                        리더
                      </span>
                    )}
                    <span className="text-[13px] text-slate-700 truncate">
                      {mod.full_name || "익명"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* 이용수칙 섹션 */}
        {community.rules && (
          <>
            <div className="border-t border-slate-100" />
            <div className="p-4">
              <Collapsible open={rulesOpen} onOpenChange={setRulesOpen}>
                <CollapsibleTrigger className="flex items-center justify-between w-full text-[11px] font-medium text-slate-400 uppercase tracking-wide hover:text-slate-600 transition-colors">
                  <div className="flex items-center gap-1.5">
                    <BookOpen className="h-3 w-3" />
                    <span>Rules</span>
                  </div>
                  <ChevronDown
                    className={cn(
                      "h-3.5 w-3.5 transition-transform duration-200",
                      rulesOpen && "rotate-180"
                    )}
                  />
                </CollapsibleTrigger>
                <CollapsibleContent className="pt-2.5">
                  <div className="text-[13px] text-slate-600 bg-slate-50 rounded-lg p-3 whitespace-pre-wrap leading-relaxed border border-slate-100">
                    {community.rules}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </div>
          </>
        )}
      </Card>

      {/* 커뮤니티 탈퇴 버튼 - 카드 밖 하단에 배치 */}
      {currentUserId && !canManage && membershipStatus === "member" && (
        <button
          onClick={handleLeave}
          disabled={isJoining}
          className="w-full text-[11px] text-slate-400 hover:text-red-500 py-2 transition-colors disabled:opacity-50"
        >
          커뮤니티 탈퇴
        </button>
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
            banner_url: community.banner_url,
          }}
          onSuccess={fetchCommunityData}
        />
      )}
    </div>
  )
}
