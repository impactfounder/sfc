import type React from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { SiteHeader } from "@/components/site-header"

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <DashboardLayout header={<SiteHeader />}>
      {children}
    </DashboardLayout>
  )
}

