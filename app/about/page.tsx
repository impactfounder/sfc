import { Sidebar } from "@/components/sidebar"
import SidebarProfile from "@/components/sidebar-profile"
import { MobileHeader } from "@/components/mobile-header"
import AboutContent from "./about-content"

export default function AboutPage() {
  return (
    <div className="flex min-h-screen bg-slate-50">
      <div className="hidden md:block">
        <Sidebar>
          <SidebarProfile />
        </Sidebar>
      </div>
      <MobileHeader />
      <AboutContent />
    </div>
  )
}
