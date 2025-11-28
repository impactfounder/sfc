import { createClient } from "@/lib/supabase/server"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Users, Instagram, ExternalLink } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { StandardRightSidebar } from "@/components/standard-right-sidebar"
import { PageHeader } from "@/components/page-header"

export default async function MemberPage() {
  const supabase = await createClient()
  
  // requireAuth 대신 안전하게 사용자 확인 (비로그인 허용)
  const { data: { user: currentUser } } = await supabase.auth.getUser()
  
  // 현재 사용자 프로필 확인 (비공개 안내용)
  let currentUserProfile = null
  if (currentUser) {
    const { data } = await supabase
      .from("profiles")
      .select("id, is_profile_public")
      .eq("id", currentUser.id)
      .single()
    currentUserProfile = data
  }

  // 커뮤니티 목록 가져오기
  const { data: communities } = await supabase
    .from("communities")
    .select(`
      id,
      name,
      description,
      thumbnail_url,
      instagram_url,
      website_url,
      created_at,
      community_members(count)
    `)
    .order("created_at", { ascending: false })

  // 공개된 멤버 리스트 가져오기
  const { data: publicMembers } = await supabase
    .from("profiles")
    .select(`
      id,
      full_name,
      avatar_url,
      company,
      position,
      roles,
      introduction,
      role,
      created_at,
      user_badges (
        badges:badge_id (
          icon,
          name
        )
      )
    `)
    .eq("is_profile_public", true)
    .order("created_at", { ascending: false })

  // 멤버 데이터 정리
  const members = (publicMembers || []).map((member: any) => ({
    ...member,
    user_badges: member.user_badges?.filter((ub: any) => ub.badges) || [],
    roles: member.roles || [],
  }))

  return (
    <div className="w-full flex flex-col lg:flex-row gap-10 pt-8 pb-20">
      {/* [LEFT] 중앙 콘텐츠 영역 */}
      <div className="flex-1 min-w-0 flex flex-col gap-10">
        {/* PageHeader 적용 */}
        <PageHeader 
          title="멤버"
          description="각자의 영역에서 성과를 증명한, 검증된 멤버들을 만나보세요."
        />

          {/* 비공개 안내 배너 */}
          {currentUser && currentUserProfile && !currentUserProfile.is_profile_public && (
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-900">
                  프로필을 공개하고 멤버 리스트에 올라가보세요!
                </p>
                <p className="text-xs text-blue-700 mt-1">
                  다른 멤버들이 당신을 찾을 수 있도록 프로필을 공개하세요
                </p>
              </div>
              <Link href="/community/profile">
                <Button size="sm" variant="outline" className="border-blue-300 text-blue-700 hover:bg-blue-100">
                  설정하기
                </Button>
              </Link>
            </div>
          )}

          {/* 커뮤니티 소개 섹션 */}
          {communities && communities.length > 0 && (
            <div className="mb-12">
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-slate-900">커뮤니티 (소모임)</h2>
                <p className="text-sm text-slate-600 mt-1">다양한 소모임을 만나보세요</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {communities.map((community: any) => (
                  <Card key={community.id} className="border-slate-200 hover:shadow-md transition-shadow">
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
                      <h3 className="font-semibold text-slate-900 mb-2 line-clamp-1">
                        {community.name}
                      </h3>
                      <p className="text-sm text-slate-600 line-clamp-2 mb-3">
                        {community.description || "설명이 없습니다."}
                      </p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                          <Users className="h-3 w-3" />
                          <span>{community.community_members?.[0]?.count || 0}명</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {community.instagram_url && (
                            <a href={community.instagram_url} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded-full hover:bg-slate-100 transition-colors">
                              <Instagram className="h-4 w-4 text-slate-600" />
                            </a>
                          )}
                          {community.website_url && (
                            <a href={community.website_url} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded-full hover:bg-slate-100 transition-colors">
                              <ExternalLink className="h-4 w-4 text-slate-600" />
                            </a>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* 멤버 리스트 섹션 */}
          <div>
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-slate-900">멤버 리스트</h2>
              <div className="text-sm text-slate-500">총 {members.length}명</div>
            </div>
            
            {members.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {members.map((member: any) => {
                  const badges = member.user_badges?.map((ub: any) => ub.badges).filter(Boolean) || []
                  return (
                    <Link key={member.id} href={`/community/profile?id=${member.id}`}>
                      <Card className="border-slate-200 bg-white hover:shadow-md transition-shadow h-full">
                        <CardContent className="p-5">
                          <div className="flex flex-col items-center text-center">
                            <Avatar className="h-16 w-16 mb-3">
                              <AvatarImage src={member.avatar_url || "/placeholder.svg"} />
                              <AvatarFallback className="bg-blue-600 text-white text-lg">
                                {member.full_name?.[0] || "U"}
                              </AvatarFallback>
                            </Avatar>
                            <h3 className="font-semibold text-slate-900 mb-1">{member.full_name || "익명"}</h3>
                            {(member.company || member.position) && (
                              <p className="text-xs text-slate-600 mb-2">
                                {member.company}{member.company && member.position && " · "}{member.position}
                              </p>
                            )}
                            {member.roles && member.roles.length > 0 && (
                              <div className="flex flex-wrap gap-1 justify-center mb-2">
                                {member.roles.map((role: string) => (
                                  <Badge key={role} variant="outline" className="text-xs">{role}</Badge>
                                ))}
                              </div>
                            )}
                            {member.introduction && (
                              <p className="text-xs text-slate-600 line-clamp-2 mb-2">{member.introduction}</p>
                            )}
                            {badges.length > 0 && (
                              <div className="flex flex-wrap gap-1 justify-center mt-2">
                                {badges.slice(0, 3).map((badge: any, idx: number) => (
                                  <Badge key={idx} variant="outline" className="text-xs">
                                    <span className="mr-1">{badge.icon}</span>{badge.name}
                                  </Badge>
                                ))}
                                {badges.length > 3 && (
                                  <Badge variant="outline" className="text-xs">+{badges.length - 3}</Badge>
                                )}
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  )
                })}
              </div>
            ) : (
              <div className="py-12 text-center text-slate-500"><p>공개된 멤버가 없습니다</p></div>
            )}
          </div>
        </div>

        {/* [RIGHT] 우측 사이드바 영역 */}
        <div className="hidden lg:flex w-72 shrink-0 flex-col gap-6">
          <div className="sticky top-8 flex flex-col gap-6 h-fit">
            <StandardRightSidebar />
          </div>
        </div>
    </div>
  )
}
