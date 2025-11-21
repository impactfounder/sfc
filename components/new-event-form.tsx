"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createClient } from "@/lib/supabase/client"
import { Loader2, ImageIcon, Upload, Search, X } from "lucide-react"
import { searchUnsplashImages } from "@/app/actions/unsplash"

export function NewEventForm({ userId, onSuccess }: { userId?: string; onSuccess?: () => void }) {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [startDate, setStartDate] = useState("")
  const [startTime, setStartTime] = useState("")
  const [endDate, setEndDate] = useState("")
  const [endTime, setEndTime] = useState("")
  const [location, setLocation] = useState("")
  const [maxParticipants, setMaxParticipants] = useState("")
  const [thumbnailUrl, setThumbnailUrl] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [unsplashQuery, setUnsplashQuery] = useState("")
  const [unsplashResults, setUnsplashResults] = useState<any[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [currentUserId, setCurrentUserId] = useState<string | null>(userId || null)
  const [isMounted, setIsMounted] = useState(false)
  const [inputsEnabled, setInputsEnabled] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  const generateTimeOptions = () => {
    const options = []
    for (let hour = 0; hour < 24; hour++) {
      for (const minute of [0, 30]) {
        const timeValue = `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`
        const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour
        const period = hour < 12 ? "오전" : "오후"
        options.push({
          value: timeValue,
          label: `${period} ${displayHour}:${String(minute).padStart(2, "0")}`,
        })
      }
    }
    return options
  }

  const timeOptions = generateTimeOptions()

  const roundToNearestHalfHour = (date: Date) => {
    const minutes = date.getMinutes()
    const roundedMinutes = minutes >= 30 ? 30 : 0
    date.setMinutes(roundedMinutes)
    date.setSeconds(0)
    date.setMilliseconds(0)
    return date
  }

  useEffect(() => {
    if (!userId) {
      const fetchUser = async () => {
        const supabase = createClient()
        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (user) {
          setCurrentUserId(user.id)
        }
      }
      fetchUser()
    }
  }, [userId])

  useEffect(() => {
    const now = roundToNearestHalfHour(new Date())
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, "0")
    const day = String(now.getDate()).padStart(2, "0")
    const hours = String(now.getHours()).padStart(2, "0")
    const minutes = String(now.getMinutes()).padStart(2, "0")

    setStartDate(`${year}-${month}-${day}`)
    setStartTime(`${hours}:${minutes}`)
    setEndDate(`${year}-${month}-${day}`)
    setEndTime(`${hours}:${minutes}`)
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => {
      setInputsEnabled(true)
      setIsMounted(true)
    }, 300)

    return () => clearTimeout(timer)
  }, [])

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append("file", file)

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) throw new Error("업로드 실패")

      const data = await response.json()
      setThumbnailUrl(data.url)
    } catch (error) {
      setError("이미지 업로드에 실패했습니다")
    } finally {
      setIsUploading(false)
    }
  }

  const handleUnsplashSearch = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!unsplashQuery.trim()) {
      return
    }

    setIsSearching(true)
    setError(null)

    try {
      const result = await searchUnsplashImages(unsplashQuery)

      if (!result.success) {
        setError(result.error || "이미지 검색에 실패했습니다.")
        return
      }

      setUnsplashResults(result.results || [])
    } catch (error) {
      console.error("Unsplash search error:", error)
      setError("이미지 검색에 실패했습니다.")
    } finally {
      setIsSearching(false)
    }
  }

  const selectUnsplashImage = (imageUrl: string) => {
    setThumbnailUrl(imageUrl)
    setUnsplashQuery("")
    setUnsplashResults([])
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!currentUserId) {
      setError("사용자 정보를 불러올 수 없습니다. 다시 로그인해주세요.")
      return
    }

    const supabase = createClient()
    setIsLoading(true)
    setError(null)

    try {
      const startDateTime = new Date(`${startDate}T${startTime}`)
      const endDateTime = endDate && endTime ? new Date(`${endDate}T${endTime}`) : null

      const eventData: {
        title: string
        description: string
        start_date: string
        end_date?: string
        location: string
        created_by: string
        max_participants?: number
        thumbnail_url?: string
      } = {
        title,
        description,
        start_date: startDateTime.toISOString(),
        location,
        created_by: currentUserId,
      }

      if (endDateTime) {
        eventData.end_date = endDateTime.toISOString()
      }

      if (maxParticipants) {
        eventData.max_participants = Number.parseInt(maxParticipants)
      }

      if (thumbnailUrl) {
        eventData.thumbnail_url = thumbnailUrl
      }

      const { error } = await supabase.from("events").insert(eventData)

      if (error) throw error

      if (onSuccess) {
        onSuccess()
      } else {
        router.push("/community/events")
      }
      router.refresh()
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "이벤트 생성에 실패했습니다")
    } finally {
      setIsLoading(false)
    }
  }

  const formatDateDisplay = (dateStr: string) => {
    if (!dateStr) return "날짜 선택"
    const date = new Date(dateStr)
    const year = date.getFullYear()
    const month = date.getMonth() + 1
    const day = date.getDate()
    const dayNames = ["일", "월", "화", "수", "목", "금", "토"]
    const dayName = dayNames[date.getDay()]
    return `${year}. ${month}. ${day}. (${dayName})`
  }

  const formatTimeDisplay = (timeStr: string) => {
    if (!timeStr) return "시간 선택"
    const [hours, minutes] = timeStr.split(":")
    const hour = Number.parseInt(hours)
    const period = hour >= 12 ? "오후" : "오전"
    const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour
    return `${period} ${displayHour}:${minutes}`
  }

  return (
    <div className="mx-auto max-w-5xl">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="flex justify-center">
          <div className="w-full max-w-[200px] space-y-3">
            <div
              className="group relative aspect-square w-full cursor-pointer overflow-hidden rounded-2xl border-2 border-slate-200 bg-gradient-to-br from-slate-50 to-slate-100 shadow-sm transition-all hover:border-slate-300 hover:shadow-lg"
              onClick={() => fileInputRef.current?.click()}
            >
              {thumbnailUrl ? (
                <>
                  <img
                    src={thumbnailUrl || "/placeholder.svg"}
                    alt="Event thumbnail"
                    className="h-full w-full object-cover"
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                    <Upload className="h-6 w-6 text-white" />
                  </div>
                </>
              ) : (
                <div className="flex h-full flex-col items-center justify-center text-slate-400">
                  {isUploading ? (
                    <>
                      <Loader2 className="h-6 w-6 mb-2 animate-spin stroke-[1.5]" />
                      <p className="text-xs font-medium">업로드 중...</p>
                    </>
                  ) : (
                    <>
                      <ImageIcon className="h-8 w-8 mb-2 stroke-[1.5]" />
                      <p className="text-xs font-semibold text-slate-600">이미지 업로드</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">클릭하여 선택</p>
                    </>
                  )}
                </div>
              )}
            </div>

            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />

            <div className="space-y-2">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-2 pointer-events-none">
                    <svg className="h-4 w-4" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg" fill="currentColor">
                      <path d="M10 9V0h12v9H10zm12 5h10v18H0V14h10v9h12v-9z" />
                    </svg>
                  </div>
                  <Input
                    placeholder="Unsplash에서 이미지 검색"
                    value={unsplashQuery}
                    onChange={(e) => setUnsplashQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault()
                        handleUnsplashSearch(e as any)
                      }
                    }}
                    disabled={!inputsEnabled}
                    tabIndex={-1}
                    className="pl-9 flex-1 h-10 border-slate-300 text-base focus:border-slate-900 focus:ring-1 focus:ring-slate-900"
                    autoComplete="off"
                  />
                </div>
                <Button
                  type="button"
                  onClick={handleUnsplashSearch}
                  disabled={isSearching || !inputsEnabled}
                  tabIndex={-1}
                  className="h-10 px-4 bg-slate-900 hover:bg-slate-800 shadow-sm"
                >
                  {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                </Button>
              </div>

              {unsplashResults.length > 0 && (
                <div className="grid grid-cols-2 gap-2 rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
                  {unsplashResults.map((image) => (
                    <div
                      key={image.id}
                      className="group relative aspect-square cursor-pointer overflow-hidden rounded-lg border border-slate-200 transition-all hover:border-slate-400 hover:shadow-md"
                      onClick={() => selectUnsplashImage(image.urls.regular)}
                    >
                      <img
                        src={image.urls.small || "/placeholder.svg"}
                        alt={image.alt_description || "Unsplash image"}
                        className="h-full w-full object-cover transition-transform group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-black/20 opacity-0 transition-opacity group-hover:opacity-100" />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {thumbnailUrl && (
              <Button
                type="button"
                variant="outline"
                onClick={() => setThumbnailUrl("")}
                disabled={!inputsEnabled}
                tabIndex={-1}
                className="w-full h-9 text-sm border-slate-300 text-red-600 hover:bg-red-50 hover:text-red-700 hover:border-red-300"
              >
                <X className="mr-2 h-4 w-4" />
                이미지 제거
              </Button>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-xl bg-slate-50 border border-slate-200 p-4">
            <input
              id="title"
              type="text"
              placeholder="이벤트 이름"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={!inputsEnabled}
              tabIndex={-1}
              required
              className="w-full border-none bg-transparent px-0 text-base font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-0 disabled:opacity-50"
            />
          </div>

          <div>
            <Label className="text-sm font-semibold text-slate-700 mb-2 block">일정</Label>
            <div className="rounded-xl border border-slate-200 bg-slate-50 overflow-hidden shadow-sm">
              <div className="flex items-center gap-3 px-4 py-3 hover:bg-slate-100 transition-colors border-b border-slate-200">
                <div className="text-sm font-semibold text-slate-600 w-12 flex-shrink-0">시작</div>
                <div className="flex-1 relative">
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    disabled={!inputsEnabled}
                    tabIndex={-1}
                    required
                    className="w-full text-base font-medium text-slate-900 border-none bg-transparent outline-none cursor-pointer disabled:opacity-50 [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:left-0 [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:h-full"
                    style={{ colorScheme: "light" }}
                  />
                </div>
                <div className="relative">
                  <select
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    disabled={!inputsEnabled}
                    tabIndex={-1}
                    required
                    className="w-28 text-base font-medium text-slate-900 border-none bg-transparent outline-none cursor-pointer appearance-none pr-2 disabled:opacity-50"
                  >
                    {timeOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-3 px-4 py-3 hover:bg-slate-100 transition-colors">
                <div className="text-sm font-semibold text-slate-600 w-12 flex-shrink-0">종료</div>
                <div className="flex-1 relative">
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    disabled={!inputsEnabled}
                    tabIndex={-1}
                    className="w-full text-base font-medium text-slate-900 border-none bg-transparent outline-none cursor-pointer disabled:opacity-50 [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:left-0 [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:h-full"
                    style={{ colorScheme: "light" }}
                  />
                </div>
                <div className="relative">
                  <select
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    disabled={!inputsEnabled}
                    tabIndex={-1}
                    className="w-28 text-base font-medium text-slate-900 border-none bg-transparent outline-none cursor-pointer appearance-none pr-2 disabled:opacity-50"
                  >
                    {timeOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          <div>
            <Label className="text-sm font-semibold text-slate-700 mb-2 block">위치</Label>
            <div className="rounded-xl bg-slate-50 border border-slate-200 p-4">
              <Input
                id="location"
                placeholder="📍 이벤트 위치 추가"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                disabled={!inputsEnabled}
                tabIndex={-1}
                required
                className="h-auto border-none bg-transparent p-0 text-base font-medium focus:ring-0 focus-visible:ring-0 placeholder:text-slate-400 disabled:opacity-50"
                autoComplete="off"
              />
            </div>
            <p className="mt-2 text-xs text-slate-500 pl-1">예: 강남역 10번 출구, 서울 또는 Zoom 링크</p>
          </div>

          <div>
            <Label className="text-sm font-semibold text-slate-700 mb-2 block">참석 인원</Label>
            <div className="rounded-xl bg-slate-50 border border-slate-200 p-4">
              <Input
                id="maxParticipants"
                type="number"
                placeholder="👥 최대 참석 인원"
                value={maxParticipants}
                onChange={(e) => setMaxParticipants(e.target.value)}
                disabled={!inputsEnabled}
                tabIndex={-1}
                min="1"
                className="h-auto border-none bg-transparent p-0 text-base font-medium focus:ring-0 focus-visible:ring-0 placeholder:text-slate-400 disabled:opacity-50"
                autoComplete="off"
              />
            </div>
          </div>
        </div>

        {error && (
          <div className="rounded-xl bg-red-50 border border-red-200 p-4 text-sm font-medium text-red-700">{error}</div>
        )}

        <div className="flex gap-3 pt-2">
          <Button
            type="submit"
            disabled={isLoading || !inputsEnabled}
            tabIndex={-1}
            className="flex-1 h-12 text-base font-bold bg-slate-900 hover:bg-slate-800 shadow-md hover:shadow-lg transition-all"
          >
            {isLoading && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
            {isLoading ? "생성 중..." : "이벤트 만들기"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => (onSuccess ? onSuccess() : router.back())}
            disabled={isLoading}
            tabIndex={-1}
            className="h-12 px-6 border-slate-300 hover:bg-slate-50 font-semibold shadow-sm"
          >
            취소
          </Button>
        </div>
      </form>
    </div>
  )
}
