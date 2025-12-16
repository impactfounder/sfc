import { createClient } from "@/lib/supabase/server"
import { Separator } from "@/components/ui/separator"
import { Bell, ChevronRight } from "lucide-react"
import Link from "next/link"

export async function StandardRightSidebar() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("posts")
    .select(`
      id,
      title,
      board_categories!inner(slug)
    `)
    .eq("board_categories.slug", "announcement")
    .order("created_at", { ascending: false })
    .limit(3)

  const announcements = (!error && data)
    ? data.map((post: any) => ({
        id: post.id,
        title: post.title,
      }))
    : []

  return (
    <div className="flex flex-col gap-8 h-full">
      {/* 공지사항 위젯 */}
      <div className="flex flex-col">
        <div className="flex items-center justify-between mb-2 px-1">
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4 text-slate-500" />
            <h3 className="text-xs font-bold uppercase tracking-wide text-slate-500">공지사항</h3>
          </div>
          <Link href="/community/board/announcements" className="text-xs text-slate-400 hover:text-slate-600 flex items-center gap-1">
            더보기
            <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
        {announcements.length > 0 ? (
          <div className="flex flex-col">
            {announcements.map((announcement, idx) => (
              <div key={announcement.id}>
                <Link
                  href={`/community/board/announcements/${announcement.id}`}
                  className="block py-2 px-1 text-sm text-slate-700 hover:text-slate-900 hover:underline truncate"
                >
                  {announcement.title}
                </Link>
                {idx !== announcements.length - 1 && <Separator className="my-1 bg-slate-100" />}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-500 px-1">공지사항이 없습니다</p>
        )}
      </div>

      <Separator className="bg-slate-100" />

      {/* 푸터 영역 (예시) */}
      <div className="px-1 text-xs text-slate-400 leading-relaxed space-y-1">
        <div>© 2024 SFC</div>
        <div className="flex gap-2">
          <Link href="/terms" className="hover:text-slate-600">이용약관</Link>
          <span className="text-slate-300">·</span>
          <Link href="/privacy" className="hover:text-slate-600">개인정보처리방침</Link>
        </div>
      </div>
    </div>
  )
}

