"use client"

import { useState } from "react"
import { Medal, Plus, Edit2, Trash2, CheckCircle2, XCircle, Eye } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { createBadge, updateBadge, deleteBadge, updateBadgeStatus } from "@/lib/actions/admin"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

type BadgeType = {
  id: string
  name: string
  icon: string
  category: string
  description: string | null
}

type PendingBadgeType = {
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

type BadgeManagementTabProps = {
  badges: BadgeType[]
  pendingBadges: PendingBadgeType[]
}

const badgeCategories = [
  { value: "personal_asset", label: "개인 자산" },
  { value: "corporate_revenue", label: "기업 매출" },
  { value: "investment", label: "투자 규모" },
  { value: "valuation", label: "기업가치" },
  { value: "influence", label: "인플루언서" },
  { value: "professional", label: "전문직" },
  { value: "community", label: "커뮤니티" },
]

export function BadgeManagementTab({ badges, pendingBadges }: BadgeManagementTabProps) {
  const router = useRouter()
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showEvidenceDialog, setShowEvidenceDialog] = useState(false)
  const [editingBadge, setEditingBadge] = useState<BadgeType | null>(null)
  const [viewingEvidence, setViewingEvidence] = useState<string>("")
  const [isProcessing, setIsProcessing] = useState(false)
  const [processingAction, setProcessingAction] = useState<'create' | 'update' | 'delete' | 'approve' | 'reject' | null>(null)
  
  const [formData, setFormData] = useState({
    name: "",
    icon: "",
    category: "",
    description: "",
  })

  const handleCreate = async () => {
    if (!formData.name || !formData.icon || !formData.category) {
      alert("이름, 아이콘, 카테고리는 필수 입력 항목입니다.")
      return
    }

    setIsProcessing(true)
    setProcessingAction('create')
    try {
      await createBadge(
        formData.name,
        formData.icon,
        formData.category,
        formData.description || null
      )
      setShowCreateDialog(false)
      setFormData({ name: "", icon: "", category: "", description: "" })
      router.refresh()
    } catch (error) {
      console.error("Failed to create badge:", error)
      alert("뱃지 생성에 실패했습니다.")
    } finally {
      setIsProcessing(false)
      setProcessingAction(null)
    }
  }

  const handleEdit = (badge: BadgeType) => {
    setEditingBadge(badge)
    setFormData({
      name: badge.name,
      icon: badge.icon,
      category: badge.category,
      description: badge.description || "",
    })
    setShowEditDialog(true)
  }

  const handleUpdate = async () => {
    if (!editingBadge || !formData.name || !formData.icon || !formData.category) {
      alert("이름, 아이콘, 카테고리는 필수 입력 항목입니다.")
      return
    }

    setIsProcessing(true)
    setProcessingAction('update')
    try {
      await updateBadge(
        editingBadge.id,
        formData.name,
        formData.icon,
        formData.category,
        formData.description || null
      )
      setShowEditDialog(false)
      setEditingBadge(null)
      setFormData({ name: "", icon: "", category: "", description: "" })
      router.refresh()
    } catch (error) {
      console.error("Failed to update badge:", error)
      alert("뱃지 수정에 실패했습니다.")
    } finally {
      setIsProcessing(false)
      setProcessingAction(null)
    }
  }

  const handleDelete = async (badgeId: string) => {
    if (!confirm("이 뱃지를 삭제하시겠습니까? 이 뱃지를 사용 중인 사용자들에게도 영향을 미칩니다.")) return

    setIsProcessing(true)
    setProcessingAction('delete')
    try {
      await deleteBadge(badgeId)
      router.refresh()
    } catch (error) {
      console.error("Failed to delete badge:", error)
      alert("뱃지 삭제에 실패했습니다.")
    } finally {
      setIsProcessing(false)
      setProcessingAction(null)
    }
  }

  const handleApprove = async (userBadgeId: string) => {
    if (!confirm("이 뱃지 신청을 승인하시겠습니까?")) return

    setIsProcessing(true)
    setProcessingAction('approve')
    try {
      await updateBadgeStatus(userBadgeId, 'approved')
      router.refresh()
    } catch (error) {
      console.error("Failed to approve badge:", error)
      alert("승인 처리에 실패했습니다.")
    } finally {
      setIsProcessing(false)
      setProcessingAction(null)
    }
  }

  const handleReject = async (userBadgeId: string) => {
    if (!confirm("이 뱃지 신청을 거절하시겠습니까?")) return

    setIsProcessing(true)
    setProcessingAction('reject')
    try {
      await updateBadgeStatus(userBadgeId, 'rejected')
      router.refresh()
    } catch (error) {
      console.error("Failed to reject badge:", error)
      alert("거절 처리에 실패했습니다.")
    } finally {
      setIsProcessing(false)
      setProcessingAction(null)
    }
  }

  return (
    <div className="space-y-8">
      {/* 상단: 뱃지 신청 현황 */}
      <div>
        <h2 className="text-xl font-bold text-slate-900 mb-6">뱃지 신청 현황</h2>
        {pendingBadges.length > 0 ? (
          <div>
            <h3 className="text-lg font-semibold text-slate-900 mb-4">대기 중인 뱃지 신청 ({pendingBadges.length}건)</h3>
          <div className="border border-slate-200 rounded-lg overflow-hidden">
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
                {pendingBadges.map((badgeRequest) => {
                  const user = badgeRequest.profiles
                  const badge = badgeRequest.badges
                  const evidence = badgeRequest.evidence || "증빙 자료 없음"
                  const evidencePreview = evidence.length > 50 ? evidence.substring(0, 50) + "..." : evidence

                  return (
                    <TableRow key={badgeRequest.id}>
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
                              onClick={() => {
                                setViewingEvidence(evidence)
                                setShowEvidenceDialog(true)
                              }}
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
                            onClick={() => handleApprove(badgeRequest.id)}
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
                            onClick={() => handleReject(badgeRequest.id)}
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
                  )
                })}
              </TableBody>
            </Table>
          </div>
          </div>
        ) : (
          <div className="border border-slate-200 rounded-lg p-12 text-center">
            <p className="text-slate-500">대기 중인 뱃지 신청이 없습니다.</p>
          </div>
        )}
      </div>

      {/* 하단: 뱃지 종류 관리 */}
      <div className="border-t border-slate-200 pt-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-slate-900">뱃지 종류 관리</h2>
          <Button
            onClick={() => {
              setFormData({ name: "", icon: "", category: "", description: "" })
              setShowCreateDialog(true)
            }}
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            뱃지 생성
          </Button>
        </div>
        <div>
          <h3 className="text-lg font-semibold text-slate-900 mb-4">전체 뱃지 목록 ({badges.length}개)</h3>
          <div className="border border-slate-200 rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">썸네일</TableHead>
                  <TableHead className="w-32">카테고리</TableHead>
                  <TableHead className="w-48">이름</TableHead>
                  <TableHead>설명</TableHead>
                  <TableHead className="text-right w-40">관리</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {badges.length > 0 ? (
                  badges.map((badge) => (
                    <TableRow key={badge.id}>
                      <TableCell>
                        <div className="flex items-center justify-center w-8 h-8">
                          <span className="text-2xl leading-none">{badge.icon}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs font-medium">
                          {badgeCategories.find(c => c.value === badge.category)?.label || badge.category}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium text-slate-900">{badge.name}</div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-slate-600 max-w-md truncate">
                          {badge.description || "-"}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            onClick={() => handleEdit(badge)}
                            disabled={isProcessing}
                            size="sm"
                            variant="outline"
                            className="gap-1.5 h-8"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                            수정
                          </Button>
                          <Button
                            onClick={() => handleDelete(badge.id)}
                            disabled={isProcessing}
                            size="sm"
                            variant="destructive"
                            className="gap-1.5 h-8"
                          >
                            {isProcessing && processingAction === 'delete' ? (
                              <>
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                삭제 중...
                              </>
                            ) : (
                              <>
                                <Trash2 className="h-3.5 w-3.5" />
                                삭제
                              </>
                            )}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-12 text-slate-500">
                      등록된 뱃지가 없습니다
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>

      {/* 뱃지 생성 Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="sm:max-w-lg bg-white rounded-xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">뱃지 생성</DialogTitle>
            <DialogDescription className="text-sm text-slate-500">
              새로운 뱃지를 생성합니다
            </DialogDescription>
          </DialogHeader>
          <div className="mt-6 space-y-4">
            <div>
              <Label htmlFor="badge_name" className="mb-2 block text-slate-700">
                이름 <span className="text-red-500">*</span>
              </Label>
              <Input
                id="badge_name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="예: 자산 10억+"
                className="bg-white border-slate-200"
              />
            </div>
            <div>
              <Label htmlFor="badge_icon" className="mb-2 block text-slate-700">
                아이콘 <span className="text-red-500">*</span>
              </Label>
              <Input
                id="badge_icon"
                value={formData.icon}
                onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                placeholder="예: 💎"
                className="bg-white border-slate-200"
              />
            </div>
            <div>
              <Label htmlFor="badge_category" className="mb-2 block text-slate-700">
                카테고리 <span className="text-red-500">*</span>
              </Label>
              <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                <SelectTrigger className="bg-white border-slate-200">
                  <SelectValue placeholder="카테고리 선택" />
                </SelectTrigger>
                <SelectContent className="z-[9999]">
                  {badgeCategories.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="badge_description" className="mb-2 block text-slate-700">
                설명
              </Label>
              <Textarea
                id="badge_description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="뱃지에 대한 설명을 입력하세요"
                rows={3}
                className="bg-white border-slate-200 resize-none"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => setShowCreateDialog(false)}
                className="h-11 px-6"
              >
                취소
              </Button>
              <Button
                onClick={handleCreate}
                disabled={isProcessing || !formData.name || !formData.icon || !formData.category}
                className={cn(
                  "h-11 px-8 font-bold transition-all",
                  "bg-slate-900 hover:bg-slate-800 text-white shadow-md hover:shadow-lg",
                  isProcessing && "opacity-70 cursor-not-allowed"
                )}
              >
                {isProcessing && processingAction === 'create' ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    생성 중...
                  </>
                ) : (
                  "생성하기"
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 뱃지 수정 Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="sm:max-w-lg bg-white rounded-xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">뱃지 수정</DialogTitle>
            <DialogDescription className="text-sm text-slate-500">
              뱃지 정보를 수정합니다
            </DialogDescription>
          </DialogHeader>
          <div className="mt-6 space-y-4">
            <div>
              <Label htmlFor="edit_badge_name" className="mb-2 block text-slate-700">
                이름 <span className="text-red-500">*</span>
              </Label>
              <Input
                id="edit_badge_name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="예: 자산 10억+"
                className="bg-white border-slate-200"
              />
            </div>
            <div>
              <Label htmlFor="edit_badge_icon" className="mb-2 block text-slate-700">
                아이콘 <span className="text-red-500">*</span>
              </Label>
              <Input
                id="edit_badge_icon"
                value={formData.icon}
                onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                placeholder="예: 💎"
                className="bg-white border-slate-200"
              />
            </div>
            <div>
              <Label htmlFor="edit_badge_category" className="mb-2 block text-slate-700">
                카테고리 <span className="text-red-500">*</span>
              </Label>
              <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                <SelectTrigger className="bg-white border-slate-200">
                  <SelectValue placeholder="카테고리 선택" />
                </SelectTrigger>
                <SelectContent className="z-[9999]">
                  {badgeCategories.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="edit_badge_description" className="mb-2 block text-slate-700">
                설명
              </Label>
              <Textarea
                id="edit_badge_description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="뱃지에 대한 설명을 입력하세요"
                rows={3}
                className="bg-white border-slate-200 resize-none"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowEditDialog(false)
                  setEditingBadge(null)
                }}
                className="h-11 px-6"
              >
                취소
              </Button>
              <Button
                onClick={handleUpdate}
                disabled={isProcessing || !formData.name || !formData.icon || !formData.category}
                className={cn(
                  "h-11 px-8 font-bold transition-all",
                  "bg-slate-900 hover:bg-slate-800 text-white shadow-md hover:shadow-lg",
                  isProcessing && "opacity-70 cursor-not-allowed"
                )}
              >
                {isProcessing && processingAction === 'update' ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    수정 중...
                  </>
                ) : (
                  "수정하기"
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 증빙 자료 보기 Dialog */}
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
                {viewingEvidence}
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

