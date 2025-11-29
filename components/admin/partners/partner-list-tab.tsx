"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Plus, Pencil, Trash2, Loader2, CheckCircle2 } from "lucide-react"
import { useRouter } from "next/navigation"

type PartnerService = {
  id: string
  title: string
  description: string
  category: string
  thumbnail_url: string | null
  is_verified: boolean
  created_at: string
  profiles?: {
    id: string
    full_name: string | null
  } | null
}

type Category = {
  id: string
  name: string
  type: "insight" | "partner"
}

type PartnerListTabProps = {
  initialServices?: PartnerService[]
  initialCategories?: Category[]
}

export function PartnerListTab({ initialServices = [], initialCategories = [] }: PartnerListTabProps) {
  const router = useRouter()
  const supabase = createClient()
  const [services, setServices] = useState<PartnerService[]>(initialServices)
  const [categories, setCategories] = useState<Category[]>(initialCategories)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [editingService, setEditingService] = useState<PartnerService | null>(null)

  // 폼 상태
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    thumbnail_url: "",
    is_verified: false,
  })

  // 카테고리 목록 새로고침
  useEffect(() => {
    const loadCategories = async () => {
      const { data } = await supabase
        .from("categories")
        .select("id, name, type")
        .eq("type", "partner")
        .order("created_at", { ascending: true })

      if (data) {
        setCategories(data)
      }
    }
    loadCategories()
  }, [])

  // 서비스 목록 새로고침
  const refreshServices = async () => {
    const { data } = await supabase
      .from("partner_services")
      .select(`
        *,
        profiles:provider_id (
          id,
          full_name
        )
      `)
      .order("is_verified", { ascending: false })
      .order("created_at", { ascending: false })

    if (data) {
      setServices(data)
    }
  }

  // 새 파트너 등록 모달 열기
  const handleNewPartner = () => {
    setEditingService(null)
    setFormData({
      title: "",
      description: "",
      category: "",
      thumbnail_url: "",
      is_verified: false,
    })
    setIsDialogOpen(true)
  }

  // 파트너 수정 모달 열기
  const handleEditPartner = (service: PartnerService) => {
    setEditingService(service)
    setFormData({
      title: service.title,
      description: service.description,
      category: service.category,
      thumbnail_url: service.thumbnail_url || "",
      is_verified: service.is_verified,
    })
    setIsDialogOpen(true)
  }

  // 파트너 저장
  const handleSave = async () => {
    if (!formData.title.trim() || !formData.description.trim() || !formData.category) {
      alert("제목, 설명, 카테고리를 모두 입력해주세요.")
      return
    }

    setIsSaving(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        throw new Error("로그인이 필요합니다.")
      }

      if (editingService) {
        // 수정
        const { error } = await supabase
          .from("partner_services")
          .update({
            title: formData.title.trim(),
            description: formData.description.trim(),
            category: formData.category,
            thumbnail_url: formData.thumbnail_url || null,
            is_verified: formData.is_verified,
          })
          .eq("id", editingService.id)

        if (error) throw error
      } else {
        // 생성
        const { error } = await supabase
          .from("partner_services")
          .insert({
            title: formData.title.trim(),
            description: formData.description.trim(),
            category: formData.category,
            thumbnail_url: formData.thumbnail_url || null,
            is_verified: formData.is_verified,
            provider_id: user.id,
          })

        if (error) throw error
      }

      setIsDialogOpen(false)
      refreshServices()
      router.refresh()
    } catch (error) {
      console.error("파트너 저장 실패:", error)
      alert(error instanceof Error ? error.message : "파트너 저장에 실패했습니다.")
    } finally {
      setIsSaving(false)
    }
  }

  // 파트너 삭제
  const handleDelete = async () => {
    if (!deletingId) return

    setIsDeleting(true)
    try {
      const { error } = await supabase
        .from("partner_services")
        .delete()
        .eq("id", deletingId)

      if (error) throw error

      setServices(services.filter(s => s.id !== deletingId))
      setDeletingId(null)
      router.refresh()
    } catch (error) {
      console.error("파트너 삭제 실패:", error)
      alert("파트너 삭제에 실패했습니다.")
    } finally {
      setIsDeleting(false)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    })
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-slate-900">제휴 업체 목록</h2>
        <Button onClick={handleNewPartner} className="gap-2">
          <Plus className="h-4 w-4" />
          새 파트너 등록
        </Button>
      </div>

      {services.length > 0 ? (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>제목</TableHead>
              <TableHead>카테고리</TableHead>
              <TableHead>제공자</TableHead>
              <TableHead>인증 상태</TableHead>
              <TableHead>등록일</TableHead>
              <TableHead className="text-right">관리</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {services.map((service) => (
              <TableRow key={service.id}>
                <TableCell>
                  <div className="font-medium text-slate-900">{service.title}</div>
                  <div className="text-sm text-slate-500 line-clamp-1 mt-1">
                    {service.description}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="secondary">{service.category}</Badge>
                </TableCell>
                <TableCell>
                  <div className="text-sm text-slate-600">
                    {service.profiles?.full_name || "알 수 없음"}
                  </div>
                </TableCell>
                <TableCell>
                  {service.is_verified ? (
                    <Badge className="bg-green-100 text-green-700 border-green-300">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      인증됨
                    </Badge>
                  ) : (
                    <Badge variant="outline">미인증</Badge>
                  )}
                </TableCell>
                <TableCell>
                  <div className="text-sm text-slate-600">
                    {formatDate(service.created_at)}
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEditPartner(service)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-red-300 text-red-600 hover:bg-red-50"
                      onClick={() => setDeletingId(service.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : (
        <div className="py-12 text-center text-slate-500">
          등록된 파트너가 없습니다
        </div>
      )}

      {/* 파트너 등록/수정 다이얼로그 */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingService ? "파트너 수정" : "새 파트너 등록"}
            </DialogTitle>
            <DialogDescription>
              제휴 업체 정보를 입력해주세요.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">제목 *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="파트너 서비스 제목"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">카테고리 *</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData({ ...formData, category: value })}
              >
                <SelectTrigger id="category">
                  <SelectValue placeholder="카테고리를 선택하세요" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.name}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">설명 *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="서비스에 대한 설명을 입력하세요"
                rows={5}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="thumbnail_url">썸네일 URL</Label>
              <Input
                id="thumbnail_url"
                value={formData.thumbnail_url}
                onChange={(e) => setFormData({ ...formData, thumbnail_url: e.target.value })}
                placeholder="https://example.com/image.jpg"
              />
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="is_verified"
                checked={formData.is_verified}
                onChange={(e) => setFormData({ ...formData, is_verified: e.target.checked })}
                className="rounded border-slate-300"
              />
              <Label htmlFor="is_verified" className="cursor-pointer">
                SFC 인증 파트너로 표시
              </Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              취소
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  저장 중...
                </>
              ) : (
                "저장"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 삭제 확인 다이얼로그 */}
      <AlertDialog open={!!deletingId} onOpenChange={(open) => !open && setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>파트너를 삭제하시겠습니까?</AlertDialogTitle>
            <AlertDialogDescription>
              이 작업은 취소할 수 없습니다. 파트너 정보가 영구적으로 삭제됩니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
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

