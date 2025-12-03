"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Building2, MapPin, User } from "lucide-react"

export type MemberProfile = {
  id: string
  full_name: string
  avatar_url: string | null
  company: string | null
  position: string | null
  company_2: string | null
  position_2: string | null
  tagline: string | null
  introduction: string | null
  member_type: ("사업가" | "투자자" | "크리에이터")[] | null
  roles: string[]
  role: string | null
  badges: Array<{
    icon: string
    name: string
    description?: string | null
  }>
}

interface MemberDetailModalProps {
  member: MemberProfile | null
  isOpen: boolean
  onClose: () => void
  currentUserRole?: string | null
}

export function MemberDetailModal({ member, isOpen, onClose, currentUserRole }: MemberDetailModalProps) {
  if (!member) return null

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
          {/* Tagline Section (한마디) */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
              <span className="w-1 h-4 bg-indigo-500 rounded-full"></span>
              나를 표현하는 한마디
            </h4>
            <p className="text-sm text-slate-600 whitespace-pre-wrap leading-relaxed bg-slate-50 p-4 rounded-lg border border-slate-100 min-h-[60px]">
              {member.tagline || <span className="text-slate-400">한마디가 없습니다</span>}
            </p>
          </div>

          {/* Introduction Section (소개) */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
              <span className="w-1 h-4 bg-slate-500 rounded-full"></span>
              소개
            </h4>
            <p className="text-sm text-slate-600 whitespace-pre-wrap leading-relaxed bg-slate-50 p-4 rounded-lg border border-slate-100 min-h-[60px]">
              {member.introduction || <span className="text-slate-400">소개가 없습니다</span>}
            </p>
          </div>

          {/* Badges Section (보유 뱃지) */}
          {member.badges.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                <span className="w-1 h-4 bg-indigo-500 rounded-full"></span>
                보유 뱃지
              </h4>
              <div className="space-y-2">
                {member.badges.map((badge, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-3 px-3 py-2 rounded-lg bg-slate-50 border border-slate-200"
                  >
                    <div className="h-8 w-8 flex items-center justify-center rounded-full bg-slate-100 text-slate-700 text-xs shrink-0 border border-slate-200">
                      <span>{badge.icon}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-slate-900">
                        {badge.name}
                      </p>
                      {badge.description && (
                        <p className="mt-0.5 text-[11px] text-slate-600 leading-snug whitespace-pre-line">
                          {badge.description}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
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
