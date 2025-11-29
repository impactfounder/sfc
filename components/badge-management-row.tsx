"use client"

import { useState } from "react"
import { TableCell, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { updateBadgeStatus } from "@/lib/actions/admin"
import { CheckCircle2, XCircle, Eye, Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"
import Image from "next/image"

type BadgeRequest = {
  id: string
  status: string
  evidence: string | null
  created_at: string
  profiles: {
    id: string
    full_name: string | null
    email: string | null
    avatar_url: string | null
  } | null
  badges: {
    id: string
    name: string
    icon: string
  } | null
}

export function BadgeManagementRow({ badgeRequest }: { badgeRequest: BadgeRequest }) {
  const router = useRouter()
  const [showEvidenceDialog, setShowEvidenceDialog] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [processingAction, setProcessingAction] = useState<'approve' | 'reject' | null>(null)

  const handleApprove = async () => {
    if (!confirm("이 뱃지 신청을 승인하시겠습니까?")) return

    setIsProcessing(true)
    setProcessingAction('approve')
    try {
      await updateBadgeStatus(badgeRequest.id, 'approved')
      router.refresh()
    } catch (error) {
      console.error("Failed to approve badge:", error)
      alert("승인 처리에 실패했습니다.")
    } finally {
      setIsProcessing(false)
      setProcessingAction(null)
    }
  }

  const handleReject = async () => {
    if (!confirm("이 뱃지 신청을 거절하시겠습니까?")) return

    setIsProcessing(true)
    setProcessingAction('reject')
    try {
      await updateBadgeStatus(badgeRequest.id, 'rejected')
      router.refresh()
    } catch (error) {
      console.error("Failed to reject badge:", error)
      alert("거절 처리에 실패했습니다.")
    } finally {
      setIsProcessing(false)
      setProcessingAction(null)
    }
  }

  const user = badgeRequest.profiles
  const badge = badgeRequest.badges
  const evidence = badgeRequest.evidence || "증빙 자료 없음"
  const evidencePreview = evidence.length > 50 ? evidence.substring(0, 50) + "..." : evidence

  return (
    <>
      <TableRow>
        <TableCell>
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={user?.avatar_url || undefined} />
              <AvatarFallback className="bg-blue-600 text-white">
                {user?.full_name?.[0] || user?.email?.[0] || "U"}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="font-medium text-slate-900">
                {user?.full_name || "이름 없음"}
              </div>
              <div className="text-sm text-slate-500">{user?.email}</div>
            </div>
          </div>
        </TableCell>
        <TableCell>
          {badge ? (
            <div className="flex items-center gap-2">
              <span className="text-lg">{badge.icon}</span>
              <span className="font-medium text-slate-900">{badge.name}</span>
            </div>
          ) : (
            <span className="text-slate-400">뱃지 정보 없음</span>
          )}
        </TableCell>
        <TableCell>
          <div className="max-w-md">
            <p className="text-sm text-slate-700 line-clamp-2">{evidencePreview}</p>
            {evidence.length > 50 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowEvidenceDialog(true)}
                className="mt-1 h-7 text-xs"
              >
                <Eye className="h-3 w-3 mr-1" />
                보기
              </Button>
            )}
          </div>
        </TableCell>
        <TableCell>
          <div className="text-sm text-slate-600">
            {new Date(badgeRequest.created_at).toLocaleDateString('ko-KR', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </div>
        </TableCell>
        <TableCell className="text-right">
          <div className="flex items-center justify-end gap-2">
            <Button
              onClick={handleApprove}
              disabled={isProcessing}
              size="sm"
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              {isProcessing && processingAction === 'approve' ? (
                <>
                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                  처리 중...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  승인
                </>
              )}
            </Button>
            <Button
              onClick={handleReject}
              disabled={isProcessing}
              size="sm"
              variant="destructive"
            >
              {isProcessing && processingAction === 'reject' ? (
                <>
                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                  처리 중...
                </>
              ) : (
                <>
                  <XCircle className="h-3 w-3 mr-1" />
                  거절
                </>
              )}
            </Button>
          </div>
        </TableCell>
      </TableRow>

      {/* 증빙 자료 상세 보기 Dialog */}
      <Dialog open={showEvidenceDialog} onOpenChange={setShowEvidenceDialog}>
        <DialogContent className="sm:max-w-lg bg-white rounded-xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">증빙 자료</DialogTitle>
            <DialogDescription className="text-sm text-slate-500">
              사용자가 제출한 증빙 자료입니다
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4">
            <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
              <p className="text-sm text-slate-700 whitespace-pre-wrap break-words">
                {evidence}
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}



