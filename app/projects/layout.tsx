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
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <MobileHeader />

      <div className="flex-1 w-full max-w-[1440px] mx-auto flex items-start pt-16 lg:pt-0">
        <aside className="hidden lg:block w-72 shrink-0 sticky top-0 h-screen overflow-y-auto border-r border-slate-200 bg-white">
          <Sidebar>
            <SidebarProfile />
          </Sidebar>
        </aside>

        <main className="flex-1 min-w-0 overflow-y-auto px-4 py-8 md:px-8">{children}</main>
      </div>
    </div>
  )
}
