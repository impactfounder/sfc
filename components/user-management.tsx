"use client"

import { useState } from "react"
import { Mail, Calendar, Coins, Shield, Crown, Medal } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { BadgeManager } from "@/components/badge-manager"
import { updateUserRole, updateUserMembershipTier } from "@/lib/actions/admin"

type UserProfile = {
  id: string
  full_name: string | null
  email: string | null
  role: string | null
  membership_tier: string | null
  points: number | null
  created_at: string
}

export function UserManagement({
  user,
  currentUserId,
  canChangeRole = false,
}: {
  user: UserProfile
  currentUserId: string
  canChangeRole?: boolean
}) {
  const [role, setRole] = useState(user.role || "user")
  const [membershipTier, setMembershipTier] = useState(user.membership_tier || "basic")
  const [isUpdating, setIsUpdating] = useState(false)
  const [showBadgeManager, setShowBadgeManager] = useState(false)

  const handleRoleChange = async (newRole: string) => {
    setIsUpdating(true)
    try {
      await updateUserRole(user.id, newRole)
      setRole(newRole)
    } catch (error) {
      console.error("Failed to update role:", error)
    } finally {
      setIsUpdating(false)
    }
  }

  const handleMembershipChange = async (newTier: string) => {
    setIsUpdating(true)
    try {
      await updateUserMembershipTier(user.id, newTier)
      setMembershipTier(newTier)
    } catch (error) {
      console.error("Failed to update membership:", error)
    } finally {
      setIsUpdating(false)
    }
  }

  const getRoleBadge = () => {
    if (role === "master") {
      return (
        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700 flex items-center gap-1">
          <Crown className="h-3 w-3" />
          MASTER
        </span>
      )
    }
    if (role === "admin") {
      return (
        <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700 flex items-center gap-1">
          <Shield className="h-3 w-3" />
          관리자
        </span>
      )
    }
    return null
  }

  const getMembershipBadge = () => {
    const badges = {
      basic: { color: "bg-slate-100 text-slate-700", label: "Basic" },
      plus: { color: "bg-blue-100 text-blue-700", label: "Plus" },
      pro: { color: "bg-purple-100 text-purple-700", label: "Pro" },
      master: { color: "bg-amber-100 text-amber-700", label: "Master" },
    }

    const badge = badges[membershipTier as keyof typeof badges] || badges.basic

    return <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${badge.color}`}>{badge.label}</span>
  }

  const isCurrentUser = user.id === currentUserId

  return (
    <div className="flex items-center justify-between rounded-lg border border-slate-200 p-4 flex-wrap gap-4">
      <div className="flex items-center gap-4 flex-1 min-w-[300px]">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-200 text-lg font-medium text-slate-700">
          {user.full_name?.[0] || "U"}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <p className="font-medium text-slate-900">{user.full_name || "익명"}</p>
            {getRoleBadge()}
            {getMembershipBadge()}
          </div>
          <div className="flex items-center gap-4 text-sm text-slate-600 flex-wrap">
            <div className="flex items-center gap-1">
              <Mail className="h-3 w-3" />
              <span className="truncate">{user.email}</span>
            </div>
            <div className="flex items-center gap-1">
              <Coins className="h-3 w-3" />
              <span>{user.points || 0}P</span>
            </div>
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {new Date(user.created_at).toLocaleDateString("ko-KR")}
            </div>
          </div>
        </div>
      </div>

      {!isCurrentUser && (
        <div className="flex items-center gap-3 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowBadgeManager(true)}
            className="gap-2"
          >
            <Medal className="h-4 w-4" />
            뱃지 관리
          </Button>

          {canChangeRole && (
            <div className="flex flex-col gap-2">
              <label className="text-xs text-slate-600 font-medium">권한</label>
              <Select value={role} onValueChange={handleRoleChange} disabled={isUpdating}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="member">일반 회원</SelectItem>
                  <SelectItem value="admin">관리자</SelectItem>
                  <SelectItem value="master">MASTER</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="flex flex-col gap-2">
            <label className="text-xs text-slate-600 font-medium">등급</label>
            <Select value={membershipTier} onValueChange={handleMembershipChange} disabled={isUpdating}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="basic">Basic</SelectItem>
                <SelectItem value="plus">Plus</SelectItem>
                <SelectItem value="pro">Pro</SelectItem>
                <SelectItem value="master">Master</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      {/* 뱃지 관리 모달 */}
      <Sheet open={showBadgeManager} onOpenChange={setShowBadgeManager}>
        <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <Medal className="h-5 w-5" />
              뱃지 관리 및 등록
            </SheetTitle>
          </SheetHeader>
          <div className="mt-6">
            <BadgeManager userId={user.id} />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
