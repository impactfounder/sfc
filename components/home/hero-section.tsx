"use client"

import { Button } from "@/components/ui/button"
import { Sparkles, Check, Users, Zap, Target } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { cn } from "@/lib/utils" // cn import 추가 (혹시 몰라 추가합니다)

interface HeroSectionProps {
  user: any
  profile?: any
  loginHref?: string
}

export function HeroSection({ user, profile, loginHref = "/auth/login" }: HeroSectionProps) {
  // 1. 로그인한 유저
  if (user) {
    // displayName 변수 생성: profile.full_name 우선, 없으면 user.user_metadata.full_name, 없으면 "멤버"
    const displayName = profile?.full_name || user.user_metadata?.full_name || "멤버"
    
    return (
      <div className="mb-6 rounded-2xl bg-slate-900 text-white px-6 py-6 shadow-lg overflow-hidden relative min-h-[140px] flex flex-col justify-center">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-white/5 rounded-full blur-3xl" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-xl md:text-2xl font-bold mb-1 leading-tight">
              반갑습니다, {displayName}님! 👋
            </h1>
            <p className="text-slate-300 text-sm">
              오늘도 새로운 기회와 연결될 준비가 되셨나요?
            </p>
          </div>
          <div className="flex items-center gap-4 shrink-0">
            {/* 포인트 표시 (숨김 처리) */}
            {/* <div className="hidden md:flex flex-col items-end mr-2">
              <span className="text-[10px] text-slate-400 font-medium mb-0.5">내 포인트</span>
              <span className="text-lg font-bold text-yellow-400 leading-none">
                {profile?.points?.toLocaleString() ?? 0} P
              </span>
            </div>
            */}
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

  // 2. 비로그인 유저
  return (
    <div className="mb-10 relative w-full overflow-hidden rounded-2xl bg-slate-900 shadow-md">
      {/* 배경 이미지 및 오버레이 */}
      <div className="absolute inset-0">
        <Image
          src="https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?q=80&w=2613&auto=format&fit=crop"
          alt="Seoul Founders Club"
          fill
          className="object-cover opacity-20"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-900/95 via-slate-900/80 to-slate-900/95" /> 
      </div>

      {/* 컨텐츠 영역 */}
      <div className="relative z-10 px-4 py-8 md:py-10 flex flex-col items-center text-center max-w-5xl mx-auto">
        
        {/* 상단 뱃지 */}
        <div className="inline-block px-3 py-0.5 mb-3 rounded-full border border-slate-600 bg-slate-800/50 text-slate-300 text-[10px] font-medium tracking-wider backdrop-blur-sm">
          SEOUL FOUNDERS CLUB
        </div>
        
        {/* 메인 카피 */}
        <h1 className="text-lg md:text-3xl lg:text-4xl font-bold text-white mb-3 leading-tight tracking-tight whitespace-nowrap">
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">새로운 가치</span>를 만드는 사람들의 베이스캠프
        </h1>
        
        {/* 서브 카피 */}
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
        
        {/* CTA Button */}
        <div className="flex flex-col sm:flex-row items-center justify-center w-full">
          <Link href={loginHref}>
            <Button 
              size="sm" 
              className="h-10 px-6 text-sm bg-white text-slate-900 hover:bg-slate-100 hover:scale-[1.02] transition-all duration-300 rounded-full font-bold shadow-lg"
            >
              3초만에 가입하기
            </Button>
          </Link>
        </div>

      </div>
    </div>
  )
}