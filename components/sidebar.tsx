"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { Calendar, LogOut, Shield, Bell, MessageSquare, Home, Users, Lightbulb, ClipboardList, BookOpen, Ticket, Zap } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useEffect, useState, useMemo, useRef } from "react"
import Image from "next/image"
import { usePrefetchPosts } from "@/lib/hooks/usePrefetchPosts"
import type React from "react"

const navigationSections = [
// ... (navigationSections 배열은 기존과 동일)
  { 
    title: "소개", 
    links: [
      { name: "SEOUL FOUNDERS CLUB", href: "/about", icon: BookOpen },
      { name: "멤버", href: "/member", icon: Users }
    ],
    groupStyle: "major"
  },
  { 
    title: "성장", 
    links: [
      { name: "이벤트", href: "/events", icon: Calendar },
      { name: "인사이트", href: "/community/board/insights", icon: Zap }
    ],
    groupStyle: "major"
  },
  { 
    title: "게시판", // 운영/정보성
    links: [
      { name: "공지사항", href: "/community/board/announcements", icon: Bell },
      { name: "자유게시판", href: "/community/board/free", icon: MessageSquare }
    ],
    groupStyle: "board"
  },
  { 
    title: "커뮤니티", // 브랜드성
    links: [
      { name: "커뮤니티", href: "/community", icon: Ticket },
      { name: "반골", href: "/community/board/vangol", icon: Users },
      { name: "하이토크", href: "/community/board/hightalk", icon: Lightbulb }
    ],
    groupStyle: "brand"
  },
]

