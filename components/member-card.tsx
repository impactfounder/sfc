"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Linkedin, Instagram, Link as LinkIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import Link from "next/link"

type SocialLinks = {
  linkedin?: string
  instagram?: string
  threads?: string
  website?: string
}

type MemberCardProps = {
  name: string
  role?: string
  bio?: string
  imageUrl?: string
  socialLinks?: SocialLinks
  className?: string
}

export function MemberCard({
  name,
  role,
  bio,
  imageUrl,
  socialLinks,
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

      {/* 하단 소셜 아이콘 */}
      {(socialLinks?.linkedin || socialLinks?.instagram || socialLinks?.threads || socialLinks?.website) && (
        <>
          <div className="w-full border-t border-slate-100 mt-auto pt-4">
            <div className="flex items-center justify-center gap-4">
              {socialLinks.linkedin && (
                <Link
                  href={socialLinks.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-slate-400 hover:text-blue-600 transition-colors duration-200"
                  aria-label={`${name}의 LinkedIn`}
                >
                  <Linkedin className="h-5 w-5" />
                </Link>
              )}
              {socialLinks.instagram && (
                <Link
                  href={socialLinks.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-slate-400 hover:text-pink-600 transition-colors duration-200"
                  aria-label={`${name}의 Instagram`}
                >
                  <Instagram className="h-5 w-5" />
                </Link>
              )}
              {socialLinks.threads && (
                <Link
                  href={socialLinks.threads}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-slate-400 hover:text-slate-900 transition-colors duration-200"
                  aria-label={`${name}의 Threads`}
                >
                  <LinkIcon className="h-5 w-5" />
                </Link>
              )}
              {socialLinks.website && (
                <Link
                  href={socialLinks.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-slate-400 hover:text-slate-900 transition-colors duration-200"
                  aria-label={`${name}의 웹사이트`}
                >
                  <LinkIcon className="h-5 w-5" />
                </Link>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

