"use client"

import { useState, useEffect } from "react"
import { usePathname, useRouter } from "next/navigation"
import { Home, Calendar, Plus, Users, User } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"
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
  const supabase = createClient()

  useEffect(() => {
    const loadUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      setUser(user)
    }

    loadUser()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [supabase])

  // 현재 경로에 따라 활성 탭 결정
  const getActiveTab = () => {
    if (pathname === "/") return "home"
    if (pathname.startsWith("/events")) return "events"
    if (pathname.startsWith("/community/profile")) return "profile"
    if (pathname.startsWith("/communities") || pathname.startsWith("/community")) return "community"
    return null
  }

  const activeTab = getActiveTab()

  const handleHome = () => {
    router.push("/")
  }

  const handleEvents = () => {
    router.push("/events")
  }

  const handleCreate = async () => {
    if (!user) {
      router.push("/auth/login")
      return
    }
    router.push("/events/new")
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
        <NavButton
          icon={<User className={cn("size-6 mb-1", !user ? "text-gray-400" : "text-gray-400")} />}
          label={user ? "프로필" : "로그인"}
          isActive={activeTab === "profile"}
          onClick={handleProfile}
        />
      </div>
    </nav>
  )
}

