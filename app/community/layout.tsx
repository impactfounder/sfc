import type { ReactNode } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { SiteHeader } from "@/components/site-header"
import { createClient } from "@/lib/supabase/server"
import { getCurrentUserProfile } from "@/lib/queries/profiles"

/**
 * Community 루트 레이아웃
 *
 * 헤더와 대시보드 레이아웃만 제공
 * 3열 레이아웃(사이드바 포함)은 각 하위 레이아웃에서 구성
 */
export default async function CommunityLayout({ children }: { children: ReactNode }) {
  const supabase = await createClient()
  const userProfile = await getCurrentUserProfile(supabase)
  const userRole = userProfile?.profile?.role || null

  return (
    <DashboardLayout header={<SiteHeader />} userRole={userRole}>
      {children}
    </DashboardLayout>
  )
}
