import type React from "react"
import { Sidebar } from "@/components/sidebar"
import { MobileHeader } from "@/components/mobile-header"

export default function CommunityLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex h-screen overflow-hidden overflow-x-hidden bg-slate-50">
      <div className="hidden md:block">
        <Sidebar />
      </div>

      <MobileHeader />

      <main className="flex-1 overflow-y-auto overflow-x-hidden w-full max-w-full md:pt-0 pt-16">
        <div className="max-w-full overflow-x-hidden">{children}</div>
      </main>
    </div>
  )
}
