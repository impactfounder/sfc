import type { ReactNode } from "react"
import { cn } from "@/lib/utils"
import { Sidebar } from "@/components/sidebar"
import { MobileHeader } from "@/components/mobile-header"

interface DashboardLayoutProps {
  children: ReactNode
  header?: ReactNode
  rightSidebar?: ReactNode
  sidebarProfile?: ReactNode
}

export function DashboardLayout({ children, header, rightSidebar, sidebarProfile }: DashboardLayoutProps) {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* 1. Global Header (Passed from server component) */}
      {header}

      {/* Mobile Header (lg 미만) - Only show if no header passed (fallback) or handle differently */}
      {!header && (
        <div className="lg:hidden sticky top-0 z-50">
          <MobileHeader />
        </div>
      )}

      {/* 2. Left Sidebar: Header 아래 배치 (top-14) */}
      <aside className="fixed top-14 left-0 z-40 hidden h-[calc(100vh-3.5rem)] w-72 border-r border-slate-200 bg-white lg:block overflow-y-auto">
        <Sidebar />
      </aside>

      {/* 3. Main Content Wrapper: Header 높이(pt-14) + Sidebar 너비(pl-72) */}
      <main
        className={cn(
          "min-h-screen w-full transition-all duration-200 ease-in-out",
          header ? "pt-14 lg:pl-72" : "lg:pl-72" // Header 유무에 따라 패딩 조정
        )}
      >
        <div className="mx-auto max-w-7xl w-full px-4 py-8 md:px-8 lg:py-10">
          <div className={cn("w-full", rightSidebar || sidebarProfile ? "flex flex-col lg:flex-row gap-8" : "")}>
            <div className="flex-1 min-w-0">{children}</div>
            {(rightSidebar || sidebarProfile) && (
              <aside className="hidden lg:block w-72 shrink-0">
                <div className="space-y-6">
                  {sidebarProfile}
                  {rightSidebar}
                </div>
              </aside>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
