import { createClient } from "@/lib/supabase/server"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Briefcase, CheckCircle2, ArrowRight, Gift, Sparkles, Plus } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { cn } from "@/lib/utils"
import { StandardRightSidebar } from "@/components/standard-right-sidebar"
import { PartnerProposalButtonClient } from "@/components/partner-proposal-button-client"
import { PageHeader } from "@/components/page-header"
import { DashboardLayout } from "@/components/dashboard-layout"
import SidebarProfile from "@/components/sidebar-profile"
import { SiteHeader } from "@/components/site-header"

// 카테고리 색상 매핑 (기본 색상, 카테고리 이름에 따라 동적으로 할당)
const getCategoryColor = (categoryName: string, index: number): string => {
  const colors = [
    "bg-blue-100 text-blue-700",
    "bg-purple-100 text-purple-700",
    "bg-pink-100 text-pink-700",
    "bg-green-100 text-green-700",
    "bg-amber-100 text-amber-700",
    "bg-indigo-100 text-indigo-700",
    "bg-teal-100 text-teal-700",
    "bg-orange-100 text-orange-700",
  ]
  return colors[index % colors.length] || "bg-slate-100 text-slate-700"
}

export default async function PartnersPage() {
  const supabase = await createClient()

  // 파트너 카테고리 가져오기
  const { data: partnerCategories } = await supabase
    .from("categories")
    .select("id, name, type")
    .eq("type", "partner")
    .order("created_at", { ascending: true })

  // 카테고리 이름 매핑 생성 (categories 테이블에서 가져온 데이터 사용)
  const categoryLabels: Record<string, string> = {}
  const categoryColorMap: Record<string, string> = {}
  if (partnerCategories) {
    partnerCategories.forEach((cat, index) => {
      categoryLabels[cat.name] = cat.name
      // 카테고리 이름을 키로 사용하여 색상 매핑
      categoryColorMap[cat.name] = getCategoryColor(cat.name, index)
    })
  }

  // 파트너 서비스 데이터 가져오기 (인증된 항목을 먼저, 그 다음 최신순)
  const { data: services } = await supabase
    .from("partner_services")
    .select(`
      *,
      profiles:provider_id (
        id,
        full_name,
        avatar_url
      )
    `)
    .order("is_verified", { ascending: false })
    .order("created_at", { ascending: false })

  // 인증된 서비스와 일반 서비스 분리
  const verifiedServices = services?.filter(s => s.is_verified) || []
  const regularServices = services?.filter(s => !s.is_verified) || []
  const allServices = [...verifiedServices, ...regularServices]

  // 더미 데이터 (실제 데이터가 없을 때 표시)
  const dummyPartners = [
    {
      id: "dummy-1",
      title: "AWS 클라우드 서비스",
      description: "엔터프라이즈급 클라우드 인프라와 AI 서비스를 제공합니다.",
      category: "개발",
      thumbnail_url: null,
      is_verified: true,
      profiles: { full_name: "AWS", avatar_url: null },
      benefit: "제휴 혜택: 첫 달 무료"
    },
    {
      id: "dummy-2",
      title: "노션 워크스페이스",
      description: "팀 협업과 문서 관리를 위한 올인원 워크스페이스 솔루션입니다.",
      category: "개발",
      thumbnail_url: null,
      is_verified: true,
      profiles: { full_name: "Notion", avatar_url: null },
      benefit: "제휴 혜택: 연간 플랜 20% 할인"
    },
    {
      id: "dummy-3",
      title: "세무법인 전문 상담",
      description: "스타트업과 중소기업을 위한 세무 자문 및 신고 대행 서비스입니다.",
      category: "회계",
      thumbnail_url: null,
      is_verified: false,
      profiles: { full_name: "세무법인", avatar_url: null },
      benefit: "제휴 혜택: 초기 상담 무료"
    },
    {
      id: "dummy-4",
      title: "법무법인 법률 자문",
      description: "기업법무, 계약 검토, 지적재산권 등 전문 법률 서비스를 제공합니다.",
      category: "법률",
      thumbnail_url: null,
      is_verified: false,
      profiles: { full_name: "법무법인", avatar_url: null },
      benefit: "제휴 혜택: 첫 상담 50% 할인"
    },
  ]

  // 실제 데이터가 없으면 더미 데이터 표시
  const displayServices = allServices.length > 0 ? allServices : dummyPartners

  return (
    <DashboardLayout
      header={<SiteHeader />}
      sidebarProfile={<SidebarProfile />}
      rightSidebar={<StandardRightSidebar />}
    >
      <div className="w-full flex flex-col gap-10">
        <PageHeader
          title="파트너스"
          description="멤버들을 위한 특별한 혜택을 만나보세요."
          className="w-full"
          compact={true}
        />

        <div className="flex justify-between items-center mt-4">
          <h2 className="text-xl font-bold text-slate-900">제휴 업체 목록</h2>
          <PartnerProposalButtonClient />
        </div>

        <div className="flex flex-wrap gap-2">
          <Button variant="outline" className="rounded-full" asChild>
            <Link href="/partners">전체</Link>
          </Button>
          {partnerCategories && partnerCategories.map((cat) => (
            <Button
              key={cat.id}
              variant="outline"
              className="rounded-full"
              asChild
            >
              <Link href={`/partners?category=${cat.name}`}>{cat.name}</Link>
            </Button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {displayServices.map((service) => {
            const isDummy = service.id?.startsWith("dummy-")
            const serviceCategory = service.category || "기타"
            const categoryIndex = partnerCategories?.findIndex(cat => cat.name === serviceCategory) ?? 0
            
            const cardElement = (
              <Card
                className={cn(
                  "flex flex-col h-full overflow-hidden transition-all duration-300",
                  "rounded-2xl border-0 shadow-sm hover:shadow-xl hover:-translate-y-2",
                  "bg-white p-0",
                  service.is_verified && "bg-gradient-to-br from-blue-50/30 to-indigo-50/30",
                  !isDummy && "cursor-pointer"
                )}
              >
                {/* 상단: 썸네일 이미지 (Full Bleed) */}
                <div className="relative aspect-video w-full overflow-hidden rounded-t-2xl">
                  {service.thumbnail_url ? (
                    <Image
                      src={service.thumbnail_url}
                      alt={service.title}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center">
                      <Briefcase className="h-12 w-12 text-slate-400" />
                    </div>
                  )}
                  {/* 카테고리 뱃지 (왼쪽 상단 오버레이 - 글래스모피즘) */}
                  <div className="absolute top-3 left-3 z-20">
                    <span className="bg-black/50 backdrop-blur-md text-white border-none rounded-full px-3 py-1 text-xs font-medium">
                      {categoryLabels[serviceCategory] || serviceCategory}
                    </span>
                  </div>
                </div>

                {/* 하단: 콘텐츠 영역 (패딩 추가) */}
                <div className="flex flex-col flex-grow p-6">
                  {/* 중단: 로고 + 이름 */}
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12 flex-shrink-0 border-2 border-slate-100">
                      <AvatarImage src={service.profiles?.avatar_url || undefined} />
                      <AvatarFallback className="bg-blue-100 text-blue-600 font-semibold text-base">
                        {service.profiles?.full_name?.[0] || service.title?.[0] || "P"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-bold text-slate-900 truncate mb-1">
                        {service.title}
                      </h3>
                      <p className="text-sm text-slate-500 truncate">
                        {service.profiles?.full_name || "파트너"}
                      </p>
                    </div>
                  </div>

                  {/* 하단: 한 줄 소개 + 제휴 혜택 */}
                  <div className="space-y-3">
                    <p className="text-sm text-slate-600 line-clamp-2 leading-relaxed">
                      {service.description}
                    </p>
                    {service.benefit && (
                      <div className="bg-blue-50 text-blue-600 px-4 py-3.5 rounded-xl">
                        <div className="flex items-center gap-2.5">
                          <div className="flex-shrink-0">
                            <Gift className="h-5 w-5 text-blue-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold mb-0.5 uppercase tracking-wide">
                              제휴 혜택
                            </p>
                            <p className="text-base font-bold leading-tight">
                              {service.benefit.replace("제휴 혜택: ", "")}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            )

            return isDummy ? (
              <div key={service.id}>
                {cardElement}
              </div>
            ) : (
              <Link 
                key={service.id} 
                href={`/partners/${service.id}`}
                className="block h-full"
              >
                {cardElement}
              </Link>
            )
          })}
        </div>
      </div>
    </DashboardLayout>
  )
}


