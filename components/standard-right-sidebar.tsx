"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Separator } from "@/components/ui/separator"
import { Bell, ChevronRight } from "lucide-react"
import Link from "next/link"

export function StandardRightSidebar() {
  const [announcements, setAnnouncements] = useState<Array<{ id: string; title: string }>>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchAnnouncements() {
      try {
        const supabase = createClient()
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

        if (!error && data) {
          setAnnouncements(data.map((post: any) => ({
            id: post.id,
            title: post.title,
          })))
        }
      } catch (error) {
        console.error("공지사항 로드 오류:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchAnnouncements()
  }, [])

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
        {isLoading ? (
          <div className="space-y-2 px-1">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-3.5 bg-slate-100 rounded animate-pulse" />
            ))}
          </div>
        ) : announcements.length > 0 ? (
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

