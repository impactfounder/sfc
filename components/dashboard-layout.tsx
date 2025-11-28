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
      
      {/* 1. 전체 화면을 가로지르는 Flex 컨테이너 */}
      <div className="flex-1 flex justify-center w-full">
        
        {/* 2. 최대 너비와 좌우 여백을 담당하는 '물리적 고정' 컨테이너 */}
        <div className="flex w-full max-w-[1800px] mx-auto px-4 lg:px-6 gap-10 box-border">
          
          {/* [좌측 사이드바] 너비 고정 (변동 불가) */}
          <aside className="hidden lg:block w-72 shrink-0 sticky top-0 h-screen border-r border-slate-200 bg-white z-30">
            <Sidebar>
              {sidebarProfile}
            </Sidebar>
          </aside>

          {/* [중앙 본문] 
              - 너비: 남은 공간 모두 차지 (flex-1)
              - 높이: 내용물에 따라 늘어남
              - 여백: 여기서 상하 여백(py)을 '유일하게' 정의함
              - pt-8 (32px): 우측 사이드바의 sticky top-8과 높이를 맞춰 레이아웃 정렬
          */}
          <main className="flex-1 min-w-0 pt-8 pb-20">
            {children}
          </main>
        </div>
      </div>
    </div>
  )
}
