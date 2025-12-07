"use client"

import { useState } from "react"
import { Pencil, Check, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { updateCommunityDescription } from "@/lib/actions/community"
import { toast } from "sonner"
import { PageHeader } from "@/components/page-header"
import { useRouter } from "next/navigation"

interface CommunityBannerProps {
  title: string
  description?: string
  communityId: string | null
  canEdit: boolean
  slug: string
}

export function CommunityBanner({ 
  title, 
  description: initialDescription, 
  communityId, 
  canEdit,
  slug 
}: CommunityBannerProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [description, setDescription] = useState(initialDescription || "")
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  // 디버깅용 로그
  console.log('CommunityBanner props:', {
    title,
    communityId,
    canEdit,
    slug,
    description: initialDescription
  })

  const handleSave = async () => {
    if (!communityId) {
      toast.error("커뮤니티 정보를 찾을 수 없습니다.")
      return
    }

    try {
      setIsLoading(true)
      await updateCommunityDescription(communityId, description)
      setIsEditing(false)
      toast.success("커뮤니티 소개가 수정되었습니다.")
      router.refresh()
    } catch (error) {
      console.error(error)
      toast.error("수정에 실패했습니다.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancel = () => {
    setDescription(initialDescription || "")
    setIsEditing(false)
  }

  if (!canEdit || !communityId) {
    // 수정 불가능한 게시판 (공지사항, 자유게시판 등)
    return (
      <PageHeader
        title={title}
        description={description}
        className="w-full mb-0"
        compact={true}
      />
    )
  }

  if (isEditing) {
    return (
      <div className="w-full bg-white p-6 rounded-xl border border-slate-200 shadow-sm animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-slate-900">{title} 소개 수정</h2>
          <div className="flex gap-2">
            <Button size="sm" variant="ghost" onClick={handleCancel} disabled={isLoading}>
              <X className="h-4 w-4 mr-1" />
              취소
            </Button>
            <Button size="sm" onClick={handleSave} disabled={isLoading}>
              <Check className="h-4 w-4 mr-1" />
              저장
            </Button>
          </div>
        </div>
        <Textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="min-h-[100px] text-base resize-none"
          placeholder="커뮤니티 소개글을 입력하세요..."
        />
        <p className="text-xs text-slate-500 mt-2 text-right">
          {description.length}자
        </p>
      </div>
    )
  }

  return (
    <div className="relative group">
      <PageHeader
        title={title}
        description={description}
        className="w-full mb-0"
        compact={true}
      >
        {/* PageHeader의 children으로 버튼 전달 */}
        <Button
          size="icon"
          variant="secondary"
          className="opacity-0 group-hover:opacity-100 transition-opacity shadow-sm bg-white/80 hover:bg-white"
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            console.log('Edit button clicked!')
            setIsEditing(true)
          }}
          title="소개글 수정"
        >
          <Pencil className="h-4 w-4 text-slate-600" />
        </Button>
      </PageHeader>
    </div>
  )
}

