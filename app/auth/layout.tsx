import { DashboardLayout } from "@/components/dashboard-layout"
import { SiteHeader } from "@/components/site-header"
import { ThreeColumnLayout } from "@/components/layout/three-column-layout"
import { StandardRightSidebar } from "@/components/standard-right-sidebar"

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <DashboardLayout header={<SiteHeader />}>
      <ThreeColumnLayout rightSidebar={<StandardRightSidebar />}>
        {children}
      </ThreeColumnLayout>
    </DashboardLayout>
  )
}
