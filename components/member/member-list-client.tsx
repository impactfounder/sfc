"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { MemberDetailModal, MemberProfile } from "./member-detail-modal"

interface MemberListClientProps {
  members: MemberProfile[]
  currentUserRole: string | null
}

export function MemberListClient({ members, currentUserRole }: MemberListClientProps) {
  const [selectedMember, setSelectedMember] = useState<MemberProfile | null>(null)

  return (
    <>
      {members.length > 0 ? (
        // 4 columns layout: grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {members.map((member) => (
            <div 
              key={member.id} 
              onClick={() => setSelectedMember(member)}
              className="cursor-pointer h-full"
            >
              <Card className="border-slate-200 bg-white hover:shadow-md transition-all duration-200 hover:-translate-y-1 h-full group overflow-hidden flex flex-col">
                {/* Compact padding and gap */}
                <CardContent className="py-2 px-5 flex flex-col gap-2.5 h-full flex-1 min-h-0">
                  {/* [Top] 프로필 이미지 & 이름 */}
                  <div className="flex flex-col items-center gap-1 shrink-0">
                    <Avatar className="h-16 w-16 rounded-full group-hover:ring-4 group-hover:ring-indigo-50 transition-all bg-slate-50">
                      <AvatarImage 
                        src={member.avatar_url || `https://api.dicebear.com/9.x/notionists/svg?seed=${member.full_name}`} 
                        className="object-cover"
                      />
                      <AvatarFallback className="bg-slate-100 text-slate-500 text-xl font-medium rounded-full">
                        {member.full_name?.[0] || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <h3 className="font-bold text-slate-900 text-base truncate px-1 w-full text-center">
                      {member.full_name || "익명"}
                    </h3>
                  </div>
                  
                  {/* [Middle] 정보 영역 - flex-1로 공간 차지 */}
                  <div className="flex-1 min-h-0 flex flex-col gap-1.5 w-full">
                    
                    {/* 최상단 고정: 소속 & 직책 */}
                    <div className="flex flex-col gap-1 shrink-0">
                      {/* 소속 정보 - 항상 같은 위치에서 시작 */}
                      <div className="text-sm text-slate-500 flex flex-col gap-0.5 min-h-[2rem]">
                        {(member.company || member.position) && (
                          <p className="truncate">
                            <span className="font-medium text-slate-700">{member.company}</span>
                            {member.company && member.position && <span className="mx-1 text-slate-300">|</span>}
                            <span>{member.position}</span>
                          </p>
                        )}
                        {(member.company_2 || member.position_2) && (
                          <p className="truncate">
                            <span className="font-medium text-slate-700">{member.company_2}</span>
                            {member.company_2 && member.position_2 && <span className="mx-1 text-slate-300">|</span>}
                            <span>{member.position_2}</span>
                          </p>
                        )}
                        {/* 소속 정보가 없어도 공간 유지 */}
                        {!(member.company || member.position || member.company_2 || member.position_2) && (
                          <div className="h-6" />
                        )}
                      </div>

                      {/* 역할 (Badge) */}
                      {member.roles && member.roles.length > 0 && (
                        <div className="flex flex-wrap gap-1 justify-center">
                          {member.roles.slice(0, 2).map((role) => (
                            <Badge key={role} variant="secondary" className="text-[10px] px-1.5 py-0 h-4 bg-slate-100 text-slate-600 font-normal">
                              {role}
                            </Badge>
                          ))}
                          {member.roles.length > 2 && (
                            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 bg-slate-100 text-slate-600 font-normal">
                              +{member.roles.length - 2}
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>

                    {/* 소개글 - 남은 공간 차지 */}
                    {member.introduction ? (
                      <p className="text-xs text-slate-600 line-clamp-3 leading-snug w-full break-keep whitespace-pre-line flex-1">
                        {member.introduction}
                      </p>
                    ) : (
                      <div className="flex-1" />
                    )}
                  </div>

                  {/* 최하단 고정: 뱃지 - 항상 같은 위치에서 시작 */}
                  {member.badges.length > 0 && (
                    <div className="shrink-0 pt-1 border-t border-slate-100">
                      <div className="flex flex-wrap gap-1.5 justify-center">
                        {member.badges.slice(0, 3).map((badge, idx) => (
                          <div 
                            key={idx} 
                            className="flex items-center gap-1 px-2 py-1 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-100 flex-shrink-0"
                            title={badge.name}
                          >
                            <span className="text-xs">{badge.icon}</span>
                            <span className="text-[10px] font-medium max-w-[60px] truncate">
                              {badge.name}
                            </span>
                          </div>
                        ))}
                        {member.badges.length > 3 && (
                          <div className="flex items-center justify-center px-2 py-1 rounded-md bg-slate-50 text-slate-500 border border-slate-100 text-[10px] font-medium">
                            +{member.badges.length - 3}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      ) : (
        <div className="py-12 text-center text-slate-500">
          <p>공개된 멤버가 없습니다</p>
        </div>
      )}

      <MemberDetailModal 
        member={selectedMember} 
        isOpen={!!selectedMember} 
        onClose={() => setSelectedMember(null)} 
        currentUserRole={currentUserRole}
      />
    </>
  )
}
