import type React from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import SidebarProfile from "@/components/sidebar-profile"
import { StandardRightSidebar } from "@/components/standard-right-sidebar"
import { SiteHeader } from "@/components/site-header"

export default function CustomerCenterLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <DashboardLayout
      header={<SiteHeader />}
      sidebarProfile={<SidebarProfile />}
      rightSidebar={<StandardRightSidebar />}
    >
      {children}
    </DashboardLayout>
  )
}






