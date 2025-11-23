"use client"

import { useEffect, useState, ReactNode } from "react"
import { useRouter } from "next/navigation"
import { Sidebar } from "@/components/sidebar"
import { MobileHeader } from "@/components/mobile-header"
import { Card, CardContent } from "@/components/ui/card"
import { Users2, Lightbulb, TrendingUp, Target, Award, Building2, Shield, Briefcase, DollarSign, Feather, Home, Calendar, Plus, User, Users } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import Image from "next/image"
import { Separator } from "@/components/ui/separator"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"

// 뱃지 정보 (최종 개편안 반영 - UI 렌더링용)
const BADGE_GROUPS = [
  {
    title: "개인 자산 (Asset)",
    icon: "💎",
    color: "bg-green-100/50 text-green-700", 
    badges: [
      { name: "자산 5억+", desc: "순자산 5억 원 이상", icon: "💎" },
      { name: "자산 10억+", desc: "순자산 10억 원 이상", icon: "💎" },
      { name: "자산 50억+", desc: "순자산 50억 원 이상", icon: "💎" },
    ],
    gridCols: "grid-cols-2 lg:grid-cols-3", // ★ grid-cols-2 추가
  },
  {
    title: "기업 매출 (Revenue)",
    icon: "📈",
    color: "bg-blue-100/50 text-blue-700", 
    badges: [
      { name: "매출 10억+", desc: "연 매출 10억 원 이상", icon: "📈" },
      { name: "매출 50억+", desc: "연 매출 50억 원 이상", icon: "📈" },
      { name: "매출 100억+", desc: "연 매출 100억 원 이상", icon: "📈" },
    ],
    gridCols: "grid-cols-2 lg:grid-cols-3", // ★ grid-cols-2 추가
  },
  {
    title: "투자 규모 (Investment Tier)",
    icon: "💰",
    color: "bg-amber-100/50 text-amber-700",
    badges: [
      { name: "투자 1억+", desc: "누적 투자 집행액 1억 원 이상", icon: "💰" },
      { name: "투자 5억+", desc: "누적 투자 집행액 5억 원 이상", icon: "💰" },
      { name: "투자 10억+", desc: "누적 투자 집행액 10억 원 이상", icon: "💰" },
      { name: "투자 30억+", desc: "누적 투자 집행액 30억 원 이상", icon: "💰" },
      { name: "투자 50억+", desc: "누적 투자 집행액 50억 원 이상", icon: "💰" },
      { name: "투자 100억+", desc: "누적 투자 집행액 100억 원 이상", icon: "💰" },
    ],
    gridCols: "grid-cols-2 lg:grid-cols-3", // ★ grid-cols-2 추가
  },
  {
    title: "기업 가치 (Valuation Tier)",
    icon: "🏙️",
    color: "bg-indigo-100/50 text-indigo-700",
    badges: [
      { name: "기업가치 30억+", desc: "30억 원 이상", icon: "🏙️" },
      { name: "기업가치 50억+", desc: "50억 원 이상", icon: "🏙️" },
      { name: "기업가치 100억+", desc: "100억 원 이상", icon: "🏙️" },
      { name: "기업가치 300억+", desc: "300억 원 이상", icon: "🏙️" },
      { name: "기업가치 1000억+", desc: "1000억 원 이상", icon: "🏙️" },
      { name: "유니콘+", desc: "기업가치 1조 원 이상", icon: "🦄" },
    ],
    gridCols: "grid-cols-2 lg:grid-cols-3", // ★ grid-cols-2 추가
  },
  {
    title: "인플루언서 (Influence Tier)",
    icon: "📣",
    color: "bg-red-100/50 text-red-700",
    badges: [
      { name: "팔로워 1만+", desc: "SNS 팔로워 1만 명 이상", icon: "📣" },
      { name: "팔로워 5만+", desc: "SNS 팔로워 5만 명 이상", icon: "🔥" },
      { name: "팔로워 10만+", desc: "SNS 팔로워 10만 명 이상", icon: "⭐" },
      { name: "팔로워 20만+", desc: "SNS 팔로워 20만 명 이상", icon: "👑" },
      { name: "팔로워 50만+", desc: "SNS 팔로워 50만 명 이상", icon: "🚀" },
      { name: "팔로워 100만+", desc: "SNS 팔로워 100만 명 이상", icon: "🌌" },
    ],
    gridCols: "grid-cols-2 lg:grid-cols-3", // ★ grid-cols-2 추가
  },
  {
    title: "전문직 (Professional License)",
    icon: "⚖️",
    color: "bg-blue-100/50 text-blue-700",
    badges: [
      { name: "변호사", desc: "대한민국 변호사 자격 인증", icon: "⚖️" },
      { name: "공인회계사", desc: "대한민국 공인회계사 자격 인증", icon: "📘" },
      { name: "세무사", desc: "대한민국 세무사 자격 인증", icon: "🧾" },
      { name: "변리사", desc: "대한민국 변리사 자격 인증", icon: "💡" },
      { name: "노무사", desc: "대한민국 공인노무사 자격 인증", icon: "🤝" },
      { name: "의사", desc: "대한민국 의사 면허 인증", icon: "🩺" },
      { name: "한의사", desc: "대한민국 한의사 면허 인증", icon: "🌿" },
      { name: "수의사", desc: "대한민국 수의사 면허 인증", icon: "🐾" },
      { name: "약사", desc: "대한민국 약사 면허 인증", icon: "💊" },
    ],
    gridCols: "grid-cols-2 lg:grid-cols-3", // ★ grid-cols-2 추가
  },
  { // 커뮤니티 섹션
    title: "커뮤니티 활동",
    icon: "🛡️",
    color: "bg-purple-100/50 text-purple-700",
    badges: [
      { name: "커뮤니티 리더", desc: "SFC 커뮤니티 운영진 및 리더", icon: "🛡️" },
      { name: "우수활동 회원", desc: "커뮤니티 내 활동 지수 상위 1% 회원", icon: "🌟" },
    ],
    gridCols: "grid-cols-2 lg:grid-cols-3", // ★ grid-cols-2 추가
  },
]


