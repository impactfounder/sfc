"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Users, Zap, Handshake, TrendingUp, ArrowRight, Target } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { StandardRightSidebar } from "@/components/standard-right-sidebar"
import { PageHeader } from "@/components/page-header"

export default function AboutContent() {
  console.log("🚩 About Content 시작")
  return (
    <div className="max-w-[1600px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10 px-4 lg:px-8 pt-8 pb-20">
      {/* [LEFT] 중앙 콘텐츠 영역 (9칸) */}
      <div className="lg:col-span-9 flex flex-col gap-10 min-w-0">
        {/* PageHeader 적용 */}
        <PageHeader 
          title="새로운 가치를 만드는 사람들의 베이스캠프"
          description="서울을 기반으로 활동하는 창업가, 투자자, 크리에이터가 모여 신뢰를 바탕으로 연결되고, 함께 성장하는 비즈니스 커뮤니티입니다."
        >
          <Link href="/auth/login">
            <Button className="bg-white text-slate-900 hover:bg-slate-100 font-bold shadow-sm border-0">
              3초만에 가입하기
            </Button>
          </Link>
        </PageHeader>
          {/* 2. WHO WE ARE: 대상 명확화 */}
          <div className="py-16 px-6 bg-white border-b border-slate-100 rounded-2xl">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">우리는 서로의 레버리지입니다</h2>
            <p className="text-slate-500 text-lg">각자의 영역에서 성과를 증명한 리더들이 모입니다.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* 창업가 */}
            <div className="flex flex-col items-center text-center group">
              <div className="w-20 h-20 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 mb-6 group-hover:scale-110 transition-transform duration-300">
                <Target className="h-10 w-10" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">창업가 & 경영진</h3>
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
              <h3 className="text-xl font-bold text-slate-900 mb-2">투자자 & 엑셀러레이터</h3>
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

          {/* 4. CTA SECTION */}
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

        {/* [RIGHT] 우측 사이드바 영역 (3칸) */}
        <div className="hidden lg:flex lg:col-span-3 flex-col gap-6">
          <div className="sticky top-8 flex flex-col gap-6 h-fit">
            <StandardRightSidebar />
          </div>
        </div>
    </div>
  )
}
