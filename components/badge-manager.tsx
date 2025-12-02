"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { toggleBadgeVisibility, grantBadge } from "@/lib/actions/badges"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"

type Badge = {
  id: string
  name: string
  icon: string
  category: string
  description: string | null
  is_active?: boolean
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
  const [allBadges, setAllBadges] = useState<Badge[]>([])
  const [selectedBadgeId, setSelectedBadgeId] = useState<string>("")
  const [loading, setLoading] = useState(true)
  const [addingBadge, setAddingBadge] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    const loadBadges = async () => {
      // Load user badges
      const { data: userBadgesData } = await supabase
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
            description,
            is_active
          )
        `)
        .eq("user_id", userId)
        .order("created_at", { ascending: false })

      if (userBadgesData) {
        // Filter active badges
        const activeBadges = userBadgesData.filter((ub: any) => 
          ub.badges.is_active !== false
        )
        setUserBadges(activeBadges as any)
      }

      // Load all available badges (활성화된 뱃지만)
      const { data: allBadgesData } = await supabase
        .from("badges")
        .select("id, name, icon, category, description")
        .or("is_active.eq.true,is_active.is.null") // 활성화된 뱃지만 조회 (true 또는 null)
        .order("category", { ascending: true })
        .order("name", { ascending: true })

      if (allBadgesData) {
        setAllBadges(allBadgesData as Badge[])
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

  const handleAddBadge = async () => {
    if (!selectedBadgeId) {
      alert("뱃지를 선택해주세요.")
      return
    }

    // Check if badge already exists
    const existingBadge = userBadges.find((ub) => ub.badge_id === selectedBadgeId)
    if (existingBadge) {
      alert("이미 부여된 뱃지입니다.")
      return
    }

    setAddingBadge(true)
    try {
      await grantBadge(userId, selectedBadgeId)
      
      // Reload badges
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
            description,
            is_active
          )
        `)
        .eq("user_id", userId)
        .order("created_at", { ascending: false })

      if (data) {
        const activeData = data.filter((ub: any) => ub.badges.is_active !== false)
        setUserBadges(activeData as any)
      }
      
      setSelectedBadgeId("")
      alert("뱃지가 추가되었습니다.")
    } catch (error: any) {
      console.error("Failed to add badge:", error)
      alert(error.message || "뱃지 추가에 실패했습니다.")
    } finally {
      setAddingBadge(false)
    }
  }

  // Get badges that user doesn't have yet
  const availableBadges = allBadges.filter(
    (badge) => !userBadges.some((ub) => ub.badge_id === badge.id)
  )

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
    <div className="space-y-6 bg-white">
      {/* 뱃지 추가 섹션 */}
      <div className="mb-6 p-4 border border-slate-200 rounded-lg bg-slate-50">
        <h3 className="text-sm font-semibold text-slate-900 mb-3">뱃지 추가</h3>
        <div className="flex gap-2">
          <Select value={selectedBadgeId} onValueChange={setSelectedBadgeId}>
            <SelectTrigger className="flex-1">
              <SelectValue placeholder="뱃지를 선택하세요" />
            </SelectTrigger>
            <SelectContent className="z-[9999]">
              {availableBadges.length > 0 ? (
                availableBadges.map((badge) => (
                  <SelectItem key={badge.id} value={badge.id}>
                    <div className="flex items-center gap-2">
                      <span>{badge.icon}</span>
                      <span>{badge.name}</span>
                    </div>
                  </SelectItem>
                ))
              ) : (
                <SelectItem value="" disabled>
                  추가할 수 있는 뱃지가 없습니다
                </SelectItem>
              )}
            </SelectContent>
          </Select>
          <Button 
            onClick={handleAddBadge} 
            disabled={!selectedBadgeId || addingBadge}
            size="default"
            className="shrink-0"
          >
            {addingBadge ? "추가 중..." : <><Plus className="h-4 w-4 mr-1" />추가</>}
          </Button>
        </div>
      </div>

      {/* 기존 뱃지 목록 */}
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

