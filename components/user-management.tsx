"use client"

import { useState } from "react"
import { Shield, Crown, Medal } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { TableRow, TableCell } from "@/components/ui/table"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
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

export function UserManagementRow({
  user,
  currentUserId,
  canChangeRole = false,
}: {
  user: UserProfile
  currentUserId: string
  canChangeRole?: boolean
}) {
  const [role, setRole] = useState(user.role || "member")
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
        <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
          <Crown className="h-3 w-3" />
          MASTER
        </span>
      )
    }
    if (role === "admin") {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
          <Shield className="h-3 w-3" />
          관리자
        </span>
      )
    }
    return <span className="text-sm text-slate-600">일반 회원</span>
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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, "0")
    const day = String(date.getDate()).padStart(2, "0")
    return `${year}. ${month}. ${day}.`
  }

  const formatPoints = (points: number | null) => {
    const value = points || 0
    return value.toLocaleString() + " P"
  }

  const isCurrentUser = user.id === currentUserId

  return (
    <>
      <TableRow>
        {/* 이름 */}
        <TableCell className="py-4">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarFallback className="bg-slate-200 text-slate-700">
                {user.full_name?.[0]?.toUpperCase() || "U"}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="font-medium text-slate-900">{user.full_name || "익명"}</div>
            </div>
          </div>
        </TableCell>

        {/* 이메일 */}
        <TableCell className="py-4">
          <div className="text-sm text-slate-600">{user.email || "-"}</div>
        </TableCell>

        {/* 포인트 */}
        <TableCell className="py-4">
          <div className="font-medium text-slate-900">{formatPoints(user.points)}</div>
        </TableCell>

        {/* 등급 */}
        <TableCell className="py-4">
          <div className="flex flex-col gap-1">
            {getRoleBadge()}
            {getMembershipBadge()}
          </div>
        </TableCell>

        {/* 가입일 */}
        <TableCell className="py-4">
          <div className="text-sm text-slate-600">{formatDate(user.created_at)}</div>
        </TableCell>

        {/* 관리 */}
        <TableCell className="text-right py-4">
          {!isCurrentUser ? (
            <div className="flex items-center justify-end gap-2">
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
                <Select value={role} onValueChange={handleRoleChange} disabled={isUpdating}>
                  <SelectTrigger className="w-32 h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="z-50">
                    <SelectItem value="member">일반 회원</SelectItem>
                    <SelectItem value="admin">관리자</SelectItem>
                    <SelectItem value="master">MASTER</SelectItem>
                  </SelectContent>
                </Select>
              )}

              <Select value={membershipTier} onValueChange={handleMembershipChange} disabled={isUpdating}>
                <SelectTrigger className="w-28 h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="z-50">
                  <SelectItem value="basic">Basic</SelectItem>
                  <SelectItem value="plus">Plus</SelectItem>
                  <SelectItem value="pro">Pro</SelectItem>
                  <SelectItem value="master">Master</SelectItem>
                </SelectContent>
              </Select>
            </div>
          ) : (
            <span className="text-sm text-slate-400">본인</span>
          )}
        </TableCell>
      </TableRow>

      {/* 뱃지 관리 모달 */}
      <Dialog open={showBadgeManager} onOpenChange={setShowBadgeManager}>
        <DialogContent className="sm:max-w-lg bg-white rounded-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Medal className="h-5 w-5" />
              뱃지 관리 및 등록
            </DialogTitle>
          </DialogHeader>
          <div className="mt-6 max-h-[80vh] overflow-y-auto">
            <BadgeManager userId={user.id} />
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
