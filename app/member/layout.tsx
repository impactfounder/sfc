import type React from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import SidebarProfile from "@/components/sidebar-profile"

export default function MemberLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <DashboardLayout sidebarProfile={<SidebarProfile />}>
      {children}
    </DashboardLayout>
  )
}
