import type React from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import SidebarProfile from "@/components/sidebar-profile"
import { StandardRightSidebar } from "@/components/standard-right-sidebar"

export default function CustomerCenterLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <DashboardLayout
      sidebarProfile={<SidebarProfile />}
      rightSidebar={<StandardRightSidebar />}
    >
      {children}
    </DashboardLayout>
  )
}






