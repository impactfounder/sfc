import { Suspense } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import SidebarProfile from "@/components/sidebar-profile"
import AboutContent from "./about-content"

export default function AboutPage() {
  return (
    <DashboardLayout sidebarProfile={
      <Suspense fallback={<div className="h-10 w-10 bg-slate-100 rounded-full animate-pulse" />}>
        <SidebarProfile />
      </Suspense>
    }>
      <AboutContent />
    </DashboardLayout>
  )
}
