import { requireAdmin } from "@/lib/auth/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { ArrowLeft, Medal } from "lucide-react"
import { BadgeManagementRow } from "@/components/badge-management-row"
import Image from "next/image"

export default async function BadgesManagementPage() {
  const { supabase, user } = await requireAdmin()

  // pending 상태인 뱃지 신청만 조회
  const { data: pendingBadges } = await supabase
    .from("user_badges")
    .select(`
      id,
      status,
      evidence,
      created_at,
      profiles:user_id (
        id,
        full_name,
        email,
        avatar_url
      ),
      badges:badge_id (
        id,
        name,
        icon
      )
    `)
    .eq("status", "pending")
    .order("created_at", { ascending: false })

  return (
    <div className="min-h-screen bg-white p-4 md:p-8 pt-20 md:pt-8">
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
          <div className="flex items-center gap-3">
            <Medal className="h-8 w-8 text-amber-500" />
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-slate-900">뱃지 발급 관리</h1>
              <p className="mt-2 text-slate-600">사용자가 신청한 뱃지를 검토하고 승인/거절합니다</p>
            </div>
          </div>
        </div>

        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle>대기 중인 뱃지 신청 ({pendingBadges?.length || 0}건)</CardTitle>
          </CardHeader>
          <CardContent>
            {pendingBadges && pendingBadges.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>신청자</TableHead>
                    <TableHead>신청 뱃지</TableHead>
                    <TableHead>증빙 자료</TableHead>
                    <TableHead>신청일</TableHead>
                    <TableHead className="text-right">관리</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingBadges.map((badgeRequest: any) => (
                    <BadgeManagementRow
                      key={badgeRequest.id}
                      badgeRequest={badgeRequest}
                    />
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="py-12 text-center text-slate-500">
                <Medal className="h-12 w-12 mx-auto mb-3 text-slate-300" />
                <p>대기 중인 뱃지 신청이 없습니다</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}






