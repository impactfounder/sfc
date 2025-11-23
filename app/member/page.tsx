import { createClient } from "@/lib/supabase/server"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Users, TrendingUp } from "lucide-react"
import Link from "next/link"
import Image from "next/image"

export default async function MemberPage() {
  const supabase = await createClient()

  // 추천 커뮤니티 (최근 생성된 커뮤니티)
  const { data: recommendedCommunities } = await supabase
    .from("communities")
    .select(`
      id,
      name,
      description,
      thumbnail_url,
      created_at,
      created_by,
      profiles:created_by (
        full_name
      ),
      community_members(count)
    `)
    .order("created_at", { ascending: false })
    .limit(10)

  // SFC 멤버 리스트
  const { data: members } = await supabase
    .from("profiles")
    .select(`
      id,
      full_name,
      avatar_url,
      bio,
      role,
      created_at,
      user_badges!inner (
        badges:badge_id (
          icon,
          name
        )
      )
    `)
    .eq("user_badges.is_visible", true)
    .order("created_at", { ascending: false })

  // 모든 멤버 가져오기 (뱃지 포함 여부와 관계없이)
  const { data: allMembersData } = await supabase
    .from("profiles")
    .select(`
      id,
      full_name,
      avatar_url,
      bio,
      role,
      created_at,
      user_badges (
        badges:badge_id (
          icon,
          name
        )
      )
    `)
    .order("created_at", { ascending: false })

  // 멤버 데이터 정리
  const allMembers = (allMembersData || []).map((member: any) => ({
    ...member,
    user_badges: member.user_badges?.filter((ub: any) => ub.badges) || []
  }))

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 pt-20 md:pt-8">
      <div className="mx-auto max-w-6xl">
        
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">SFC멤버</h1>
          <p className="mt-2 text-slate-600">SFC 커뮤니티의 멤버들을 만나보세요</p>
        </div>

        {/* 추천 커뮤니티 섹션 */}
        {recommendedCommunities && recommendedCommunities.length > 0 && (
          <div className="mb-12">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-slate-900">추천 커뮤니티</h2>
              <Link href="/communities" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                전체 보기 →
              </Link>
            </div>
            <div className="overflow-x-auto pb-4">
              <div className="flex gap-4 min-w-max">
                {recommendedCommunities.map((community: any) => (
                  <Link
                    key={community.id}
                    href={`/communities/${community.id}`}
                    className="flex-shrink-0"
                  >
                    <Card className="w-64 border-slate-200 hover:shadow-md transition-shadow">
                      <div className="aspect-video relative overflow-hidden rounded-t-lg bg-slate-100">
                        {community.thumbnail_url ? (
                          <Image
                            src={community.thumbnail_url}
                            alt={community.name}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center text-slate-400">
                            <Users className="h-12 w-12" />
                          </div>
                        )}
                      </div>
                      <CardContent className="p-4">
                        <h3 className="font-semibold text-slate-900 mb-1 line-clamp-1">
                          {community.name}
                        </h3>
                        <p className="text-xs text-slate-600 line-clamp-2 mb-2">
                          {community.description || "설명이 없습니다."}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                          <Users className="h-3 w-3" />
                          <span>{community.community_members?.[0]?.count || 0}명</span>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* SFC 멤버 리스트 섹션 */}
        <div>
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-slate-900">SFC 멤버 리스트</h2>
            <div className="text-sm text-slate-500">
              총 {allMembers.length}명
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {allMembers.map((member: any) => {
              const badges = member.user_badges?.map((ub: any) => ub.badges).filter(Boolean) || []
              
              return (
                <Link key={member.id} href={`/community/profile?id=${member.id}`}>
                  <Card className="border-slate-200 hover:shadow-md transition-shadow">
                    <CardContent className="p-5">
                      <div className="flex items-start gap-4">
                        <Avatar className="h-12 w-12 flex-shrink-0">
                          <AvatarImage src={member.avatar_url || "/placeholder.svg"} />
                          <AvatarFallback className="bg-blue-600 text-white">
                            {member.full_name?.[0] || "U"}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-slate-900 truncate">
                              {member.full_name || "익명"}
                            </h3>
                            {member.role === "admin" || member.role === "master" ? (
                              <Badge variant="secondary" className="text-xs">
                                관리자
                              </Badge>
                            ) : null}
                          </div>
                          {member.bio && (
                            <p className="text-xs text-slate-600 line-clamp-2 mb-2">
                              {member.bio}
                            </p>
                          )}
                          {badges.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {badges.slice(0, 3).map((badge: any, idx: number) => (
                                <Badge key={idx} variant="outline" className="text-xs">
                                  <span className="mr-1">{badge.icon}</span>
                                  {badge.name}
                                </Badge>
                              ))}
                              {badges.length > 3 && (
                                <Badge variant="outline" className="text-xs">
                                  +{badges.length - 3}
                                </Badge>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

