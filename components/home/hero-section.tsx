"use client"

import { Button } from "@/components/ui/button"
import { Sparkles, Check, Users, Zap, Target } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { cn } from "@/lib/utils" // cn import 추가 (혹시 몰라 추가합니다)

interface HeroSectionProps {
  user: any
  profile?: any
  onLogin: () => void
}

export function HeroSection({ user, profile, onLogin }: HeroSectionProps) {
  // 1. 로그인한 유저
  if (user) {
    // displayName 변수 생성: profile.full_name 우선, 없으면 user.user_metadata.full_name, 없으면 "멤버"
    const displayName = profile?.full_name || user.user_metadata?.full_name || "멤버"
    
    return (
      <div className="mb-8 rounded-2xl bg-slate-900 text-white p-6 md:p-8 shadow-lg overflow-hidden relative">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-white/5 rounded-full blur-3xl" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-[11px] font-medium mb-3 border border-white/10">
              <Sparkles className="w-3 h-3 text-yellow-400" />
              <span>멤버십 혜택을 누려보세요</span>
            </div>
            <h1 className="text-xl md:text-2xl font-bold mb-2 leading-tight">
              반갑습니다, {displayName}님! 👋
            </h1>
            <p className="text-slate-300 text-sm">
              오늘도 새로운 기회와 연결될 준비가 되셨나요?
            </p>
          </div>
          <div className="flex gap-3 shrink-0">
            <Button onClick={() => document.getElementById('events-section')?.scrollIntoView({ behavior: 'smooth' })} className="bg-white text-slate-900 hover:bg-slate-100 font-semibold border-none h-10 text-sm">
              이벤트 참여
            </Button>
            <Link href="/community/profile">
              <Button variant="outline" className="border-white/20 bg-white/5 text-white hover:bg-white/10 h-10 text-sm">
                내 프로필
              </Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // 2. 비로그인 유저 (수정된 간소화 버전)
  return (
    <div className="mb-10 relative w-full overflow-hidden rounded-2xl bg-slate-900 shadow-md">
      {/* 배경 이미지 및 오버레이 */}
      <div className="absolute inset-0">
        <Image
          src="https://images.unsplash.com/photo-1528605248644-14dd04022da1?q=80&w=2070&auto=format&fit=crop"
          alt="Community Background"
          fill
          className="object-cover opacity-30" // ★ opacity를 40 -> 30으로 낮춰 배경을 더 어둡게
          priority
        />
        {/* ★ 오버레이 강도 높여 텍스트 가독성 확보 */}
        <div className="absolute inset-0 bg-gradient-to-r from-slate-900/95 via-slate-900/80 to-slate-900/95" /> 
      </div>

      {/* 컨텐츠 영역 (padding: py-10 md:py-16으로 늘려 시원하게) */}
      <div className="relative z-10 px-6 py-10 md:py-16 flex flex-col items-center text-center max-w-4xl mx-auto">
        
        {/* ★ 상단 뱃지 제거 (복잡함 감소) */}
        
        {/* ★ 메인 카피 */}
        <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-4 leading-snug tracking-tight drop-shadow-md">
          당신의 영향력을 확장시키는{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">성장 커뮤니티</span>
        </h1>
        
        {/* ★ 부제: 메시지 명확화 */}
        <p className="text-slate-300 text-base leading-relaxed max-w-lg mx-auto mb-8">
          사업가, 투자자, 인플루언서가 모여 신뢰를 기반으로 함께 <strong className="text-white">연결됩니다.</strong>
        </p>
        
        {/* ★ 혜택 체크리스트 전체 제거 */}
        
        {/* ★ CTA Button Block - 1개만 강조 */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full max-w-lg">
          <Button 
            onClick={onLogin}
            size="lg" 
            className="w-full sm:w-auto h-14 px-10 text-lg bg-white text-slate-900 hover:bg-slate-100 hover:scale-[1.02] transition-all duration-300 rounded-full font-bold shadow-xl"
          >
            시작하기
          </Button>

          {/* 커뮤니티 소개 버튼은 하위로 이동하거나 제거 */}
          <Link href="/about" className="w-full sm:w-auto hidden sm:block">
            {/* <Button variant="ghost" className="h-14 px-10 text-white hover:bg-white/10 text-base">
              커뮤니티 소개
            </Button> 
            */}
          </Link>
        </div>

      </div>
    </div>
  )
}