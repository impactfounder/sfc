import { createClient } from "@/lib/supabase/server"
import { DashboardLayout } from "@/components/dashboard-layout"
import SidebarProfile from "@/components/sidebar-profile"
import { PageHeader } from "@/components/page-header"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Briefcase, CheckCircle2, ArrowRight } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { cn } from "@/lib/utils"

const categoryLabels: Record<string, string> = {
  development: "개발",
  design: "디자인",
  marketing: "마케팅",
  business: "비즈니스",
  consulting: "컨설팅",
  other: "기타"
}

const categoryColors: Record<string, string> = {
  development: "bg-blue-100 text-blue-700",
  design: "bg-purple-100 text-purple-700",
  marketing: "bg-pink-100 text-pink-700",
  business: "bg-green-100 text-green-700",
  consulting: "bg-amber-100 text-amber-700",
  other: "bg-slate-100 text-slate-700"
}

export default async function PartnersPage() {
  const supabase = await createClient()

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

  return (
    <DashboardLayout sidebarProfile={<SidebarProfile />}>
      <div className="w-full flex flex-col gap-10">
        {/* PageHeader */}
        <PageHeader
          title="파트너스"
          description="비즈니스 성장을 위한 검증된 파트너를 만나보세요."
        />

        {/* 카테고리 필터 (추후 클라이언트 컴포넌트로 확장 가능) */}
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            className="rounded-full"
            asChild
          >
            <Link href="/partners">전체</Link>
          </Button>
          {Object.entries(categoryLabels).map(([value, label]) => (
            <Button
              key={value}
              variant="outline"
              className="rounded-full"
              asChild
            >
              <Link href={`/partners?category=${value}`}>{label}</Link>
            </Button>
          ))}
        </div>

        {/* 서비스 리스트 */}
        {allServices.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {allServices.map((service) => (
              <Link key={service.id} href={`/partners/${service.id}`}>
                <Card
                  className={cn(
                    "h-full overflow-hidden transition-all hover:shadow-lg hover:-translate-y-1",
                    service.is_verified && "bg-gradient-to-br from-blue-50/50 to-indigo-50/50 border-blue-200"
                  )}
                >
                  <div className="relative aspect-video w-full overflow-hidden">
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
                    {service.is_verified && (
                      <div className="absolute top-3 right-3">
                        <Badge className="bg-blue-600 text-white border-none shadow-md">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          SFC 인증
                        </Badge>
                      </div>
                    )}
                    <div className="absolute top-3 left-3">
                      <Badge className={cn("border-none shadow-sm", categoryColors[service.category] || categoryColors.other)}>
                        {categoryLabels[service.category] || "기타"}
                      </Badge>
                    </div>
                  </div>
                  <CardContent className="p-5">
                    <h3 className="text-lg font-bold text-slate-900 mb-2 line-clamp-2">
                      {service.title}
                    </h3>
                    <p className="text-sm text-slate-600 mb-4 line-clamp-2">
                      {service.description}
                    </p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={service.profiles?.avatar_url || undefined} />
                          <AvatarFallback className="bg-blue-100 text-blue-600 text-xs">
                            {service.profiles?.full_name?.[0] || "U"}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-xs text-slate-500">
                          {service.profiles?.full_name || "제공자"}
                        </span>
                      </div>
                      {service.price_range && (
                        <span className="text-sm font-semibold text-slate-900">
                          {service.price_range}
                        </span>
                      )}
                    </div>
                    <div className="mt-4 flex items-center text-blue-600 text-sm font-medium">
                      자세히 보기
                      <ArrowRight className="h-4 w-4 ml-1" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <Card className="p-12 text-center">
            <Briefcase className="h-12 w-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 mb-2">
              등록된 서비스가 없습니다
            </h3>
            <p className="text-sm text-slate-500">
              첫 번째 파트너 서비스를 등록해보세요.
            </p>
          </Card>
        )}
      </div>
    </DashboardLayout>
  )
}


