"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { Calendar, LogOut, Shield, Bell, Megaphone, MessageSquare, Home, Users, Lightbulb, ClipboardList, BookOpen, Ticket, Zap, Headset, Briefcase } from "lucide-react"
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
      { name: "이벤트", href: "/e", icon: Calendar },
      { name: "인사이트", href: "/community/board/insights", icon: Zap },
      { name: "파트너스", href: "/partners", icon: Briefcase }
    ],
    groupStyle: "major"
  },
  {
    title: "게시판", // 운영/정보성
    links: [
      { name: "공지사항", href: "/community/board/announcements", icon: Megaphone },
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

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])
  const [user, setUser] = useState<any>(null)
  const [userRole, setUserRole] = useState<string>("member")
  const [isRoleLoaded, setIsRoleLoaded] = useState(false)
  const prefetch = usePrefetchPosts()

  // 유저 및 role 정보 가져오기
  useEffect(() => {
    const fetchUserRole = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)

      if (user) {
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single()

        console.log('[Sidebar] Profile fetch result:', { role: profile?.role, error })

        if (profile?.role) {
          setUserRole(profile.role)
        }
      }
      setIsRoleLoaded(true)
    }

    fetchUserRole()

    // 인증 상태 변경 구독
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setUser(session?.user || null)
      if (session?.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .single()

        if (profile?.role) {
          setUserRole(profile.role)
        }
      } else {
        setUserRole("member")
      }
      setIsRoleLoaded(true)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [supabase])

  const isAdmin = userRole === "admin" || userRole === "master"
  const shouldShowAdminMenu = isRoleLoaded && (isAdmin || pathname.startsWith('/admin'))

  const isLinkActive = (href: string, startsWith = false) => {
    if (href === '/community' || href === '/community/page') {
      return pathname === href
    }
    return startsWith ? pathname.startsWith(href) : pathname === href
  }

  const sidebarRef = useRef<HTMLDivElement>(null)

  // ... existing wheel event handler ...
  useEffect(() => {
    const sidebar = sidebarRef.current
    if (!sidebar) return

    const handleWheel = (e: WheelEvent) => {
      const isScrollable = sidebar.scrollHeight > sidebar.clientHeight
      const isAtTop = sidebar.scrollTop <= 1
      const isAtBottom = sidebar.scrollTop + sidebar.clientHeight >= sidebar.scrollHeight - 5

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
        className="flex h-full w-full flex-col bg-white border-r border-slate-100 shadow-sm overflow-hidden"
      >
        <nav
          ref={sidebarRef}
          className="flex-1 px-2 py-4 overflow-y-auto overflow-x-hidden no-scrollbar"
          style={{
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
          }}
        >

          {/* 1. 홈 (Top Level) */}
          <div className="space-y-0.5 mb-1">
            <Link
              href="/"
              className={cn(
                "flex items-center gap-3 rounded-xl px-[27px] py-1.5 text-[15px] font-medium transition-all",
                isLinkActive("/") ? "bg-slate-100 text-slate-900 font-bold" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900",
              )}
            >
              <Home className="h-5 w-5 flex-shrink-0" />
              <span>홈</span>
            </Link>
          </div>

          {/* 2. 구조화된 메뉴 섹션 */}
          {navigationSections.map((section) => (
            <div key={section.title} className="mt-6 mb-2">

              <div className="px-[27px] mb-2">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  {section.title}
                </span>
              </div>

              <div className="space-y-0.5">
                {section.links.map((item) => {
                  const useExactMatch = item.href === "/community"
                  const isActive = isLinkActive(item.href, !useExactMatch)
                  const Icon = item.icon
                  const isBoardLink = item.href.startsWith("/community/board/")
                  const boardSlug = isBoardLink ? item.href.split("/").pop() : null
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
                        "flex items-center gap-3 px-[27px] py-1.5 text-[15px] transition-all rounded-xl",
                        isActive ? "bg-slate-100 text-slate-900 font-bold" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 font-medium",
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
          <div className="mt-6 mb-2">
            <div className="px-[27px] mb-2">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">기타</span>
            </div>
            <div className="space-y-0.5">
              <Link
                href="/customer-center"
                className={cn(
                  "flex items-center gap-3 px-[27px] py-1.5 text-[15px] transition-all rounded-xl",
                  isLinkActive("/customer-center", true)
                    ? "bg-slate-100 text-slate-900 font-bold"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 font-medium",
                )}
              >
                <Headset className="h-5 w-5 flex-shrink-0" />
                <span>고객센터</span>
              </Link>
              {shouldShowAdminMenu && (
                <Link
                  href="/admin"
                  className={cn(
                    "flex items-center gap-3 px-[27px] py-1.5 text-[15px] transition-all rounded-xl",
                    isLinkActive("/admin", true)
                      ? "bg-slate-100 text-slate-900 font-bold"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 font-medium",
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