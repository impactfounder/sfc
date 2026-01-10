import type { ReactNode } from "react"
import { ThreeColumnLayout } from "@/components/layout/three-column-layout"
import { StandardRightSidebar } from "@/components/standard-right-sidebar"
import { CommunityInfoSidebar } from "@/components/community/community-info-sidebar"
import { createClient } from "@/lib/supabase/server"

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

  // 커뮤니티 게시판인 경우 데이터 조회
  let communityName: string | null = null
  let userId: string | null = null

  if (!isSystemBoard) {
    const supabase = await createClient()

    // 병렬로 카테고리와 세션 조회
    const [categoryResult, sessionResult] = await Promise.all([
      supabase.from("board_categories").select("name").eq("slug", dbSlug).single(),
      supabase.auth.getSession(),
    ])

    communityName = categoryResult.data?.name || null
    userId = sessionResult.data.session?.user?.id || null

    // board_categories에 없으면 communities 테이블에서 slug로 직접 찾기
    if (!communityName) {
      // slug 컬럼이 있으면 직접 조회, 없으면 name으로 조회
      const { data: communityBySlug } = await supabase
        .from("communities")
        .select("name")
        .or(`slug.eq.${dbSlug},slug.eq.${slug}`)
        .limit(1)
        .maybeSingle()

      if (communityBySlug) {
        communityName = communityBySlug.name
      } else {
        // slug 컬럼이 없는 경우: name을 slug화해서 비교 (ilike 사용)
        // 예: "반골" -> slug "반골", "Weekly Vibe" -> slug "weekly-vibe"
        const { data: communityByName } = await supabase
          .from("communities")
          .select("name")
          .ilike("name", dbSlug.replace(/-/g, ' '))
          .limit(1)
          .maybeSingle()

        if (communityByName) {
          communityName = communityByName.name
        }
      }
    }

    console.log("[CommunityBoardLayout] slug:", dbSlug, "communityName:", communityName, "userId:", userId)
  }

  // 사이드바 결정
  // 커뮤니티 페이지: 사이드바를 배너 상단과 정렬 (pt 제거)
  const rightSidebar = isSystemBoard ? (
    <StandardRightSidebar />
  ) : (
    <CommunityInfoSidebar communityName={communityName} userId={userId} />
  )

  return (
    <ThreeColumnLayout rightSidebar={rightSidebar}>
      {children}
    </ThreeColumnLayout>
  )
}
