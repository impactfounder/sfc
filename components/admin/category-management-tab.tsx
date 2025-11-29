"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Trash2, Plus, Loader2 } from "lucide-react"
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

type Category = {
  id: string
  name: string
  type: "insight" | "partner"
  created_at: string
}

type CategoryManagementTabProps = {
  initialCategories?: Category[]
}

export function CategoryManagementTab({ initialCategories = [] }: CategoryManagementTabProps) {
  const [activeType, setActiveType] = useState<"insight" | "partner">("insight")
  const [categories, setCategories] = useState<Category[]>(initialCategories)
  const [newCategoryName, setNewCategoryName] = useState("")
  const [isAdding, setIsAdding] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const supabase = createClient()

  // 타입별 카테고리 필터링
  const filteredCategories = categories.filter(cat => cat.type === activeType)

  // 카테고리 목록 새로고침
  const refreshCategories = async () => {
    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .order("created_at", { ascending: true })

    if (!error && data) {
      setCategories(data)
    } else if (error) {
      console.error("카테고리 로드 실패:", error)
    }
  }

  // 컴포넌트 마운트 시 카테고리 새로고침
  useEffect(() => {
    const loadCategories = async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .order("created_at", { ascending: true })

      if (!error && data) {
        setCategories(data)
      } else if (error) {
        console.error("카테고리 로드 실패:", error)
      }
    }
    loadCategories()
  }, [])

  // 카테고리 추가
  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) return

    setIsAdding(true)
    try {
      const { data, error } = await supabase
        .from("categories")
        .insert({
          name: newCategoryName.trim(),
          type: activeType,
        })
        .select()
        .single()

      if (error) throw error

      setCategories([...categories, data])
      setNewCategoryName("")
    } catch (error) {
      console.error("카테고리 추가 실패:", error)
      alert("카테고리 추가에 실패했습니다.")
    } finally {
      setIsAdding(false)
    }
  }

  // 카테고리 삭제
  const handleDeleteCategory = async () => {
    if (!deletingId) return

    setIsDeleting(true)
    try {
      const { error } = await supabase
        .from("categories")
        .delete()
        .eq("id", deletingId)

      if (error) throw error

      setCategories(categories.filter(cat => cat.id !== deletingId))
      setDeletingId(null)
    } catch (error) {
      console.error("카테고리 삭제 실패:", error)
      alert("카테고리 삭제에 실패했습니다.")
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div>
      <h2 className="text-xl font-bold text-slate-900 mb-6">카테고리 관리</h2>

      {/* 탭 버튼 */}
      <div className="flex gap-2 mb-6 border-b border-slate-200">
        <button
          onClick={() => setActiveType("insight")}
          className={`px-4 py-2 font-medium transition-colors ${
            activeType === "insight"
              ? "border-b-2 border-slate-900 text-slate-900"
              : "text-slate-500 hover:text-slate-700"
          }`}
        >
          인사이트 카테고리
        </button>
        <button
          onClick={() => setActiveType("partner")}
          className={`px-4 py-2 font-medium transition-colors ${
            activeType === "partner"
              ? "border-b-2 border-slate-900 text-slate-900"
              : "text-slate-500 hover:text-slate-700"
          }`}
        >
          파트너스 카테고리
        </button>
      </div>

      {/* 카테고리 추가 폼 */}
      <div className="mb-6 flex gap-2">
        <Input
          placeholder="새 카테고리 이름 입력"
          value={newCategoryName}
          onChange={(e) => setNewCategoryName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              handleAddCategory()
            }
          }}
          className="flex-1"
        />
        <Button
          onClick={handleAddCategory}
          disabled={isAdding || !newCategoryName.trim()}
          className="gap-2"
        >
          {isAdding ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              추가 중...
            </>
          ) : (
            <>
              <Plus className="h-4 w-4" />
              추가
            </>
          )}
        </Button>
      </div>

      {/* 카테고리 목록 */}
      {filteredCategories.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {filteredCategories.map((category) => (
            <div
              key={category.id}
              className="flex items-center justify-between p-3 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
            >
              <span className="font-medium text-slate-900 text-sm">{category.name}</span>
              <Button
                variant="outline"
                size="sm"
                className="h-8 w-8 p-0 border-red-300 text-red-600 hover:bg-red-50 shrink-0"
                onClick={() => setDeletingId(category.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      ) : (
        <div className="py-12 text-center text-slate-500">
          등록된 카테고리가 없습니다
        </div>
      )}

      {/* 삭제 확인 다이얼로그 */}
      <AlertDialog open={!!deletingId} onOpenChange={(open) => !open && setDeletingId(null)}>
        <AlertDialogContent className="bg-white z-[100]">
          <AlertDialogHeader>
            <AlertDialogTitle>카테고리를 삭제하시겠습니까?</AlertDialogTitle>
            <AlertDialogDescription>
              이 작업은 취소할 수 없습니다. 카테고리가 영구적으로 삭제됩니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteCategory}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? "삭제 중..." : "삭제"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

