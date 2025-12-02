"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"

type MemberCardProps = {
  name: string
  role?: string
  bio?: string
  imageUrl?: string
  className?: string
}

export function MemberCard({
  name,
  role,
  bio,
  imageUrl,
  className,
}: MemberCardProps) {
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)

  return (
    <div
      className={cn(
        "bg-white rounded-2xl shadow-sm p-6 flex flex-col items-center text-center",
        "transition-all duration-300 hover:-translate-y-1 hover:shadow-md",
        className
      )}
    >
      {/* 프로필 이미지 */}
      <Avatar className="w-24 h-24 mb-4 border-2 border-slate-100">
        <AvatarImage src={imageUrl} alt={name} className="object-cover" />
        <AvatarFallback className="bg-slate-100 text-slate-600 text-2xl font-bold">
          {initials}
        </AvatarFallback>
      </Avatar>

      {/* 텍스트 정보 */}
      <div className="flex flex-col gap-1.5 mb-4 w-full">
        <h3 className="text-xl font-bold text-slate-900">{name}</h3>
        {role && (
          <p className="text-sm text-slate-500 font-medium">{role}</p>
        )}
        {bio && (
          <p className="text-sm text-slate-600 line-clamp-2 leading-relaxed mt-1">
            {bio}
          </p>
        )}
      </div>
    </div>
  )
}

