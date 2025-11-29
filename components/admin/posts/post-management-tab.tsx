"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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
import { Separator } from "@/components/ui/separator"
import { Eye, MoreVertical, Trash2, EyeOff, MoveRight, Loader2 } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { PartnerCategoryTab } from "./partner-category-tab-simple"
import { cn } from "@/lib/utils"

type Post = {
  id: string
  title: string
  created_at: string
  visibility?: string | null
  board_categories?: {
    id: string
    name: string | null
    slug: string | null
  } | null
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

type PostManagementTabProps = {
  boardType: "all" | "free" | "insights" | "partners" | "announcement"
  initialPosts?: Post[]
  initialCategories?: Category[]
}

// 게시판 타입별 slug 매핑
const BOARD_TYPE_SLUGS: Record<string, string[]> = {
  all: [],
  free: ["free", "free-board"],
  insights: ["insights"],
  partners: ["partners"],
  announcement: ["announcement", "announcements"],
}

// 카테고리가 필요한 게시판 타입
const CATEGORY_REQUIRED_BOARDS = ["insights", "partners"]

export function PostManagementTab({
  boardType,
  initialPosts = [],
  initialCategories = [],
}: PostManagementTabProps) {
  const router = useRouter()
  const supabase = createClient()
  const [posts, setPosts] = useState<Post[]>(initialPosts)
  const [categories, setCategories] = useState<Category[]>(initialCategories)
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [isDeleting, setIsDeleting] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [isHiding, setIsHiding] = useState(false)
  const [hidingId, setHidingId] = useState<string | null>(null)

  // boardType에 따라 필터링된 카테고리
  const filteredCategories = categories.filter(cat => {
    if (boardType === "insights") {
      return cat.type === "insight"
    } else if (boardType === "partners") {
      return cat.type === "partner"
    }
    return false
  })

  // 카테고리 필터가 필요한 게시판인지 확인
  const showCategoryFilter = CATEGORY_REQUIRED_BOARDS.includes(boardType) && filteredCategories.length > 0

  // 카테고리 필터링된 게시글
  const filteredPosts = selectedCategory === "all"
    ? posts
    : posts.filter(post => {
        // 게시글의 카테고리 정보가 있는 경우 (추후 확장 가능)
        return true // 현재는 모든 게시글 표시
      })

  // 카테고리 목록 새로고침
  useEffect(() => {
    if (CATEGORY_REQUIRED_BOARDS.includes(boardType)) {
      const loadCategories = async () => {
        const categoryType = boardType === "insights" ? "insight" : "partner"
        const { data } = await supabase
          .from("categories")
          .select("id, name, type")
          .eq("type", categoryType)
          .order("created_at", { ascending: true })

        if (data) {
          setCategories(data)
        }
      }
      loadCategories()
    }
  }, [boardType])

  // boardType 변경 시 selectedCategory 초기화
  useEffect(() => {
    setSelectedCategory("all")
  }, [boardType])

  // 게시글 목록 새로고침
  const refreshPosts = async () => {
    const slugs = BOARD_TYPE_SLUGS[boardType] || []
    let query = supabase
      .from("posts")
      .select(`
        id,
        title,
        created_at,
        visibility,
        board_categories:board_category_id (
          id,
          name,
          slug
        ),
        profiles:author_id (
          id,
          full_name
        )
      `)
      .order("created_at", { ascending: false })

    if (boardType !== "all" && slugs.length > 0) {
      query = query.in("board_categories.slug", slugs)
    }

    const { data } = await query
    if (data) {
      setPosts(data)
    }
  }

  // 게시글 삭제
  const handleDelete = async () => {
    if (!deletingId) return

    setIsDeleting(true)
    try {
      const { error } = await supabase
        .from("posts")
        .delete()
        .eq("id", deletingId)

      if (error) throw error

      setPosts(posts.filter(p => p.id !== deletingId))
      setDeletingId(null)
      router.refresh()
    } catch (error) {
      console.error("게시글 삭제 실패:", error)
      alert("게시글 삭제에 실패했습니다.")
    } finally {
      setIsDeleting(false)
    }
  }

  // 게시글 숨기기/공개
  const handleToggleVisibility = async () => {
    if (!hidingId) return

    setIsHiding(true)
    try {
      const post = posts.find(p => p.id === hidingId)
      const newVisibility = post?.visibility === "public" ? "hidden" : "public"

      const { error } = await supabase
        .from("posts")
        .update({ visibility: newVisibility })
        .eq("id", hidingId)

      if (error) throw error

      setPosts(posts.map(p =>
        p.id === hidingId ? { ...p, visibility: newVisibility } : p
      ))
      setHidingId(null)
      router.refresh()
    } catch (error) {
      console.error("게시글 상태 변경 실패:", error)
      alert("게시글 상태 변경에 실패했습니다.")
    } finally {
      setIsHiding(false)
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

  const boardSlug = posts[0]?.board_categories?.slug || "free"
  const showCategoryManagement = CATEGORY_REQUIRED_BOARDS.includes(boardType)

  return (
    <div className="space-y-6">
      {/* 카테고리 관리 영역 (인사이트/파트너스만) */}
      {showCategoryManagement && (
        <>
          <div>
            <h3 className="text-lg font-semibold text-slate-900 mb-4">카테고리 관리</h3>
            <PartnerCategoryTab
              initialCategories={categories.filter(cat =>
                cat.type === (boardType === "insights" ? "insight" : "partner")
              )}
              categoryType={boardType === "insights" ? "insight" : "partner"}
            />
          </div>
          <Separator />
        </>
      )}

      {/* 게시글 목록 영역 */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-slate-900">게시글 목록</h3>
          {showCategoryFilter && (
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="카테고리 필터" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체</SelectItem>
                {filteredCategories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        {filteredPosts.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>제목</TableHead>
                <TableHead>게시판</TableHead>
                <TableHead>작성자</TableHead>
                <TableHead>작성일</TableHead>
                <TableHead>상태</TableHead>
                <TableHead className="text-right">관리</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPosts.map((post) => {
                const postSlug = post.board_categories?.slug || "free"
                const postUrl = `/community/board/${postSlug}/${post.id}`
                const isHidden = post.visibility === "hidden"

                return (
                  <TableRow key={post.id}>
                    <TableCell>
                      <div className="font-medium text-slate-900">{post.title}</div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {post.board_categories?.name || "게시판"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-slate-600">
                        {post.profiles?.full_name || "익명"}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-slate-600">
                        {formatDate(post.created_at)}
                      </div>
                    </TableCell>
                    <TableCell>
                      {isHidden ? (
                        <Badge variant="outline" className="text-slate-500">
                          <EyeOff className="h-3 w-3 mr-1" />
                          숨김
                        </Badge>
                      ) : (
                        <Badge className="bg-green-100 text-green-700">공개</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={postUrl} className="cursor-pointer">
                              <Eye className="mr-2 h-4 w-4" />
                              보기
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => setHidingId(post.id)}
                            className="cursor-pointer"
                          >
                            <EyeOff className="mr-2 h-4 w-4" />
                            {isHidden ? "공개하기" : "숨기기"}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => setDeletingId(post.id)}
                            className="cursor-pointer text-red-600"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            삭제
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        ) : (
          <div className="py-12 text-center text-slate-500">
            등록된 게시글이 없습니다
          </div>
        )}
      </div>

      {/* 삭제 확인 다이얼로그 */}
      <AlertDialog open={!!deletingId} onOpenChange={(open) => !open && setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>게시글을 삭제하시겠습니까?</AlertDialogTitle>
            <AlertDialogDescription>
              이 작업은 취소할 수 없습니다. 게시글과 모든 댓글이 영구적으로 삭제됩니다.
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

      {/* 숨기기 확인 다이얼로그 */}
      <AlertDialog open={!!hidingId} onOpenChange={(open) => !open && setHidingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {posts.find(p => p.id === hidingId)?.visibility === "public"
                ? "게시글을 숨기시겠습니까?"
                : "게시글을 공개하시겠습니까?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {posts.find(p => p.id === hidingId)?.visibility === "public"
                ? "게시글이 목록에서 숨겨집니다. 링크를 아는 사람은 여전히 접근할 수 있습니다."
                : "게시글이 다시 목록에 표시됩니다."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleToggleVisibility}
              disabled={isHiding}
            >
              {isHiding ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  처리 중...
                </>
              ) : (
                "확인"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

