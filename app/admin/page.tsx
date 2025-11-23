import { requireAdmin } from "@/lib/auth/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, FileText, Calendar, Shield } from "lucide-react"
import Link from "next/link"

export default async function AdminDashboard() {
  const { supabase, isMaster } = await requireAdmin()

  const [usersResult, postsResult, eventsResult] = await Promise.all([
    supabase.from("profiles").select("*", { count: "exact", head: true }),
    supabase.from("posts").select("*", { count: "exact", head: true }),
    supabase.from("events").select("*", { count: "exact", head: true }),
  ])

  const stats = {
    usersCount: usersResult.count || 0,
    postsCount: postsResult.count || 0,
    eventsCount: eventsResult.count || 0,
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 pt-20 md:pt-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">관리자 대시보드</h1>
          <p className="mt-2 text-slate-600">Seoul Founders Club 커뮤니티 관리</p>
        </div>

        <div className="mb-8 grid gap-6 md:grid-cols-3">
          <Card className="border-slate-200">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">전체 회원</CardTitle>
              <Users className="h-4 w-4 text-slate-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">{stats.usersCount}</div>
            </CardContent>
          </Card>

          <Card className="border-slate-200">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">전체 게시글</CardTitle>
              <FileText className="h-4 w-4 text-slate-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">{stats.postsCount}</div>
            </CardContent>
          </Card>

          <Card className="border-slate-200">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">전체 이벤트</CardTitle>
              <Calendar className="h-4 w-4 text-slate-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">{stats.eventsCount}</div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Link href="/admin/users">
            <Card className="border-slate-200 transition-shadow hover:shadow-md cursor-pointer">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  회원 관리
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-600">회원 목록 조회, 등급 관리, 권한 관리</p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/admin/events">
            <Card className="border-slate-200 transition-shadow hover:shadow-md cursor-pointer">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  이벤트 관리
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-600">이벤트 목록 조회, 이벤트 삭제</p>
              </CardContent>
            </Card>
          </Link>

          {isMaster && (
            <Link href="/admin/roles">
              <Card className="border-amber-200 bg-amber-50 transition-shadow hover:shadow-md cursor-pointer">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-amber-900">
                    <Shield className="h-5 w-5" />
                    관리자 지정
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-amber-700">MASTER 전용: 다른 회원을 관리자로 지정</p>
                </CardContent>
              </Card>
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}
