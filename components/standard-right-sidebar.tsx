"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Bell, ChevronRight } from "lucide-react"
import Link from "next/link"

export function StandardRightSidebar() {
  const [announcements, setAnnouncements] = useState<Array<{ id: string; title: string }>>([])
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    async function fetchAnnouncements() {
      try {
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
  }, [supabase])

  return (
    <div className="flex flex-col gap-6 h-full">
      {/* 공지사항 위젯 */}
      <Card className="bg-white border border-slate-200 rounded-xl shadow-sm">
        <CardContent className="p-5">
          <Link href="/community/board/announcements" className="flex items-center gap-2 mb-4 group">
            <Bell className="h-5 w-5 text-slate-700" />
            <h3 className="text-lg font-semibold text-slate-900 group-hover:text-slate-700 transition-colors">공지사항</h3>
            <ChevronRight className="h-4 w-4 text-slate-400 ml-auto group-hover:text-slate-600 transition-colors" />
          </Link>
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-4 bg-slate-100 rounded animate-pulse" />
              ))}
            </div>
          ) : announcements.length > 0 ? (
            <div className="space-y-3">
              {announcements.map((announcement) => (
                <Link
                  key={announcement.id}
                  href={`/community/board/announcements/${announcement.id}`}
                  className="block group"
                >
                  <p className="text-sm text-slate-700 group-hover:text-slate-900 transition-colors line-clamp-2">
                    {announcement.title}
                  </p>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-500">공지사항이 없습니다</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

