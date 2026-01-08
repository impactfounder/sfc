import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { CommunityGrid } from "@/components/community/community-grid"
import { ThreeColumnLayout } from "@/components/layout/three-column-layout"
import { StandardRightSidebar } from "@/components/standard-right-sidebar"

export default async function CommunityDashboardPage() {
  const supabase = await createClient()

  // 현재 사용자 확인
  const { data: { user } } = await supabase.auth.getUser()

  // 모든 커뮤니티 가져오기 (공개 커뮤니티 + 비공개이지만 가입한 커뮤니티)
  const { data: allCommunities } = await supabase
    .from("communities")
    .select("id, name, description, is_private, created_at")
    .order("created_at", { ascending: false })

  // board_categories에서 slug 매핑 가져오기
  const communityNames = (allCommunities || []).map((c) => c.name)
  const { data: boardCategories } = await supabase
    .from("board_categories")
    .select("name, slug")
    .in("name", communityNames)

  // 사용자의 멤버십 정보 가져오기
  let userMemberships: any[] = []
  if (user && allCommunities && allCommunities.length > 0) {
    const communityIds = allCommunities.map((c) => c.id)
    const { data: memberships } = await supabase
      .from("community_members")
      .select("community_id, role")
      .eq("user_id", user.id)
      .in("community_id", communityIds)
    userMemberships = memberships || []
  }

  // 커뮤니티 데이터 병합 (공개 커뮤니티 또는 가입한 비공개 커뮤니티만 표시)
  const mergedCommunities = (allCommunities || [])
    .filter((community) => {
      // 공개 커뮤니티는 항상 표시
      if (!community.is_private) return true
      // 비공개 커뮤니티는 가입한 경우에만 표시
      return userMemberships.some((m) => m.community_id === community.id)
    })
    .map((community) => {
      const category = boardCategories?.find((c) => c.name === community.name)
      const membership = userMemberships.find((m) => m.community_id === community.id)
      return {
        id: community.id,
        name: community.name,
        description: community.description,
        slug: category?.slug || community.name.toLowerCase().replace(/\s+/g, '-'),
        communityId: community.id,
        isMember: !!membership,
        role: membership?.role || null,
      }
    })

  return (
    <ThreeColumnLayout rightSidebar={<StandardRightSidebar />}>
      <div className="w-full flex flex-col gap-6">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <h1 className="text-2xl font-bold text-slate-900">커뮤니티 리스트</h1>
          <Link href="/communities/new">
            <Button size="sm" className="gap-1.5 shadow-sm active:scale-95 transition-all">
              <Plus className="h-4 w-4" />
              새 커뮤니티 만들기
            </Button>
          </Link>
        </div>

        <CommunityGrid communities={mergedCommunities} />
      </div>
    </ThreeColumnLayout>
  )
}
