"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { MoreVertical, Edit, Trash2 } from "lucide-react"
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
import { deletePost } from "@/lib/actions/posts"

type PostActionsProps = {
  postId: string
  isAuthor: boolean
  isMaster?: boolean
  isAdmin?: boolean
  slug?: string // 게시판 slug (선택사항)
  redirectUrl?: string // 삭제 후 리다이렉트 URL (선택사항)
}

export function PostActions({ postId, isAuthor, isMaster = false, isAdmin = false, slug, redirectUrl }: PostActionsProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const router = useRouter()

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      await deletePost(postId)
      // redirectUrl이 있으면 그것을 사용, 없으면 기본값
      const redirectPath = redirectUrl || (slug ? `/community/board/${slug}` : "/community/posts")
      router.push(redirectPath)
      router.refresh()
    } catch (error) {
      console.error("Failed to delete post:", error)
      alert("게시글 삭제에 실패했습니다.")
    } finally {
      setIsDeleting(false)
    }
  }

  // 작성자가 아니고 관리자도 아니면 아무것도 표시하지 않음
  if (!isAuthor && !isMaster && !isAdmin) {
    return null
  }

  // 삭제 가능 여부 (작성자 또는 관리자/마스터)
  const canDelete = isAuthor || isMaster || isAdmin
  // 수정 가능 여부 (작성자만)
  const canEdit = isAuthor

  return (
    <>
      <div className="h-8 w-8 shrink-0 flex items-center justify-center">
        <DropdownMenu modal={false}>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent 
            align="end" 
            className="bg-white border-slate-200 shadow-lg z-50"
            onOpenAutoFocus={(e) => e.preventDefault()}
            onCloseAutoFocus={(e) => e.preventDefault()}
          >
            {canEdit && (
              <DropdownMenuItem onClick={() => {
                // slug가 있으면 게시판별 수정 페이지로, 없으면 기본 수정 페이지로
                const editUrl = slug 
                  ? `/community/board/${slug}/${postId}/edit`
                  : `/community/posts/${postId}/edit`
                router.push(editUrl)
              }} className="bg-white hover:bg-slate-50">
                <Edit className="mr-2 h-4 w-4" />
                수정
              </DropdownMenuItem>
            )}
            {canDelete && (
              <DropdownMenuItem className="text-red-600 bg-white hover:bg-red-50" onClick={() => setShowDeleteDialog(true)}>
                <Trash2 className="mr-2 h-4 w-4" />
                삭제
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="bg-white">
          <AlertDialogHeader>
            <AlertDialogTitle>게시글을 삭제하시겠습니까?</AlertDialogTitle>
            <AlertDialogDescription>
              이 작업은 취소할 수 없습니다. 게시글과 모든 댓글이 영구적으로 삭제됩니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel variant="outline">취소</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete} 
              disabled={isDeleting} 
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isDeleting ? "삭제 중..." : "삭제"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
