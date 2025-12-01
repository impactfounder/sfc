import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { StandardRightSidebar } from "@/components/standard-right-sidebar"
import { PageHeader } from "@/components/page-header"
import Link from "next/link"
import { MemberListClient } from "@/components/member/member-list-client"
import type { MemberProfile } from "@/components/member/member-detail-modal"

export const dynamic = 'force-dynamic'

export default async function MemberPage() {
  const supabase = await createClient()
  
  const { data: { user: currentUser } } = await supabase.auth.getUser()
  
  let currentUserProfile = null
  if (currentUser) {
    const { data } = await supabase
      .from("profiles")
      .select("id, is_profile_public")
      .eq("id", currentUser.id)
      .single()
    currentUserProfile = data
  }

  // 1. 소셜 링크 포함해서 조회 시도
  let { data: publicMembers, error } = await supabase
    .from("profiles")
    .select(`
      id,
      full_name,
      avatar_url,
      company,
      position,
      company_2,
      position_2,
      roles,
      introduction,
      role,
      created_at,
      linkedin_url,
      instagram_url,
      threads_url,
      website_url,
      user_badges (
        status,
        is_visible,
        badges:badge_id (
          icon,
          name
        )
      )
    `)
    .eq("is_profile_public", true)
    .order("created_at", { ascending: false })

  // 2. 컬럼 없음 에러 발생 시, 소셜 링크 제외하고 재시도
  // 에러 코드에 상관없이 에러가 발생하면 안전한 쿼리로 재시도
  if (error) {
    console.warn("First attempt failed, retrying with safe columns. Error:", error)
    
    // [1차 재시도] 소셜 링크 제외, 뱃지 상태 포함
    let { data: retryData, error: retryError } = await supabase
      .from("profiles")
      .select(`
        id,
        full_name,
        avatar_url,
        company,
        position,
        company_2,
        position_2,
        roles,
        introduction,
        role,
        created_at,
        user_badges (
          status,
          is_visible,
          badges:badge_id (
            icon,
            name
          )
        )
      `)
      .eq("is_profile_public", true)
      .order("created_at", { ascending: false })
      
    if (!retryError) {
      publicMembers = retryData
    } else {
      // [2차 재시도] 뱃지 상태도 제외 (최소 데이터)
      console.warn("Second attempt failed, retrying with minimal columns. Error:", retryError)
      const { data: finalData, error: finalError } = await supabase
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

      if (!finalError) {
        publicMembers = finalData
      } else {
        console.error("All fetch attempts failed:", finalError)
      }
    }
  }

  const members: MemberProfile[] = (publicMembers || []).map((member: any) => {
    // 뱃지 필터링: 승인됨(approved) AND 공개(is_visible) 상태인 것만
    const validBadges = member.user_badges?.filter((ub: any) => 
      ub.badges && 
      (ub.status === 'approved' || !ub.status) && 
      ub.is_visible
    ).map((ub: any) => ub.badges) || []

    return {
      id: member.id,
      full_name: member.full_name,
      avatar_url: member.avatar_url,
      company: member.company,
      position: member.position,
      company_2: member.company_2,
      position_2: member.position_2,
      introduction: member.introduction,
      role: member.role,
      roles: member.roles || [],
      linkedin_url: member.linkedin_url, // 없으면 undefined
      instagram_url: member.instagram_url,
      threads_url: member.threads_url,
      website_url: member.website_url,
      badges: validBadges
    }
  })

  return (
    <div className="w-full flex flex-col lg:flex-row gap-10">
      <div className="flex-1 min-w-0 flex flex-col gap-10">
        <PageHeader 
          title="멤버"
          description="각자의 영역에서 성과를 증명한, 검증된 멤버들을 만나보세요."
        />

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

          <div>
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-slate-900">멤버 리스트</h2>
              <div className="text-sm text-slate-500">총 {members.length}명</div>
            </div>
            
            <MemberListClient members={members} />
          </div>
        </div>

        <div className="hidden lg:flex w-72 shrink-0 flex-col gap-6">
          <div className="sticky top-8 flex flex-col gap-6 h-fit">
            <StandardRightSidebar />
          </div>
        </div>
    </div>
  )
}
