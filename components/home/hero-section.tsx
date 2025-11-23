"use client"

import { Button } from "@/components/ui/button"
import { ArrowRight, Sparkles, Check, Users, Zap, Target } from "lucide-react"
import Link from "next/link"
import Image from "next/image"

interface HeroSectionProps {
  user: any
  onLogin: () => void
}

export function HeroSection({ user, onLogin }: HeroSectionProps) {
  // 1. 로그인한 유저
  if (user) {
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
              반갑습니다, {user.user_metadata?.full_name || "멤버"}님! 👋
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

  // 2. 비로그인 유저 (최종 컴팩트 버전)
  return (
    <div className="mb-10 relative w-full overflow-hidden rounded-2xl bg-slate-900 shadow-md">
      {/* 배경 이미지 및 오버레이 */}
      <div className="absolute inset-0">
        <Image
          src="https://images.unsplash.com/photo-1528605248644-14dd04022da1?q=80&w=2070&auto=format&fit=crop"
          alt="Community Background"
          fill
          className="object-cover opacity-40"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-900/95 via-slate-900/70 to-transparent" />
      </div>

      {/* 컨텐츠 영역 (padding: py-4 md:py-6으로 최소화) */}
      <div className="relative z-10 px-6 py-4 md:py-6 flex flex-col items-center text-center max-w-4xl mx-auto">
        
        {/* 상단 뱃지 */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/30 text-white backdrop-blur-md mb-2 shadow-sm">
          <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
          <span className="text-[11px] font-bold tracking-wider">지금 100+명의 리더들이 실시간 활동 중</span>
        </div>

        {/* 메인 카피 */}
        <h1 className="text-2xl md:text-3xl font-bold text-white mb-1 leading-snug tracking-tight drop-shadow-md">
          당신의 영향력을 확장시키는
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400"> 성장 네트워크.</span>
        </h1>
        
        {/* 부제 */}
        <p className="text-slate-300 text-sm leading-relaxed max-w-lg mx-auto mb-4">
          신뢰기반 검증을 통해 아이디어와 콘텐츠가 자본과 연결되는 커뮤니티입니다.
        </p>
        
        {/* CTA Button Block (★ w-full, h-12로 최종 축소) */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full max-w-lg">
          
          <Button 
            onClick={onLogin}
            size="lg" 
            className="w-full sm:w-auto h-12 px-8 text-base bg-white text-slate-900 hover:bg-slate-100 hover:scale-[1.02] transition-all duration-300 rounded-full font-bold shadow-xl" // ★ 높이 h-12
          >
            3초 만에 시작하기
            <ArrowRight className="ml-2 w-5 h-5" />
          </Button>

          {/* 커뮤니티 소개 버튼 */}
          <Link href="/about" className="w-full sm:w-auto">
            <Button
              variant="outline"
              size="lg"
              className="w-full h-12 px-8 text-base border-slate-900 bg-white text-slate-900 hover:bg-slate-50 hover:scale-[1.02] transition-all duration-300 rounded-full font-semibold" // ★ 높이 h-12
            >
              커뮤니티 소개
            </Button>
          </Link>
        </div>

        {/* 혜택 체크리스트 (Hidden on Mobile) */}
        <div className="mt-4 w-full max-w-sm hidden sm:block">
          <ul className="text-white text-sm space-y-2 mx-auto w-fit text-left">
            <li className="flex items-start gap-2">
              <Check className="w-4 h-4 text-green-400 shrink-0 mt-0.5" />
              <span>사업가·창작자·투자자의 실시간 네트워크</span>
            </li>
            <li className="flex items-start gap-2">
              <Check className="w-4 h-4 text-green-400 shrink-0 mt-0.5" />
              <span>단독 이벤트·모임 참여 기회 제공</span>
            </li>
            <li className="flex items-start gap-2">
              <Check className="w-4 h-4 text-green-400 shrink-0 mt-0.5" />
              <span>나만의 프로필 기반 추천 연결</span>
            </li>
          </ul>
        </div>

      </div>
    </div>
  )
}