"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { MobileHeader } from "@/components/mobile-header"
import { Sidebar } from "@/components/sidebar"
import { MobileSidebar } from "@/components/mobile-sidebar"
import { Button } from "@/components/ui/button"
import { MapPin, Users, ChevronLeft, Calendar } from "lucide-react"
import Image from "next/image"

export default function EventDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [event, setEvent] = useState<any>(null)
  const [isRegistered, setIsRegistered] = useState(false)
  const [registrationCount, setRegistrationCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    async function fetchEventDetails() {
      const { data: eventData } = await supabase
        .from("events")
        .select(`
          *,
          profiles(full_name),
          event_registrations(user_id)
        `)
        .eq("id", params.id)
        .single()

      if (eventData) {
        setEvent(eventData)
        setRegistrationCount(eventData.event_registrations?.length || 0)

        // 현재 사용자의 등록 상태 확인
        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (user) {
          const registered = eventData.event_registrations?.some((reg: any) => reg.user_id === user.id)
          setIsRegistered(registered || false)
        }
      }

      setLoading(false)
    }

    fetchEventDetails()
  }, [params.id])

  async function handleRegistration() {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      router.push("/login")
      return
    }

    if (isRegistered) {
      // 참가 취소
      await supabase.from("event_registrations").delete().eq("event_id", params.id).eq("user_id", user.id)
      setIsRegistered(false)
      setRegistrationCount((prev) => prev - 1)
    } else {
      // 참가 신청
      await supabase.from("event_registrations").insert({
        event_id: params.id,
        user_id: user.id,
      })
      setIsRegistered(true)
      setRegistrationCount((prev) => prev + 1)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-slate-600">로딩 중...</div>
      </div>
    )
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-slate-600">이벤트를 찾을 수 없습니다.</div>
      </div>
    )
  }

  const eventDate = new Date(event.event_date)
  const month = eventDate.getMonth() + 1
  const day = eventDate.getDate()
  const weekday = ["일", "월", "화", "수", "목", "금", "토"][eventDate.getDay()]
  const time = eventDate.toLocaleTimeString("ko-KR", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  })

  return (
    <div className="min-h-screen bg-slate-50">
      <MobileSidebar />
      <div className="hidden md:block fixed inset-y-0 left-0 z-50">
        <Sidebar />
      </div>

      <div className="md:ml-64">
        <MobileHeader />

        <div className="sticky top-16 md:top-0 z-40 bg-white border-b border-slate-200">
          <div className="max-w-6xl mx-auto px-6 lg:px-20 py-4 flex items-center gap-3">
            <button onClick={() => router.back()} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
              <ChevronLeft className="w-5 h-5 text-slate-700" />
            </button>
            <h1 className="text-sm font-medium text-slate-600">이벤트 상세</h1>
          </div>
        </div>

        <main className="pb-32 pt-8 md:pt-12">
          <div className="max-w-6xl mx-auto px-6 lg:px-20">
            <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
              <div className="lg:w-[360px] flex-shrink-0">
                {event.thumbnail_url ? (
                  <div className="relative w-full aspect-square rounded-2xl overflow-hidden shadow-lg">
                    <Image
                      src={event.thumbnail_url || "/placeholder.svg"}
                      alt={event.title}
                      fill
                      className="object-cover"
                    />
                  </div>
                ) : (
                  <div className="relative w-full aspect-square bg-gradient-to-br from-slate-700 to-slate-900 rounded-2xl flex items-center justify-center shadow-lg">
                    <span className="text-white text-8xl font-bold opacity-20">{event.title.charAt(0)}</span>
                  </div>
                )}
              </div>

              <div className="flex-1 flex flex-col justify-between" style={{ minHeight: "360px" }}>
                <div className="space-y-6">
                  <div className="mb-4">
                    <h1 className="text-3xl lg:text-4xl font-bold text-slate-900 leading-tight mb-2">{event.title}</h1>
                  </div>

                  <div>
                    <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">호스트</h3>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-sm font-bold">
                          {(event.profiles?.full_name || "SFC").charAt(0)}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-900">
                          {event.profiles?.full_name || "Seoul Founders Club"}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="flex items-center justify-center w-10 h-10 bg-slate-100 rounded-lg flex-shrink-0">
                      <Calendar className="w-5 h-5 text-slate-700" />
                    </div>
                    <div className="flex-1 pt-1.5">
                      <p className="text-sm text-slate-500">
                        {month}월 {day}일 {weekday}요일
                      </p>
                      <p className="text-base text-slate-900 font-medium">{time}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-6">
                    <div className="flex items-start gap-3 flex-1">
                      <div className="flex items-center justify-center w-10 h-10 bg-slate-100 rounded-lg flex-shrink-0">
                        <MapPin className="w-5 h-5 text-slate-700" />
                      </div>
                      <div className="flex-1 pt-1.5">
                        <p className="text-sm text-slate-500">장소</p>
                        <p className="text-base text-slate-900 font-medium">{event.location}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="flex items-center justify-center w-10 h-10 bg-slate-100 rounded-lg flex-shrink-0">
                        <Users className="w-5 h-5 text-slate-700" />
                      </div>
                      <div className="flex-1 pt-1.5">
                        <p className="text-sm text-slate-500">참여 인원</p>
                        <p className="text-base text-slate-900 font-medium whitespace-nowrap">
                          {registrationCount}명{event.max_participants && ` / ${event.max_participants}명`}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-6">
                  {/* 버튼을 더 작고 심단하며 세련되게 재디자인 */}
                  <Button
                    onClick={handleRegistration}
                    className={`w-full h-9 text-sm font-medium rounded-lg transition-all ${
                      isRegistered
                        ? "bg-slate-900 hover:bg-slate-800 text-white"
                        : "bg-slate-900 hover:bg-slate-800 text-white"
                    }`}
                  >
                    {isRegistered ? "참가 신청 완료" : "참가 신청하기"}
                  </Button>
                </div>
              </div>
            </div>

            <div className="border-t border-slate-200 pt-8 mt-12">
              <h2 className="text-xl font-bold text-slate-900 mb-4">이벤트 소개</h2>
              {event.description ? (
                <div
                  className="prose prose-slate max-w-none text-slate-700 leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: event.description }}
                />
              ) : (
                <p className="text-slate-600">이벤트 설명이 없습니다.</p>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
