import { createClient } from "@/lib/supabase/server"
import Link from "next/link"
import { Megaphone, ChevronRight } from "lucide-react"

export default async function AnnouncementBanner() {
  const supabase = await createClient()

  // 1. 최신 공지사항 1개만 가져오기 (날짜 정보 포함)
  const { data: announcement } = await supabase
    .from("posts")
    .select("id, title, created_at, board_categories!inner(slug)")
    .eq("board_categories.slug", "announcement")
    .eq("visibility", "public")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  // 공지사항이 없으면 배너 자체를 보여주지 않음
  if (!announcement) return null

  // 날짜 포맷팅 (예: 2024.01.15)
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}.${month}.${day}`
  }

  const category = Array.isArray(announcement.board_categories) ? announcement.board_categories[0] : announcement.board_categories
  const formattedDate = announcement.created_at ? formatDate(announcement.created_at) : ''

  return (
    <div className="bg-slate-50 border-b border-slate-200">
      <div className="mx-auto max-w-7xl px-4 md:px-8">
        <Link 
          href={`/community/board/${category?.slug || "announcement"}/${announcement.id}`}
          className="flex items-center gap-3 py-3 px-4 rounded-lg hover:bg-slate-100 transition-colors group"
        >
          {/* 왼쪽: 아이콘 + 공지 배지 */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <Megaphone className="h-4 w-4 text-slate-500" />
            <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-semibold rounded">
              공지
            </span>
          </div>

          {/* 중앙: 공지사항 제목 (truncate) */}
          <div className="flex-1 min-w-0">
            <span className="text-sm font-medium text-slate-900 truncate block">
              {announcement.title}
            </span>
          </div>

          {/* 오른쪽: 날짜 + 화살표 */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {formattedDate && (
              <span className="text-xs text-slate-500 hidden sm:inline">
                {formattedDate}
              </span>
            )}
            <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-slate-600 group-hover:translate-x-0.5 transition-all" />
          </div>
        </Link>
      </div>
    </div>
  )
}
