import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { CommunityGrid } from "@/components/community/community-grid"

export default async function CommunityDashboardPage() {
  const supabase = await createClient()

  // Fetch board categories
  const { data: boardCategories } = await supabase
    .from("board_categories")
    .select("id, name, description, slug")
    .in("slug", ["vangol", "hightalk"])
    .order("id")

  // Fetch rich descriptions from communities table
  let mergedCommunities = boardCategories || []
  if (boardCategories && boardCategories.length > 0) {
    const names = boardCategories.map((c) => c.name)
    const { data: communityInfos } = await supabase
      .from("communities")
      .select("name, description")
      .in("name", names)

    mergedCommunities = boardCategories.map((cat) => {
      const info = communityInfos?.find((c) => c.name === cat.name)
      return {
        ...cat,
        description: info?.description || cat.description,
      }
    })
  }

  return (
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
  )
}
