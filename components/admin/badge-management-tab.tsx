"use client"

import { useState, useEffect, useMemo } from "react"
import { Medal, Plus, Edit2, Trash2, CheckCircle2, XCircle, Eye, GripVertical, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import Image from "next/image"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Switch } from "@/components/ui/switch"
import { createBadge, updateBadge, deleteBadge, updateBadgeStatus, toggleBadgeActive } from "@/lib/actions/admin"
import { updateBadgeCategoryOrder } from "@/lib/actions/badge-categories"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core"
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"

type BadgeType = {
  id: string
  name: string
  icon: string
  category: string
  description: string | null
  is_active?: boolean | null
}

type PendingBadgeType = {
  id: string
  status: string
  evidence: string | null
  proof_url?: string | null // proof_url 추가
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

type BadgeCategoryType = {
  category_value: string
  category_label: string
  sort_order: number
}

type BadgeManagementTabProps = {
  badges: BadgeType[]
  pendingBadges: PendingBadgeType[]
  badgeCategories?: BadgeCategoryType[]
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

// 개별 뱃지 행 컴포넌트 (로컬 state로 토글 상태 관리)
function BadgeRow({
  badge,
  badgeCategories,
  isProcessing,
  processingAction,
  onToggleActive,
  onEdit,
  onDelete,
}: {
  badge: BadgeType
  badgeCategories: typeof badgeCategories
  isProcessing: boolean
  processingAction: 'create' | 'update' | 'delete' | 'approve' | 'reject' | null
  onToggleActive: (badgeId: string, currentActive: boolean) => Promise<void>
  onEdit: (badge: BadgeType) => void
  onDelete: (badgeId: string) => void
}) {
  // 각 뱃지 행의 로컬 state (낙관적 업데이트용)
  const initialActive = badge.is_active !== false // null이나 undefined도 true로 처리
  const [isActive, setIsActive] = useState(initialActive)
  
  // props의 badge가 변경되면 로컬 state 동기화
  useEffect(() => {
    const newActive = badge.is_active !== false
    setIsActive(newActive)
  }, [badge.is_active])
  
  const handleToggle = async (checked: boolean) => {
    const previousState = isActive
    
    console.log(`[BadgeRow] 토글 시도: badgeId=${badge.id}, previousState=${previousState}, newState=${checked}`)
    
    // 낙관적 업데이트: UI를 먼저 업데이트
    setIsActive(checked)
    
    try {
      // 서버 API 호출
      console.log(`[BadgeRow] API 호출 시작: badgeId=${badge.id}, previousState=${previousState}, newState=${checked}`)
      await onToggleActive(badge.id, previousState)
      console.log(`[BadgeRow] 토글 성공: badgeId=${badge.id}, newState=${checked}`)
    } catch (error) {
      // 실패 시 이전 상태로 롤백
      console.error("API Error Details:", error)
      console.error("토글 실패 원인:", error)
      console.error("토글 실패 상세:", {
        badgeId: badge.id,
        badgeName: badge.name,
        previousState,
        attemptedState: checked,
        errorMessage: error instanceof Error ? error.message : String(error),
        errorStack: error instanceof Error ? error.stack : undefined,
        errorName: error instanceof Error ? error.name : undefined,
        errorCode: (error as any)?.code,
        errorDetails: (error as any)?.details,
        errorHint: (error as any)?.hint,
      })
      console.error("[BadgeRow] 상태 롤백: previousState=", previousState)
      setIsActive(previousState)
      throw error // 상위 컴포넌트에서 에러 처리하도록
    }
  }
  
  const isThisBadgeProcessing = isProcessing && processingAction === 'update'
  
  return (
    <TableRow 
      className={cn(
        "transition-all duration-200",
        !isActive && "opacity-50 grayscale"
      )}
    >
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
        <div className="flex items-center justify-end gap-3">
          <div className="flex items-center gap-3">
            <Switch
              checked={isActive}
              onCheckedChange={handleToggle}
              disabled={isThisBadgeProcessing}
              className={cn(
                "w-11 h-6 transition-all duration-200",
                isActive 
                  ? "data-[state=checked]:bg-green-600" 
                  : "data-[state=unchecked]:bg-gray-300"
              )}
            />
            <span className={cn(
              "text-sm whitespace-nowrap transition-colors duration-200 font-medium",
              isActive ? "text-green-700" : "text-gray-500"
            )}>
              {isActive ? "공개" : "비공개"}
            </span>
          </div>
          <Button
            onClick={() => onEdit(badge)}
            disabled={isThisBadgeProcessing}
            size="sm"
            variant="outline"
            className="gap-1.5 h-8"
          >
            <Edit2 className="h-3.5 w-3.5" />
            수정
          </Button>
          <Button
            onClick={() => onDelete(badge.id)}
            disabled={isThisBadgeProcessing}
            size="sm"
            variant="ghost"
            className={cn(
              "gap-1.5 h-8 text-red-600 hover:text-red-700 hover:bg-red-50 border border-red-200",
              "transition-colors duration-200"
            )}
          >
            <Trash2 className="h-3.5 w-3.5" />
            삭제
          </Button>
        </div>
      </TableCell>
    </TableRow>
  )
}

// 테스트용 더미 데이터 (개발 환경에서만 사용)
const DUMMY_BADGES: BadgeType[] = [
  { id: '1', name: '자산 10억+', icon: '💎', category: 'personal_asset', description: '순자산 10억 원 이상 인증', is_active: true },
  { id: '2', name: '매출 50억+', icon: '📈', category: 'corporate_revenue', description: '연 매출 50억 원 이상 인증', is_active: true },
  { id: '3', name: '투자 10억+', icon: '💰', category: 'investment', description: '누적 투자 집행액 10억 원 이상', is_active: true },
  { id: '4', name: '기업가치 100억+', icon: '🏙️', category: 'valuation', description: '최근 투자 유치 기준 기업가치 100억 원 이상', is_active: false },
  { id: '5', name: '변호사', icon: '⚖️', category: 'professional', description: '대한민국 변호사 자격 인증', is_active: true },
]

// 카테고리 섹션 컴포넌트 (드래그 가능)
function CategorySection({
  categoryValue,
  categoryLabel,
  badges,
  badgeCategories,
  isProcessing,
  processingAction,
  onToggleActive,
  onEdit,
  onDelete,
}: {
  categoryValue: string
  categoryLabel: string
  badges: BadgeType[]
  badgeCategories: typeof badgeCategories // 하드코딩된 배열 타입
  isProcessing: boolean
  processingAction: 'create' | 'update' | 'delete' | 'approve' | 'reject' | null
  onToggleActive: (badgeId: string, currentActive: boolean) => Promise<void>
  onEdit: (badge: BadgeType) => void
  onDelete: (badgeId: string) => void
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: categoryValue })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div ref={setNodeRef} style={style} className="mb-6">
      {/* 카테고리 헤더 */}
      <div className="bg-gray-100 p-3 rounded-lg mb-3 flex items-center gap-3 cursor-move">
        <div
          {...attributes}
          {...listeners}
          className="flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors"
        >
          <GripVertical className="h-5 w-5" />
        </div>
        <h3 className="text-lg font-semibold text-slate-900">
          {categoryLabel}
        </h3>
        <Badge variant="outline" className="text-xs">
          {badges.length}개
        </Badge>
      </div>

      {/* 뱃지 리스트 (들여쓰기) */}
      {badges.length > 0 ? (
        <div className="ml-4 border border-slate-200 rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">썸네일</TableHead>
                <TableHead className="w-32">카테고리</TableHead>
                <TableHead className="w-48">이름</TableHead>
                <TableHead>설명</TableHead>
                <TableHead className="text-right w-64">관리</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {badges.map((badge) => (
                <BadgeRow
                  key={badge.id}
                  badge={badge}
                  badgeCategories={badgeCategories}
                  isProcessing={isProcessing}
                  processingAction={processingAction}
                  onToggleActive={onToggleActive}
                  onEdit={onEdit}
                  onDelete={onDelete}
                />
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="ml-4 border border-slate-200 rounded-lg p-8 text-center text-slate-500">
          이 카테고리에 뱃지가 없습니다
        </div>
      )}
    </div>
  )
}

export function BadgeManagementTab({ badges, pendingBadges, badgeCategories: badgeCategoriesProp = [] }: BadgeManagementTabProps) {
  const router = useRouter()
  const { toast } = useToast()
  // badges가 비어있으면 더미 데이터 사용 (개발 환경)
  const initialBadges = badges && badges.length > 0 ? badges : (process.env.NODE_ENV === 'development' ? DUMMY_BADGES : [])
  const [localBadges, setLocalBadges] = useState<BadgeType[]>(initialBadges)
  const [localBadgeCategories, setLocalBadgeCategories] = useState<BadgeCategoryType[]>(badgeCategories)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showEvidenceDialog, setShowEvidenceDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [deletingBadgeId, setDeletingBadgeId] = useState<string | null>(null)
  const [editingBadge, setEditingBadge] = useState<BadgeType | null>(null)
  const [viewingEvidence, setViewingEvidence] = useState<{text: string, url?: string | null}>({text: "", url: null})
  const [isProcessing, setIsProcessing] = useState(false)
  const [processingAction, setProcessingAction] = useState<'create' | 'update' | 'delete' | 'approve' | 'reject' | null>(null)
  
  const [formData, setFormData] = useState({
    name: "",
    icon: "",
    category: "",
    description: "",
  })

  // 드래그앤드롭 센서 설정
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  // badges prop이 변경되면 로컬 state 업데이트
  useEffect(() => {
    if (badges && badges.length > 0) {
      setLocalBadges(badges)
    } else if (process.env.NODE_ENV === 'development') {
      // 개발 환경에서만 더미 데이터 사용
      setLocalBadges(DUMMY_BADGES)
    } else {
      setLocalBadges([])
    }
  }, [badges])

  // badgeCategories prop이 변경되면 로컬 state 업데이트
  useEffect(() => {
    if (badgeCategoriesProp && badgeCategoriesProp.length > 0) {
      setLocalBadgeCategories(badgeCategoriesProp)
    } else {
      // DB에 데이터가 없으면 기본 카테고리 목록 사용
      const defaultCategories: BadgeCategoryType[] = badgeCategories.map((cat, index) => ({
        category_value: cat.value,
        category_label: cat.label,
        sort_order: index,
      }))
      setLocalBadgeCategories(defaultCategories)
    }
  }, [badgeCategoriesProp])

  // 카테고리별로 뱃지 그룹화
  const badgesByCategory = useMemo(() => {
    const grouped: Record<string, BadgeType[]> = {}
    
    // 먼저 모든 카테고리에 대해 빈 배열 초기화
    localBadgeCategories.forEach((cat) => {
      grouped[cat.category_value] = []
    })
    
    // 뱃지를 카테고리별로 분류
    localBadges.forEach((badge) => {
      if (!grouped[badge.category]) {
        grouped[badge.category] = []
      }
      grouped[badge.category].push(badge)
    })
    
    return grouped
  }, [localBadges, localBadgeCategories])

  // 카테고리 순서에 따라 정렬된 카테고리 목록
  const sortedCategories = useMemo(() => {
    return [...localBadgeCategories].sort((a, b) => a.sort_order - b.sort_order)
  }, [localBadgeCategories])

  // 드래그앤드롭 핸들러
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event

    if (!over || active.id === over.id) {
      return
    }

    const oldIndex = sortedCategories.findIndex((cat) => cat.category_value === active.id)
    const newIndex = sortedCategories.findIndex((cat) => cat.category_value === over.id)

    if (oldIndex === -1 || newIndex === -1) {
      return
    }

    // 낙관적 업데이트: 화면을 즉시 업데이트
    const newCategories = arrayMove(sortedCategories, oldIndex, newIndex)
    const updatedCategories = newCategories.map((cat, index) => ({
      ...cat,
      sort_order: index,
    }))
    setLocalBadgeCategories(updatedCategories)

    // 백그라운드에서 DB 업데이트
    try {
      await updateBadgeCategoryOrder(
        updatedCategories.map((cat) => ({
          category_value: cat.category_value,
          sort_order: cat.sort_order,
        }))
      )
      toast({
        title: "순서 변경 완료",
        description: "카테고리 순서가 저장되었습니다.",
      })
      router.refresh()
    } catch (error) {
      console.error("Failed to update category order:", error)
      // 실패 시 이전 상태로 롤백
      setLocalBadgeCategories(badgeCategoriesProp)
      toast({
        variant: "destructive",
        title: "순서 변경 실패",
        description: error instanceof Error ? error.message : "카테고리 순서 변경에 실패했습니다.",
      })
    }
  }

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

  const handleDeleteClick = (badgeId: string) => {
    setDeletingBadgeId(badgeId)
    setShowDeleteDialog(true)
  }

  const handleDeleteConfirm = async () => {
    if (!deletingBadgeId) return

    setIsProcessing(true)
    setProcessingAction('delete')
    try {
      await deleteBadge(deletingBadgeId)
      
      // 로컬 state에서 즉시 제거
      setLocalBadges((prev) => prev.filter((badge) => badge.id !== deletingBadgeId))
      
      // 성공 토스트 메시지
      toast({
        title: "삭제 완료",
        description: "뱃지가 성공적으로 삭제되었습니다.",
      })
      
      setShowDeleteDialog(false)
      setDeletingBadgeId(null)
      router.refresh()
    } catch (error) {
      console.error("Failed to delete badge:", error)
      toast({
        variant: "destructive",
        title: "삭제 실패",
        description: error instanceof Error ? error.message : "뱃지 삭제에 실패했습니다.",
      })
    } finally {
      setIsProcessing(false)
      setProcessingAction(null)
    }
  }

  const handleToggleActive = async (badgeId: string, currentActive: boolean) => {
    const newActiveState = !currentActive
    
    console.log(`[handleToggleActive] 시작: badgeId=${badgeId}, currentActive=${currentActive}, newActiveState=${newActiveState}`)
    
    setIsProcessing(true)
    setProcessingAction('update')
    
    try {
      // 서버 API 호출
      console.log(`[handleToggleActive] toggleBadgeActive 호출: badgeId=${badgeId}, newActiveState=${newActiveState}`)
      await toggleBadgeActive(badgeId, newActiveState)
      console.log(`[handleToggleActive] toggleBadgeActive 성공: badgeId=${badgeId}`)
      
      // 성공 시 로컬 state 업데이트 (BadgeRow의 로컬 state와 동기화)
      setLocalBadges((prev) =>
        prev.map((badge) =>
          badge.id === badgeId ? { ...badge, is_active: newActiveState } : badge
        )
      )
      
      // 성공 시 토스트 메시지
      toast({
        title: newActiveState ? "뱃지 공개 처리" : "뱃지 비공개 처리",
        description: newActiveState 
          ? "뱃지가 공개로 설정되었습니다." 
          : "뱃지가 비공개로 설정되었습니다.",
      })
    } catch (error) {
      console.error("[handleToggleActive] API Error Details:", error)
      console.error("[handleToggleActive] Failed to toggle badge active:", {
        badgeId,
        currentActive,
        newActiveState,
        error: error instanceof Error ? error.message : String(error),
        errorCode: (error as any)?.code,
        errorDetails: (error as any)?.details,
        errorStack: error instanceof Error ? error.stack : undefined,
      })
      
      toast({
        variant: "destructive",
        title: "상태 변경 실패",
        description: error instanceof Error ? error.message : "뱃지 상태 변경에 실패했습니다.",
      })
      // 에러는 BadgeRow 컴포넌트에서 롤백 처리됨
      throw error
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
                  const proofUrl = badgeRequest.proof_url
                  const hasEvidence = !!badgeRequest.evidence || !!proofUrl
                  
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
                          {hasEvidence ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setViewingEvidence({
                                  text: badgeRequest.evidence || "",
                                  url: proofUrl
                                })
                                setShowEvidenceDialog(true)
                              }}
                              className="h-8 text-xs gap-1.5"
                            >
                              <Eye className="h-3 w-3" />
                              증빙 자료 확인
                              {proofUrl && <span className="text-[10px] bg-blue-50 text-blue-600 px-1 rounded">파일</span>}
                            </Button>
                          ) : (
                            <span className="text-sm text-slate-400">없음</span>
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
                            onClick={async () => {
                              await handleApprove(badgeRequest.id)
                            }}
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
                            onClick={async () => {
                              await handleReject(badgeRequest.id)
                            }}
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
          <h3 className="text-lg font-semibold text-slate-900 mb-4">전체 뱃지 목록 ({localBadges.length}개)</h3>
          
          {localBadges.length > 0 ? (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={sortedCategories.map((cat) => cat.category_value)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-0">
                  {sortedCategories.map((category) => {
                    const categoryBadges = badgesByCategory[category.category_value] || []
                    if (categoryBadges.length === 0) return null
                    
                    return (
                      <CategorySection
                        key={category.category_value}
                        categoryValue={category.category_value}
                        categoryLabel={category.category_label}
                        badges={categoryBadges}
                        badgeCategories={badgeCategories}
                        isProcessing={isProcessing}
                        processingAction={processingAction}
                        onToggleActive={handleToggleActive}
                        onEdit={handleEdit}
                        onDelete={handleDeleteClick}
                      />
                    )
                  })}
                </div>
              </SortableContext>
            </DndContext>
          ) : (
            <div className="border border-slate-200 rounded-lg p-12 text-center">
              <p className="text-slate-500">등록된 뱃지가 없습니다</p>
            </div>
          )}
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
            <DialogTitle className="text-lg font-bold">증빙 자료 확인</DialogTitle>
            <DialogDescription className="text-sm text-slate-500">
              사용자가 제출한 증빙 자료입니다
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4 space-y-4">
            {viewingEvidence.text && (
              <div>
                <h4 className="text-sm font-semibold text-slate-900 mb-2">설명</h4>
                <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                  <p className="text-sm text-slate-700 whitespace-pre-wrap break-words">
                    {viewingEvidence.text}
                  </p>
                </div>
              </div>
            )}
            
            {viewingEvidence.url && (
              <div>
                <h4 className="text-sm font-semibold text-slate-900 mb-2">첨부 파일</h4>
                {viewingEvidence.url.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                  <div className="relative w-full h-64 rounded-lg overflow-hidden border border-slate-200">
                    <Image 
                      src={viewingEvidence.url} 
                      alt="증빙 이미지"
                      fill
                      className="object-contain"
                    />
                  </div>
                ) : (
                  <Button asChild variant="outline" className="w-full justify-start">
                    <a href={viewingEvidence.url} target="_blank" rel="noopener noreferrer">
                      <FileText className="h-4 w-4 mr-2" />
                      파일 다운로드 / 보기
                    </a>
                  </Button>
                )}
              </div>
            )}

            {!viewingEvidence.text && !viewingEvidence.url && (
              <div className="p-8 text-center text-slate-500 bg-slate-50 rounded-lg border border-dashed border-slate-300">
                제출된 증빙 자료가 없습니다.
              </div>
            )}
          </div>
          <div className="flex justify-end pt-4">
            <Button onClick={() => setShowEvidenceDialog(false)}>
              닫기
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* 뱃지 삭제 확인 Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="bg-white z-[100]">
          <AlertDialogHeader>
            <AlertDialogTitle>뱃지 삭제 확인</AlertDialogTitle>
            <AlertDialogDescription>
              이 뱃지를 정말 삭제하시겠습니까? 이 뱃지를 사용 중인 사용자들에게도 영향을 미칩니다. 이 작업은 취소할 수 없습니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel 
              onClick={() => {
                setShowDeleteDialog(false)
                setDeletingBadgeId(null)
              }}
              disabled={isProcessing}
            >
              취소
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={isProcessing}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  삭제 중...
                </>
              ) : (
                "삭제"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

