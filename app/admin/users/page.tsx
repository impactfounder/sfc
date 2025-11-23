import { requireAdmin } from "@/lib/auth/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { UserManagement } from "@/components/user-management"

export default async function UsersManagementPage() {
  const { supabase, user, isMaster } = await requireAdmin()

  const { data: users } = await supabase.from("profiles").select("*").order("created_at", { ascending: false })

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 pt-20 md:pt-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6">
          <Link href="/admin">
            <Button variant="ghost">
              <ArrowLeft className="mr-2 h-4 w-4" />
              대시보드로 돌아가기
            </Button>
          </Link>
        </div>

        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">회원 관리</h1>
          <p className="mt-2 text-slate-600">전체 회원 목록 및 상세 정보</p>
        </div>

        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle>회원 목록 ({users?.length || 0}명)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {users && users.length > 0 ? (
                users.map((member) => (
                  <UserManagement
                    key={member.id}
                    user={member}
                    currentUserId={user.id}
                    canChangeRole={isMaster}
                  />
                ))
              ) : (
                <div className="py-12 text-center text-slate-500">회원이 없습니다</div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
