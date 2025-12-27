import type { ReactNode } from "react"
import { cn } from "@/lib/utils"
import { Sidebar } from "@/components/sidebar"
import { MobileHeader } from "@/components/mobile-header"

interface DashboardLayoutProps {
  children: ReactNode
  header?: ReactNode
  rightSidebar?: ReactNode
  sidebarProfile?: ReactNode
  userRole?: string | null
}

export function DashboardLayout({ children, header, rightSidebar, sidebarProfile, userRole }: DashboardLayoutProps) {
  const hasAside = Boolean(rightSidebar || sidebarProfile)

  return (
    <div className="min-h-screen bg-slate-50">
      {/* 1. Global Header - Desktop only (lg 이상에서만 표시) */}
      {header && (
        <div className="hidden lg:block">
          {header}
        </div>
      )}

      {/* 2. Mobile Header (lg 미만에서만 표시) */}
      <div className="lg:hidden">
        <MobileHeader userRole={userRole} />
      </div>

      {/* 2. Left Sidebar: Header 아래 배치 (top-16) */}
      <aside className="fixed top-16 left-0 z-40 hidden h-[calc(100vh-4rem)] w-72 border-r border-slate-200/50 bg-white lg:block overflow-y-auto">
        <Sidebar userRole={userRole} />
      </aside>

      {/* 3. Main Content Wrapper: Header 높이(pt-16) + Sidebar 너비(pl-72) */}
      <main
        className={cn(
          "min-h-screen w-full transition-all duration-200 ease-in-out",
          header ? "pt-16 lg:pl-72" : "lg:pl-72"
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
