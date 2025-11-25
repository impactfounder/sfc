"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Edit, Trash2, Loader2 } from "lucide-react"
import { deleteEvent } from "@/lib/actions/events"

type EventActionButtonsProps = {
  eventId: string
  userId: string
}

export function EventActionButtons({ eventId, userId }: EventActionButtonsProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const router = useRouter()

  const handleEdit = () => {
    alert("수정 기능은 준비 중입니다.")
  }

  const handleDelete = async () => {
    if (!confirm("이벤트를 삭제하시겠습니까?\n\n이 작업은 취소할 수 없습니다. 이벤트와 모든 참가 신청 정보가 영구적으로 삭제됩니다.")) {
      return
    }

    setIsDeleting(true)
    try {
      await deleteEvent(eventId)
      router.push("/events")
      router.refresh()
    } catch (error) {
      console.error("Failed to delete event:", error)
      alert("이벤트 삭제에 실패했습니다.")
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Button 
        variant="outline" 
        size="sm" 
        className="bg-white border-slate-300 hover:bg-slate-50 text-slate-700"
        onClick={handleEdit}
      >
        <Edit className="mr-2 h-3.5 w-3.5" />
        수정
      </Button>
      <Button
        variant="outline"
        size="sm"
        className="bg-white border-red-300 text-red-600 hover:bg-red-50"
        onClick={handleDelete}
        disabled={isDeleting}
      >
        {isDeleting ? (
          <>
            <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
            삭제 중...
          </>
        ) : (
          <>
            <Trash2 className="mr-2 h-3.5 w-3.5" />
            삭제
          </>
        )}
      </Button>
    </div>
  )
}

