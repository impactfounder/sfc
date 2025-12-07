import type React from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import SidebarProfile from "@/components/sidebar-profile"
import { SiteHeader } from "@/components/site-header"

export default function ProjectsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <DashboardLayout header={<SiteHeader />} sidebarProfile={<SidebarProfile />}>
      {children}
    </DashboardLayout>
  )
}
