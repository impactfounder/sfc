"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ChevronRight } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"

interface CommunityRightSidebarProps {
  slug: string
}

interface CommunityData {
  id: string
  name: string
  description?: string | null
  created_by?: string | null
  creator_profile?: {
    id: string
    full_name?: string | null
    avatar_url?: string | null
    company?: string | null
    position?: string | null
  } | null
  member_count?: number
  members?: Array<{
    id: string
    full_name?: string | null
    avatar_url?: string | null
    company?: string | null
    position?: string | null
    joined_at?: string
  }>
}

export function CommunityRightSidebar({ slug }: CommunityRightSidebarProps) {
  const [communityData, setCommunityData] = useState<CommunityData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    async function fetchCommunityData() {
      try {
        setIsLoading(true)

        // board_categories에서 커뮤니티 정보 가져오기
        const { data: category, error: categoryError } = await supabase
          .from("board_categories")
          .select("id, name, description, slug")
          .eq("slug", slug)
          .single()

        if (categoryError || !category) {
          console.error("커뮤니티 정보 로드 실패:", categoryError)
          setIsLoading(false)
          return
        }

        // communities 테이블에서 추가 정보 가져오기 (있는 경우)
        const { data: community } = await supabase
          .from("communities")
          .select(`
            id,
            name,
            description,
            created_by,
            profiles:created_by (
              id,
              full_name,
              avatar_url,
              company,
              position
            )
          `)
          .eq("name", category.name)
          .maybeSingle()

        // community_members에서 멤버 정보 가져오기
        let members: any[] = []
        let memberCount = 0

        if (community?.id) {
          const { data: communityMembers, error: membersError } = await supabase
            .from("community_members")
            .select(`
              user_id,
              joined_at,
              profiles:user_id (
                id,
                full_name,
                avatar_url,
                company,
                position
              )
            `)
            .eq("community_id", community.id)
            .order("joined_at", { ascending: false })
            .limit(10)

          if (!membersError && communityMembers) {
            members = communityMembers
              .map((cm: any) => ({
                id: cm.profiles?.id || cm.user_id,
                full_name: cm.profiles?.full_name || null,
                avatar_url: cm.profiles?.avatar_url || null,
                company: cm.profiles?.company || null,
                position: cm.profiles?.position || null,
                joined_at: cm.joined_at,
              }))
              .filter((m: any) => m.id) // 유효한 멤버만

            // 전체 멤버 수 카운트
            const { count } = await supabase
              .from("community_members")
              .select("*", { count: "exact", head: true })
              .eq("community_id", community.id)

            memberCount = count || 0
          }
        }

        setCommunityData({
          id: category.id,
          name: category.name,
          description: category.description || community?.description || null,
          created_by: community?.created_by || null,
          creator_profile: community?.profiles || null,
          member_count: memberCount,
          members: members,
        })
      } catch (error) {
        console.error("커뮤니티 데이터 로드 오류:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchCommunityData()
  }, [slug, supabase])

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="bg-white border border-slate-200 rounded-xl shadow-sm">
            <CardContent className="p-5">
              <Skeleton className="h-6 w-32 mb-4" />
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-3/4" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (!communityData) {
    return null
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Card 1: 클럽 가이드라인 */}
      <Card className="bg-indigo-50 border-indigo-100 rounded-xl shadow-sm">
        <CardContent className="p-5">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-lg">📌</span>
            <h3 className="text-base font-bold text-slate-900">클럽 가이드라인</h3>
          </div>
          {communityData.description ? (
            <div className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">
              {communityData.description}
            </div>
          ) : (
            <ul className="text-sm text-slate-700 space-y-1.5 leading-relaxed">
              <li>• 서로 존중하며 소통합니다</li>
              <li>• 건설적인 피드백을 제공합니다</li>
              <li>• 커뮤니티의 가치를 함께 만들어갑니다</li>
            </ul>
          )}
        </CardContent>
      </Card>

      {/* Card 2: 클럽 모더레이터 */}
      {communityData.creator_profile && (
        <Card className="bg-white border border-slate-200 rounded-xl shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-lg">👑</span>
              <h3 className="text-base font-bold text-slate-900">클럽 모더레이터</h3>
            </div>
            <div className="flex items-center gap-3">
              <Avatar className="h-12 w-12 border-2 border-amber-200">
                <AvatarImage src={communityData.creator_profile.avatar_url || undefined} />
                <AvatarFallback className="bg-gradient-to-br from-amber-400 to-amber-600 text-white font-bold">
                  {communityData.creator_profile.full_name?.charAt(0) || "M"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-semibold text-slate-900 text-sm truncate">
                    {communityData.creator_profile.full_name || "모더레이터"}
                  </p>
                  <Badge className="bg-amber-100 text-amber-700 text-[10px] px-1.5 py-0.5 font-bold">
                    리드
                  </Badge>
                </div>
                {(communityData.creator_profile.company || communityData.creator_profile.position) && (
                  <p className="text-xs text-slate-500 truncate">
                    {[communityData.creator_profile.company, communityData.creator_profile.position]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Card 3: 전체 클럽 멤버 */}
      <Card className="bg-white border border-slate-200 rounded-xl shadow-sm">
        <CardContent className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-lg">●</span>
            <h3 className="text-base font-bold text-slate-900">
              전체 클럽 멤버 {communityData.member_count ? `(${communityData.member_count}명)` : ""}
            </h3>
          </div>
          {communityData.members && communityData.members.length > 0 ? (
            <>
              <div className="space-y-3 mb-4">
                {communityData.members.map((member) => (
                  <div key={member.id} className="flex items-center gap-3">
                    <Avatar className="h-10 w-10 border border-slate-200">
                      <AvatarImage src={member.avatar_url || undefined} />
                      <AvatarFallback className="bg-slate-100 text-slate-600 text-xs font-semibold">
                        {member.full_name?.charAt(0) || "M"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-slate-900 text-sm truncate">
                        {member.full_name || "멤버"}
                      </p>
                      {(member.company || member.position) && (
                        <p className="text-xs text-slate-500 truncate">
                          {[member.company, member.position].filter(Boolean).join(" · ")}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              {communityData.member_count && communityData.member_count > communityData.members.length && (
                <Button
                  variant="ghost"
                  className="w-full text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                  disabled
                >
                  더보기 <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              )}
            </>
          ) : (
            <p className="text-sm text-slate-500">멤버가 없습니다</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

