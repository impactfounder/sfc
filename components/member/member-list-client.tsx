"use client"

import { useState, useMemo } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MemberDetailModal, MemberProfile } from "./member-detail-modal"
import { cn } from "@/lib/utils"

interface MemberListClientProps {
  members: MemberProfile[]
  currentUserRole: string | null
}

function getShortBadgeLabel(name: string): string {
  // "커뮤니티 리더" -> "리더"로 단축
  if (name === "커뮤니티 리더") {
    return "리더"
  }

  // 예: "매출 10억+" -> "10억+" 만 표시
  if (/\+$/.test(name) && name.includes(" ")) {
    const parts = name.split(" ")
    return parts[parts.length - 1]
  }
  return name
}

export function MemberListClient({ members, currentUserRole }: MemberListClientProps) {
  const [selectedMember, setSelectedMember] = useState<MemberProfile | null>(null)
  const [selectedFilter, setSelectedFilter] = useState<"전체" | "사업가" | "투자자" | "크리에이터">("전체")

  const filteredMembers = useMemo(() => {
    if (selectedFilter === "전체") {
      return members
    }
    return members.filter((member) =>
      member.member_type && Array.isArray(member.member_type) && member.member_type.includes(selectedFilter)
    )
  }, [members, selectedFilter])

  return (
    <>
      {/* 필터 버튼 */}
      <div className="mb-6 flex gap-2">
        {(["전체", "사업가", "투자자", "크리에이터"] as const).map((filter) => (
          <Button
            key={filter}
            variant={selectedFilter === filter ? "default" : "outline"}
            onClick={() => setSelectedFilter(filter)}
            className={cn(
              "h-9 px-4 text-sm rounded-full",
              selectedFilter === filter
                ? "bg-slate-900 hover:bg-slate-800 text-white"
                : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
            )}
          >
            {filter}
          </Button>
        ))}
      </div>

      {filteredMembers.length > 0 ? (
        // 한 줄에 최대 3개 카드 (데스크탑 기준)
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredMembers.map((member) => (
            <div
              key={member.id}
              onClick={() => setSelectedMember(member)}
              className="cursor-pointer h-full"
            >
              <Card className="border-slate-200 bg-white hover:shadow-md transition-all duration-200 hover:-translate-y-1 h-full group overflow-hidden flex flex-col">
                <CardContent className="p-0 flex flex-col h-full">
                  {/* 상단 영역 */}
                  <div className="pt-3 px-4 pb-2 flex flex-col gap-2 flex-1">
                    <div className="flex items-center gap-3 ml-2">
                      <Avatar className="h-12 w-12 rounded-full group-hover:ring-4 group-hover:ring-indigo-50 transition-all bg-slate-50 flex-shrink-0 border border-slate-100 shadow-sm">
                        <AvatarImage
                          src={member.avatar_url || `https://api.dicebear.com/9.x/notionists/svg?seed=${member.full_name}`}
                          className="object-cover"
                        />
                        <AvatarFallback className="bg-slate-100 text-slate-500 text-lg font-medium rounded-full">
                          {member.full_name?.[0] || "U"}
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex-1 min-w-0 flex flex-col gap-1">
                        <h3 className="font-bold text-slate-900 text-base truncate">
                          {member.full_name || "익명"}
                        </h3>

                        {/* 소속 / 직책 */}
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

                        {/* 역할 (Role 태그) */}
                        {member.roles && member.roles.length > 0 && (
                          <div className="flex flex-wrap gap-1">
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
                    </div>

                    {/* 소개글 영역 고정 */}
                    <div className="w-full mt-1 h-9 flex items-center justify-center text-center px-1">
                      <p className="text-xs text-slate-600 leading-snug break-keep whitespace-pre-line line-clamp-2 w-full">
                        {member.tagline || "\u00A0"}
                      </p>
                    </div>
                  </div>

                  {/* 하단 배지 영역 (Footer) */}
                  <div className="w-full h-[72px] shrink-0 flex flex-col justify-center">
                    {member.badges.length > 0 ? (
                      <div className="flex w-full items-center justify-between gap-1 px-3">
                        {member.badges.slice(0, 3).map((badge, idx) => {
                          const shortLabel = getShortBadgeLabel(badge.name)
                          return (
                            <div
                              key={`${badge.name}-${idx}`}
                              className="flex-1 basis-1/3 min-w-0 flex flex-col items-center justify-center gap-1"
                            >
                              {/* 원형 아이콘 */}
                              <div className="h-10 w-10 flex items-center justify-center rounded-full bg-slate-50 border border-slate-200 text-slate-700 shrink-0">
                                <span className="text-xl">{badge.icon}</span>
                              </div>
                              {/* 하단 텍스트 */}
                              <span className="text-xs text-slate-600 font-medium text-center leading-tight break-keep line-clamp-1">
                                {shortLabel}
                              </span>
                            </div>
                          )
                        })}
                      </div>
                    ) : (
                      /* 배지가 없을 때도 빈 박스를 둬서 디자인 통일성 유지 */
                      <div className="h-full w-full" />
                    )}
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
        currentUserRole={currentUserRole}
      />
    </>
  )
}
