"use client"

import { useState, useMemo } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Users, Zap, Handshake, TrendingUp, ArrowRight, Target, ChevronDown, ChevronUp, Shield, Award, Star, TrendingUp as TrendingUpIcon } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { StandardRightSidebar } from "@/components/standard-right-sidebar"

type Badge = {
  id: string
  name: string
  icon: string
  category: string
  description: string | null
}

type BadgeCategory = {
  category_value: string
  category_label: string
  sort_order: number
}

type AboutContentProps = {
  badges: Badge[]
  badgeCategories?: BadgeCategory[]
  isLoggedIn?: boolean
}

const categoryConfig = {
  personal_asset: {
    label: "개인 자산 (Asset)",
    icon: "💰",
    bgColor: "bg-green-100/50",
    textColor: "text-green-700"
  },
  corporate_revenue: {
    label: "기업 매출 (Revenue)",
    icon: "📈",
    bgColor: "bg-blue-100/50",
    textColor: "text-blue-700"
  },
  investment: {
    label: "투자 규모 (Investment Tier)",
    icon: "💰",
    bgColor: "bg-amber-100/50",
    textColor: "text-amber-700"
  },
  valuation: {
    label: "기업가치 (Valuation Tier)",
    icon: "🏙️",
    bgColor: "bg-indigo-100/50",
    textColor: "text-indigo-700"
  },
  influence: {
    label: "인플루언서 (Influence Tier)",
    icon: "📣",
    bgColor: "bg-red-100/50",
    textColor: "text-red-700"
  },
  professional: {
    label: "전문직 (Professional License)",
    icon: "⚖️",
    bgColor: "bg-blue-100/50",
    textColor: "text-blue-700"
  },
  community: {
    label: "커뮤니티 (Community)",
    icon: "🛡️",
    bgColor: "bg-purple-100/50",
    textColor: "text-purple-700"
  }
} as const

