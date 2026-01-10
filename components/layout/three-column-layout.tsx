import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

interface ThreeColumnLayoutProps {
  children: ReactNode
  rightSidebar?: ReactNode
  header?: ReactNode  // 전체 너비 헤더 (배너 등)
  className?: string
}

/**
 * Reddit 스타일 레이아웃
 * - 최대 폭: 1280px
 * - 사이드바: 고정 312px
 * - 메인: 나머지 공간
 * - header: 전체 너비로 표시되는 상단 영역 (커뮤니티 배너 등)
 */
export function ThreeColumnLayout({ children, rightSidebar, header, className }: ThreeColumnLayoutProps) {
  return (
    <div className={cn("w-full max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-6", className)}>
      {/* 전체 너비 헤더 (배너) */}
      {header && (
        <div className="mb-6">
          {header}
        </div>
      )}

      {/* 메인 + 사이드바 */}
      <div className="flex gap-6 items-start">
        <main className="min-w-0 flex-1">
          {children}
        </main>

        {rightSidebar && (
          <aside className="hidden xl:block w-[312px] flex-shrink-0">
            <div className="sticky top-24 flex flex-col gap-3">
              {rightSidebar}
            </div>
          </aside>
        )}
      </div>
    </div>
  )
}

