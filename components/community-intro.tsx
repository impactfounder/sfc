"use client"

import { useState } from "react"
import { Pencil, Check, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { updateCommunityIntro } from "@/lib/actions/community"
import { toast } from "sonner"
import { PageHeader } from "@/components/page-header"

interface CommunityIntroProps {
  initialIntro: string
  canEdit: boolean
}

export function CommunityIntro({ initialIntro, canEdit }: CommunityIntroProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [intro, setIntro] = useState(initialIntro)
  const [isLoading, setIsLoading] = useState(false)

  const handleSave = async () => {
    try {
      setIsLoading(true)
      await updateCommunityIntro(intro)
      setIsEditing(false)
      toast.success("커뮤니티 소개글이 수정되었습니다.")
    } catch (error) {
      console.error(error)
      toast.error("수정에 실패했습니다.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancel = () => {
    setIntro(initialIntro)
    setIsEditing(false)
  }

  if (isEditing) {
    return (
      <div className="w-full bg-white p-6 rounded-xl border border-slate-200 shadow-sm mb-8 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-slate-900">커뮤니티 소개글 수정</h2>
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
          value={intro}
          onChange={(e) => setIntro(e.target.value)}
          className="min-h-[100px] text-base resize-none"
          placeholder="커뮤니티 소개글을 입력하세요..."
        />
        <p className="text-xs text-slate-500 mt-2 text-right">
          {intro.length}자
        </p>
      </div>
    )
  }

  return (
    <div className="relative group">
      <PageHeader
        title="커뮤니티"
        description={intro}
        className="w-full"
        compact={true}
      />
      {canEdit && (
        <Button
          size="icon"
          variant="secondary"
          className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm bg-white/80 hover:bg-white"
          onClick={() => setIsEditing(true)}
          title="소개글 수정"
        >
          <Pencil className="h-4 w-4 text-slate-600" />
        </Button>
      )}
    </div>
  )
}

