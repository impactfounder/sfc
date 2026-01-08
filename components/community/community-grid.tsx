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
    const getMembershipButton = (community: Community) => {
        if (!community.isMember) {
            return (
                <Button
                    variant="outline"
                    size="sm"
                    className="rounded-full px-4 h-8 text-xs font-semibold border-slate-300 text-slate-700 hover:border-slate-800 hover:bg-slate-50 hover:text-slate-900 transition-colors shrink-0 ml-4 z-10 relative active:scale-95"
                    onClick={(e) => {
                        e.preventDefault()
                        // 가입 로직
                    }}
                >
                    가입
                </Button>
            )
        }

        // 이미 가입한 경우
        if (community.role === "owner") {
            return (
                <span className="inline-flex items-center gap-1 px-3 h-8 text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 rounded-full shrink-0 ml-4">
                    <Crown className="h-3 w-3" />
                    리더
                </span>
            )
        }

        if (community.role === "admin") {
            return (
                <span className="inline-flex items-center gap-1 px-3 h-8 text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200 rounded-full shrink-0 ml-4">
                    <Shield className="h-3 w-3" />
                    운영진
                </span>
            )
        }

        return (
            <span className="inline-flex items-center gap-1 px-3 h-8 text-xs font-semibold text-green-700 bg-green-50 border border-green-200 rounded-full shrink-0 ml-4">
                <Check className="h-3 w-3" />
                참여중
            </span>
        )
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {communities.map((community) => (
                <Link key={community.id} href={`/community/board/${community.slug}`} className="group block h-full">
                    <Card className="hover:border-slate-400 transition-all duration-200 border-slate-200 bg-white overflow-hidden group-hover:shadow-md h-full">
                        <CardContent className="p-6 flex items-start gap-4">
                            {/* Icon / Thumbnail Placeholder */}
                            <div className="shrink-0">
                                <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200 group-hover:bg-slate-200 transition-colors">
                                    <span className="text-lg font-bold text-slate-700">
                                        {community.name.slice(0, 1)}
                                    </span>
                                </div>
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0 pt-1">
                                <div className="flex items-center justify-between mb-1">
                                    <h3 className="text-lg font-bold text-slate-900 truncate group-hover:text-slate-700 transition-colors">
                                        {community.name}
                                    </h3>
                                    {getMembershipButton(community)}
                                </div>

                                <p className="text-sm text-slate-600 line-clamp-3 leading-relaxed">
                                    {community.description || "함께 소통하고 성장하는 커뮤니티입니다."}
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </Link>
            ))}
        </div>
    )
}
