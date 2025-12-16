import type React from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { SiteHeader } from "@/components/site-header"
import { createClient } from "@/lib/supabase/server"
import { getCurrentUserProfile } from "@/lib/queries/profiles"

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const userProfile = await getCurrentUserProfile(supabase)
  const userRole = userProfile?.profile?.role || null

  return (
    <DashboardLayout header={<SiteHeader />} userRole={userRole}>
      <div className="p-6 lg:p-8">
        {children}
      </div>
    </DashboardLayout>
  )
}

