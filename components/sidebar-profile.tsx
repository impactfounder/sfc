import { createClient } from "@/lib/supabase/server"
import { getCurrentUserProfile } from "@/lib/queries/profiles"
import Link from "next/link"
import { LogIn } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import NotificationsDropdown from "@/components/notifications-dropdown"

export default async function SidebarProfile() {
  const supabase = await createClient()
  const userProfile = await getCurrentUserProfile(supabase)

  if (!userProfile || !userProfile.user) {
    // 로그인 안 된 상태 UI
    return (
      <div className="px-4 pb-4 min-h-[140px] flex flex-col justify-center">
        <Button
          asChild
          className="w-full h-10 rounded-full bg-slate-800/10 hover:bg-slate-800/20 text-slate-700 hover:text-slate-900 text-sm font-medium transition-all duration-300 shadow-sm hover:shadow border border-slate-300/50"
        >
          <Link href="/auth/login">
            <LogIn className="mr-2 h-4 w-4" />
            로그인
          </Link>
        </Button>
      </div>
    )
  }

  const { user, profile } = userProfile
  const userRole = profile?.role || "member"

  // 최신 정보로 UI 렌더링 (깜빡임 없음)
  return (
    <div className="px-4 pb-4 min-h-[140px] flex flex-col justify-center">
      <div className="space-y-2">
        {/* 프로필 영역과 알림 버튼을 형제 요소로 분리 */}
        <div className="flex items-center gap-2">
          {/* 1. 프로필 영역 (클릭 시 이동) */}
          <Link
            href="/community/profile"
            className="flex-1 flex items-center gap-3 rounded-xl px-3 py-3 transition-all border border-slate-200 min-w-0 bg-white hover:bg-slate-50 hover:border-slate-300"
          >
            <Avatar className="h-10 w-10 flex-shrink-0 border border-slate-100">
              <AvatarImage src={profile?.avatar_url || "/placeholder.svg"} />
              <AvatarFallback className="bg-blue-100 text-blue-600 text-sm font-bold">
                {profile?.full_name?.charAt(0) || user.email?.charAt(0)?.toUpperCase() || "U"}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-bold text-slate-900 truncate">
                {profile?.full_name || user.email?.split("@")[0] || "사용자"}
              </div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-[10px] px-1.5 py-0.5 bg-slate-100 rounded text-slate-500 font-medium truncate">
                  {userRole === "admin" || userRole === "master" ? "관리자" : "멤버"}
                </span>
                {profile?.points !== undefined && profile.points !== null && (
                  <span className="text-[10px] font-bold text-amber-600 flex items-center gap-0.5">
                    💎 {profile.points.toLocaleString()}
                  </span>
                )}
              </div>
            </div>
          </Link>

          {/* 2. 알림 버튼 (독립된 영역) */}
          <div className="flex-shrink-0">
            <NotificationsDropdown />
          </div>
        </div>
      </div>
    </div>
  )
}

