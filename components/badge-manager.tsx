"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { toggleBadgeVisibility } from "@/lib/actions/badges"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

type Badge = {
  id: string
  name: string
  icon: string
  category: string
  description: string | null
}

type UserBadge = {
  id: string
  badge_id: string
  is_visible: boolean
  badges: Badge
}

type BadgeManagerProps = {
  userId: string
}

export function BadgeManager({ userId }: BadgeManagerProps) {
  const [userBadges, setUserBadges] = useState<UserBadge[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const loadBadges = async () => {
      const { data } = await supabase
        .from("user_badges")
        .select(`
          id,
          badge_id,
          is_visible,
          badges:badge_id (
            id,
            name,
            icon,
            category,
            description
          )
        `)
        .eq("user_id", userId)
        .order("created_at", { ascending: false })

      if (data) {
        setUserBadges(data as any)
      }
      setLoading(false)
    }

    loadBadges()
  }, [userId, supabase])

  const handleToggleVisibility = async (badgeId: string, currentVisibility: boolean) => {
    try {
      await toggleBadgeVisibility(badgeId, !currentVisibility)
      
      // Update local state
      setUserBadges((prev) =>
        prev.map((ub) =>
          ub.badge_id === badgeId ? { ...ub, is_visible: !currentVisibility } : ub
        )
      )
    } catch (error) {
      console.error("Failed to toggle badge visibility:", error)
      alert("뱃지 노출 설정 변경에 실패했습니다.")
    }
  }

  if (loading) {
    return <div className="text-sm text-slate-500">로딩 중...</div>
  }

  if (userBadges.length === 0) {
    return (
      <div className="text-center py-8 text-slate-500">
        <p className="text-sm">보유한 뱃지가 없습니다.</p>
        <p className="text-xs mt-2 text-slate-400">관리자 검증을 통해 뱃지를 부여받을 수 있습니다.</p>
      </div>
    )
  }

  // 카테고리별로 그룹화
  const groupedBadges = userBadges.reduce((acc, ub) => {
    const category = ub.badges.category
    if (!acc[category]) {
      acc[category] = []
    }
    acc[category].push(ub)
    return acc
  }, {} as Record<string, UserBadge[]>)

  const categoryLabels: Record<string, string> = {
    asset: "자산",
    revenue: "매출",
    influence: "인플루언서",
    achievement: "특별 이력",
    community: "커뮤니티",
  }

  return (
    <div className="space-y-6">
      {Object.entries(groupedBadges).map(([category, badges]) => (
        <div key={category}>
          <h4 className="mb-3 text-sm font-semibold text-slate-700 uppercase tracking-wide">
            {categoryLabels[category] || category}
          </h4>
          <div className="space-y-3">
            {badges.map((userBadge) => {
              const badge = userBadge.badges
              return (
                <Card key={userBadge.id} className="border-slate-200">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{badge.icon}</span>
                        <div>
                          <div className="font-semibold text-slate-900">{badge.name}</div>
                          {badge.description && (
                            <div className="text-xs text-slate-600 mt-0.5">{badge.description}</div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex flex-col items-end gap-1">
                          <Label htmlFor={`badge-${userBadge.id}`} className="text-xs text-slate-600 cursor-pointer">
                            {userBadge.is_visible ? "노출 중" : "숨김"}
                          </Label>
                          <Switch
                            id={`badge-${userBadge.id}`}
                            checked={userBadge.is_visible}
                            onCheckedChange={() => handleToggleVisibility(userBadge.badge_id, userBadge.is_visible)}
                          />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      ))}
      <div className="mt-4 p-3 rounded-lg bg-blue-50 border border-blue-200">
        <p className="text-xs text-blue-700">
          💡 노출된 뱃지는 게시글 작성자 이름 옆에 표시됩니다.
        </p>
      </div>
    </div>
  )
}

