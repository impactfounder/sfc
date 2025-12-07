import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

interface ThreeColumnLayoutProps {
  children: ReactNode
  rightSidebar?: ReactNode
  className?: string
}

/**
 * Home과 동일한 12컬럼 그리드 레이아웃
 * - 사이드바 노출 시점: lg(1024px)부터
 * - 최대 폭: 1600px
 */
export function ThreeColumnLayout({ children, rightSidebar, className }: ThreeColumnLayoutProps) {
  return (
    <div className={cn("w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8", className)}>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
        <main className={cn("min-w-0 w-full", rightSidebar ? "lg:col-span-9" : "lg:col-span-12")}>
          {children}
        </main>

        {rightSidebar && (
          <aside className="hidden lg:block lg:col-span-3">
            <div className="sticky top-24 flex flex-col gap-6">
              {rightSidebar}
            </div>
          </aside>
        )}
      </div>
    </div>
  )
}

