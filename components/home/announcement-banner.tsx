import { createClient } from "@/lib/supabase/server"
import Link from "next/link"
import { Megaphone } from "lucide-react"

export default async function AnnouncementBanner() {
  const supabase = await createClient()

  // 1. 최신 공지사항 1개만 가져오기
  const { data: announcement } = await supabase
    .from("posts")
    .select("id, title, board_categories!inner(slug)")
    .eq("board_categories.slug", "announcement")
    .eq("visibility", "public")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  // 공지사항이 없으면 배너 자체를 보여주지 않음
  if (!announcement) return null

  return (
    // 오리지널 디자인: 파란색 배경, 깔끔한 한 줄
    <div className="bg-blue-600 text-white px-4 py-3">
      <div className="mx-auto max-w-7xl flex items-center justify-start">
        <div className="flex items-center gap-2 text-sm font-medium truncate">
          <Megaphone className="h-4 w-4 flex-shrink-0" />
          <Link 
            href={`/community/board/${announcement.board_categories?.slug || "announcement"}/${announcement.id}`} 
            className="hover:underline truncate"
          >
            {announcement.title}
          </Link>
        </div>
      </div>
    </div>
  )
}
