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
import { Loader2, Trash2, AlertTriangle, ImageIcon, RefreshCw } from "lucide-react"
import { getSuggestedBannerUrls } from "@/lib/utils/unsplash"
import Image from "next/image"
import { toast } from "@/hooks/use-toast"
import { updateCommunitySettings, deleteCommunity } from "@/lib/actions/community"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

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
    banner_url: string | null
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
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteConfirmName, setDeleteConfirmName] = useState("")
  const [formData, setFormData] = useState({
    name: community.name,
    description: community.description || "",
    is_private: community.is_private,
    rules: community.rules || "",
    thumbnail_url: community.thumbnail_url || "",
    banner_url: community.banner_url || "",
  })

  // Unsplash 추천 배너 목록
  const suggestedBanners = getSuggestedBannerUrls(community.description)

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
        thumbnail_url: formData.thumbnail_url.trim() || undefined,
        banner_url: formData.banner_url.trim() || undefined,
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

  const handleDelete = async () => {
    if (deleteConfirmName !== community.name) {
      toast({
        title: "삭제 실패",
        description: "커뮤니티 이름이 일치하지 않습니다.",
        variant: "destructive",
      })
      return
    }

    setIsDeleting(true)
    try {
      const result = await deleteCommunity(community.id)

      if (result.error) {
        throw new Error(result.error)
      }

      toast({
        title: "삭제 완료",
        description: "커뮤니티가 삭제되었습니다.",
      })

      onOpenChange(false)
      router.push("/community")
    } catch (error: any) {
      toast({
        title: "삭제 실패",
        description: error.message || "다시 시도해주세요.",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
      setDeleteConfirmName("")
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

          {/* 배너 이미지 */}
          <div className="space-y-3">
            <Label>배너 이미지</Label>
            {/* 현재 배너 미리보기 */}
            {formData.banner_url && (
              <div className="relative h-24 rounded-lg overflow-hidden bg-slate-100">
                <Image
                  src={formData.banner_url}
                  alt="배너 미리보기"
                  fill
                  className="object-cover"
                />
              </div>
            )}
            {/* URL 입력 */}
            <Input
              value={formData.banner_url}
              onChange={(e) => setFormData({ ...formData, banner_url: e.target.value })}
              placeholder="배너 이미지 URL (Unsplash 등)"
              disabled={isLoading}
            />
            {/* 추천 배너 */}
            <div className="space-y-2">
              <p className="text-xs text-slate-500 flex items-center gap-1">
                <ImageIcon className="h-3 w-3" />
                추천 배너 (클릭하여 선택)
              </p>
              <div className="grid grid-cols-3 gap-2">
                {suggestedBanners.map((url, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setFormData({ ...formData, banner_url: url })}
                    className={`relative h-12 rounded-md overflow-hidden border-2 transition-all ${
                      formData.banner_url === url
                        ? "border-blue-500 ring-2 ring-blue-200"
                        : "border-transparent hover:border-slate-300"
                    }`}
                  >
                    <Image
                      src={url}
                      alt={`추천 배너 ${idx + 1}`}
                      fill
                      className="object-cover"
                    />
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 커뮤니티 아이콘 */}
          <div className="space-y-2">
            <Label htmlFor="thumbnail_url">커뮤니티 아이콘 URL</Label>
            <Input
              id="thumbnail_url"
              value={formData.thumbnail_url}
              onChange={(e) => setFormData({ ...formData, thumbnail_url: e.target.value })}
              placeholder="아이콘 이미지 URL (선택사항)"
              disabled={isLoading}
            />
            <p className="text-xs text-slate-500">
              정사각형 이미지를 권장합니다 (예: 200x200px)
            </p>
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

          {/* 위험 영역 - 커뮤니티 삭제 */}
          <div className="mt-6 pt-6 border-t border-red-100">
            <div className="flex items-start gap-3 p-4 bg-red-50 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5 shrink-0" />
              <div className="flex-1">
                <h4 className="text-sm font-semibold text-red-700 mb-1">위험 영역</h4>
                <p className="text-xs text-red-600 mb-3">
                  커뮤니티를 삭제하면 모든 게시글, 멤버 정보가 함께 삭제되며 복구할 수 없습니다.
                </p>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="gap-1.5"
                      disabled={isLoading || isDeleting}
                    >
                      <Trash2 className="h-4 w-4" />
                      커뮤니티 삭제
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="bg-white">
                    <AlertDialogHeader>
                      <AlertDialogTitle className="flex items-center gap-2 text-red-600">
                        <AlertTriangle className="h-5 w-5" />
                        커뮤니티 삭제
                      </AlertDialogTitle>
                      <AlertDialogDescription asChild>
                        <div className="text-left space-y-3">
                          <p className="text-slate-600">
                            <strong className="text-slate-900">{community.name}</strong> 커뮤니티를 정말 삭제하시겠습니까?
                          </p>
                          <p className="text-red-600 font-medium">
                            이 작업은 되돌릴 수 없습니다. 모든 게시글과 멤버 정보가 영구적으로 삭제됩니다.
                          </p>
                          <div className="pt-2">
                            <Label htmlFor="delete-confirm" className="text-xs text-slate-500">
                              삭제를 확인하려면 커뮤니티 이름을 정확히 입력하세요
                            </Label>
                            <Input
                              id="delete-confirm"
                              value={deleteConfirmName}
                              onChange={(e) => setDeleteConfirmName(e.target.value)}
                              placeholder={community.name}
                              className="mt-1.5 bg-white"
                            />
                          </div>
                        </div>
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel onClick={() => setDeleteConfirmName("")}>
                        취소
                      </AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleDelete}
                        disabled={isDeleting || deleteConfirmName !== community.name}
                        className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
                      >
                        {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        삭제
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
