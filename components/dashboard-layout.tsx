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
  const hasAside = Boolean(rightSidebar || sidebarProfile)

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
          header ? "pt-14 lg:pl-72" : "lg:pl-72"
        )}
      >
        <div
          className={cn(
            "w-full",
            hasAside ? "grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_20rem] gap-8" : ""
          )}
        >
          <div className={cn(hasAside ? "min-w-0" : "w-full")}>{children}</div>
          {hasAside && (
            <aside className="hidden lg:block">
              <div className="space-y-6 w-80">
                {sidebarProfile}
                {rightSidebar}
              </div>
            </aside>
          )}
        </div>
      </main>
    </div>
  )
}
