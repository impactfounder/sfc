import { createClient } from "@/lib/supabase/server"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { CheckCircle2, ExternalLink } from "lucide-react"
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

// 더미 데이터 정의
const dummyPartners: Record<string, any> = {
  "dummy-1": {
    id: "dummy-1",
    title: "AWS 클라우드 서비스",
    description: "엔터프라이즈급 클라우드 인프라와 AI 서비스를 제공합니다.",
    content: `
      <h3>서비스 소개</h3>
      <p>AWS는 세계 최대의 클라우드 컴퓨팅 플랫폼으로, 스타트업부터 대기업까지 다양한 규모의 기업에 최적화된 클라우드 솔루션을 제공합니다.</p>
      <h3>주요 혜택</h3>
      <ul>
        <li>첫 달 크레딧 $1,000 제공</li>
        <li>전담 기술 지원</li>
        <li>스타트업 전용 프로그램 참여 기회</li>
      </ul>
    `,
    category: "개발",
    price_range: "사용량 기반",
    thumbnail_url: null,
    is_verified: true,
    contact_link: "https://aws.amazon.com",
    created_at: new Date().toISOString(),
    profiles: { id: null, full_name: "AWS", avatar_url: null, bio: "Amazon Web Services" },
    benefit: "첫 달 무료"
  },
  "dummy-2": {
    id: "dummy-2",
    title: "노션 워크스페이스",
    description: "팀 협업과 문서 관리를 위한 올인원 워크스페이스 솔루션입니다.",
    content: `
      <h3>서비스 소개</h3>
      <p>노션은 문서, 위키, 프로젝트 관리를 하나로 통합한 협업 도구입니다. 팀의 모든 지식을 한 곳에서 관리하세요.</p>
      <h3>주요 혜택</h3>
      <ul>
        <li>연간 플랜 20% 할인</li>
        <li>무제한 게스트 초대</li>
        <li>프리미엄 템플릿 제공</li>
      </ul>
    `,
    category: "개발",
    price_range: "월 $8부터",
    thumbnail_url: null,
    is_verified: true,
    contact_link: "https://notion.so",
    created_at: new Date().toISOString(),
    profiles: { id: null, full_name: "Notion", avatar_url: null, bio: "All-in-one workspace" },
    benefit: "연간 플랜 20% 할인"
  },
  "dummy-3": {
    id: "dummy-3",
    title: "세무법인 전문 상담",
    description: "스타트업과 중소기업을 위한 세무 자문 및 신고 대행 서비스입니다.",
    content: `
      <h3>서비스 소개</h3>
      <p>스타트업 전문 세무사가 여러분의 사업을 지원합니다. 법인 설립부터 세무 신고까지 원스톱 서비스를 제공합니다.</p>
      <h3>주요 혜택</h3>
      <ul>
        <li>초기 상담 무료</li>
        <li>월 기장료 20% 할인</li>
        <li>긴급 세무 상담 우선 배정</li>
      </ul>
    `,
    category: "회계",
    price_range: "월 20만원부터",
    thumbnail_url: null,
    is_verified: false,
    contact_link: null,
    created_at: new Date().toISOString(),
    profiles: { id: null, full_name: "세무법인", avatar_url: null, bio: "스타트업 전문 세무 서비스" },
    benefit: "초기 상담 무료"
  },
  "dummy-4": {
    id: "dummy-4",
    title: "법무법인 법률 자문",
    description: "기업법무, 계약 검토, 지적재산권 등 전문 법률 서비스를 제공합니다.",
    content: `
      <h3>서비스 소개</h3>
      <p>스타트업과 중소기업을 위한 맞춤형 법률 서비스를 제공합니다. 계약서 검토부터 투자 유치까지 함께합니다.</p>
      <h3>주요 혜택</h3>
      <ul>
        <li>첫 상담 50% 할인</li>
        <li>계약서 검토 우선 처리</li>
        <li>정기 법률 자문 패키지 할인</li>
      </ul>
    `,
    category: "법률",
    price_range: "상담 후 결정",
    thumbnail_url: null,
    is_verified: false,
    contact_link: null,
    created_at: new Date().toISOString(),
    profiles: { id: null, full_name: "법무법인", avatar_url: null, bio: "기업 전문 법률 서비스" },
    benefit: "첫 상담 50% 할인"
  }
}

export default async function PartnerServiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  // 더미 데이터 체크
  const isDummy = id.startsWith("dummy-")

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

  let service: any = null

  if (isDummy) {
    // 더미 데이터 사용
    service = dummyPartners[id]
  } else {
    // 실제 데이터베이스에서 조회
    const { data } = await supabase
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
      .eq("id", id)
      .single()
    service = data
  }

  if (!service) {
    notFound()
  }

  return (
    <div className="w-full flex flex-col gap-8">
        {/* 썸네일 이미지 */}
        <div className="relative aspect-video w-full rounded-xl overflow-hidden">
          {service.thumbnail_url ? (
            <Image
              src={service.thumbnail_url}
              alt={service.title}
              fill
              sizes="(max-width: 768px) 100vw, 66vw"
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
                  {service.profiles?.id && (
                    <Link href={`/member/${service.profiles.id}`}>
                      <Button variant="outline" size="sm">
                        프로필 보기
                      </Button>
                    </Link>
                  )}
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
            {/* 제휴 혜택 */}
            {service.benefit && (
              <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
                <CardContent className="p-6">
                  <h3 className="text-lg font-bold text-blue-900 mb-3">
                    🎁 제휴 혜택
                  </h3>
                  <div className="text-xl font-bold text-blue-700">
                    {service.benefit}
                  </div>
                </CardContent>
              </Card>
            )}

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
    </div>
  )
}


