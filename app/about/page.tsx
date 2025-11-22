import { Sidebar } from "@/components/sidebar"
import { MobileSidebar } from "@/components/mobile-sidebar"
import { MobileHeader } from "@/components/mobile-header"
import { Card } from "@/components/ui/card"
import { Users2, Lightbulb, TrendingUp, Target, Award, Building2 } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import Image from "next/image"

export const metadata = {
  title: "SFC 소개 | Seoul Founders Club",
  description: "서울 파운더스 클럽은 사업가, 투자자, 인플루언서가 모여 네트워킹하고 성장하는 비즈니스 커뮤니티입니다.",
}

export default function AboutPage() {
  return (
    <div className="flex min-h-screen bg-slate-50">
      <div className="hidden md:block">
        <Sidebar />
      </div>

      <MobileHeader />
      <MobileSidebar />

      <div className="flex-1 overflow-auto pt-16 md:pt-0">
        <div className="bg-gradient-to-r from-slate-900 to-slate-800 px-4 md:px-8 py-12 md:py-20 text-white">
          <div className="mx-auto max-w-4xl text-center">
            <div className="mb-6 flex justify-center">
              <Image
                src="/images/logo.png"
                alt="Seoul Founders Club Logo"
                width={120}
                height={120}
                className="w-24 h-24 md:w-32 md:h-32"
              />
            </div>
            <h1 className="mb-4 md:mb-6 text-3xl md:text-5xl font-bold tracking-tight">Seoul Founders Club</h1>
            <p className="text-base md:text-xl text-slate-300 leading-relaxed">
              사업가, 투자자, 인플루언서가 모여
              <br className="hidden sm:block" />
              네트워킹하고 성장하는 비즈니스 커뮤니티
            </p>
          </div>
        </div>

        <div className="px-4 md:px-8 py-8 md:py-16">
          <div className="mx-auto max-w-4xl">
            <div className="mb-12 md:mb-16">
              <h2 className="mb-6 md:mb-8 text-center text-2xl md:text-3xl font-bold text-slate-900">3대 핵심 가치</h2>
              <div className="grid gap-4 md:gap-6 grid-cols-1 md:grid-cols-3">
                <Card className="border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow">
                  <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100">
                    <Users2 className="h-6 w-6 text-blue-600" />
                  </div>
                  <h3 className="mb-3 text-xl font-semibold text-slate-900">네트워킹</h3>
                  <p className="text-slate-600 leading-relaxed">
                    검증된 사업가, 투자자, 인플루언서와의 진정성 있는 관계 형성
                  </p>
                </Card>

                <Card className="border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow">
                  <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-green-100">
                    <Lightbulb className="h-6 w-6 text-green-600" />
                  </div>
                  <h3 className="mb-3 text-xl font-semibold text-slate-900">지식 공유</h3>
                  <p className="text-slate-600 leading-relaxed">
                    실전 경험과 인사이트를 투명하게 공유하며 서로 배우는 문화
                  </p>
                </Card>

                <Card className="border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow">
                  <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-purple-100">
                    <TrendingUp className="h-6 w-6 text-purple-600" />
                  </div>
                  <h3 className="mb-3 text-xl font-semibold text-slate-900">성장 가속화</h3>
                  <p className="text-slate-600 leading-relaxed">
                    정기 이벤트, 워크샵, 멘토링을 통한 비즈니스 성장 지원
                  </p>
                </Card>
              </div>
            </div>

            <div className="mb-12 md:mb-16">
              <h2 className="mb-6 md:mb-8 text-center text-2xl md:text-3xl font-bold text-slate-900">멤버십 혜택</h2>
              <div className="grid gap-4 md:gap-6 sm:grid-cols-2">
                <Card className="border-blue-200 bg-blue-50/50 p-6 shadow-sm">
                  <h3 className="mb-3 text-xl font-semibold text-slate-900">Plus 멤버십</h3>
                  <p className="text-slate-600 leading-relaxed mb-4">
                    월 3~5만원으로 무브먼트 강남 월 4회 이용, SFC 모임 참여 할인, 멤버 프로필 등록 혜택
                  </p>
                  <div className="text-sm text-blue-600 font-medium">온라인 + 오프라인 통합</div>
                </Card>

                <Card className="border-purple-200 bg-purple-50/50 p-6 shadow-sm">
                  <h3 className="mb-3 text-xl font-semibold text-slate-900">Pro 멤버십</h3>
                  <p className="text-slate-600 leading-relaxed mb-4">
                    월 12~15만원으로 무브먼트 강남 월 12시간, 프리미엄 이벤트 우선권, 협업 매칭 지원
                  </p>
                  <div className="text-sm text-purple-600 font-medium">비즈니스 성장 가속</div>
                </Card>
              </div>
            </div>

            {/* What We Offer */}
            <div className="mb-12 md:mb-16">
              <h2 className="mb-6 md:mb-8 text-center text-2xl md:text-3xl font-bold text-slate-900">제공하는 것들</h2>
              <div className="space-y-4 md:space-y-6">
                <Card className="border-slate-200 bg-white p-6 shadow-sm">
                  <div className="flex items-start gap-4">
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-slate-100">
                      <Target className="h-5 w-5 text-slate-700" />
                    </div>
                    <div>
                      <h3 className="mb-2 text-lg font-semibold text-slate-900">무브먼트 강남에서의 정기 밋업</h3>
                      <p className="text-slate-600 leading-relaxed">
                        주 5일 데일리 프로그램 운영 (사이드 프로젝트 Night, CEO 밋업, Investment Night 등)
                      </p>
                    </div>
                  </div>
                </Card>

                <Card className="border-slate-200 bg-white p-6 shadow-sm">
                  <div className="flex items-start gap-4">
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-slate-100">
                      <Award className="h-5 w-5 text-slate-700" />
                    </div>
                    <div>
                      <h3 className="mb-2 text-lg font-semibold text-slate-900">전문가 워크샵 & 세미나</h3>
                      <p className="text-slate-600 leading-relaxed">
                        창업, 투자, 마케팅, 법률 등 비즈니스 전반의 실무 중심 교육
                      </p>
                    </div>
                  </div>
                </Card>

                <Card className="border-slate-200 bg-white p-6 shadow-sm">
                  <div className="flex items-start gap-4">
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-slate-100">
                      <Users2 className="h-5 w-5 text-slate-700" />
                    </div>
                    <div>
                      <h3 className="mb-2 text-lg font-semibold text-slate-900">온라인 커뮤니티 & 협업 기회</h3>
                      <p className="text-slate-600 leading-relaxed">
                        24/7 접근 가능한 플랫폼에서 질문, 정보 공유, 프로젝트 매칭
                      </p>
                    </div>
                  </div>
                </Card>
              </div>
            </div>

            {/* Moved Section */}
            <div className="mb-12 md:mb-16 text-center">
              <div className="inline-flex items-center justify-center gap-2 mb-4 px-4 py-2 bg-blue-50 rounded-full">
                <Building2 className="h-5 w-5 text-blue-600" />
                <span className="text-sm font-semibold text-blue-600 uppercase tracking-wide">오프라인 HQ</span>
              </div>
              <h2 className="mb-4 text-2xl md:text-3xl font-bold text-slate-900">무브먼트 강남</h2>
              <p className="mx-auto max-w-2xl text-base md:text-lg text-slate-600 leading-relaxed">
                SFC의 오프라인 본진이자 멤버들이 만나고 협업하는 핵심 공간입니다.
                <br />
                모든 이벤트, 밋업, 워크샵이 이곳에서 진행되며 멤버십 혜택으로 자유롭게 이용할 수 있습니다.
              </p>
            </div>

            {/* 뱃지 소개 섹션 */}
            <div className="mb-12 md:mb-16">
              <h2 className="mb-4 text-center text-2xl md:text-3xl font-bold text-slate-900">신뢰를 더하는 인증 뱃지</h2>
              <p className="mb-8 text-center text-base md:text-lg text-slate-600 leading-relaxed max-w-2xl mx-auto">
                SFC는 검증된 멤버들과의 만남을 지향합니다. 뱃지를 통해 서로의 신뢰도를 확인할 수 있습니다.
              </p>

              <div className="space-y-8">
                {/* 자산/매출 뱃지 */}
                <div>
                  <h3 className="mb-4 text-lg font-semibold text-slate-800 border-b border-slate-200 pb-2">자산/매출</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="flex items-center gap-3 p-4 rounded-xl border border-slate-200 bg-white hover:shadow-md transition-shadow">
                      <span className="text-3xl">💰</span>
                      <div>
                        <div className="font-semibold text-slate-900">자산 10억+</div>
                        <div className="text-sm text-slate-600">순자산 10억 원 이상</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-4 rounded-xl border border-slate-200 bg-white hover:shadow-md transition-shadow">
                      <span className="text-3xl">💎</span>
                      <div>
                        <div className="font-semibold text-slate-900">자산 50억+</div>
                        <div className="text-sm text-slate-600">순자산 50억 원 이상</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-4 rounded-xl border border-slate-200 bg-white hover:shadow-md transition-shadow">
                      <span className="text-3xl">📈</span>
                      <div>
                        <div className="font-semibold text-slate-900">매출 10억+</div>
                        <div className="text-sm text-slate-600">연 매출 10억 원 이상</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-4 rounded-xl border border-slate-200 bg-white hover:shadow-md transition-shadow">
                      <span className="text-3xl">🚀</span>
                      <div>
                        <div className="font-semibold text-slate-900">매출 50억+</div>
                        <div className="text-sm text-slate-600">연 매출 50억 원 이상</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-4 rounded-xl border border-slate-200 bg-white hover:shadow-md transition-shadow">
                      <span className="text-3xl">🏢</span>
                      <div>
                        <div className="font-semibold text-slate-900">매출 100억+</div>
                        <div className="text-sm text-slate-600">연 매출 100억 원 이상</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 인플루언서 뱃지 */}
                <div>
                  <h3 className="mb-4 text-lg font-semibold text-slate-800 border-b border-slate-200 pb-2">인플루언서</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="flex items-center gap-3 p-4 rounded-xl border border-slate-200 bg-white hover:shadow-md transition-shadow">
                      <span className="text-3xl">📣</span>
                      <div>
                        <div className="font-semibold text-slate-900">팔로워 1만+</div>
                        <div className="text-sm text-slate-600">SNS 팔로워 1만 명 이상</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-4 rounded-xl border border-slate-200 bg-white hover:shadow-md transition-shadow">
                      <span className="text-3xl">🔥</span>
                      <div>
                        <div className="font-semibold text-slate-900">팔로워 5만+</div>
                        <div className="text-sm text-slate-600">SNS 팔로워 5만 명 이상</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-4 rounded-xl border border-slate-200 bg-white hover:shadow-md transition-shadow">
                      <span className="text-3xl">🌟</span>
                      <div>
                        <div className="font-semibold text-slate-900">팔로워 10만+</div>
                        <div className="text-sm text-slate-600">SNS 팔로워 10만 명 이상</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-4 rounded-xl border border-slate-200 bg-white hover:shadow-md transition-shadow">
                      <span className="text-3xl">👑</span>
                      <div>
                        <div className="font-semibold text-slate-900">팔로워 20만+</div>
                        <div className="text-sm text-slate-600">SNS 팔로워 20만 명 이상</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 특별 이력 뱃지 */}
                <div>
                  <h3 className="mb-4 text-lg font-semibold text-slate-800 border-b border-slate-200 pb-2">특별 이력</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="flex items-center gap-3 p-4 rounded-xl border border-slate-200 bg-white hover:shadow-md transition-shadow">
                      <span className="text-3xl">🚪</span>
                      <div>
                        <div className="font-semibold text-slate-900">EXIT 경험</div>
                        <div className="text-sm text-slate-600">M&A 또는 IPO 엑싯 경험</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-4 rounded-xl border border-slate-200 bg-white hover:shadow-md transition-shadow">
                      <span className="text-3xl">🔄</span>
                      <div>
                        <div className="font-semibold text-slate-900">연쇄 창업가</div>
                        <div className="text-sm text-slate-600">2회 이상 창업 경험</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-4 rounded-xl border border-slate-200 bg-white hover:shadow-md transition-shadow">
                      <span className="text-3xl">📺</span>
                      <div>
                        <div className="font-semibold text-slate-900">연애프로그램</div>
                        <div className="text-sm text-slate-600">TV/OTT 연애 리얼리티 출연</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-4 rounded-xl border border-slate-200 bg-white hover:shadow-md transition-shadow">
                      <span className="text-3xl">🛡️</span>
                      <div>
                        <div className="font-semibold text-slate-900">커뮤니티 리더</div>
                        <div className="text-sm text-slate-600">SFC 커뮤니티 운영진 및 리더</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-6 p-4 rounded-xl bg-blue-50 border border-blue-200 text-center">
                  <p className="text-sm text-blue-700 font-medium">
                    💡 관리자 검증을 통해 부여됩니다
                  </p>
                </div>
              </div>
            </div>

            {/* CTA */}
            <div className="rounded-2xl bg-gradient-to-r from-slate-900 to-slate-800 p-8 md:p-12 text-center text-white">
              <h2 className="mb-4 text-2xl md:text-3xl font-bold">함께 성장할 준비가 되셨나요?</h2>
              <p className="mb-6 md:mb-8 text-base md:text-lg text-slate-300">
                무브먼트 강남에서 만나 SFC 커뮤니티와 함께 비즈니스를 성장시키세요
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-4">
                <Link href="/events">
                  <Button size="lg" className="w-full sm:w-auto bg-white text-slate-900 hover:bg-slate-100">
                    이벤트 둘러보기
                  </Button>
                </Link>
                <Link href="/community/posts">
                  <Button
                    size="lg"
                    variant="outline"
                    className="w-full sm:w-auto border-white text-white hover:bg-white/10 bg-transparent"
                  >
                    커뮤니티 참여하기
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
