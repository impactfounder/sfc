import type React from "react"
import { Sidebar } from "@/components/sidebar"
import { MobileHeader } from "@/components/mobile-header"
import SidebarProfile from "@/components/sidebar-profile"

export default function ProjectsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <div className="hidden md:block">
        <Sidebar>
          <SidebarProfile />
        </Sidebar>
      </div>

      <MobileHeader />

      <main className="flex-1 overflow-y-auto w-full pt-16 md:pt-0 md:pl-[344px]">{children}</main>
    </div>
  )
}