export default function AboutContent({ badges, badgeCategories = [], isLoggedIn = false }: AboutContentProps) {
  const [isBadgeExpanded, setIsBadgeExpanded] = useState(false)

  // 카테고리별로 뱃지 그룹화 (관리자 설정 순서 적용)
  const badgesByCategory = useMemo(() => {
    const grouped: Record<string, Badge[]> = {}
    badges.forEach((badge) => {
      if (!grouped[badge.category]) {
        grouped[badge.category] = []
      }
      grouped[badge.category].push(badge)
    })
    return grouped
  }, [badges])

  // 관리자 설정 순서대로 카테고리 정렬
  const sortedCategories = useMemo(() => {
    if (badgeCategories.length === 0) {
      // badge_categories 데이터가 없으면 기존 순서 유지
      return Object.keys(badgesByCategory)
    }

    // sort_order 기준으로 정렬된 카테고리 목록
    const sorted = [...badgeCategories]
      .sort((a, b) => {
        // 1차 정렬: sort_order
        if (a.sort_order !== b.sort_order) {
          return a.sort_order - b.sort_order
        }
        // 2차 정렬: created_at (categoryConfig에 있는 순서)
        return 0
      })
      .map(cat => cat.category_value)
      .filter(cat => badgesByCategory[cat] && badgesByCategory[cat].length > 0) // 뱃지가 있는 카테고리만

    // badge_categories에 없는 카테고리도 추가 (기존 뱃지가 있는 경우)
    const allCategories = new Set([...sorted, ...Object.keys(badgesByCategory)])
    return Array.from(allCategories)
  }, [badgeCategories, badgesByCategory])

  return (
    <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8">
      <div className="lg:col-span-9 flex flex-col gap-6">

        {/* Hero Section (메인 화면과 100% 동일하게 수정됨) */}
        <div className="relative w-full overflow-hidden rounded-2xl bg-slate-900 shadow-md mb-10">
          {/* 배경 이미지 */}
          <div className="absolute inset-0">
            <div className="relative w-full h-full">
              <Image
                src="https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?q=80&w=2613&auto=format&fit=crop"
                alt="Background"
                fill
                className="object-cover opacity-20"
                priority
              />
            </div>
            <div className="absolute inset-0 bg-gradient-to-r from-slate-900/95 via-slate-900/80 to-slate-900/95" />
          </div>

          {/* 콘텐츠 (중앙 정렬 + 컴팩트한 패딩) */}
          <div className="relative z-10 px-4 py-8 md:py-10 flex flex-col items-center text-center max-w-6xl mx-auto">

            {/* 뱃지 */}
            <div className="inline-block px-3 py-0.5 mb-3 rounded-full border border-slate-600 bg-slate-800/50 text-slate-300 text-[10px] font-medium tracking-wider backdrop-blur-sm">
              SEOUL FOUNDERS CLUB
            </div>

            {/* 제목 */}
            <h1 className="text-xl md:text-3xl lg:text-4xl font-bold text-white mb-3 leading-tight tracking-tight">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">새로운 가치</span>를 만드는 사람들의 베이스캠프
            </h1>

            {/* 설명 */}
            <div className="text-slate-400 text-xs md:text-sm leading-relaxed max-w-2xl mx-auto mb-5">
              <p>
                서울을 기반으로 활동하는 <strong>창업가, 투자자, 크리에이터</strong>가 모여
              </p>
              <p className="hidden md:block">
                신뢰를 바탕으로 연결되고, 함께 성장하는 비즈니스 커뮤니티입니다.
              </p>
              <p className="md:hidden">
                신뢰를 바탕으로 연결되고, 함께 성장하는 비즈니스 커뮤니티입니다.
              </p>
            </div>

            {/* 버튼 */}
            <Link href="/auth/login">
              <Button
                size="sm"
                className="h-10 px-6 text-sm bg-white text-slate-900 hover:bg-slate-100 hover:scale-[1.02] transition-all duration-300 rounded-full font-bold shadow-lg border-0"
              >
                3초만에 가입하기
              </Button>
            </Link>
          </div>
        </div>
        {/* 2. WHO WE ARE: 대상 명확화 */}
        <div className="py-16 px-6 bg-white rounded-xl shadow-sm">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold text-slate-900 mb-4">우리는 서로의 성장 동력입니다</h2>
              <p className="text-slate-500 text-lg">각자의 영역에서 성과를 증명한 리더들이 모입니다.</p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {/* 창업가 */}
              <div className="flex flex-col items-center text-center group">
                <div className="w-20 h-20 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 mb-6 group-hover:scale-110 transition-transform duration-300">
                  <Target className="h-10 w-10" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">창업가 & 사업가</h3>
                <p className="text-slate-500 leading-relaxed text-sm">
                  문제를 해결하고 세상을 바꾸는<br />
                  비즈니스 빌더 (Builder)
                </p>
              </div>

              {/* 투자자 */}
              <div className="flex flex-col items-center text-center group">
                <div className="w-20 h-20 rounded-2xl bg-green-50 flex items-center justify-center text-green-600 mb-6 group-hover:scale-110 transition-transform duration-300">
                  <TrendingUp className="h-10 w-10" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">투자자</h3>
                <p className="text-slate-500 leading-relaxed text-sm">
                  가능성을 알아보고 자원을 더해주는<br />
                  성장 조력자 (Backer)
                </p>
              </div>

              {/* 크리에이터 */}
              <div className="flex flex-col items-center text-center group">
                <div className="w-20 h-20 rounded-2xl bg-purple-50 flex items-center justify-center text-purple-600 mb-6 group-hover:scale-110 transition-transform duration-300">
                  <Zap className="h-10 w-10" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">인플루언서 & 크리에이터</h3>
                <p className="text-slate-500 leading-relaxed text-sm">
                  스토리와 영향력으로 가치를 전파하는<br />
                  메신저 (Storyteller)
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 3. WHAT YOU GET: 제공 가치 (핵심) */}
        <div className="py-20 px-6 bg-slate-50">
          <div className="max-w-6xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-4">
              <div>
                <span className="text-blue-600 font-bold tracking-wide text-sm uppercase mb-2 block">Opportunities</span>
                <h2 className="text-3xl md:text-4xl font-bold text-slate-900">
                  SFC가 드리는<br />3가지 핵심 가치
                </h2>
              </div>
              <p className="text-slate-500 text-right md:max-w-md leading-relaxed">
                혼자서는 얻기 힘든 기회들을 연결합니다.<br />
                검증된 멤버들과 함께 성장의 속도를 높이세요.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {/* 카드 1 */}
              <Card className="bg-white border-none rounded-xl shadow-sm hover:shadow-md transition-shadow duration-300 overflow-hidden h-full">
                <CardContent className="p-8 h-full flex flex-col">
                  <div className="h-12 w-12 bg-slate-900 rounded-lg flex items-center justify-center text-white mb-6">
                    <Users className="h-6 w-6" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-3">검증된 네트워크</h3>
                  <p className="text-slate-500 mb-6 flex-1 leading-relaxed">
                    아무나 만나는 모임이 아닙니다. 인증 뱃지 시스템을 통해 신원이 검증된, 결이 맞는 사람들과 깊이 있게 교류합니다.
                  </p>
                  <ul className="space-y-2 text-sm text-slate-700 font-medium">
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
                      C-Level 프라이빗 디너
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
                      산업군별 소모임
                    </li>
                  </ul>
                </CardContent>
              </Card>

              {/* 카드 2 */}
              <Card className="bg-white border-none rounded-xl shadow-sm hover:shadow-md transition-shadow duration-300 overflow-hidden h-full">
                <CardContent className="p-8 h-full flex flex-col">
                  <div className="h-12 w-12 bg-slate-900 rounded-lg flex items-center justify-center text-white mb-6">
                    <Zap className="h-6 w-6" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-3">실전 인사이트</h3>
                  <p className="text-slate-500 mb-6 flex-1 leading-relaxed">
                    책이나 뉴스에는 없는, 현장의 진짜 이야기를 공유합니다. 성공과 실패의 경험을 통해 시행착오를 줄입니다.
                  </p>
                  <ul className="space-y-2 text-sm text-slate-700 font-medium">
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-purple-500 rounded-full" />
                      전문가 초청 독점 세미나
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-purple-500 rounded-full" />
                      투자 유치 & 스케일업 노하우
                    </li>
                  </ul>
                </CardContent>
              </Card>

              {/* 카드 3 */}
              <Card className="bg-white border-none rounded-xl shadow-sm hover:shadow-md transition-shadow duration-300 overflow-hidden h-full">
                <CardContent className="p-8 h-full flex flex-col">
                  <div className="h-12 w-12 bg-slate-900 rounded-lg flex items-center justify-center text-white mb-6">
                    <Handshake className="h-6 w-6" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-3">비즈니스 기회</h3>
                  <p className="text-slate-500 mb-6 flex-1 leading-relaxed">
                    단순한 친목을 넘어 실질적인 비즈니스 성과를 만듭니다. 공동 창업, 채용, 투자, 제휴가 자연스럽게 일어납니다.
                  </p>
                  <ul className="space-y-2 text-sm text-slate-700 font-medium">
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                      공동 창업자 & 핵심 인재 매칭
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                      IR 피칭 및 투자 연계
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* 4. 뱃지 시스템 소개 */}
        <div className="py-20 px-6 bg-white rounded-xl shadow-sm">
          <div className="max-w-6xl mx-auto">
            <h2 className="mb-8 text-center text-3xl font-bold text-slate-900">
              신뢰를 증명하는 뱃지 시스템
            </h2>
            <p className="text-center text-slate-600 mb-10 max-w-4xl mx-auto text-lg whitespace-nowrap">
              Seoul Founders Club의 검증된 자격과 성과를 인증받아 멤버들의 신뢰를 얻는 뱃지입니다.
            </p>

            {/* 카테고리 미리보기 */}
            <div className="flex justify-center gap-6 mb-8 flex-wrap">
              <div className="flex flex-col items-center gap-2">
                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                  <Shield className="h-6 w-6 text-blue-600" />
                </div>
                <span className="text-sm font-medium text-slate-700">인증</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center">
                  <Award className="h-6 w-6 text-purple-600" />
                </div>
                <span className="text-sm font-medium text-slate-700">활동</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center">
                  <Star className="h-6 w-6 text-amber-600" />
                </div>
                <span className="text-sm font-medium text-slate-700">기여</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                  <TrendingUpIcon className="h-6 w-6 text-green-600" />
                </div>
                <span className="text-sm font-medium text-slate-700">성장</span>
              </div>
            </div>

            {/* 토글 버튼 */}
            <div className="flex justify-center mb-6">
              <Button
                variant="outline"
                onClick={() => setIsBadgeExpanded(!isBadgeExpanded)}
                className="rounded-full w-12 h-12 p-0 bg-slate-50 hover:bg-slate-100 border-slate-200 transition-all duration-300"
                aria-label={isBadgeExpanded ? "접기" : "뱃지 종류 자세히 보기"}
              >
                {isBadgeExpanded ? (
                  <ChevronUp className="h-5 w-5 text-slate-700" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-slate-700" />
                )}
              </Button>
            </div>

            <div className={`overflow-hidden transition-all duration-500 ease-in-out ${isBadgeExpanded ? 'max-h-[5000px] opacity-100' : 'max-h-0 opacity-0'}`}>
              {isBadgeExpanded && (
                <>
                  <div className="space-y-12">
                    {/* 카테고리별로 뱃지 렌더링 (관리자 설정 순서 적용) */}
                    {sortedCategories.map((category) => {
                      const categoryBadges = badgesByCategory[category]
                      if (!categoryBadges || categoryBadges.length === 0) return null

                      // categoryConfig에서 설정 가져오기, 없으면 기본 설정 사용
                      const config = categoryConfig[category as keyof typeof categoryConfig] || {
                        label: category,
                        icon: "🏷️",
                        bgColor: "bg-slate-100/50",
                        textColor: "text-slate-700"
                      }

                      // badge_categories에서 가져온 label 사용 (있으면)
                      const categoryInfo = badgeCategories.find(cat => cat.category_value === category)
                      const categoryLabel = categoryInfo?.category_label || config.label

                      // 숫자가 포함된 뱃지는 숫자 순으로 정렬 (낮은 숫자부터)
                      const shouldSortByNumber = ['corporate_revenue', 'investment', 'valuation', 'influence'].includes(category)

                      const sortedBadges = shouldSortByNumber
                        ? [...categoryBadges].sort((a, b) => {
                          // 유니콘은 항상 마지막에 배치
                          if (a.name.includes('유니콘')) return 1
                          if (b.name.includes('유니콘')) return -1

                          // 뱃지 이름에서 숫자 추출하여 정렬
                          const extractNumber = (name: string): number => {
                            // 숫자와 단위 추출 (예: "10억", "100만")
                            const match = name.match(/(\d+(?:\.\d+)?)\s*(억|만|조)?/)
                            if (!match) return 0

                            const num = parseFloat(match[1])
                            const unit = match[2]

                            // 단위를 고려한 실제 값 계산
                            if (unit === '조') return num * 1000000000000
                            if (unit === '억') return num * 100000000
                            if (unit === '만') return num * 10000
                            return num
                          }

                          return extractNumber(a.name) - extractNumber(b.name)
                        })
                        : categoryBadges

                      return (
                        <div key={category}>
                          <h3 className="mb-6 text-xl font-bold text-slate-900 border-b border-slate-200 pb-3 flex items-center gap-2">
                            <span className="text-2xl pt-1">{config.icon}</span>
                            {categoryLabel}
                          </h3>
                          <div className="grid gap-4 grid-cols-2 lg:grid-cols-3">
                            {sortedBadges.map((badge) => (
                              <Card
                                key={badge.id}
                                className={`p-3 rounded-xl shadow-sm border-none transition-shadow hover:shadow-md ${config.bgColor} ${config.textColor}`}
                              >
                                <div className="flex items-start gap-3">
                                  <div className="hidden md:block flex-shrink-0 text-xl pt-1 text-slate-700">
                                    <span className="text-2xl">{badge.icon}</span>
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="font-semibold text-slate-900 leading-tight line-clamp-1">
                                      {badge.name}
                                    </div>
                                    <div className="text-xs text-slate-700 mt-0.5 leading-snug line-clamp-1">
                                      {badge.description || "-"}
                                    </div>
                                  </div>
                                </div>
                              </Card>
                            ))}
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  <div className="mt-12 p-4 rounded-xl bg-blue-50 border border-blue-100 text-center shadow-sm">
                    <p className="text-sm text-blue-700 font-medium">
                      모든 뱃지는 관리자 검증을 통해 인증되면 프로필에 표시됩니다.
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* 5. CTA SECTION */}
        <div className="py-24 px-6 bg-white text-center">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-6">
              준비되셨나요?
            </h2>
            <p className="text-lg text-slate-600 mb-10 leading-relaxed">
              당신의 성장을 가속화할 파트너들이 기다리고 있습니다.<br />
              지금 Seoul Founders Club에 합류하세요.
            </p>
            <div className="flex justify-center">
              <Link href={isLoggedIn ? "/" : "/auth/login"}>
                <Button size="lg" className="h-14 px-8 rounded-full text-base bg-slate-900 hover:bg-slate-800 text-white shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all">
                  가입하기 <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* [RIGHT] 우측 사이드바 영역 */}
      <div className="hidden lg:block lg:col-span-3">
        <div className="sticky top-8 flex flex-col gap-6 h-fit">
          <StandardRightSidebar />
        </div>
      </div>
    </div>
  )
}
