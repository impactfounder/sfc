import type { ReactNode } from "react"
import { ThreeColumnLayout } from "@/components/layout/three-column-layout"
import { StandardRightSidebar } from "@/components/standard-right-sidebar"
import { CommunityInfoSidebar } from "@/components/community/community-info-sidebar"

interface CommunityBoardLayoutProps {
  children: ReactNode
  params: Promise<{ slug: string }>
}

// 시스템 게시판 목록 (기존 사이드바 사용)
const SYSTEM_BOARDS = [
  "announcement",
  "announcements",
  "free",
  "free-board",
  "event-requests",
  "insights",
  "reviews",
]

/**
 * 커뮤니티 보드 레이아웃
 * - 시스템 게시판: StandardRightSidebar (공지사항 위젯)
 * - 커뮤니티 게시판: CommunityInfoSidebar (커뮤니티 정보)
 *
 * 참고: DashboardLayout은 상위 /community/layout.tsx에서 제공
 */
export default async function CommunityBoardLayout({
  children,
  params,
}: CommunityBoardLayoutProps) {
  const { slug } = await params

  // URL 슬러그 -> DB 슬러그 변환
  let dbSlug = slug
  if (slug === "free") dbSlug = "free-board"
  if (slug === "announcements") dbSlug = "announcement"

  // 시스템 게시판 여부 확인
  const isSystemBoard = SYSTEM_BOARDS.includes(dbSlug) || SYSTEM_BOARDS.includes(slug)

  // 사이드바 결정
  const rightSidebar = isSystemBoard ? (
    <StandardRightSidebar />
  ) : (
    <CommunityInfoSidebar slug={dbSlug} />
  )

  return (
    <ThreeColumnLayout rightSidebar={rightSidebar}>
      {children}
    </ThreeColumnLayout>
  )
}
