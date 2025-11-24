import type React from "react"
import { Sidebar } from "@/components/sidebar"
import { MobileHeader } from "@/components/mobile-header"

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      {/* 1. 데스크탑 사이드바 */}
      <div className="hidden lg:block fixed inset-y-0 left-6 z-50">
        <Sidebar />
      </div>

      {/* 2. 모바일 헤더 */}
      <MobileHeader />

      {/* 3. 메인 콘텐츠 영역 */}
      <main className="flex-1 overflow-y-auto w-full pt-16 lg:pt-0 lg:pl-[344px]" style={{ scrollbarGutter: 'stable' }}>
        <div className="max-w-full overflow-x-hidden">{children}</div>
      </main>
    </div>
  )
}

