import type React from "react"
import { Sidebar } from "@/components/sidebar"
import { MobileSidebar } from "@/components/mobile-sidebar"
import { MobileHeader } from "@/components/mobile-header"

export default function ProjectsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <div className="hidden md:block">
        <Sidebar />
      </div>

      <MobileHeader />
      <MobileSidebar />

      <main className="flex-1 overflow-y-auto w-full pt-16 md:pt-0">{children}</main>
    </div>
  )
}
