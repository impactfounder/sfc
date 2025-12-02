"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { MemberDetailModal, MemberProfile } from "./member-detail-modal"

interface MemberListClientProps {
  members: MemberProfile[]
}

export function MemberListClient({ members }: MemberListClientProps) {
  const [selectedMember, setSelectedMember] = useState<MemberProfile | null>(null)

  return (
    <>
      {members.length > 0 ? (
        // 3 columns layout update: grid-cols-1 xl:grid-cols-2 -> lg:grid-cols-3
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {members.map((member) => (
            <div 
              key={member.id} 
              onClick={() => setSelectedMember(member)}
              className="cursor-pointer h-full"
            >
              <Card className="border-slate-200 bg-white hover:shadow-md transition-all duration-200 hover:-translate-y-1 h-full group overflow-hidden">
                {/* Compact padding and gap */}
                <CardContent className="py-3 px-5 flex flex-col sm:flex-row gap-5 items-start sm:items-center h-full">
                  {/* [Left] 프로필 이미지 & 이름 */}
                  <div className="flex flex-col items-center gap-2 shrink-0 mx-auto sm:mx-0 w-full sm:w-20">
                    {/* Reduced avatar size */}
                    <Avatar className="h-16 w-16 sm:h-20 sm:w-20 rounded-full group-hover:ring-4 group-hover:ring-indigo-50 transition-all bg-slate-50">
                      <AvatarImage 
                        src={member.avatar_url || `https://api.dicebear.com/9.x/notionists/svg?seed=${member.full_name}`} 
                        className="object-cover"
                      />
                      <AvatarFallback className="bg-slate-100 text-slate-500 text-xl font-medium rounded-full">
                        {member.full_name?.[0] || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="text-center w-full">
                      <h3 className="font-bold text-slate-900 text-base truncate px-1">
                        {member.full_name || "익명"}
                      </h3>
                    </div>
                  </div>
                  
                  {/* [Right] 정보 영역 */}
                  <div className="flex-1 min-w-0 flex flex-col gap-2 w-full text-center sm:text-left">
                    
                    {/* 상단: 소속 & 역할 */}
                    <div className="flex flex-col gap-1">
                      {/* 소속 정보 */}
                      <div className="text-sm text-slate-500 flex flex-col gap-0.5">
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
                      </div>

                      {/* 역할 (Badge) */}
                      {member.roles && member.roles.length > 0 && (
                        <div className="flex flex-wrap gap-1 justify-center sm:justify-start">
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

                    {/* 소개글 - 3줄까지 표시 */}
                    {member.introduction ? (
                      <p className="text-xs text-slate-600 line-clamp-3 leading-snug w-full break-keep whitespace-pre-line">
                        {member.introduction}
                      </p>
                    ) : (
                      <div className="w-full h-4" />
                    )}

                    {/* 하단: 뱃지 */}
                    <div className="mt-auto pt-1.5 flex items-center justify-center sm:justify-start">
                      {member.badges.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {member.badges.slice(0, 3).map((badge, idx) => (
                            <div 
                              key={idx} 
                              className="flex items-center gap-1 px-2 py-1 rounded bg-indigo-50 text-indigo-700 border border-indigo-100"
                              title={badge.name}
                            >
                              <span className="text-sm">{badge.icon}</span>
                              <span className="text-xs font-medium max-w-[100px] truncate">
                                {badge.name}
                              </span>
                            </div>
                          ))}
                          {member.badges.length > 3 && (
                            <div className="flex items-center justify-center px-2 py-1 rounded bg-slate-50 text-slate-500 border border-slate-100 text-xs font-medium">
                              +{member.badges.length - 3}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="h-6 text-xs text-slate-300">보유 뱃지 없음</div>
                      )}
                    </div>
                  </div>
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
      />
    </>
  )
}
