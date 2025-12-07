import { requireAdmin } from "@/lib/auth/server"
import { createClient } from "@/lib/supabase/server"
import { PartnerListTab } from "@/components/admin/partners/partner-list-tab"
import { PartnerApplicationsTab } from "@/components/admin/partner-applications-tab"
import { PartnerCategoryTab } from "@/components/admin/partners/partner-category-tab"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default async function AdminPartnersPage() {
  const { supabase } = await requireAdmin()

  // 병렬 데이터 페칭
  const [servicesResult, applicationsResult, categoriesResult] = await Promise.all([
    // Partner Services: 파트너스 서비스 목록
    (async () => {
      try {
        const { data, error } = await supabase
          .from("partner_services")
          .select(`
            id,
            title,
            description,
            category,
            thumbnail_url,
            is_verified,
            created_at,
            profiles:provider_id (
              id,
              full_name
            )
          `)
          .order("is_verified", { ascending: false })
          .order("created_at", { ascending: false })
        
        if (error) {
          console.error("Partner services query error:", error)
          return { data: [], error: null }
        }
        return { data: data || [], error: null }
      } catch (err) {
        console.error("Partner services query exception:", err)
        return { data: [], error: err }
      }
    })(),
    
    // Partner Applications: 파트너스 신청 목록
    (async () => {
      try {
        const { data, error } = await supabase
          .from("partner_applications")
          .select(`
            id,
            created_at,
            status,
            company_name,
            current_usage,
            partner_name,
            profiles:user_id (
              id,
              full_name,
              email
            )
          `)
          .order("created_at", { ascending: false })
        
        if (error) {
          // 테이블이 없을 경우 빈 배열 반환
          if (error.code === "42P01") {
            console.warn("partner_applications 테이블이 없습니다.")
            return { data: [], error: null }
          }
          return { data: [], error }
        }
        return { data: data || [], error: null }
      } catch (err) {
        console.error("Partner applications query error:", err)
        return { data: [], error: err }
      }
    })(),
    
    // Categories: 파트너스 카테고리만
    supabase
      .from("categories")
      .select("*")
      .eq("type", "partner")
      .order("created_at", { ascending: true }),
  ])

  const servicesNormalized = (servicesResult.data || []).map((item: any) => {
    const profile = Array.isArray(item.profiles) ? item.profiles[0] : item.profiles
    return { ...item, profiles: profile }
  })

  const applicationsNormalized = (applicationsResult.data || []).map((item: any) => {
    const profile = Array.isArray(item.profiles) ? item.profiles[0] : item.profiles
    return { ...item, profiles: profile }
  })

  return (
    <div className="w-full">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">파트너스 관리</h1>
        <p className="mt-2 text-slate-600">제휴 업체 및 신청 내역을 관리합니다</p>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-6">
        <Tabs defaultValue="list" className="w-full">
          <TabsList className="grid w-full max-w-2xl grid-cols-3 mb-6">
            <TabsTrigger value="list">제휴 업체 목록</TabsTrigger>
            <TabsTrigger value="applications">신청 내역 관리</TabsTrigger>
            <TabsTrigger value="categories">카테고리 관리</TabsTrigger>
          </TabsList>

          <TabsContent value="list" className="mt-0">
            <PartnerListTab
              initialServices={servicesNormalized}
              initialCategories={categoriesResult.data || []}
            />
          </TabsContent>

          <TabsContent value="applications" className="mt-0">
            <PartnerApplicationsTab
              applications={applicationsNormalized}
            />
          </TabsContent>

          <TabsContent value="categories" className="mt-0">
            <PartnerCategoryTab
              initialCategories={categoriesResult.data || []}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

