"use client"

import { useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CheckCircle2, XCircle, Loader2 } from "lucide-react"
import { updatePartnerApplicationStatus } from "@/lib/actions/partner-applications"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"

type PartnerApplication = {
  id: string
  created_at: string
  status: "pending" | "approved" | "rejected"
  company_name: string | null
  current_usage: string | null
  profiles: {
    id: string
    full_name: string | null
    email: string | null
  } | null
  partners?: {
    id: string
    name: string
  } | null
  partner_name?: string | null
}

type PartnerApplicationsTabProps = {
  applications: PartnerApplication[]
}

export function PartnerApplicationsTab({ applications }: PartnerApplicationsTabProps) {
  const router = useRouter()
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    })
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <Badge className="bg-yellow-100 text-yellow-700 border-yellow-300">
            승인 대기
          </Badge>
        )
      case "approved":
        return (
          <Badge className="bg-green-100 text-green-700 border-green-300">
            승인 완료
          </Badge>
        )
      case "rejected":
        return (
          <Badge className="bg-red-100 text-red-700 border-red-300">
            반려됨
          </Badge>
        )
      default:
        return (
          <Badge className="bg-slate-100 text-slate-700">
            {status}
          </Badge>
        )
    }
  }

  const handleApprove = async (applicationId: string) => {
    setUpdatingId(applicationId)
    try {
      await updatePartnerApplicationStatus(applicationId, "approved")
      router.refresh()
    } catch (error) {
      console.error("승인 실패:", error)
      alert("승인 처리에 실패했습니다.")
    } finally {
      setUpdatingId(null)
    }
  }

  const handleReject = async (applicationId: string) => {
    setUpdatingId(applicationId)
    try {
      await updatePartnerApplicationStatus(applicationId, "rejected")
      router.refresh()
    } catch (error) {
      console.error("반려 실패:", error)
      alert("반려 처리에 실패했습니다.")
    } finally {
      setUpdatingId(null)
    }
  }

  return (
    <div>
      <h2 className="text-xl font-bold text-slate-900 mb-6">파트너스 신청 관리</h2>
      {applications.length > 0 ? (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>신청일</TableHead>
              <TableHead>파트너사</TableHead>
              <TableHead>신청자(이메일)</TableHead>
              <TableHead>회사명</TableHead>
              <TableHead>현재 이용 여부</TableHead>
              <TableHead>상태</TableHead>
              <TableHead className="text-right">관리</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {applications.map((application) => (
              <TableRow key={application.id}>
                <TableCell>
                  <div className="text-sm text-slate-600">
                    {formatDate(application.created_at)}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="font-medium text-slate-900">
                    {application.partners?.name || application.partner_name || "파트너 정보 없음"}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="text-sm text-slate-900">
                    {application.profiles?.full_name || "이름 없음"}
                  </div>
                  <div className="text-xs text-slate-500">
                    {application.profiles?.email || "이메일 없음"}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="text-sm text-slate-600">
                    {application.company_name || "-"}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="text-sm text-slate-600">
                    {application.current_usage || "-"}
                  </div>
                </TableCell>
                <TableCell>
                  {getStatusBadge(application.status)}
                </TableCell>
                <TableCell className="text-right">
                  {application.status === "pending" && (
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-2 border-green-300 text-green-700 hover:bg-green-50"
                        onClick={() => handleApprove(application.id)}
                        disabled={updatingId === application.id}
                      >
                        {updatingId === application.id ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            처리 중...
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="h-4 w-4" />
                            승인
                          </>
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-2 border-red-300 text-red-600 hover:bg-red-50"
                        onClick={() => handleReject(application.id)}
                        disabled={updatingId === application.id}
                      >
                        {updatingId === application.id ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            처리 중...
                          </>
                        ) : (
                          <>
                            <XCircle className="h-4 w-4" />
                            반려
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : (
        <div className="py-12 text-center text-slate-500">
          등록된 신청이 없습니다
        </div>
      )}
    </div>
  )
}

