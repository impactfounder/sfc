"use client"

import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Check, Crown, Shield } from "lucide-react"

interface Community {
    id: string
    name: string
    description: string | null
    slug: string
    communityId?: string
    isMember?: boolean
    role?: string | null
}

interface CommunityGridProps {
    communities: Community[]
}

export function CommunityGrid({ communities }: CommunityGridProps) {
    const getMembershipBadge = (community: Community) => {
        if (!community.isMember) {
            return (
                <span className="inline-flex items-center px-2 py-0.5 text-[11px] font-medium text-slate-500 bg-slate-100 rounded">
                    가입하기
                </span>
            )
        }

        if (community.role === "owner") {
            return (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium text-amber-700 bg-amber-50 rounded">
                    <Crown className="h-3 w-3" />
                    리더
                </span>
            )
        }

        if (community.role === "admin") {
            return (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium text-blue-700 bg-blue-50 rounded">
                    <Shield className="h-3 w-3" />
                    운영진
                </span>
            )
        }

        return (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium text-green-700 bg-green-50 rounded">
                <Check className="h-3 w-3" />
                참여중
            </span>
        )
    }

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {communities.map((community) => (
                <Link key={community.id} href={`/community/board/${community.slug}`} className="group block">
                    <div className="flex gap-3 p-4 rounded-xl border border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm transition-all h-full min-h-[120px]">
                        {/* 아이콘 */}
                        <div className="shrink-0">
                            <div className="w-11 h-11 rounded-lg bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center group-hover:from-slate-200 group-hover:to-slate-300 transition-colors">
                                <span className="text-base font-bold text-slate-600">
                                    {community.name.slice(0, 1)}
                                </span>
                            </div>
                        </div>

                        {/* 콘텐츠 */}
                        <div className="flex-1 min-w-0 flex flex-col">
                            <div className="flex items-center justify-between gap-2 mb-1">
                                <h3 className="text-sm font-semibold text-slate-900 truncate">
                                    {community.name}
                                </h3>
                                <div className="shrink-0">
                                    {getMembershipBadge(community)}
                                </div>
                            </div>
                            <p className="text-xs text-slate-500 line-clamp-3 leading-relaxed flex-1">
                                {community.description || "함께 소통하고 성장하는 커뮤니티"}
                            </p>
                        </div>
                    </div>
                </Link>
            ))}
        </div>
    )
}
