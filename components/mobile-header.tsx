"use client"

import Link from "next/link"
import Image from "next/image"
import { Menu, BookOpen, Users, Calendar, Bell, MessageSquare, Ticket, Lightbulb } from "lucide-react"
import { NotificationsDropdown } from "@/components/notifications-dropdown"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { useState } from "react"

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
    title: "핵심 활동", 
    links: [
      { name: "이벤트", href: "/events", icon: Calendar }
    ]
  },
  { 
    title: "게시판",
    links: [
      { name: "공지사항", href: "/community/board/announcements", icon: Bell },
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

  const isLinkActive = (href: string) => {
    if (href === '/community') return pathname === href
    return pathname.startsWith(href)
  }

  return (
    <header className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-white/90 backdrop-blur-md border-b border-slate-200 z-40 flex items-center justify-between px-4 transition-all duration-300">
      {/* 1. 로고 */}
      <Link href="/" className="flex-shrink-0 relative z-50">
        <Image
          src="/images/ec-a0-9c-eb-aa-a9-20-ec-97-86-ec-9d-8c-1.png"
          alt="Seoul Founders Club"
          width={140}
          height={28}
          className="object-contain h-7 w-auto"
          priority
        />
      </Link>

      {/* 2. 우측 액션 영역 */}
      <div className="flex items-center gap-1">
        
        {/* 알림 아이콘 */}
        <div className="relative">
          <NotificationsDropdown />
        </div>

        {/* 햄버거 메뉴 */}
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="h-10 w-10 -mr-2 text-slate-600 hover:bg-slate-100">
              <Menu className="h-6 w-6" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-[300px] sm:w-[350px] p-0 bg-white border-l border-slate-200">
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
                      // 게시판 링크인지 확인 (/community/board/로 시작)
                      const isBoardLink = item.href.startsWith("/community/board/")
                      
                      return (
                        <Link
                          key={item.name}
                          href={item.href}
                          prefetch={isBoardLink ? true : undefined}
                          onClick={() => setIsOpen(false)}
                          className={cn(
                            "flex items-center gap-3 px-3 py-2.5 text-[15px] transition-all rounded-xl",
                            active 
                              ? "bg-slate-100 text-slate-900 font-bold" 
                              : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 font-medium"
                          )}
                        >
                          <Icon className={cn("h-5 w-5 flex-shrink-0", active ? "text-slate-900" : "text-slate-400")} />
                          <span>{item.name}</span>
                        </Link>
                      )
                    })}
                  </div>
                </div>
              ))}
              
              {/* 하단 여백 (하단바에 가려지지 않도록) */}
              <div className="h-12" />
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  )
}
