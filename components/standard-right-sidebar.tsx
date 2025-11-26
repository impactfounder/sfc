"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { MessageSquare, Bell, LogIn, User, ChevronRight } from "lucide-react"
import Link from "next/link"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

export function StandardRightSidebar() {
  const [announcements, setAnnouncements] = useState<Array<{ id: string; title: string }>>([])
  const [isLoading, setIsLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const supabase = createClient()

  useEffect(() => {
    const loadUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)

      if (user) {
        const { data: profileData } = await supabase
          .from("profiles")
          .select("id, full_name, avatar_url, role, points")
          .eq("id", user.id)
          .single()
        
        if (profileData) {
          setProfile(profileData)
        }
      }
    }

    loadUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        supabase
          .from("profiles")
          .select("id, full_name, avatar_url, role, points")
          .eq("id", session.user.id)
          .single()
          .then(({ data }) => {
            if (data) setProfile(data)
          })
      } else {
        setProfile(null)
      }
    })

    return () => subscription.unsubscribe()
  }, [supabase])

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

      {/* 건의사항 / 오류신고 위젯 */}
      <Card className="bg-white border border-slate-200 rounded-xl shadow-sm">
        <CardContent className="p-5">
          <div className="flex items-center gap-2 mb-3">
            <MessageSquare className="h-5 w-5 text-slate-700" />
            <h3 className="text-lg font-semibold text-slate-900">건의사항 / 오류신고</h3>
          </div>
          <p className="text-sm text-slate-600 mb-4 leading-relaxed">
            서비스 이용 중 불편한 점이 있으신가요?
          </p>
          <Button asChild variant="outline" className="w-full border-slate-300 text-slate-700 hover:bg-slate-50">
            <a href="mailto:support@seoulfounders.club">문의하기</a>
          </Button>
        </CardContent>
      </Card>

      {/* 로그인/프로필 위젯 (맨 아래) */}
      <div className="mt-auto pt-4">
        {!user ? (
          <Link href="/auth/login" className="w-full">
            <Button variant="outline" className="w-full border-slate-300 text-slate-600 hover:bg-slate-50 h-12">
              <LogIn className="h-4 w-4 mr-2" />
              로그인 / 회원가입
            </Button>
          </Link>
        ) : (
          <Card className="bg-white border border-slate-200 rounded-xl shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-3 mb-4">
                <Avatar className="h-12 w-12 border border-slate-200">
                  <AvatarImage src={profile?.avatar_url || "/placeholder.svg"} />
                  <AvatarFallback className="bg-blue-100 text-blue-600 text-sm font-bold">
                    {profile?.full_name?.charAt(0) || user.email?.charAt(0)?.toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold text-slate-900 truncate">
                    {profile?.full_name || user.email?.split("@")[0] || "사용자"}
                  </div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-[10px] px-1.5 py-0.5 bg-slate-100 rounded text-slate-500 font-medium">
                      {profile?.role === "admin" || profile?.role === "master" ? "관리자" : "멤버"}
                    </span>
                    {profile?.points !== undefined && profile.points !== null && (
                      <span className="text-[10px] font-bold text-amber-600 flex items-center gap-0.5">
                        💎 {profile.points.toLocaleString()}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <Button asChild variant="outline" className="w-full border-slate-300 text-slate-700 hover:bg-slate-50">
                <Link href="/community/profile">
                  <User className="mr-2 h-4 w-4" />
                  내 프로필
                </Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

