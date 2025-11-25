"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Trash2 } from "lucide-react"
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
import { deleteEvent } from "@/lib/actions/events"

type DeleteEventButtonProps = {
  eventId: string
}

export function DeleteEventButton({ eventId }: DeleteEventButtonProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const router = useRouter()

  const handleDelete = async () => {
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
      setShowDeleteDialog(false)
    }
  }

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className="bg-white border-red-300 text-red-600 hover:bg-red-50"
        onClick={() => setShowDeleteDialog(true)}
      >
        <Trash2 className="mr-2 h-3.5 w-3.5" />
        삭제
      </Button>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="bg-white z-[100]">
          <AlertDialogHeader>
            <AlertDialogTitle>이벤트를 삭제하시겠습니까?</AlertDialogTitle>
            <AlertDialogDescription>
              이 작업은 취소할 수 없습니다. 이벤트와 모든 참가 신청 정보가 영구적으로 삭제됩니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={isDeleting} className="bg-red-600 hover:bg-red-700">
              {isDeleting ? "삭제 중..." : "삭제"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

