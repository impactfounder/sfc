"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Users, Zap, Handshake, TrendingUp, ArrowRight, Target, ChevronDown, ChevronUp } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { StandardRightSidebar } from "@/components/standard-right-sidebar"

export default function AboutContent() {
  const [isBadgeExpanded, setIsBadgeExpanded] = useState(false)

  return (
    <div className="w-full flex flex-col lg:flex-row gap-10 pt-8 pb-20">
      <div className="flex-1 min-w-0 flex flex-col gap-10">
        
        {/* Hero Section (메인 화면과 100% 동일하게 수정됨) */}
        <div className="relative w-full overflow-hidden rounded-2xl bg-slate-900 shadow-md mb-10">
          {/* 배경 이미지 */}
          <div className="absolute inset-0">
            <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?q=80&w=2613&auto=format&fit=crop')] bg-cover bg-center opacity-20" />
            <div className="absolute inset-0 bg-gradient-to-r from-slate-900/95 via-slate-900/80 to-slate-900/95" />
          </div>

          {/* 콘텐츠 (중앙 정렬 + 컴팩트한 패딩) */}
          <div className="relative z-10 px-4 py-8 md:py-10 flex flex-col items-center text-center max-w-5xl mx-auto">
            
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
          <div className="py-16 px-6 bg-white border-b border-slate-100 rounded-2xl">
        <div className="max-w-5xl mx-auto">
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
                문제를 해결하고 세상을 바꾸는<br/>
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
                가능성을 알아보고 자원을 더해주는<br/>
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
                스토리와 영향력으로 가치를 전파하는<br/>
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
                SFC가 드리는<br/>3가지 핵심 가치
              </h2>
            </div>
            <p className="text-slate-500 text-right md:max-w-md leading-relaxed">
              혼자서는 얻기 힘든 기회들을 연결합니다.<br/>
              검증된 멤버들과 함께 성장의 속도를 높이세요.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {/* 카드 1 */}
            <Card className="border-none shadow-lg hover:shadow-xl transition-shadow duration-300 overflow-hidden">
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
                    산업군별 소모임 (반골, 하이토크)
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* 카드 2 */}
            <Card className="border-none shadow-lg hover:shadow-xl transition-shadow duration-300 overflow-hidden">
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
            <Card className="border-none shadow-lg hover:shadow-xl transition-shadow duration-300 overflow-hidden">
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
      <div className="py-20 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <h2 className="mb-8 text-center text-3xl font-bold text-slate-900">
            신뢰를 증명하는 뱃지 시스템
          </h2>
          <p className="text-center text-slate-600 mb-10 max-w-2xl mx-auto text-lg">
            Seoul Founders Club의 검증된 자격과 성과를 인증받아 멤버들의 신뢰를 얻는 뱃지입니다.
          </p>
          
          {/* 토글 버튼 */}
          <div className="flex justify-center mb-6">
            <Button
              variant="ghost"
              onClick={() => setIsBadgeExpanded(!isBadgeExpanded)}
              className="flex items-center gap-2"
            >
              {isBadgeExpanded ? (
                <>
                  접기
                  <ChevronUp className="h-4 w-4" />
                </>
              ) : (
                <>
                  뱃지 종류 자세히 보기
                  <ChevronDown className="h-4 w-4" />
                </>
              )}
            </Button>
          </div>

          {isBadgeExpanded && (
            <>
              <div className="space-y-12">
            {/* 개인 자산 */}
            <div>
              <h3 className="mb-6 text-xl font-bold text-slate-900 border-b border-slate-200 pb-3 flex items-center gap-2">
                <span className="text-2xl pt-1">💰</span>
                개인 자산 (Asset)
              </h3>
              <div className="grid gap-4 grid-cols-2 lg:grid-cols-3">
                <Card className="p-3 shadow-sm border-slate-200 transition-shadow hover:shadow-md bg-green-100/50 text-green-700">
                  <div className="flex items-start gap-3">
                    <div className="hidden md:block flex-shrink-0 text-xl pt-1 text-slate-700">
                      <span className="text-2xl">💰</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-slate-900 leading-tight line-clamp-1">자산 5억+</div>
                      <div className="text-xs text-slate-700 mt-0.5 leading-snug line-clamp-1">순자산 5억 원 이상 인증</div>
                    </div>
                  </div>
                </Card>
                <Card className="p-3 shadow-sm border-slate-200 transition-shadow hover:shadow-md bg-green-100/50 text-green-700">
                  <div className="flex items-start gap-3">
                    <div className="hidden md:block flex-shrink-0 text-xl pt-1 text-slate-700">
                      <span className="text-2xl">💎</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-slate-900 leading-tight line-clamp-1">자산 10억+</div>
                      <div className="text-xs text-slate-700 mt-0.5 leading-snug line-clamp-1">순자산 10억 원 이상 인증</div>
                    </div>
                  </div>
                </Card>
                <Card className="p-3 shadow-sm border-slate-200 transition-shadow hover:shadow-md bg-green-100/50 text-green-700">
                  <div className="flex items-start gap-3">
                    <div className="hidden md:block flex-shrink-0 text-xl pt-1 text-slate-700">
                      <span className="text-2xl">💎</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-slate-900 leading-tight line-clamp-1">자산 50억+</div>
                      <div className="text-xs text-slate-700 mt-0.5 leading-snug line-clamp-1">순자산 50억 원 이상 인증</div>
                    </div>
                  </div>
                </Card>
              </div>
            </div>

            {/* 기업 매출 */}
            <div>
              <h3 className="mb-6 text-xl font-bold text-slate-900 border-b border-slate-200 pb-3 flex items-center gap-2">
                <span className="text-2xl pt-1">📈</span>
                기업 매출 (Revenue)
              </h3>
              <div className="grid gap-4 grid-cols-2 lg:grid-cols-3">
                <Card className="p-3 shadow-sm border-slate-200 transition-shadow hover:shadow-md bg-blue-100/50 text-blue-700">
                  <div className="flex items-start gap-3">
                    <div className="hidden md:block flex-shrink-0 text-xl pt-1 text-slate-700">
                      <span className="text-2xl">📈</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-slate-900 leading-tight line-clamp-1">매출 10억+</div>
                      <div className="text-xs text-slate-700 mt-0.5 leading-snug line-clamp-1">연 매출 10억 원 이상 인증</div>
                    </div>
                  </div>
                </Card>
                <Card className="p-3 shadow-sm border-slate-200 transition-shadow hover:shadow-md bg-blue-100/50 text-blue-700">
                  <div className="flex items-start gap-3">
                    <div className="hidden md:block flex-shrink-0 text-xl pt-1 text-slate-700">
                      <span className="text-2xl">📈</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-slate-900 leading-tight line-clamp-1">매출 50억+</div>
                      <div className="text-xs text-slate-700 mt-0.5 leading-snug line-clamp-1">연 매출 50억 원 이상 인증</div>
                    </div>
                  </div>
                </Card>
                <Card className="p-3 shadow-sm border-slate-200 transition-shadow hover:shadow-md bg-blue-100/50 text-blue-700">
                  <div className="flex items-start gap-3">
                    <div className="hidden md:block flex-shrink-0 text-xl pt-1 text-slate-700">
                      <span className="text-2xl">📈</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-slate-900 leading-tight line-clamp-1">매출 100억+</div>
                      <div className="text-xs text-slate-700 mt-0.5 leading-snug line-clamp-1">연 매출 100억 원 이상 인증</div>
                    </div>
                  </div>
                </Card>
              </div>
            </div>

            {/* 투자 규모 */}
            <div>
              <h3 className="mb-6 text-xl font-bold text-slate-900 border-b border-slate-200 pb-3 flex items-center gap-2">
                <span className="text-2xl pt-1">💰</span>
                투자 규모 (Investment Tier)
              </h3>
              <div className="grid gap-4 grid-cols-2 lg:grid-cols-3">
                <Card className="p-3 shadow-sm border-slate-200 transition-shadow hover:shadow-md bg-amber-100/50 text-amber-700">
                  <div className="flex items-start gap-3">
                    <div className="hidden md:block flex-shrink-0 text-xl pt-1 text-slate-700">
                      <span className="text-2xl">💰</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-slate-900 leading-tight line-clamp-1">투자 1억+</div>
                      <div className="text-xs text-slate-700 mt-0.5 leading-snug line-clamp-1">누적 투자 집행액 1억 원 이상</div>
                    </div>
                  </div>
                </Card>
                <Card className="p-3 shadow-sm border-slate-200 transition-shadow hover:shadow-md bg-amber-100/50 text-amber-700">
                  <div className="flex items-start gap-3">
                    <div className="hidden md:block flex-shrink-0 text-xl pt-1 text-slate-700">
                      <span className="text-2xl">💰</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-slate-900 leading-tight line-clamp-1">투자 5억+</div>
                      <div className="text-xs text-slate-700 mt-0.5 leading-snug line-clamp-1">누적 투자 집행액 5억 원 이상</div>
                    </div>
                  </div>
                </Card>
                <Card className="p-3 shadow-sm border-slate-200 transition-shadow hover:shadow-md bg-amber-100/50 text-amber-700">
                  <div className="flex items-start gap-3">
                    <div className="hidden md:block flex-shrink-0 text-xl pt-1 text-slate-700">
                      <span className="text-2xl">💰</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-slate-900 leading-tight line-clamp-1">투자 10억+</div>
                      <div className="text-xs text-slate-700 mt-0.5 leading-snug line-clamp-1">누적 투자 집행액 10억 원 이상</div>
                    </div>
                  </div>
                </Card>
                <Card className="p-3 shadow-sm border-slate-200 transition-shadow hover:shadow-md bg-amber-100/50 text-amber-700">
                  <div className="flex items-start gap-3">
                    <div className="hidden md:block flex-shrink-0 text-xl pt-1 text-slate-700">
                      <span className="text-2xl">💰</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-slate-900 leading-tight line-clamp-1">투자 30억+</div>
                      <div className="text-xs text-slate-700 mt-0.5 leading-snug line-clamp-1">누적 투자 집행액 30억 원 이상</div>
                    </div>
                  </div>
                </Card>
                <Card className="p-3 shadow-sm border-slate-200 transition-shadow hover:shadow-md bg-amber-100/50 text-amber-700">
                  <div className="flex items-start gap-3">
                    <div className="hidden md:block flex-shrink-0 text-xl pt-1 text-slate-700">
                      <span className="text-2xl">💰</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-slate-900 leading-tight line-clamp-1">투자 50억+</div>
                      <div className="text-xs text-slate-700 mt-0.5 leading-snug line-clamp-1">누적 투자 집행액 50억 원 이상</div>
                    </div>
                  </div>
                </Card>
                <Card className="p-3 shadow-sm border-slate-200 transition-shadow hover:shadow-md bg-amber-100/50 text-amber-700">
                  <div className="flex items-start gap-3">
                    <div className="hidden md:block flex-shrink-0 text-xl pt-1 text-slate-700">
                      <span className="text-2xl">💰</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-slate-900 leading-tight line-clamp-1">투자 100억+</div>
                      <div className="text-xs text-slate-700 mt-0.5 leading-snug line-clamp-1">누적 투자 집행액 100억 원 이상</div>
                    </div>
                  </div>
                </Card>
              </div>
            </div>

            {/* 기업가치 */}
            <div>
              <h3 className="mb-6 text-xl font-bold text-slate-900 border-b border-slate-200 pb-3 flex items-center gap-2">
                <span className="text-2xl pt-1">🏙️</span>
                기업가치 (Valuation Tier)
              </h3>
              <div className="grid gap-4 grid-cols-2 lg:grid-cols-3">
                <Card className="p-3 shadow-sm border-slate-200 transition-shadow hover:shadow-md bg-indigo-100/50 text-indigo-700">
                  <div className="flex items-start gap-3">
                    <div className="hidden md:block flex-shrink-0 text-xl pt-1 text-slate-700">
                      <span className="text-2xl">🏙️</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-slate-900 leading-tight line-clamp-1">기업가치 30억+</div>
                      <div className="text-xs text-slate-700 mt-0.5 leading-snug line-clamp-1">최근 투자 유치 기준 기업가치 30억 원 이상</div>
                    </div>
                  </div>
                </Card>
                <Card className="p-3 shadow-sm border-slate-200 transition-shadow hover:shadow-md bg-indigo-100/50 text-indigo-700">
                  <div className="flex items-start gap-3">
                    <div className="hidden md:block flex-shrink-0 text-xl pt-1 text-slate-700">
                      <span className="text-2xl">🏙️</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-slate-900 leading-tight line-clamp-1">기업가치 50억+</div>
                      <div className="text-xs text-slate-700 mt-0.5 leading-snug line-clamp-1">최근 투자 유치 기준 기업가치 50억 원 이상</div>
                    </div>
                  </div>
                </Card>
                <Card className="p-3 shadow-sm border-slate-200 transition-shadow hover:shadow-md bg-indigo-100/50 text-indigo-700">
                  <div className="flex items-start gap-3">
                    <div className="hidden md:block flex-shrink-0 text-xl pt-1 text-slate-700">
                      <span className="text-2xl">🏙️</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-slate-900 leading-tight line-clamp-1">기업가치 100억+</div>
                      <div className="text-xs text-slate-700 mt-0.5 leading-snug line-clamp-1">최근 투자 유치 기준 기업가치 100억 원 이상</div>
                    </div>
                  </div>
                </Card>
                <Card className="p-3 shadow-sm border-slate-200 transition-shadow hover:shadow-md bg-indigo-100/50 text-indigo-700">
                  <div className="flex items-start gap-3">
                    <div className="hidden md:block flex-shrink-0 text-xl pt-1 text-slate-700">
                      <span className="text-2xl">🏙️</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-slate-900 leading-tight line-clamp-1">기업가치 300억+</div>
                      <div className="text-xs text-slate-700 mt-0.5 leading-snug line-clamp-1">최근 투자 유치 기준 기업가치 300억 원 이상</div>
                    </div>
                  </div>
                </Card>
                <Card className="p-3 shadow-sm border-slate-200 transition-shadow hover:shadow-md bg-indigo-100/50 text-indigo-700">
                  <div className="flex items-start gap-3">
                    <div className="hidden md:block flex-shrink-0 text-xl pt-1 text-slate-700">
                      <span className="text-2xl">🏙️</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-slate-900 leading-tight line-clamp-1">기업가치 1000억+</div>
                      <div className="text-xs text-slate-700 mt-0.5 leading-snug line-clamp-1">최근 투자 유치 기준 기업가치 1000억 원 이상</div>
                    </div>
                  </div>
                </Card>
                <Card className="p-3 shadow-sm border-slate-200 transition-shadow hover:shadow-md bg-indigo-100/50 text-indigo-700">
                  <div className="flex items-start gap-3">
                    <div className="hidden md:block flex-shrink-0 text-xl pt-1 text-slate-700">
                      <span className="text-2xl">🦄</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-slate-900 leading-tight line-clamp-1">유니콘+</div>
                      <div className="text-xs text-slate-700 mt-0.5 leading-snug line-clamp-1">기업가치 1조 원 이상 (유니콘)</div>
                    </div>
                  </div>
                </Card>
              </div>
            </div>

            {/* 인플루언서 */}
            <div>
              <h3 className="mb-6 text-xl font-bold text-slate-900 border-b border-slate-200 pb-3 flex items-center gap-2">
                <span className="text-2xl pt-1">📣</span>
                인플루언서 (Influence Tier)
              </h3>
              <div className="grid gap-4 grid-cols-2 lg:grid-cols-3">
                <Card className="p-3 shadow-sm border-slate-200 transition-shadow hover:shadow-md bg-red-100/50 text-red-700">
                  <div className="flex items-start gap-3">
                    <div className="hidden md:block flex-shrink-0 text-xl pt-1 text-slate-700">
                      <span className="text-2xl">📣</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-slate-900 leading-tight line-clamp-1">팔로워 1만+</div>
                      <div className="text-xs text-slate-700 mt-0.5 leading-snug line-clamp-1">SNS 팔로워 1만 명 이상</div>
                    </div>
                  </div>
                </Card>
                <Card className="p-3 shadow-sm border-slate-200 transition-shadow hover:shadow-md bg-red-100/50 text-red-700">
                  <div className="flex items-start gap-3">
                    <div className="hidden md:block flex-shrink-0 text-xl pt-1 text-slate-700">
                      <span className="text-2xl">🔥</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-slate-900 leading-tight line-clamp-1">팔로워 5만+</div>
                      <div className="text-xs text-slate-700 mt-0.5 leading-snug line-clamp-1">SNS 팔로워 5만 명 이상</div>
                    </div>
                  </div>
                </Card>
                <Card className="p-3 shadow-sm border-slate-200 transition-shadow hover:shadow-md bg-red-100/50 text-red-700">
                  <div className="flex items-start gap-3">
                    <div className="hidden md:block flex-shrink-0 text-xl pt-1 text-slate-700">
                      <span className="text-2xl">⭐</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-slate-900 leading-tight line-clamp-1">팔로워 10만+</div>
                      <div className="text-xs text-slate-700 mt-0.5 leading-snug line-clamp-1">SNS 팔로워 10만 명 이상</div>
                    </div>
                  </div>
                </Card>
                <Card className="p-3 shadow-sm border-slate-200 transition-shadow hover:shadow-md bg-red-100/50 text-red-700">
                  <div className="flex items-start gap-3">
                    <div className="hidden md:block flex-shrink-0 text-xl pt-1 text-slate-700">
                      <span className="text-2xl">👑</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-slate-900 leading-tight line-clamp-1">팔로워 20만+</div>
                      <div className="text-xs text-slate-700 mt-0.5 leading-snug line-clamp-1">SNS 팔로워 20만 명 이상</div>
                    </div>
                  </div>
                </Card>
                <Card className="p-3 shadow-sm border-slate-200 transition-shadow hover:shadow-md bg-red-100/50 text-red-700">
                  <div className="flex items-start gap-3">
                    <div className="hidden md:block flex-shrink-0 text-xl pt-1 text-slate-700">
                      <span className="text-2xl">🚀</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-slate-900 leading-tight line-clamp-1">팔로워 50만+</div>
                      <div className="text-xs text-slate-700 mt-0.5 leading-snug line-clamp-1">SNS 팔로워 50만 명 이상</div>
                    </div>
                  </div>
                </Card>
                <Card className="p-3 shadow-sm border-slate-200 transition-shadow hover:shadow-md bg-red-100/50 text-red-700">
                  <div className="flex items-start gap-3">
                    <div className="hidden md:block flex-shrink-0 text-xl pt-1 text-slate-700">
                      <span className="text-2xl">🌌</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-slate-900 leading-tight line-clamp-1">팔로워 100만+</div>
                      <div className="text-xs text-slate-700 mt-0.5 leading-snug line-clamp-1">SNS 팔로워 100만 명 이상</div>
                    </div>
                  </div>
                </Card>
              </div>
            </div>

            {/* 전문직 */}
            <div>
              <h3 className="mb-6 text-xl font-bold text-slate-900 border-b border-slate-200 pb-3 flex items-center gap-2">
                <span className="text-2xl pt-1">⚖️</span>
                전문직 (Professional License)
              </h3>
              <div className="grid gap-4 grid-cols-2 lg:grid-cols-3">
                <Card className="p-3 shadow-sm border-slate-200 transition-shadow hover:shadow-md bg-blue-100/50 text-blue-700">
                  <div className="flex items-start gap-3">
                    <div className="hidden md:block flex-shrink-0 text-xl pt-1 text-slate-700">
                      <span className="text-2xl">⚖️</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-slate-900 leading-tight line-clamp-1">변호사</div>
                      <div className="text-xs text-slate-700 mt-0.5 leading-snug line-clamp-1">대한민국 변호사 자격 인증</div>
                    </div>
                  </div>
                </Card>
                <Card className="p-3 shadow-sm border-slate-200 transition-shadow hover:shadow-md bg-blue-100/50 text-blue-700">
                  <div className="flex items-start gap-3">
                    <div className="hidden md:block flex-shrink-0 text-xl pt-1 text-slate-700">
                      <span className="text-2xl">📘</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-slate-900 leading-tight line-clamp-1">공인회계사</div>
                      <div className="text-xs text-slate-700 mt-0.5 leading-snug line-clamp-1">대한민국 공인회계사 자격 인증</div>
                    </div>
                  </div>
                </Card>
                <Card className="p-3 shadow-sm border-slate-200 transition-shadow hover:shadow-md bg-blue-100/50 text-blue-700">
                  <div className="flex items-start gap-3">
                    <div className="hidden md:block flex-shrink-0 text-xl pt-1 text-slate-700">
                      <span className="text-2xl">🧾</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-slate-900 leading-tight line-clamp-1">세무사</div>
                      <div className="text-xs text-slate-700 mt-0.5 leading-snug line-clamp-1">대한민국 세무사 자격 인증</div>
                    </div>
                  </div>
                </Card>
                <Card className="p-3 shadow-sm border-slate-200 transition-shadow hover:shadow-md bg-blue-100/50 text-blue-700">
                  <div className="flex items-start gap-3">
                    <div className="hidden md:block flex-shrink-0 text-xl pt-1 text-slate-700">
                      <span className="text-2xl">💡</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-slate-900 leading-tight line-clamp-1">변리사</div>
                      <div className="text-xs text-slate-700 mt-0.5 leading-snug line-clamp-1">대한민국 변리사 자격 인증</div>
                    </div>
                  </div>
                </Card>
                <Card className="p-3 shadow-sm border-slate-200 transition-shadow hover:shadow-md bg-blue-100/50 text-blue-700">
                  <div className="flex items-start gap-3">
                    <div className="hidden md:block flex-shrink-0 text-xl pt-1 text-slate-700">
                      <span className="text-2xl">🤝</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-slate-900 leading-tight line-clamp-1">노무사</div>
                      <div className="text-xs text-slate-700 mt-0.5 leading-snug line-clamp-1">대한민국 공인노무사 자격 인증</div>
                    </div>
                  </div>
                </Card>
                <Card className="p-3 shadow-sm border-slate-200 transition-shadow hover:shadow-md bg-blue-100/50 text-blue-700">
                  <div className="flex items-start gap-3">
                    <div className="hidden md:block flex-shrink-0 text-xl pt-1 text-slate-700">
                      <span className="text-2xl">🩺</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-slate-900 leading-tight line-clamp-1">의사</div>
                      <div className="text-xs text-slate-700 mt-0.5 leading-snug line-clamp-1">대한민국 의사 면허 인증</div>
                    </div>
                  </div>
                </Card>
                <Card className="p-3 shadow-sm border-slate-200 transition-shadow hover:shadow-md bg-blue-100/50 text-blue-700">
                  <div className="flex items-start gap-3">
                    <div className="hidden md:block flex-shrink-0 text-xl pt-1 text-slate-700">
                      <span className="text-2xl">🌿</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-slate-900 leading-tight line-clamp-1">한의사</div>
                      <div className="text-xs text-slate-700 mt-0.5 leading-snug line-clamp-1">대한민국 한의사 면허 인증</div>
                    </div>
                  </div>
                </Card>
                <Card className="p-3 shadow-sm border-slate-200 transition-shadow hover:shadow-md bg-blue-100/50 text-blue-700">
                  <div className="flex items-start gap-3">
                    <div className="hidden md:block flex-shrink-0 text-xl pt-1 text-slate-700">
                      <span className="text-2xl">🐾</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-slate-900 leading-tight line-clamp-1">수의사</div>
                      <div className="text-xs text-slate-700 mt-0.5 leading-snug line-clamp-1">대한민국 수의사 면허 인증</div>
                    </div>
                  </div>
                </Card>
                <Card className="p-3 shadow-sm border-slate-200 transition-shadow hover:shadow-md bg-blue-100/50 text-blue-700">
                  <div className="flex items-start gap-3">
                    <div className="hidden md:block flex-shrink-0 text-xl pt-1 text-slate-700">
                      <span className="text-2xl">💊</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-slate-900 leading-tight line-clamp-1">약사</div>
                      <div className="text-xs text-slate-700 mt-0.5 leading-snug line-clamp-1">대한민국 약사 면허 인증</div>
                    </div>
                  </div>
                </Card>
              </div>
            </div>

            {/* 커뮤니티 */}
            <div>
              <h3 className="mb-6 text-xl font-bold text-slate-900 border-b border-slate-200 pb-3 flex items-center gap-2">
                <span className="text-2xl pt-1">🛡️</span>
                커뮤니티 (Community)
              </h3>
              <div className="grid gap-4 grid-cols-2 lg:grid-cols-3">
                <Card className="p-3 shadow-sm border-slate-200 transition-shadow hover:shadow-md bg-purple-100/50 text-purple-700">
                  <div className="flex items-start gap-3">
                    <div className="hidden md:block flex-shrink-0 text-xl pt-1 text-slate-700">
                      <span className="text-2xl">👑</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-slate-900 leading-tight line-clamp-1">선착순 100인</div>
                      <div className="text-xs text-slate-700 mt-0.5 leading-snug line-clamp-1">SFC 초기 가입 멤버 (로열티)</div>
                    </div>
                  </div>
                </Card>
                <Card className="p-3 shadow-sm border-slate-200 transition-shadow hover:shadow-md bg-purple-100/50 text-purple-700">
                  <div className="flex items-start gap-3">
                    <div className="hidden md:block flex-shrink-0 text-xl pt-1 text-slate-700">
                      <span className="text-2xl">🛡️</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-slate-900 leading-tight line-clamp-1">커뮤니티 리더</div>
                      <div className="text-xs text-slate-700 mt-0.5 leading-snug line-clamp-1">SFC 커뮤니티 운영진 및 리더</div>
                    </div>
                  </div>
                </Card>
                <Card className="p-3 shadow-sm border-slate-200 transition-shadow hover:shadow-md bg-purple-100/50 text-purple-700">
                  <div className="flex items-start gap-3">
                    <div className="hidden md:block flex-shrink-0 text-xl pt-1 text-slate-700">
                      <span className="text-2xl">🌟</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-slate-900 leading-tight line-clamp-1">우수활동 회원</div>
                      <div className="text-xs text-slate-700 mt-0.5 leading-snug line-clamp-1">커뮤니티 내 활동 지수 상위 1% 회원</div>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          </div>

          <div className="mt-12 p-4 rounded-xl bg-blue-50 border border-blue-200 text-center">
              <p className="text-sm text-blue-700 font-medium">
                모든 뱃지는 관리자 검증을 통해 인증되면 프로필에 표시됩니다.
              </p>
            </div>
            </>
          )}
        </div>
      </div>

          {/* 5. CTA SECTION */}
          <div className="py-24 px-6 bg-white text-center">
            <div className="max-w-3xl mx-auto">
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-6">
                준비되셨나요?
              </h2>
              <p className="text-lg text-slate-600 mb-10 leading-relaxed">
                당신의 성장을 가속화할 파트너들이 기다리고 있습니다.<br/>
                지금 Seoul Founders Club에 합류하세요.
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-4">
                <Link href="/events">
                  <Button size="lg" variant="outline" className="h-14 px-8 rounded-full text-base border-slate-300 text-slate-700 hover:bg-slate-50">
                    이벤트 둘러보기
                  </Button>
                </Link>
                <Link href="/auth/login">
                  <Button size="lg" className="h-14 px-8 rounded-full text-base bg-slate-900 hover:bg-slate-800 text-white shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all">
                    멤버십 가입하기 <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* [RIGHT] 우측 사이드바 영역 */}
        <div className="hidden lg:flex w-72 shrink-0 flex-col gap-6">
          <div className="sticky top-8 flex flex-col gap-6 h-fit">
            <StandardRightSidebar />
          </div>
        </div>
    </div>
  )
}
