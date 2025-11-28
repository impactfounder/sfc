import { createClient } from "@/lib/supabase/server"
import { getCurrentUserProfile } from "@/lib/queries/profiles"
import Link from "next/link"
import { LogIn, User, MoreHorizontal } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { SidebarLogoutItem } from "@/components/sidebar-logout-item"

export default async function SidebarProfile() {
  const supabase = await createClient()
  const userProfile = await getCurrentUserProfile(supabase)

  if (!userProfile || !userProfile.user) {
    // 비로그인 상태 UI
    return (
      <div className="px-4 pb-4 min-h-[140px] flex flex-col justify-center">
        <Button
          asChild
          className="w-full h-12 rounded-xl bg-slate-900 text-white hover:bg-slate-800 transition-all duration-300"
        >
          <Link href="/auth/login">
            <LogIn className="mr-2 h-4 w-4" />
            로그인 / 회원가입
          </Link>
        </Button>
      </div>
    )
  }

  const { user, profile } = userProfile
  const userRole = profile?.role || "member"
  const displayName = profile?.full_name || user.email?.split("@")[0] || "사용자"
  const roleLabel = userRole === "admin" || userRole === "master" ? "관리자" : "멤버"

  // 로그인 상태 UI (Dropdown Menu)
  return (
    <div className="px-4 pb-4 min-h-[140px] flex flex-col justify-center">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="w-full p-2 rounded-xl hover:bg-slate-100 justify-between h-auto"
          >
            <div className="flex items-center gap-3 flex-1 min-w-0">
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
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-[10px] px-1.5 py-0.5 bg-slate-100 rounded text-slate-500 font-medium truncate">
                    {roleLabel}
                  </span>
                  {profile?.points !== undefined && profile.points !== null && (
                    <span className="text-[10px] font-bold text-amber-600 flex items-center gap-0.5">
                      💎 {profile.points.toLocaleString()}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <MoreHorizontal className="h-5 w-5 text-slate-400 flex-shrink-0 ml-2" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem asChild>
            <Link href="/community/profile" className="cursor-pointer">
              <User className="mr-2 h-4 w-4" />
              내 프로필
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <SidebarLogoutItem />
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

