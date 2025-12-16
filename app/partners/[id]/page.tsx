import { createClient } from "@/lib/supabase/server"
import { getCurrentUserProfile } from "@/lib/queries/profiles"
import { DashboardLayout } from "@/components/dashboard-layout"
import SidebarProfile from "@/components/sidebar-profile"
import { SiteHeader } from "@/components/site-header"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { CheckCircle2, ArrowRight, ExternalLink } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { notFound } from "next/navigation"
import { cn } from "@/lib/utils"

// 카테고리 색상 매핑 (기본 색상, 카테고리 이름에 따라 동적으로 할당)
const getCategoryColor = (categoryName: string, categories: Array<{ name: string }>): string => {
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
  const index = categories.findIndex(cat => cat.name === categoryName)
  return index >= 0 ? colors[index % colors.length] : "bg-slate-100 text-slate-700"
}

export default async function PartnerServiceDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const supabase = await createClient()
  const userProfile = await getCurrentUserProfile(supabase)
  const userRole = userProfile?.profile?.role || null

  // 파트너 카테고리 가져오기
  const { data: partnerCategories } = await supabase
    .from("categories")
    .select("id, name, type")
    .eq("type", "partner")
    .order("created_at", { ascending: true })

  // 카테고리 이름 매핑 생성
  const categoryLabels: Record<string, string> = {}
  if (partnerCategories) {
    partnerCategories.forEach(cat => {
      categoryLabels[cat.name] = cat.name
    })
  }

  // 서비스 상세 정보 가져오기
  const { data: service } = await supabase
    .from("partner_services")
    .select(`
      *,
      profiles:provider_id (
        id,
        full_name,
        avatar_url,
        bio
      )
    `)
    .eq("id", params.id)
    .single()

  if (!service) {
    notFound()
  }

  return (
    <DashboardLayout header={<SiteHeader />} sidebarProfile={<SidebarProfile />} userRole={userRole}>
      <div className="w-full flex flex-col gap-8">
        {/* 썸네일 이미지 */}
        <div className="relative aspect-video w-full rounded-xl overflow-hidden">
          {service.thumbnail_url ? (
            <Image
              src={service.thumbnail_url}
              alt={service.title}
              fill
              className="object-cover"
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-slate-200 to-slate-300" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <div className="absolute bottom-6 left-6 right-6">
            <div className="flex items-center gap-3 mb-3">
              {service.is_verified && (
                <Badge className="bg-blue-600 text-white border-none shadow-md">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  SFC 인증
                </Badge>
              )}
              <Badge className={cn(
                "border-none shadow-sm",
                getCategoryColor(service.category, partnerCategories || [])
              )}>
                {categoryLabels[service.category] || service.category || "기타"}
              </Badge>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
              {service.title}
            </h1>
            <p className="text-lg text-white/90">
              {service.description}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 메인 콘텐츠 */}
          <div className="lg:col-span-2 space-y-6">
            {/* 제공자 정보 */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={service.profiles?.avatar_url || undefined} />
                    <AvatarFallback className="bg-blue-100 text-blue-600 text-xl font-bold">
                      {service.profiles?.full_name?.[0] || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-slate-900 mb-1">
                      {service.profiles?.full_name || "제공자"}
                    </h3>
                    {service.profiles?.bio && (
                      <p className="text-sm text-slate-600">
                        {service.profiles.bio}
                      </p>
                    )}
                  </div>
                  <Link href={`/member/${service.profiles?.id}`}>
                    <Button variant="outline" size="sm">
                      프로필 보기
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>

            {/* 서비스 상세 설명 */}
            {service.content && (
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-xl font-bold text-slate-900 mb-4">
                    서비스 상세
                  </h2>
                  <div
                    className="prose prose-slate max-w-none"
                    dangerouslySetInnerHTML={{ __html: service.content }}
                  />
                </CardContent>
              </Card>
            )}
          </div>

          {/* 사이드바 */}
          <div className="space-y-6">
            {/* 가격 정보 */}
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-bold text-slate-900 mb-4">
                  가격 정보
                </h3>
                {service.price_range ? (
                  <div className="text-2xl font-bold text-slate-900">
                    {service.price_range}
                  </div>
                ) : (
                  <div className="text-lg text-slate-500">
                    문의 필요
                  </div>
                )}
              </CardContent>
            </Card>

            {/* 서비스 정보 */}
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-bold text-slate-900 mb-4">
                  서비스 정보
                </h3>
                <div className="space-y-3">
                  <div>
                    <div className="text-xs text-slate-500 mb-1">카테고리</div>
                    <Badge className={cn(
                      "border-none",
                      getCategoryColor(service.category, partnerCategories || [])
                    )}>
                      {categoryLabels[service.category] || service.category || "기타"}
                    </Badge>
                  </div>
                  <div>
                    <div className="text-xs text-slate-500 mb-1">등록일</div>
                    <div className="text-sm text-slate-900">
                      {new Date(service.created_at).toLocaleDateString('ko-KR', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Sticky 문의하기 바 */}
      {service.contact_link && (
        <div className="fixed bottom-0 left-0 right-0 lg:left-72 bg-white border-t border-slate-200 shadow-lg z-50 p-4">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div>
              <div className="text-sm text-slate-500">이 서비스에 관심이 있으신가요?</div>
              <div className="text-lg font-bold text-slate-900">{service.title}</div>
            </div>
            <Button
              size="lg"
              className="bg-slate-900 hover:bg-slate-800 text-white"
              asChild
            >
              <a href={service.contact_link} target="_blank" rel="noopener noreferrer">
                문의하기
                <ExternalLink className="h-4 w-4 ml-2" />
              </a>
            </Button>
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}


