"use client"

import { useState, useEffect } from "react"
import { usePathname, useRouter } from "next/navigation"
import { Home, Calendar, Plus, Users, User } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import type { ReactNode } from "react"

type NavButtonProps = {
  icon: ReactNode
  label: string
  isActive?: boolean
  onClick: () => void
}

function NavButton({ icon, label, isActive, onClick }: NavButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex flex-col items-center justify-center transition-colors active:bg-gray-50 pt-1",
        isActive ? "text-slate-900 font-bold" : "text-gray-400"
      )}
    >
      {icon}
      <span>{label}</span>
    </button>
  )
}

export function MobileActionBar() {
  const pathname = usePathname()
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<{ avatar_url?: string; full_name?: string } | null>(null)
  const supabase = createClient()

  useEffect(() => {
    const loadUserAndProfile = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      setUser(user)

      if (user) {
        const { data: profileData } = await supabase
          .from("profiles")
          .select("avatar_url, full_name")
          .eq("id", user.id)
          .single()
        setProfile(profileData)
      }
    }

    loadUserAndProfile()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        const { data: profileData } = await supabase
          .from("profiles")
          .select("avatar_url, full_name")
          .eq("id", session.user.id)
          .single()
        setProfile(profileData)
      } else {
        setProfile(null)
      }
    })

    return () => subscription.unsubscribe()
  }, [supabase])

  // 현재 경로에 따라 활성 탭 결정
  const getActiveTab = () => {
    if (pathname === "/") return "home"
    if (pathname.startsWith("/e")) return "events"
    if (pathname.startsWith("/community/profile")) return "profile"
    if (pathname.startsWith("/communities") || pathname.startsWith("/community")) return "community"
    return null
  }

  const activeTab = getActiveTab()

  const handleHome = () => {
    router.push("/")
  }

  const handleEvents = () => {
    router.push("/e")
  }

  const handleCreate = async () => {
    if (!user) {
      router.push("/auth/login")
      return
    }
    router.push("/e/new")
  }

  const handleCommunity = () => {
    router.push("/community")
  }

  const handleProfile = async () => {
    if (!user) {
      router.push("/auth/login")
      return
    }
    router.push("/community/profile")
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-[100] bg-white border-t border-slate-200 lg:hidden pb-[env(safe-area-inset-bottom)] shadow-[0_-2px_10px_rgba(0,0,0,0.1)]">
      <div className="grid h-16 grid-cols-5 divide-x-0 text-[10px] font-medium text-gray-500">
        <NavButton
          icon={<Home className={cn("size-6 mb-1", activeTab === "home" ? "text-slate-900" : "text-gray-400")} />}
          label="홈"
          isActive={activeTab === "home"}
          onClick={handleHome}
        />
        <NavButton
          icon={<Calendar className={cn("size-6 mb-1", activeTab === "events" ? "text-slate-900" : "text-gray-400")} />}
          label="이벤트"
          isActive={activeTab === "events"}
          onClick={handleEvents}
        />
        <button
          type="button"
          onClick={handleCreate}
          className="flex flex-col items-center justify-center pt-0.5"
        >
          <div className="flex items-center justify-center size-10 bg-slate-900 rounded-full shadow-lg text-white transform active:scale-95 transition-transform">
            <Plus className="size-6" />
          </div>
          <span className="text-[10px] text-slate-900 font-semibold">만들기</span>
        </button>
        <NavButton
          icon={<Users className={cn("size-6 mb-1", activeTab === "community" ? "text-slate-900" : "text-gray-400")} />}
          label="커뮤니티"
          isActive={activeTab === "community"}
          onClick={handleCommunity}
        />
        {/* 프로필/로그인 버튼 - 로그인 상태에 따라 분기 */}
        {user ? (
          <button
            type="button"
            onClick={handleProfile}
            className={cn(
              "flex flex-col items-center justify-center transition-colors active:bg-gray-50 pt-1",
              activeTab === "profile" ? "text-slate-900 font-bold" : "text-gray-400"
            )}
          >
            <Avatar className={cn(
              "size-7 mb-0.5 ring-2 ring-offset-1",
              activeTab === "profile" ? "ring-slate-900" : "ring-transparent"
            )}>
              <AvatarImage src={profile?.avatar_url || undefined} alt={profile?.full_name || "프로필"} />
              <AvatarFallback className="text-xs bg-slate-200 text-slate-600">
                {profile?.full_name?.charAt(0) || user?.email?.charAt(0)?.toUpperCase() || "U"}
              </AvatarFallback>
            </Avatar>
            <span className="text-[10px]">프로필</span>
          </button>
        ) : (
          <NavButton
            icon={<User className="size-6 mb-1 text-gray-400" />}
            label="로그인"
            isActive={false}
            onClick={handleProfile}
          />
        )}
      </div>
    </nav>
  )
}

