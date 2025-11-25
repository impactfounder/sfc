"use client"

import { useState, useMemo } from "react"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { PostListItem } from "@/components/ui/post-list-item"
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyTitle, EmptyMedia } from "@/components/ui/empty"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { LayoutGrid, List } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"

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
  hideTabs?: boolean // 카테고리 필터 탭 숨기기 (개별 게시판용)
}

export function PostsSection({ 
  posts, 
  boardCategories,
  selectedBoard = "all",
  onBoardChange,
  isLoading = false,
  hideTabs = false
}: PostsSectionProps) {
  
  const [internalSelectedBoard, setInternalSelectedBoard] = useState("all")
  const [viewMode, setViewMode] = useState<"feed" | "list">("feed")
  const currentBoard = onBoardChange ? selectedBoard : internalSelectedBoard
  const handleBoardChange = onBoardChange 
    ? onBoardChange 
    : (val: string) => setInternalSelectedBoard(val || "all")

  const filteredPosts = useMemo(() => {
    // 1. 개별 게시판 모드(hideTabs=true)면 필터링 없이 원본 그대로 반환
    // 개별 게시판 페이지에서는 이미 쿼리 단계에서 필요한 글만 가져오기 때문
    if (hideTabs) {
      return posts;
    }

    // 2. 통합 피드 모드(hideTabs=false)면 공지/자유 제외 필터 적용
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
  }, [posts, currentBoard, hideTabs]) // hideTabs 의존성 추가 필수

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
    <div className="w-full space-y-6 bg-transparent">
      {/* 상단 헤더 영역: 제목 + 뷰 모드 토글 */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl md:text-3xl font-bold text-slate-900">최신 글</h2>
        
        {/* 뷰 모드 토글 (카테고리 필터와 동일한 디자인 적용) */}
        <div className="inline-flex items-center p-1 bg-slate-100/80 rounded-xl">
          <button
            onClick={() => setViewMode("feed")}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200",
              viewMode === "feed"
                ? "bg-white text-slate-900 shadow-sm font-bold"
                : "text-slate-500 hover:text-slate-700"
            )}
          >
            <LayoutGrid className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">피드형</span>
          </button>
          <button
            onClick={() => setViewMode("list")}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200",
              viewMode === "list"
                ? "bg-white text-slate-900 shadow-sm font-bold"
                : "text-slate-500 hover:text-slate-700"
            )}
          >
            <List className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">리스트형</span>
          </button>
        </div>
      </div>

      {/* 카테고리 필터 (hideTabs가 false일 때만 표시) */}
      {!hideTabs && (
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
              className="rounded-xl px-4 py-2 text-sm font-medium text-slate-500 transition-all hover:text-slate-700 data-[state=on]:bg-white data-[state=on]:text-slate-900 data-[state=on]:shadow-sm data-[state=on]:font-bold h-9"
            >
              전체
            </ToggleGroupItem>
            
            {uniqueCategories.map((category) => (
              <ToggleGroupItem
                key={category.id}
                value={category.slug}
                aria-label={category.name}
                className="rounded-xl px-4 py-2 text-sm font-medium text-slate-500 transition-all hover:text-slate-700 data-[state=on]:bg-white data-[state=on]:text-slate-900 data-[state=on]:shadow-sm data-[state=on]:font-bold h-9"
              >
                {category.name}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </div>
      )}

      {/* Posts List */}
      {/* 리스트 뷰일 때는 space-y-4(간격) 제거 */}
      <div className={cn(
        "w-full",
        viewMode === "feed" ? "space-y-4" : "space-y-0 flex flex-col border-t border-slate-100"
      )}>
        {isLoading ? (
          [1, 2, 3, 4, 5].map((i) => (
            <div key={i} className={cn(
              "w-full bg-white",
              viewMode === "feed" ? "h-24 rounded-xl border border-gray-200 p-4" : "h-16 border-b border-gray-100 px-4 py-3"
            )}>
              <Skeleton className="h-4 w-3/4 mb-2" />
              <Skeleton className="h-3 w-1/4" />
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
          <div className="p-16">
            <Empty className="bg-transparent">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <svg className="h-16 w-16 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </EmptyMedia>
                <EmptyTitle className="text-xl font-semibold text-slate-900">아직 조용하네요 🍃</EmptyTitle>
                <EmptyDescription className="text-slate-500">가장 먼저 대화를 시작해보세요!</EmptyDescription>
              </EmptyHeader>
              <EmptyContent>
                <Button asChild className="bg-slate-900 hover:bg-slate-800 text-white rounded-xl px-6">
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