export function Sidebar({ 
  isMobile = false, 
  children 
}: { 
  isMobile?: boolean
  children?: React.ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])
  const [user, setUser] = useState<any>(null)
  const [userRole, setUserRole] = useState<string>("member")
  const [isSigningOut, setIsSigningOut] = useState(false)
  const prefetch = usePrefetchPosts()

  useEffect(() => {
    const loadUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      setUser(user)

      if (user) {
        const { data: profileData } = await supabase
          .from("profiles")
          .select("id, role")
          .eq("id", user.id)
          .single()

        if (profileData) {
          setUserRole(profileData.role || "member")
        }
      }
    }

    loadUser()

    // 근본 원인: onAuthStateChange가 페이지 이동 시에도 트리거되어 
    // session이 일시적으로 null이 되면서 프로필이 초기화됨
    // 해결: SIGNED_OUT 이벤트일 때만 프로필 초기화
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      // 로그아웃 이벤트일 때만 프로필 초기화
      if (event === 'SIGNED_OUT') {
        setUser(null)
        setUserRole("member")
      } else if (session?.user) {
        // 로그인 상태가 유지되면 사용자 정보만 업데이트
        setUser(session.user)
        // 프로필 정보가 없을 때만 다시 로드
        supabase
          .from("profiles")
          .select("id, role")
          .eq("id", session.user.id)
          .single()
          .then(({ data: profileData }) => {
          if (profileData) {
            setUserRole(profileData.role || "member")
          }
        })
      }
    })

    return () => subscription.unsubscribe()
  }, [supabase])

  const handleSignOut = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (isSigningOut) return // 이미 로그아웃 중이면 무시
    
    setIsSigningOut(true)
    
    try {
      // 로그아웃 실행 (타임아웃 설정)
      const signOutPromise = supabase.auth.signOut()
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('로그아웃 타임아웃')), 2000)
      )
      
      await Promise.race([signOutPromise, timeoutPromise])
    } catch (error) {
      console.error('로그아웃 오류:', error)
    }
    
    // 세션 스토리지 및 로컬 스토리지 클리어
    try {
      localStorage.clear()
      sessionStorage.clear()
    } catch (e) {
      console.error('스토리지 클리어 오류:', e)
    }
    
    // 캐시 무시하고 완전히 리로드 (히스토리 스택에 남지 않음)
    window.location.replace('/?logout=' + Date.now())
  }


  const isAdmin = userRole === "admin" || userRole === "master"

  const isLinkActive = (href: string, startsWith = false) => {
    // /community 경로에 대한 예외 처리: 완전 일치일 때만 활성화
    if (href === '/community' || href === '/community/page') {
      return pathname === href
    }
    // 다른 링크는 기존 로직 유지
    return startsWith ? pathname.startsWith(href) : pathname === href
  }

  const sidebarRef = useRef<HTMLDivElement>(null)

  // 사이드바에 마우스가 올라가 있을 때만 스크롤 처리
  useEffect(() => {
    const sidebar = sidebarRef.current
    if (!sidebar) return

    const handleWheel = (e: WheelEvent) => {
      // 사이드바가 스크롤 가능한 상태인지 확인
      const isScrollable = sidebar.scrollHeight > sidebar.clientHeight
      const isAtTop = sidebar.scrollTop <= 1 // 여유를 둠
      // 근본 원인: isAtBottom 계산이 부정확하여 스크롤이 끝까지 내려가지 않음
      // 해결: 여유를 두고 정확한 계산
      const isAtBottom = sidebar.scrollTop + sidebar.clientHeight >= sidebar.scrollHeight - 5

      // 스크롤 가능하고, 위/아래 끝에 도달하지 않았으면 사이드바만 스크롤
      if (isScrollable) {
        if ((e.deltaY < 0 && !isAtTop) || (e.deltaY > 0 && !isAtBottom)) {
          e.stopPropagation()
        }
      }
    }

    sidebar.addEventListener('wheel', handleWheel, { passive: false })

    return () => {
      sidebar.removeEventListener('wheel', handleWheel)
    }
  }, [])

  return (
    <>
      <div 
        ref={sidebarRef}
        className="flex h-full w-80 flex-col bg-white border-r border-slate-100 overflow-y-scroll scrollbar-hide shadow-sm"
      >
        <div className="border-b border-slate-100">
          
          {/* 로고 & 타이틀 */}
          <Link href="/" className="flex flex-col items-center justify-center px-6 py-8 hover:opacity-80 transition-opacity">
            <Image
              src="/images/logo.png"
              alt="Seoul Founders Club"
              width={200}
              height={200}
              className="w-40 h-40"
              priority
            />
            <Image
              src="/images/logo-text.png"
              alt="SEOUL FOUNDERS CLUB"
              width={240}
              height={40}
              className="mt-5 w-56"
              priority
            />
          </Link>

          {/* 유저 프로필 & 로그인 버튼 - 서버 컴포넌트로 대체 (모바일 전용) */}
          <div className="lg:hidden">
            {children}
          </div>
        </div>

        <nav className="flex-1 px-2 py-4 pb-8">
          
          {/* 1. 홈 (Top Level) */}
          <div className="space-y-0.5 mb-6">
            <Link
              href="/"
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-[15px] font-medium transition-all",
                isLinkActive("/") ? "bg-slate-100 text-slate-900 font-bold" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900",
              )}
            >
              <Home className="h-5 w-5 flex-shrink-0" />
              <span>홈</span>
            </Link>
          </div>

          {/* 2. 구조화된 메뉴 섹션 */}
          {navigationSections.map((section) => (
            <div key={section.title} className="mt-4 mb-6">
              
              <div className="px-3 mb-2">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  {section.title}
                </span>
              </div>

              <div className="space-y-0.5">
                {section.links.map((item) => {
                  // '커뮤니티' 메뉴(/community)는 정확히 해당 경로일 때만 활성화
                  // 다른 커뮤니티 하위 링크는 startsWith 사용
                  const useExactMatch = item.href === "/community"
                  const isActive = isLinkActive(item.href, !useExactMatch)
                  const Icon = item.icon
                  // 게시판 링크인지 확인 (/community/board/로 시작)
                  const isBoardLink = item.href.startsWith("/community/board/")
                  // URL에서 slug 추출 (예: /community/board/free -> free)
                  const boardSlug = isBoardLink ? item.href.split("/").pop() : null
                  // URL 슬러그를 DB 슬러그로 변환
                  let dbSlug = boardSlug
                  if (boardSlug === 'free') dbSlug = 'free-board'
                  if (boardSlug === 'announcements') dbSlug = 'announcement'
                  
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      prefetch={isBoardLink ? true : undefined}
                      onMouseEnter={() => {
                        if (isBoardLink && dbSlug) {
                          prefetch(dbSlug)
                        }
                      }}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2.5 text-[15px] transition-all rounded-xl",
                        isActive ? "bg-slate-100 text-slate-900 font-medium" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 font-normal",
                      )}
                    >
                      <Icon className="h-5 w-5 flex-shrink-0" />
                      <span>{item.name}</span>
                    </Link>
                  )
                })}
              </div>
            </div>
          ))}

          {/* 5. 기타 활동 및 관리자 섹션 */}
          <div className="mt-6">
            <div className="px-3 mb-2">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">기타</span>
            </div>
            <div className="space-y-0.5">
              {isAdmin && (
                <Link
                  href="/admin"
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 text-[15px] transition-all rounded-xl",
                    isLinkActive("/admin", true)
                      ? "bg-slate-100 text-slate-900 font-medium"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 font-normal",
                  )}
                >
                  <Shield className="h-5 w-5 flex-shrink-0" />
                  <span>관리자</span>
                </Link>
              )}
            </div>
          </div>
        </nav>
      </div>
    </>
  )
}