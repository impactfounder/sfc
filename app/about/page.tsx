import { Suspense } from "react"
import { Sidebar } from "@/components/sidebar"
import SidebarProfile from "@/components/sidebar-profile"
import { MobileHeader } from "@/components/mobile-header"
import AboutContent from "./about-content"

export default function AboutPage() {
  return (
    <div className="flex min-h-screen bg-slate-50">
      <div className="hidden md:block">
        <Sidebar>
          <Suspense fallback={<div className="h-10 w-10 bg-slate-100 rounded-full animate-pulse" />}>
            <SidebarProfile />
          </Suspense>
        </Sidebar>
      </div>
      <MobileHeader />
      <AboutContent />
    </div>
  )
}
