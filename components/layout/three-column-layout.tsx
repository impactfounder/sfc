import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

interface ThreeColumnLayoutProps {
  children: ReactNode
  rightSidebar?: ReactNode
  className?: string
}

/**
 * Reddit 스타일 레이아웃
 * - 최대 폭: 1280px
 * - 사이드바: 고정 312px
 * - 메인: 나머지 공간
 */
export function ThreeColumnLayout({ children, rightSidebar, className }: ThreeColumnLayoutProps) {
  return (
    <div className={cn("w-full max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-6", className)}>
      <div className="flex gap-6 items-start">
        <main className="min-w-0 flex-1">
          {children}
        </main>

        {rightSidebar && (
          <aside className="hidden lg:block w-[312px] flex-shrink-0">
            <div className="sticky top-24 flex flex-col gap-4">
              {rightSidebar}
            </div>
          </aside>
        )}
      </div>
    </div>
  )
}

