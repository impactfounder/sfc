"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Linkedin, Instagram, Link as LinkIcon, Building2, MapPin, User, Globe } from "lucide-react"
import Link from "next/link"

export type MemberProfile = {
  id: string
  full_name: string
  avatar_url: string | null
  company: string | null
  position: string | null
  company_2: string | null
  position_2: string | null
  introduction: string | null
  roles: string[]
  role: string | null
  linkedin_url?: string | null
  instagram_url?: string | null
  threads_url?: string | null
  website_url?: string | null
  badges: Array<{
    icon: string
    name: string
  }>
}

interface MemberDetailModalProps {
  member: MemberProfile | null
  isOpen: boolean
  onClose: () => void
}

export function MemberDetailModal({ member, isOpen, onClose }: MemberDetailModalProps) {
  if (!member) return null

  const hasSocialLinks = member.linkedin_url || member.instagram_url || member.threads_url || member.website_url

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md bg-white rounded-xl overflow-hidden p-0 gap-0">
        <div className="bg-slate-50 px-6 py-8 flex flex-col items-center text-center border-b border-slate-100">
          <Avatar className="h-24 w-24 mb-4 ring-4 ring-white shadow-sm bg-white">
            <AvatarImage 
              src={member.avatar_url || `https://api.dicebear.com/9.x/notionists/svg?seed=${member.full_name}`} 
              className="object-cover"
            />
            <AvatarFallback className="bg-blue-600 text-white text-2xl">
              {member.full_name?.[0] || "U"}
            </AvatarFallback>
          </Avatar>
          
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-slate-900 text-center">
              {member.full_name}
            </DialogTitle>
          </DialogHeader>
          
          {(member.company || member.position || member.company_2 || member.position_2) && (
            <div className="flex flex-col gap-1 mt-2 items-center w-full">
              {(member.company || member.position) && (
                <div className="flex items-center gap-2 text-slate-600 text-sm font-medium justify-center">
                  {member.company && <span>{member.company}</span>}
                  {member.company && member.position && <span className="text-slate-300">|</span>}
                  {member.position && <span>{member.position}</span>}
                </div>
              )}
              {(member.company_2 || member.position_2) && (
                <div className="flex items-center gap-2 text-slate-600 text-sm font-medium justify-center">
                  {member.company_2 && <span>{member.company_2}</span>}
                  {member.company_2 && member.position_2 && <span className="text-slate-300">|</span>}
                  {member.position_2 && <span>{member.position_2}</span>}
                </div>
              )}
            </div>
          )}

          {member.roles && member.roles.length > 0 && (
            <div className="flex flex-wrap gap-1.5 justify-center mt-4">
              {member.roles.map((role) => (
                <Badge key={role} variant="secondary" className="bg-white border-slate-200 text-slate-700 font-normal">
                  {role}
                </Badge>
              ))}
            </div>
          )}
        </div>

        <div className="p-6 space-y-6">
          {/* Badges Section */}
          {member.badges.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                <span className="w-1 h-4 bg-indigo-500 rounded-full"></span>
                보유 뱃지
              </h4>
              <div className="flex flex-wrap gap-2">
                {member.badges.map((badge, idx) => (
                  <div key={idx} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-indigo-50 text-indigo-700 text-xs font-medium border border-indigo-100">
                    <span>{badge.icon}</span>
                    <span>{badge.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Introduction Section */}
          {member.introduction && (
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                <span className="w-1 h-4 bg-slate-500 rounded-full"></span>
                소개
              </h4>
              <p className="text-sm text-slate-600 whitespace-pre-wrap leading-relaxed bg-slate-50 p-4 rounded-lg border border-slate-100">
                {member.introduction}
              </p>
            </div>
          )}

          {/* Social Links Section */}
          {hasSocialLinks && (
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                <span className="w-1 h-4 bg-blue-500 rounded-full"></span>
                소셜 링크
              </h4>
              <div className="flex flex-wrap gap-3">
                {member.linkedin_url && (
                  <Link href={member.linkedin_url} target="_blank" className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#0077b5]/10 text-[#0077b5] hover:bg-[#0077b5]/20 transition-colors text-sm font-medium">
                    <Linkedin className="h-4 w-4" />
                    LinkedIn
                  </Link>
                )}
                {member.instagram_url && (
                  <Link href={member.instagram_url} target="_blank" className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#E1306C]/10 text-[#E1306C] hover:bg-[#E1306C]/20 transition-colors text-sm font-medium">
                    <Instagram className="h-4 w-4" />
                    Instagram
                  </Link>
                )}
                {member.threads_url && (
                  <Link href={member.threads_url} target="_blank" className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-100 text-slate-900 hover:bg-slate-200 transition-colors text-sm font-medium">
                    <LinkIcon className="h-4 w-4" />
                    Threads
                  </Link>
                )}
                {member.website_url && (
                  <Link href={member.website_url} target="_blank" className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors text-sm font-medium">
                    <Globe className="h-4 w-4" />
                    웹사이트
                  </Link>
                )}
              </div>
            </div>
          )}
        </div>
        
        <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex justify-end">
          <Button onClick={onClose} variant="outline">닫기</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

