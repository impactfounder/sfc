"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { LogIn } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import NotificationsDropdown from "@/components/notifications-dropdown"

interface SidebarProfileClientProps {
  user: {
    id: string
    email?: string | null
  } | null
  profile: {
    id: string
    full_name?: string | null
    avatar_url?: string | null
    role?: string | null
    points?: number | null
  } | null
}

export function SidebarProfileClient({ user, profile }: SidebarProfileClientProps) {
  const [isMounted, setIsMounted] = useState(false)

  // 하이드레이션 에러 방지: 마운트 후에만 드롭다운 렌더링
  useEffect(() => {
    setIsMounted(true)
  }, [])

  // 비로그인 상태 UI
  if (!user || !profile) {
    return null
  }

  const userRole = profile?.role || "member"
  const displayName = profile?.full_name || user.email?.split("@")[0] || "사용자"

  // 로그인 상태 UI
  // isMounted가 false일 때는 드롭다운 없이 단순 링크만 표시 (하이드레이션 에러 방지)
  if (!isMounted) {
    return (
      <div className="px-4 py-3">
        <div className="flex items-center gap-3 w-full">
          <div className="flex items-center gap-3 w-full">
            <Link
              href="/community/profile"
              className="flex items-center gap-3 flex-1 min-w-0 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <Avatar className="h-10 w-10 flex-shrink-0 border border-slate-100">
                <AvatarImage src={profile?.avatar_url || "/placeholder.svg"} />
                <AvatarFallback className="bg-blue-100 text-blue-600 text-sm font-bold">
                  {profile?.full_name?.charAt(0) || user.email?.charAt(0)?.toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0 text-left">
                <div className="text-sm font-bold text-slate-900 truncate">
                  {displayName}
                </div>
              </div>
            </Link>
            {/* 비로그인 시 보여줄 더미 버튼 (레이아웃 유지용) */}
            <div className="w-10 h-10" />
          </div>
        </div>
      </div>
    )
  }

  // 마운트된 후 드롭다운 메뉴 렌더링
  return (
    <div className="px-4 py-3">
      <div className="flex items-center gap-2 w-full">
        {/* 좌측: 프로필 링크 영역 */}
        <Link
          href="/community/profile"
          className="flex items-center gap-3 flex-1 min-w-0 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
        >
          <Avatar className="h-10 w-10 flex-shrink-0 border border-slate-100">
            <AvatarImage src={profile?.avatar_url || "/placeholder.svg"} />
            <AvatarFallback className="bg-blue-100 text-blue-600 text-sm font-bold">
              {profile?.full_name?.charAt(0) || user.email?.charAt(0)?.toUpperCase() || "U"}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0 text-left">
            <div className="text-sm font-bold text-slate-900 truncate">
              {displayName}
            </div>
          </div>
        </Link>

        {/* 우측: 알림 아이콘 */}
        <div className="flex items-center">
          <NotificationsDropdown 
            triggerClassName="h-10 w-10" 
            side="right"
            align="end"
          />
        </div>
      </div>
    </div>
  )
}

