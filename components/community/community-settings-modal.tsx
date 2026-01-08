"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Loader2 } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { updateCommunitySettings } from "@/lib/actions/community"

interface CommunitySettingsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  community: {
    id: string
    name: string
    description: string | null
    is_private: boolean
    rules: string | null
    thumbnail_url: string | null
  }
  onSuccess?: () => void
}

export function CommunitySettingsModal({
  open,
  onOpenChange,
  community,
  onSuccess,
}: CommunitySettingsModalProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: community.name,
    description: community.description || "",
    is_private: community.is_private,
    rules: community.rules || "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name.trim()) {
      toast({
        title: "오류",
        description: "커뮤니티 이름을 입력해주세요.",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    try {
      const result = await updateCommunitySettings(community.id, {
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        is_private: formData.is_private,
        rules: formData.rules.trim() || undefined,
      })

      if (result.error) {
        throw new Error(result.error)
      }

      toast({
        title: "설정 저장 완료",
        description: "커뮤니티 설정이 업데이트되었습니다.",
      })

      onOpenChange(false)
      onSuccess?.()
      router.refresh()
    } catch (error: any) {
      toast({
        title: "설정 저장 실패",
        description: error.message || "다시 시도해주세요.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>커뮤니티 설정</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 커뮤니티 이름 */}
          <div className="space-y-2">
            <Label htmlFor="name">커뮤니티 이름</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="커뮤니티 이름을 입력하세요"
              disabled={isLoading}
            />
          </div>

          {/* 소개글 */}
          <div className="space-y-2">
            <Label htmlFor="description">소개글</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="커뮤니티 소개글을 입력하세요"
              rows={3}
              disabled={isLoading}
            />
          </div>

          {/* 공개/비공개 설정 */}
          <div className="space-y-3">
            <Label>공개 설정</Label>
            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
              <span className={`text-sm font-medium ${!formData.is_private ? "text-blue-600" : "text-slate-400"}`}>
                공개
              </span>
              <Switch
                id="is_private"
                checked={formData.is_private}
                onCheckedChange={(checked) => setFormData({ ...formData, is_private: checked })}
                disabled={isLoading}
                className="data-[state=checked]:bg-slate-600 data-[state=unchecked]:bg-blue-500"
              />
              <span className={`text-sm font-medium ${formData.is_private ? "text-slate-700" : "text-slate-400"}`}>
                비공개
              </span>
            </div>
            <p className="text-xs text-slate-500">
              {formData.is_private
                ? "멤버만 글을 볼 수 있고, 메인 피드에 글이 노출되지 않습니다"
                : "누구나 글을 볼 수 있고, 메인 피드에 글이 노출됩니다"}
            </p>
          </div>

          {/* 이용수칙 */}
          <div className="space-y-2">
            <Label htmlFor="rules">이용수칙</Label>
            <Textarea
              id="rules"
              value={formData.rules}
              onChange={(e) => setFormData({ ...formData, rules: e.target.value })}
              placeholder="커뮤니티 이용수칙을 입력하세요 (선택사항)"
              rows={4}
              disabled={isLoading}
            />
            <p className="text-xs text-slate-500">
              줄바꿈을 사용하여 여러 규칙을 작성할 수 있습니다
            </p>
          </div>

          {/* 버튼 */}
          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              취소
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              저장
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
