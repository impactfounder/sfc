"use client"

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { UserBadges } from "@/components/user-badges"
import Link from "next/link"

interface ProfilePopoverProps {
  children: React.ReactNode
  profile: {
    id: string
    full_name: string | null
    avatar_url: string | null
    bio?: string | null
    company?: string | null
    position?: string | null
    tagline?: string | null
  }
  badges?: { icon: string; name: string }[]
}

export function ProfilePopover({ children, profile, badges }: ProfilePopoverProps) {
  // profile이 없거나 id가 없으면 children만 반환
  if (!profile?.id) {
    return <>{children}</>
  }

  return (
    <Popover>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent className="w-72 p-0 bg-white border-slate-200 shadow-lg" align="start" sideOffset={8}>
        {/* 헤더 배경 */}
        <div className="h-14 bg-gradient-to-r from-slate-100 to-slate-50 rounded-t-lg" />

        {/* 프로필 정보 */}
        <div className="px-4 pb-4">
          {/* 아바타 (배경 위로 올라감) */}
          <Avatar className="h-14 w-14 -mt-7 border-4 border-white shadow-sm">
            <AvatarImage src={profile.avatar_url || undefined} />
            <AvatarFallback className="bg-slate-100 text-slate-600 text-lg font-bold">
              {profile.full_name?.[0] || "U"}
            </AvatarFallback>
          </Avatar>

          {/* 이름 + 배지 */}
          <div className="mt-2">
            <div className="flex items-center gap-2">
              <h4 className="font-bold text-slate-900">{profile.full_name || "익명"}</h4>
              {badges && badges.length > 0 && <UserBadges badges={badges} />}
            </div>

            {/* 직책 */}
            {(profile.company || profile.position) && (
              <p className="text-sm text-slate-500 mt-0.5">
                {[profile.position, profile.company].filter(Boolean).join(" @ ")}
              </p>
            )}
          </div>

          {/* 한 줄 소개 */}
          {profile.tagline && (
            <p className="text-sm text-slate-600 mt-2 line-clamp-2 italic">"{profile.tagline}"</p>
          )}

          {/* 프로필 보기 버튼 */}
          <Button asChild variant="outline" className="w-full mt-3" size="sm">
            <Link href={`/community/profile/${profile.id}`}>프로필 보기</Link>
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}
