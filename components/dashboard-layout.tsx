"use client"

import type { ReactNode } from "react"
import { Sidebar } from "@/components/sidebar"
import { MobileHeader } from "@/components/mobile-header"

export function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* 모바일 헤더 */}
      <MobileHeader />
      
      {/* 데스크탑 사이드바 (고정) */}
      <div className="hidden lg:block">
        <Sidebar />
      </div>

      {/* 메인 영역 컨테이너 */}
      {/* lg:pl-[344px]: 사이드바 공간 확보를 여기서 중앙 통제 */}
      <main className="w-full min-h-screen pt-20 pb-24 lg:pt-8 lg:pb-10 lg:pl-[344px]">
        {/* 콘텐츠 중앙 정렬 래퍼 */}
        <div className="mx-auto w-full max-w-7xl px-4 md:px-8">
          {children}
        </div>
      </main>
    </div>
  )
}

