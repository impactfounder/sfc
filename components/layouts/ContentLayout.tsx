import type { ReactNode } from "react"

interface ContentLayoutProps {
  mainContent: ReactNode
  rightSidebar?: ReactNode
  className?: string
}

/**
 * 게시판/컨텐츠 페이지용 공통 9:3 레이아웃
 *
 * - 1열: 모바일 전체, 데스크톱에서 12컬럼 그리드
 * - mainContent: lg 기준 좌측 9칸
 * - rightSidebar: lg 기준 우측 3칸
 */
export function ContentLayout({ mainContent, rightSidebar, className }: ContentLayoutProps) {
  return (
    <div className={["w-full", className].filter(Boolean).join(" ")}>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* 메인 콘텐츠 영역 (왼쪽 9칸) */}
        <main className="lg:col-span-9 flex flex-col gap-6">
          {mainContent}
        </main>

        {/* 우측 사이드바 영역 (오른쪽 3칸) */}
        {rightSidebar && (
          <aside className="lg:col-span-3">
            {rightSidebar}
          </aside>
        )}
      </div>
    </div>
  )
}


