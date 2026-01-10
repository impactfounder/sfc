"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ProfilePopover } from "@/components/ui/profile-popover"
import { cn } from "@/lib/utils"

interface ClickableAvatarProps {
  profile: {
    id: string
    full_name: string | null
    avatar_url: string | null
    bio?: string | null
    company?: string | null
    position?: string | null
    tagline?: string | null
  } | null
  badges?: { icon: string; name: string }[]
  size?: "xs" | "sm" | "md" | "lg" | "xl"
  showName?: boolean
  className?: string
  nameClassName?: string
}

const sizeClasses = {
  xs: "h-6 w-6",
  sm: "h-8 w-8",
  md: "h-10 w-10",
  lg: "h-12 w-12",
  xl: "h-14 w-14",
}

const fallbackTextSizes = {
  xs: "text-[10px]",
  sm: "text-xs",
  md: "text-sm",
  lg: "text-base",
  xl: "text-lg",
}

export function ClickableAvatar({
  profile,
  badges,
  size = "md",
  showName = false,
  className,
  nameClassName,
}: ClickableAvatarProps) {
  // profile이 없으면 정적 아바타만 표시
  if (!profile?.id) {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <Avatar className={cn(sizeClasses[size], "border border-slate-100")}>
          <AvatarFallback className={cn("bg-slate-100 text-slate-500 font-semibold", fallbackTextSizes[size])}>
            {profile?.full_name?.[0] || "U"}
          </AvatarFallback>
        </Avatar>
        {showName && (
          <span className={cn("font-semibold text-slate-900 text-sm", nameClassName)}>
            {profile?.full_name || "익명"}
          </span>
        )}
      </div>
    )
  }

  return (
    <ProfilePopover profile={profile} badges={badges}>
      <button
        className={cn("flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity", className)}
        type="button"
      >
        <Avatar className={cn(sizeClasses[size], "border border-slate-100")}>
          <AvatarImage src={profile.avatar_url || undefined} />
          <AvatarFallback className={cn("bg-slate-100 text-slate-500 font-semibold", fallbackTextSizes[size])}>
            {profile.full_name?.[0] || "U"}
          </AvatarFallback>
        </Avatar>
        {showName && (
          <span className={cn("font-semibold text-slate-900 text-sm hover:underline", nameClassName)}>
            {profile.full_name || "익명"}
          </span>
        )}
      </button>
    </ProfilePopover>
  )
}
