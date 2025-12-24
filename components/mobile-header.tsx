"use client"

import Link from "next/link"
import Image from "next/image"
import { Menu, BookOpen, Users, Calendar, Bell, Megaphone, MessageSquare, Ticket, Lightbulb, Zap, Headset, Briefcase, Shield } from "lucide-react"
import { NotificationsDropdown } from "@/components/notifications-dropdown"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"

// 사이드바와 동일한 메뉴 구조
const navigationSections = [
  { 
    title: "소개", 
    links: [
      { name: "SEOUL FOUNDERS CLUB", href: "/about", icon: BookOpen },
      { name: "멤버", href: "/member", icon: Users }
    ]
  },
  { 
    title: "성장", 
    links: [
      { name: "이벤트", href: "/e", icon: Calendar },
      { name: "인사이트", href: "/community/board/insights", icon: Zap },
      { name: "파트너스", href: "/partners", icon: Briefcase }
    ]
  },
  { 
    title: "게시판",
    links: [
      { name: "공지사항", href: "/community/board/announcements", icon: Megaphone },
      { name: "자유게시판", href: "/community/board/free", icon: MessageSquare }
    ]
  },
  { 
    title: "커뮤니티",
    links: [
      { name: "커뮤니티 홈", href: "/community", icon: Ticket },
      { name: "반골", href: "/community/board/vangol", icon: Users },
      { name: "하이토크", href: "/community/board/hightalk", icon: Lightbulb }
    ]
  },
]

export function MobileHeader() {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)
  const [userRole, setUserRole] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    const loadUserRole = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .single()
        setUserRole(profile?.role || null)
      }
    }

    loadUserRole()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", session.user.id)
          .single()
        setUserRole(profile?.role || null)
      } else {
        setUserRole(null)
      }
    })

    return () => subscription.unsubscribe()
  }, [supabase])

  const isAdmin = userRole === "admin" || userRole === "master"
  const showAdminMenu = isAdmin || pathname.startsWith('/admin')

  const isLinkActive = (href: string) => {
    if (href === '/community') return pathname === href
    return pathname.startsWith(href)
  }

  return (
    <header className="fixed top-0 left-0 right-0 h-14 bg-white/95 backdrop-blur-xl border-b border-slate-100 z-40 flex items-center justify-between px-4 transition-all duration-300 shadow-sm shadow-slate-900/5">
      {/* 1. 로고 */}
      <Link href="/" className="flex-shrink-0 relative z-50">
        <Image
          src="/images/ec-a0-9c-eb-aa-a9-20-ec-97-86-ec-9d-8c-1.png"
          alt="Seoul Founders Club"
          width={140}
          height={28}
          className="object-contain h-5 w-auto"
          priority
        />
      </Link>

      {/* 2. 우측 액션 영역 */}
      <div className="flex items-center gap-1 flex-shrink-0">
        
        {/* 알림 아이콘 */}
        <div className="relative">
          <NotificationsDropdown align="end" side="bottom" />
        </div>

        {/* 햄버거 메뉴 */}
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="h-11 w-11 -mr-2 text-slate-700 hover:bg-slate-100 active:bg-slate-200 rounded-xl transition-colors">
              <Menu className="h-6 w-6" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-[85vw] max-w-[350px] p-0 bg-white/98 backdrop-blur-xl border-l border-slate-100 shadow-2xl">
            <SheetHeader className="p-6 border-b border-slate-100 text-left">
              <SheetTitle className="text-lg font-bold text-slate-900">메뉴</SheetTitle>
            </SheetHeader>

            <div className="flex flex-col h-full overflow-y-auto py-4 pb-20">
              {navigationSections.map((section) => (
                <div key={section.title} className="mb-6 px-4">
                  <h4 className="mb-2 px-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
                    {section.title}
                  </h4>
                  <div className="space-y-1">
                    {section.links.map((item) => {
                      const Icon = item.icon
                      const active = isLinkActive(item.href)
                      const isBoardLink = item.href.startsWith("/community/board/")

                      return (
                        <Link
                          key={item.name}
                          href={item.href}
                          prefetch={isBoardLink ? true : undefined}
                          onClick={() => setIsOpen(false)}
                          className={cn(
                            "flex items-center gap-4 px-4 py-3 text-base transition-all rounded-2xl active:scale-[0.98]",
                            active
                              ? "bg-slate-900 text-white font-semibold shadow-sm"
                              : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 font-medium"
                          )}
                        >
                          <Icon className={cn("h-5 w-5 flex-shrink-0", active ? "text-white" : "text-slate-400")} />
                          <span>{item.name}</span>
                        </Link>
                      )
                    })}
                  </div>
                </div>
              ))}

              {/* 기타 섹션 */}
              <div className="mb-6 px-4">
                <h4 className="mb-2 px-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
                  기타
                </h4>
                <div className="space-y-1">
                  <Link
                    href="/customer-center"
                    onClick={() => setIsOpen(false)}
                    className={cn(
                      "flex items-center gap-4 px-4 py-3 text-base transition-all rounded-2xl active:scale-[0.98]",
                      isLinkActive("/customer-center")
                        ? "bg-slate-900 text-white font-semibold shadow-sm"
                        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 font-medium"
                    )}
                  >
                    <Headset className={cn("h-5 w-5 flex-shrink-0", isLinkActive("/customer-center") ? "text-white" : "text-slate-400")} />
                    <span>고객센터</span>
                  </Link>
                  {showAdminMenu && (
                    <Link
                      href="/admin"
                      onClick={() => setIsOpen(false)}
                      className={cn(
                        "flex items-center gap-4 px-4 py-3 text-base transition-all rounded-2xl active:scale-[0.98]",
                        isLinkActive("/admin")
                          ? "bg-slate-900 text-white font-semibold shadow-sm"
                          : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 font-medium"
                      )}
                    >
                      <Shield className={cn("h-5 w-5 flex-shrink-0", isLinkActive("/admin") ? "text-white" : "text-slate-400")} />
                      <span>관리자</span>
                    </Link>
                  )}
                </div>
              </div>

              {/* 하단 여백 (하단바에 가려지지 않도록) */}
              <div className="h-12" />
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  )
}
