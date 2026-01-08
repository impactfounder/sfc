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

  // Fetch board categories
  const { data: boardCategories } = await supabase
    .from("board_categories")
    .select("id, name, description, slug")
    .in("slug", ["vangol", "hightalk"])
    .order("id")

  // Fetch rich descriptions from communities table
  let mergedCommunities: any[] = boardCategories || []
  if (boardCategories && boardCategories.length > 0) {
    const names = boardCategories.map((c) => c.name)
    const { data: communityInfos } = await supabase
      .from("communities")
      .select("id, name, description")
      .in("name", names)

    // 사용자의 멤버십 정보 가져오기
    let userMemberships: any[] = []
    if (user && communityInfos && communityInfos.length > 0) {
      const communityIds = communityInfos.map((c) => c.id)
      const { data: memberships } = await supabase
        .from("community_members")
        .select("community_id, role")
        .eq("user_id", user.id)
        .in("community_id", communityIds)
      userMemberships = memberships || []
    }

    mergedCommunities = boardCategories.map((cat) => {
      const info = communityInfos?.find((c) => c.name === cat.name)
      const membership = userMemberships.find((m) => m.community_id === info?.id)
      return {
        ...cat,
        communityId: info?.id,
        description: info?.description || cat.description,
        isMember: !!membership,
        role: membership?.role || null,
      }
    })
  }

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
