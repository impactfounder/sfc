"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { Calendar, LogOut, LogIn, Shield, Plus, Bell, MessageSquare, Home, Users, Lightbulb } from "lucide-react"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import { useEffect, useState, useMemo } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import NotificationsDropdown from "@/components/notifications-dropdown"
import { LoginModal } from "@/components/login-modal"
import Image from "next/image"

const staticNavigation = [
  { name: "홈", href: "/", icon: Home },
  { name: "SFC 소개", href: "/about", icon: Users },
]

const staticBoardCategories = [
  { name: "공지사항", slug: "announcements", icon: Bell },
  { name: "자유게시판", slug: "free-board", icon: MessageSquare },
  { name: "반골", slug: "bangol", icon: Users },
  { name: "하이토크", slug: "hightalk", icon: Lightbulb },
]

export function Sidebar({ isMobile = false }: { isMobile?: boolean }) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])
  const [user, setUser] = useState<any>(null)
  const [userRole, setUserRole] = useState<string>("member")
  const [profile, setProfile] = useState<any>(null)
  const [showLoginModal, setShowLoginModal] = useState(false)

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
      } else {
        setShowLoginModal(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [supabase])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push("/")
    router.refresh()
  }

  const isAdmin = userRole === "admin" || userRole === "master"

  // ★★★ 이 함수가 누락되어 에러가 발생했습니다. 다시 추가했습니다. ★★★
  const isLinkActive = (href: string, startsWith = false) => {
    return startsWith ? pathname.startsWith(href) : pathname === href
  }

  return (
    <div className="flex h-full w-64 flex-col bg-white border-r border-slate-200 overflow-y-scroll scrollbar-hide">
      <div className="border-b border-slate-100">
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
                  <div className="text-xs text-slate-500 truncate">
                    {userRole === "admin" || userRole === "master" ? "관리자" : "멤버"}
                  </div>
                </div>
              </Link>
              <Button
                variant="outline"
                className="w-full justify-center text-slate-600 hover:bg-slate-50 hover:text-slate-900 h-9 text-sm bg-transparent"
                onClick={handleSignOut}
              >
                <LogOut className="mr-2 h-4 w-4" />
                로그아웃
              </Button>
            </div>
          ) : (
            <button
              onClick={() => setShowLoginModal(true)}
              className="w-full h-10 rounded-full bg-slate-800/10 hover:bg-slate-800/20 backdrop-blur-sm border border-slate-300/50 text-slate-700 hover:text-slate-900 text-sm font-medium transition-all duration-300 flex items-center justify-center gap-2 shadow-sm hover:shadow"
            >
              <LogIn className="h-4 w-4" />
              <span>로그인</span>
            </button>
          )}
        </div>
      </div>

      {/* 메인 네비게이션 */}
      <nav className="flex-1 px-2 py-4">
        <div className="space-y-0.5">
          {staticNavigation.map((item) => {
            const isActive = isLinkActive(item.href)
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-[15px] font-medium transition-all",
                  isActive ? "bg-slate-100 text-slate-900" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900",
                )}
              >
                {item.icon && <item.icon className="h-5 w-5 flex-shrink-0" />}
                <span>{item.name}</span>
              </Link>
            )
          })}
        </div>

        {/* 게시판 섹션 */}
        <div className="mt-6 mb-3">
          <div className="px-3 mb-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">게시판</span>
          </div>
          <div className="space-y-0.5">
            {staticBoardCategories.map((category) => {
              const href = `/community/board/${category.slug}`
              const isActive = isLinkActive(href, true)
              const Icon = category.icon
              return (
                <Link
                  key={category.slug}
                  href={href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-[15px] font-medium transition-all",
                    isActive ? "bg-slate-100 text-slate-900" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900",
                  )}
                >
                  <Icon className="h-5 w-5 flex-shrink-0" />
                  <span>{category.name}</span>
                </Link>
              )
            })}
          </div>
        </div>

        {/* 이벤트 */}
        <div className="mt-6">
          <div className="px-3 mb-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">활동</span>
          </div>
          <div className="space-y-0.5">
            <Link
              href="/community/events"
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-[15px] font-medium transition-all",
                isLinkActive("/community/events", true)
                  ? "bg-slate-100 text-slate-900"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900",
              )}
            >
              <Calendar className="h-5 w-5 flex-shrink-0" />
              <span>이벤트</span>
            </Link>

            {user && <NotificationsDropdown />}
            
            {/* 이벤트 만들기 버튼 삭제됨 */}
          </div>
        </div>

        {isAdmin && (
          <div className="mt-6">
            <div className="space-y-0.5">
              <Link
                href="/admin"
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-[15px] font-medium transition-all",
                  isLinkActive("/admin", true)
                    ? "bg-slate-100 text-slate-900"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900",
                )}
              >
                <Shield className="h-5 w-5 flex-shrink-0" />
                <span>관리자</span>
              </Link>
            </div>
          </div>
        )}
      </nav>
      <LoginModal open={showLoginModal} onOpenChange={setShowLoginModal} />
    </div>
  )
}