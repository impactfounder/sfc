import { DashboardLayout } from "@/components/dashboard-layout"
import SidebarProfile from "@/components/sidebar-profile"
import AboutContent from "./about-content"

export default function AboutPage() {
  console.log("🚩 About Page 시작")
  return (
    <DashboardLayout sidebarProfile={<SidebarProfile />}>
      <AboutContent />
    </DashboardLayout>
  )
}
