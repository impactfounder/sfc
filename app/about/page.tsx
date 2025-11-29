import { DashboardLayout } from "@/components/dashboard-layout"
import SidebarProfile from "@/components/sidebar-profile"
import AboutContent from "./about-content"
import { createClient } from "@/lib/supabase/server"

export default async function AboutPage() {
  console.log("🚩 About Page 시작")
  
  const supabase = await createClient()
  
  // badges 테이블에서 모든 뱃지 데이터 가져오기
  const { data: badges } = await supabase
    .from("badges")
    .select("id, name, icon, category, description, created_at")
    .order("created_at", { ascending: true })

  return (
    <DashboardLayout sidebarProfile={<SidebarProfile />}>
      <AboutContent badges={badges || []} />
    </DashboardLayout>
  )
}
