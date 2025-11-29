import { createClient } from "@/lib/supabase/server"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
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
    <div className="w-full flex flex-col lg:flex-row gap-10">
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
                <p className="text-lg font-bold text-blue-900">
                  프로필을 공개하고 멤버 리스트에 올려보세요!
                </p>
              </div>
              <Link href="/community/profile">
                <Button size="sm" variant="outline" className="border-blue-300 text-blue-700 hover:bg-blue-100">
                  설정하기
                </Button>
              </Link>
            </div>
          )}

          {/* 멤버 리스트 섹션 */}
          <div>
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-slate-900">멤버 리스트</h2>
              <div className="text-sm text-slate-500">총 {members.length}명</div>
            </div>
            
            {members.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-6">
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
