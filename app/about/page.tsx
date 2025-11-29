import { DashboardLayout } from "@/components/dashboard-layout"
import SidebarProfile from "@/components/sidebar-profile"
import AboutContent from "./about-content"
import { createClient } from "@/lib/supabase/server"

export default async function AboutPage() {
  console.log("🚩 About Page 시작")
  
  const supabase = await createClient()
  
  // badge_categories 테이블에서 카테고리 순서 정보 가져오기
  const { data: badgeCategories } = await supabase
    .from("badge_categories")
    .select("category_value, category_label, sort_order")
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true }) // 2차 정렬: sort_order가 같은 경우 created_at 기준
  
  // badges 테이블에서 활성화된 뱃지만 가져오기 (is_active = true 또는 null)
  // ⚠️ 캐시: Next.js가 이 페이지를 캐시할 수 있습니다. 
  //    관리자에서 뱃지 상태를 변경하면 revalidatePath("/about")가 호출되어 캐시가 무효화됩니다.
  const { data: badges } = await supabase
    .from("badges")
    .select("id, name, icon, category, description, created_at")
    .or("is_active.eq.true,is_active.is.null") // 활성화된 뱃지만 조회 (true 또는 null)
    .order("created_at", { ascending: true })

  return (
    <DashboardLayout sidebarProfile={<SidebarProfile />}>
      <AboutContent badges={badges || []} badgeCategories={badgeCategories || []} />
    </DashboardLayout>
  )
}
