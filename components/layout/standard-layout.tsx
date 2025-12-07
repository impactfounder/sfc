import type { ReactNode } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { SiteHeader } from "@/components/site-header"
import { ThreeColumnLayout } from "@/components/layout/three-column-layout"
import { StandardRightSidebar } from "@/components/standard-right-sidebar"

interface StandardLayoutProps {
  children: ReactNode
}

/**
 * 표준 3열 레이아웃
 * - SiteHeader + DashboardLayout + ThreeColumnLayout + StandardRightSidebar 조합
 * - about, community, customer-center, member 등에서 공통 사용
 */
export function StandardLayout({ children }: StandardLayoutProps) {
  return (
    <DashboardLayout header={<SiteHeader />}>
      <ThreeColumnLayout rightSidebar={<StandardRightSidebar />}>
        {children}
      </ThreeColumnLayout>
    </DashboardLayout>
  )
}
