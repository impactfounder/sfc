"use client"

import { useState, useMemo } from "react"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { PostListItem } from "@/components/ui/post-list-item"
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { LayoutGrid, List } from "lucide-react"
import Link from "next/link"

type Post = {
  id: string
  title: string
  content?: string | null
  created_at: string
  visibility?: "public" | "group"
  likes_count?: number
  comments_count?: number
  board_categories?: {
    name?: string | null
    slug?: string | null
  } | null
  profiles?: {
    full_name?: string | null
  } | null
  communities?: {
    name?: string | null
  } | null
  isMember?: boolean
}

type BoardCategory = {
  id: string
  name: string
  slug: string
}

interface PostsSectionProps {
  posts: Post[]
  boardCategories: BoardCategory[]
  selectedBoard?: string
  onBoardChange?: (slug: string) => void
  isLoading?: boolean
}

export function PostsSection({ 
  posts, 
  boardCategories,
  selectedBoard = "all",
  onBoardChange,
  isLoading = false 
}: PostsSectionProps) {
  
  const [internalSelectedBoard, setInternalSelectedBoard] = useState("all")
  const [viewMode, setViewMode] = useState<"feed" | "list">("feed")
  const currentBoard = onBoardChange ? selectedBoard : internalSelectedBoard
  const handleBoardChange = onBoardChange 
    ? onBoardChange 
    : (val: string) => setInternalSelectedBoard(val || "all")

  const filteredPosts = useMemo(() => {
    // 공지사항과 자유게시판 제외 (소모임 카테고리만 표시)
    const excludedSlugs = ['announcement', 'announcements', 'free', 'free-board']
    const baseFiltered = posts.filter((post) => {
      const postSlug = post.board_categories?.slug
      return !postSlug || !excludedSlugs.includes(postSlug)
    })

    if (currentBoard === "all") {
      return baseFiltered
    }
    return baseFiltered.filter(
      (post) => post.board_categories?.slug === currentBoard
    )
  }, [posts, currentBoard])

  // 중복 카테고리 제거 및 공지사항/자유게시판 제외 (slug 기준)
  const uniqueCategories = useMemo(() => {
    const excludedSlugs = ['announcement', 'announcements', 'free', 'free-board']
    const unique = new Map();
    boardCategories.forEach(cat => {
      // 공지사항과 자유게시판 제외
      if (!excludedSlugs.includes(cat.slug) && !unique.has(cat.slug)) {
        unique.set(cat.slug, cat);
      }
    });
    return Array.from(unique.values());
  }, [boardCategories]);

  return (
    <div className="w-full space-y-6">
      
      {/* 헤더: 제목 + 뷰 모드 토글 */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl md:text-[26px] font-bold text-gray-900">최신 글</h2>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant={viewMode === "feed" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("feed")}
            className="h-9 px-3"
          >
            <LayoutGrid className="h-4 w-4 mr-1.5" />
            피드형
          </Button>
          <Button
            type="button"
            variant={viewMode === "list" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("list")}
            className="h-9 px-3"
          >
            <List className="h-4 w-4 mr-1.5" />
            리스트형
          </Button>
        </div>
      </div>

      {/* 카테고리 필터 (업로드하신 이미지 스타일 적용) */}
      <div className="overflow-x-auto pb-2 scrollbar-hide">
        <ToggleGroup
          type="single"
          value={currentBoard}
          onValueChange={handleBoardChange}
          // ★ 컨테이너 스타일: 연한 회색 배경, 둥근 모서리, 내부 패딩
          className="inline-flex items-center p-1.5 rounded-2xl bg-slate-100/80 w-auto"
        >
          <ToggleGroupItem 
            value="all" 
            aria-label="전체" 
            // ★ 아이템 스타일: 선택 시 흰색 배경 + 그림자 + 파란 텍스트 / 비선택 시 회색 텍스트
            className="rounded-xl px-6 py-2 text-sm font-medium text-slate-500 transition-all hover:text-slate-700 data-[state=on]:bg-white data-[state=on]:text-blue-600 data-[state=on]:shadow-sm data-[state=on]:font-bold h-9"
          >
            전체
          </ToggleGroupItem>
          
          {uniqueCategories.map((category) => (
            <ToggleGroupItem
              key={category.id}
              value={category.slug}
              aria-label={category.name}
              className="rounded-xl px-6 py-2 text-sm font-medium text-slate-500 transition-all hover:text-slate-700 data-[state=on]:bg-white data-[state=on]:text-blue-600 data-[state=on]:shadow-sm data-[state=on]:font-bold h-9"
            >
              {category.name}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>

      {/* Posts List */}
      <div className="space-y-3">
        {isLoading ? (
          [1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="w-full h-24 rounded-xl border border-gray-200 bg-white p-4">
              <Skeleton className="h-6 w-3/4 mb-3" />
              <div className="flex gap-2">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-24" />
              </div>
            </div>
          ))
        ) : filteredPosts.length > 0 ? (
          filteredPosts.map((post) => {
            const boardSlug = post.board_categories?.slug || "free-board"
            return (
              <PostListItem
                key={post.id}
                post={post}
                href={`/community/board/${boardSlug}/${post.id}`}
                isMember={post.isMember ?? true}
                viewMode={viewMode}
              />
            )
          })
        ) : (
          <div className="bg-white border border-gray-200 rounded-3xl shadow-sm p-12">
            <Empty className="bg-transparent">
              <EmptyHeader>
                <EmptyTitle>게시글이 없습니다</EmptyTitle>
                <EmptyDescription>첫 글을 작성해 커뮤니티를 시작해보세요.</EmptyDescription>
              </EmptyHeader>
              <EmptyContent>
                <Button asChild variant="outline" className="rounded-xl">
                  <Link href="/community/posts/new">글 작성하기</Link>
                </Button>
              </EmptyContent>
            </Empty>
          </div>
        )}
      </div>
    </div>
  )
}