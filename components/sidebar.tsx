"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { Calendar, LogOut, LogIn, Shield, Bell, MessageSquare, Home, Users, Lightbulb, ClipboardList, BookOpen } from "lucide-react"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import { useEffect, useState, useMemo, useRef } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import NotificationsDropdown from "@/components/notifications-dropdown"
import Image from "next/image"

const navigationSections = [
// ... (navigationSections 배열은 기존과 동일)
  { 
    title: "소개", 
    links: [
      { name: "SEOUL FOUNDERS CLUB 소개", href: "/about", icon: BookOpen } 
    ],
    groupStyle: "major"
  },
  { 
    title: "핵심 활동", 
    links: [
      { name: "이벤트", href: "/events", icon: Calendar }
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
      { name: "반골", href: "/community/board/bangol", icon: Users },
      { name: "하이토크", href: "/community/board/hightalk", icon: Lightbulb }
    ],
    groupStyle: "brand"
  },
]

export function Sidebar({ isMobile = false }: { isMobile?: boolean }) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])
  const [user, setUser] = useState<any>(null)
  const [userRole, setUserRole] = useState<string>("member")
  const [profile, setProfile] = useState<any>(null)

  useEffect(() => {
    const loadUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      setUser(user)

      if (user) {
        const { data: profileData } = await supabase.from("profiles").select("*").eq("id", user.id).single()

        if (profileData) {
          setProfile(profileData)
          setUserRole(profileData.role || "member")
        }
      }
    }

    loadUser()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      if (!session?.user) {
        setUserRole("member")
        setProfile(null)
      }
    })

    return () => subscription.unsubscribe()
  }, [supabase])

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut()
      // 하드 리로드로 캐시 무시하고 완전 초기화
      window.location.replace('/')
    } catch (error) {
      console.error('로그아웃 오류:', error)
      // 오류가 발생해도 강제 리로드
      window.location.replace('/')
    }
  }

  const handleLogin = () => {
    // 모달을 없애기로 했으므로 페이지 이동으로 통일
    router.push("/auth/login") 
  }

  const isAdmin = userRole === "admin" || userRole === "master"

  const isLinkActive = (href: string, startsWith = false) => {
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
      const isAtTop = sidebar.scrollTop === 0
      const isAtBottom = sidebar.scrollTop + sidebar.clientHeight >= sidebar.scrollHeight - 1

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
        className="flex h-full w-64 flex-col bg-white border-r border-slate-200 overflow-y-scroll scrollbar-hide"
      >
        <div className="border-b border-slate-100">
          
          {/* 로고 & 타이틀 */}
          <Link href="/" className="flex flex-col items-center justify-center px-6 py-6">
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
              width={180}
              height={30}
              className="mt-4 w-44"
              priority
            />
          </Link>

          {/* 유저 프로필 & 로그인 버튼 */}
          <div className="px-4 pb-4">
            {user ? (
              <div className="space-y-2">
                <Link
                  href="/community/profile"
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-3 transition-all border border-slate-200",
                    isLinkActive("/community/profile") ? "bg-slate-100" : "hover:bg-slate-50 hover:text-slate-900",
                  )}
                >
                  <Avatar className="h-10 w-10 flex-shrink-0">
                    <AvatarImage src={profile?.avatar_url || "/placeholder.svg"} />
                    <AvatarFallback className="bg-blue-600 text-white text-sm">
                      {profile?.full_name?.charAt(0) || user.email?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-slate-900 truncate">
                      {profile?.full_name || user.email?.split("@")[0]}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-slate-500 truncate">
                        {userRole === "admin" || userRole === "master" ? "관리자" : "멤버"}
                      </span>
                      {profile?.points !== undefined && profile.points !== null && (
                        <span className="text-xs font-bold text-yellow-600 flex items-center gap-1">
                          💎 {profile.points.toLocaleString()}P
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
                <Button
                  variant="outline"
                  className="w-full justify-center text-slate-600 hover:bg-slate-50 hover:text-slate-900 h-9 text-sm bg-transparent"
                  onClick={handleSignOut} // ★ 하드 리로드 적용
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  로그아웃
                </Button>
              </div>
            ) : (
              <Button
                onClick={handleLogin}
                className="w-full h-10 rounded-full bg-slate-800/10 hover:bg-slate-800/20 text-slate-700 hover:text-slate-900 text-sm font-medium transition-all duration-300 shadow-sm hover:shadow border border-slate-300/50"
              >
                <LogIn className="mr-2 h-4 w-4" />
                로그인
              </Button>
            )}
          </div>
        </div>

        <nav className="flex-1 px-2 py-4">
          
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
                  const isActive = isLinkActive(item.href, true)
                  const Icon = item.icon
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
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
              {user && <NotificationsDropdown />}
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