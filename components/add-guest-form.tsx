"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { UserPlus, Loader2 } from "lucide-react"
import { addGuestParticipant } from "@/lib/actions/events"

type AddGuestFormProps = {
  eventId: string
}

export function AddGuestForm({ eventId }: AddGuestFormProps) {
  const [guestName, setGuestName] = useState("")
  const [guestContact, setGuestContact] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (!guestName.trim()) {
      alert("이름을 입력해주세요.")
      return
    }

    setIsSubmitting(true)
    try {
      await addGuestParticipant(eventId, guestName.trim(), guestContact.trim() || undefined)
      setGuestName("")
      setGuestContact("")
      router.refresh()
      alert("참가자가 등록되었습니다.")
    } catch (error) {
      console.error("Failed to add guest participant:", error)
      alert(error instanceof Error ? error.message : "참가자 등록에 실패했습니다.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card className="border-slate-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserPlus className="h-5 w-5" />
          참가자 수동 등록
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="guest-name">이름 *</Label>
            <Input
              id="guest-name"
              type="text"
              placeholder="참가자 이름"
              value={guestName}
              onChange={(e) => setGuestName(e.target.value)}
              required
              disabled={isSubmitting}
              className="border-slate-300"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="guest-contact">연락처 (선택)</Label>
            <Input
              id="guest-contact"
              type="text"
              placeholder="연락처 (선택사항)"
              value={guestContact}
              onChange={(e) => setGuestContact(e.target.value)}
              disabled={isSubmitting}
              className="border-slate-300"
            />
          </div>
          <Button type="submit" disabled={isSubmitting} className="w-full bg-slate-900 hover:bg-slate-800">
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                등록 중...
              </>
            ) : (
              "등록하기"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