export default function AboutPage() {
  const router = useRouter()
  const supabase = createClient()
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    async function loadUser() {
      const { data: { user: currentUser } } = await supabase.auth.getUser()
      setUser(currentUser)
    }
    loadUser()
  }, [supabase])

  const handleCreateEvent = () => {
    if (!user) {
      router.push("/auth/login")
      return
    }
    router.push("/events/new")
  }

  const handleProfileAction = () => {
    if (user) {
      router.push("/community/profile")
      return
    }
    router.push("/auth/login")
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      <div className="hidden md:block">
        <Sidebar />
      </div>

      <MobileHeader />

      <div className="flex-1 overflow-auto pt-16 md:pt-0">
        
        {/* HERO: SFC는 어떤 사람들의 커뮤니티인가 */}
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
              네트워킹하고 성장하는 비즈니스 커뮤니티입니다.
            </p>
          </div>
        </div>

        <div className="px-4 md:px-8 py-8 md:py-16">
          <div className="mx-auto max-w-4xl">
            
            {/* 1. SFC 소개 / 미션 / 설립 배경 */}
            <div className="mb-12 md:mb-16">
              <p className="text-center text-slate-600 text-lg mb-8 max-w-2xl mx-auto">
                서울 파운더스 클럽은 성장 가속화를 목표로, 투명한 지식 공유와 검증된 관계 형성을 통해 멤버들의 비즈니스 성과를 극대화합니다.
              </p>
              
              <h2 className="mb-6 md:mb-8 text-center text-2xl md:text-3xl font-bold text-slate-900">3대 핵심 가치</h2>
              
              <div className="grid gap-4 md:gap-6 grid-cols-1 md:grid-cols-3">
                <Card className="border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow">
                  <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100">
                    <Users2 className="h-6 w-6 text-blue-600" />
                  </div>
                  <h3 className="mb-3 text-xl font-semibold text-slate-900">진정성 있는 관계 형성</h3>
                  <p className="text-slate-600 leading-relaxed">
                    검증된 사업가, 투자자, 인플루언서와의 진정성 있는 관계 형성을 최우선 목표로 합니다.
                  </p>
                </Card>
                <Card className="border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow">
                  <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-green-100">
                    <Lightbulb className="h-6 w-6 text-green-600" />
                  </div>
                  <h3 className="mb-3 text-xl font-semibold text-slate-900">경험과 지식 공유</h3>
                  <p className="text-slate-600 leading-relaxed">
                    실전 경험과 인사이트를 투명하게 공유하며 서로 배우는 문화
                  </p>
                </Card>
                <Card className="border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow">
                  <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-purple-100">
                    <TrendingUp className="h-6 w-6 text-purple-600" />
                  </div>
                  <h3 className="mb-3 text-xl font-semibold text-slate-900">비즈니스 성장 가속</h3>
                  <p className="text-slate-600 leading-relaxed">
                    정기 이벤트, 워크샵, 멘토링을 통한 비즈니스 성장 지원
                  </p>
                </Card>
              </div>
            </div>

            {/* 2. SFC가 제공하는 활동 (What We Do) */}
            <div className="mb-12 md:mb-16">
              <h2 className="mb-6 md:mb-8 text-center text-2xl md:text-3xl font-bold text-slate-900">제공하는 활동 및 서비스</h2>
              <div className="space-y-4 md:space-y-6">
                <Card className="border-slate-200 bg-white p-6 shadow-sm">
                  <div className="flex items-start gap-4">
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-slate-100">
                      <Target className="h-5 w-5 text-slate-700" />
                    </div>
                    <div>
                      <h3 className="mb-2 text-lg font-semibold text-slate-900">정기 밋업 및 워크샵</h3>
                      <p className="text-slate-600 leading-relaxed">
                        무브먼트 강남 HQ에서의 주 5일 데일리 프로그램 운영 (CEO 밋업, Investment Night 등)
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
                      <h3 className="mb-2 text-lg font-semibold text-slate-900">온라인 커뮤니티</h3>
                      <p className="text-slate-600 leading-relaxed">
                        24/7 접근 가능한 플랫폼에서 질문, 정보 공유, 프로젝트 매칭
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
                      <h3 className="mb-2 text-lg font-semibold text-slate-900">전문가 세미나 및 멘토링</h3>
                      <p className="text-slate-600 leading-relaxed">
                        창업, 투자, 마케팅, 법률 등 비즈니스 전반의 실무 중심 교육 제공
                      </p>
                    </div>
                  </div>
                </Card>
              </div>
            </div>

            {/* 3. 우리는 어떤 사람들과 함께 하나 (멤버 구성 - 텍스트만) */}
            <div className="mb-12 md:mb-16 border border-slate-200 bg-white rounded-2xl p-8 shadow-sm">
                <h2 className="mb-6 text-center text-2xl md:text-3xl font-bold text-slate-900">
                    함께하는 멤버들
                </h2>
                <p className="text-center text-slate-600 text-lg mb-8 max-w-2xl mx-auto">
                    SFC 커뮤니티에 참여하는 멤버들은 사업가, 투자자, 전문직 등 특정 분야에서 검증된 역량을 가진 리더들로 구성되어 있습니다.
                </p>
                <div className="grid md:grid-cols-3 gap-6 text-center">
                    <div className="space-y-2">
                        <div className="mx-auto mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100/50 border border-blue-200">
                            <Briefcase className="h-6 w-6 text-blue-600" />
                        </div>
                        <h3 className="text-xl font-semibold text-slate-900">사업가 & 경영자</h3>
                        <p className="text-slate-600 text-sm">성장 단계의 스타트업 대표, C-Level 경영진</p>
                    </div>
                    <div className="space-y-2">
                        <div className="mx-auto mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-amber-100/50 border border-amber-200">
                            <DollarSign className="h-6 w-6 text-amber-600" />
                        </div>
                        <h3 className="text-xl font-semibold text-slate-900">투자자 & 전문가</h3>
                        <p className="text-slate-600 text-sm">VC, 엔젤 투자자, 회계사, 변호사 등 전문 지식인</p>
                    </div>
                    <div className="space-y-2">
                        <div className="mx-auto mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-purple-100/50 border border-purple-200">
                            <Feather className="h-6 w-6 text-purple-600" />
                        </div>
                        <h3 className="text-xl font-semibold text-slate-900">인플루언서 & 크리에이터</h3>
                        <p className="text-slate-600 text-sm">콘텐츠 기반의 영향력을 가진 창작자 및 리더</p>
                    </div>
                </div>
                
                <Separator className="my-8 bg-slate-200" />

                <div className="mt-6 text-center">
                    <Button size="lg" disabled>
                        멤버들 보러가기 (추후 서비스 됩니다)
                    </Button>
                </div>
            </div>


            {/* 4. 인증 뱃지 시스템 (FLEXIBLE) - 그리드 통일 */}
            <div className="mb-12 md:mb-16">
              <h2 className="mb-8 text-center text-3xl font-bold text-slate-900">
                신뢰를 더하는 인증 뱃지 시스템
              </h2>
              <p className="text-center text-slate-600 mb-10 max-w-2xl mx-auto text-lg">
                SFC는 객관적인 지표를 통해 멤버들의 신뢰도와 역량을 투명하게 인증합니다.
              </p>
              <div className="space-y-12">
                {BADGE_GROUPS.map((group) => (
                  <div key={group.title}>
                    <h3 className="mb-6 text-xl font-bold text-slate-900 border-b border-slate-200 pb-3 flex items-center gap-2">
                      <span className={`text-2xl pt-1`}>{group.icon}</span>
                      {group.title}
                    </h3>

                    {/* ★ 모든 그룹 모바일 2단, 데스크탑 3단으로 통일 */}
                    <div className={`grid gap-4 grid-cols-2 lg:grid-cols-3`}>
                      {group.badges.map((badge, index) => (
                        <Card 
                          key={index} 
                          className={`p-4 shadow-sm border-slate-200 transition-shadow hover:shadow-md ${group.color}`}
                        >
                          <div className="flex items-start gap-4">
                            <span className="text-2xl pt-1 flex-shrink-0">{badge.icon}</span>
                            <div className="flex-1 min-w-0">
                              <div className="font-semibold text-slate-900 leading-tight line-clamp-1">{badge.name}</div>
                              <div className="text-xs text-slate-700 mt-0.5 leading-snug line-clamp-1">{badge.desc}</div>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-12 p-4 rounded-xl bg-blue-50 border border-blue-200 text-center">
                <p className="text-sm text-blue-700 font-medium">
                  💡 뱃지는 관리자 검증을 통해 부여되며, 프로필 노출 여부를 직접 설정할 수 있습니다.
                </p>
              </div>
            </div>


            {/* V. CTA */}
            <div className="rounded-2xl bg-gradient-to-r from-slate-900 to-slate-800 p-8 md:p-12 text-center text-white">
              <h2 className="mb-4 text-2xl md:text-3xl font-bold">함께 성장할 준비가 되셨나요?</h2>
              <p className="mb-6 md:mb-8 text-base md:text-lg text-slate-300">
                SFC 커뮤니티와 함께 비즈니스를 성장시키세요
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

      {/* 하단 메뉴바 */}
      <MobileActionBar
        onCreate={handleCreateEvent}
        onProfile={handleProfileAction}
        user={user}
      />
    </div>
  )
}

// 하단 메뉴바 컴포넌트
type MobileActionBarProps = {
  onCreate: () => void
  onProfile: () => void
  user: any
}

function MobileActionBar({ onCreate, onProfile, user }: MobileActionBarProps) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-white/95 backdrop-blur lg:hidden safe-area-pb">
      <div className="grid h-16 grid-cols-5 divide-x-0 text-[10px] font-medium text-gray-500">
        <NavButton 
          icon={<Home className={cn("size-6 mb-1", "text-gray-400")} />} 
          label="홈" 
          isActive={false} 
          onClick={() => window.location.href = "/"} 
        />
        <NavButton 
          icon={<Calendar className={cn("size-6 mb-1", "text-gray-400")} />} 
          label="이벤트" 
          isActive={false} 
          onClick={() => window.location.href = "/events"} 
        />
        <button type="button" onClick={onCreate} className="flex flex-col items-center justify-center">
          <div className="flex items-center justify-center size-10 bg-slate-900 rounded-full shadow-lg text-white mb-1 transform active:scale-95 transition-transform">
            <Plus className="size-6" />
          </div>
          <span className="text-[10px] text-slate-900 font-semibold">만들기</span>
        </button>
        <NavButton 
          icon={<Users className={cn("size-6 mb-1", "text-gray-400")} />} 
          label="커뮤니티" 
          isActive={false} 
          onClick={() => window.location.href = "/community/posts"} 
        />
        <NavButton 
          icon={<User className={cn("size-6 mb-1", "text-gray-400")} />} 
          label={user ? "프로필" : "로그인"} 
          onClick={onProfile} 
        />
      </div>
    </nav>
  )
}

type NavButtonProps = { icon: ReactNode, label: string, isActive?: boolean, onClick: () => void }
function NavButton({ icon, label, isActive, onClick }: NavButtonProps) {
  return (
    <button type="button" onClick={onClick} className={cn("flex flex-col items-center justify-center transition-colors active:bg-gray-50", isActive ? "text-slate-900 font-bold" : "text-gray-400")}>
      {icon}
      <span>{label}</span>
    </button>
  )
}