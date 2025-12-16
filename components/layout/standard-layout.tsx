import type { ReactNode } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { SiteHeader } from "@/components/site-header"
import { ThreeColumnLayout } from "@/components/layout/three-column-layout"
import { StandardRightSidebar } from "@/components/standard-right-sidebar"
import { createClient } from "@/lib/supabase/server"
import { getCurrentUserProfile } from "@/lib/queries/profiles"

interface StandardLayoutProps {
  children: ReactNode
}

/**
 * 표준 3열 레이아웃
 * - SiteHeader + DashboardLayout + ThreeColumnLayout + StandardRightSidebar 조합
 * - about, community, customer-center, member 등에서 공통 사용
 */
export async function StandardLayout({ children }: StandardLayoutProps) {
  const supabase = await createClient()
  const userProfile = await getCurrentUserProfile(supabase)
  const userRole = userProfile?.profile?.role || null

  return (
    <DashboardLayout header={<SiteHeader />} userRole={userRole}>
      <ThreeColumnLayout rightSidebar={<StandardRightSidebar />}>
        {children}
      </ThreeColumnLayout>
    </DashboardLayout>
  )
}
