"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Plus, X } from "lucide-react"
import { NewEventForm } from "@/components/new-event-form"
import { Sheet, SheetClose, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"

interface CreateEventButtonProps {
  userId?: string
  variant?: "default" | "outline" | "ghost"
  className?: string
  children?: React.ReactNode
}

export function CreateEventButton({ userId, variant = "default", className, children }: CreateEventButtonProps) {
  const [showCreateSheet, setShowCreateSheet] = useState(false)
  const router = useRouter()

  const handleClick = () => {
    // ★ 수정됨: 로그인이 안 되어 있으면 -> 로그인 페이지로 이동
    if (!userId) {
      router.push("/auth/login")
      return
    }
    // 로그인이 되어 있으면 -> 이벤트 생성 시트 열기
    setShowCreateSheet(true)
  }

  return (
    <>
      <Button 
        onClick={handleClick} 
        variant={variant} 
        className={className}
      >
        {children || (
          <>
            <Plus className="w-4 h-4 mr-2" />
            새 이벤트
          </>
        )}
      </Button>

      {/* 이벤트 생성 시트 (로그인 된 경우에만 뜸) */}
      <Sheet open={showCreateSheet} onOpenChange={setShowCreateSheet}>
        <SheetContent side="bottom" className="h-[95vh] p-0 rounded-t-2xl overflow-hidden" hideClose>
          <div className="flex h-full flex-col">
            <SheetHeader className="flex flex-row items-center justify-between border-b px-6 py-4 bg-white z-10">
              <SheetTitle className="text-xl font-bold">새 이벤트</SheetTitle>
              <SheetClose asChild>
                <Button variant="ghost" size="icon" className="rounded-full hover:bg-slate-100">
                  <X className="size-5" />
                </Button>
              </SheetClose>
            </SheetHeader>
            <div className="flex-1 overflow-y-auto bg-slate-50">
              <div className="max-w-5xl mx-auto p-6 md:p-8">
                <NewEventForm
                  userId={userId || ""}
                  onSuccess={() => {
                    setShowCreateSheet(false)
                    window.location.reload()
                  }}
                />
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}

