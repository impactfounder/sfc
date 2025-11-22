"use client"

import { cn } from "@/lib/utils"

type Badge = {
  icon: string
  name: string
}

type UserBadgesProps = {
  badges?: Badge[]
  className?: string
}

export function UserBadges({ badges, className }: UserBadgesProps) {
  if (!badges || badges.length === 0) {
    return null
  }

  return (
    <div className={cn("flex items-center gap-1.5", className)}>
      {badges.map((badge, index) => (
        <span
          key={index}
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-xs font-medium border border-slate-200"
          title={badge.name}
        >
          <span className="text-sm">{badge.icon}</span>
        </span>
      ))}
    </div>
  )
}

