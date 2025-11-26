"use client"

import type { ReactNode } from "react"
import { Sidebar } from "@/components/sidebar"
import { MobileHeader } from "@/components/mobile-header"

interface DashboardLayoutProps {
  children: ReactNode
  sidebarProfile?: ReactNode
}

export function DashboardLayout({ children, sidebarProfile }: DashboardLayoutProps) {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <MobileHeader />
      
      {/* 메인 컨테이너 */}
      <div className="flex-1 flex justify-center w-full">
        {/* 최대 너비 제한 컨테이너 (중앙 정렬) */}
        <div className="flex w-full max-w-[1920px] mx-auto">
          
          {/* [좌측 사이드바] Sticky 포지셔닝 */}
          <aside className="hidden lg:block w-80 shrink-0 sticky top-0 h-screen overflow-y-auto border-r border-slate-200 bg-white z-30">
            <Sidebar>
              {sidebarProfile}
            </Sidebar>
          </aside>

          {/* [중앙 본문] overflow 제거, padding 제거 (개별 페이지에서 제어) */}
          <main className="flex-1 min-w-0 bg-slate-50">
            {children}
          </main>
        </div>
      </div>
    </div>
  )
}
