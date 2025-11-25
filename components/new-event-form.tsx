"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { createClient } from "@/lib/supabase/client"
import { Loader2, ImageIcon, Upload, Search, X, MapPin, Calendar, Users, Clock } from "lucide-react"
import { searchUnsplashImages } from "@/app/actions/unsplash"
import { RichTextEditor } from "@/components/rich-text-editor" // 에디터 import
import { createEvent } from "@/lib/actions/events" // ★ 보안: 서버 액션 사용

export function NewEventForm({ userId, onSuccess }: { userId?: string; onSuccess?: () => void }) {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("") // Editor content (HTML)
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
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [currentUserId, setCurrentUserId] = useState<string | null>(userId || null)
  
  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  // 시간 옵션 생성
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

  // 기본값 설정 (다음 30분 단위)
  useEffect(() => {
    if (!userId) {
      const fetchUser = async () => {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (user) setCurrentUserId(user.id)
      }
      fetchUser()
    }

    const now = new Date()
    now.setMinutes(now.getMinutes() + 30 - (now.getMinutes() % 30)) // Round up to next 30 mins
    
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, "0")
    const day = String(now.getDate()).padStart(2, "0")
    const hours = String(now.getHours()).padStart(2, "0")
    const minutes = String(now.getMinutes()).padStart(2, "0")

    setStartDate(`${year}-${month}-${day}`)
    setStartTime(`${hours}:${minutes}`)
    setEndDate(`${year}-${month}-${day}`)
    setEndTime(`${hours}:${minutes}`)
  }, [userId])

  // startDate 변경 시 endDate 자동 설정 (사용자가 수동으로 수정 가능)
  useEffect(() => {
    if (startDate && !endDate) {
      setEndDate(startDate)
    } else if (startDate && endDate) {
      // startDate가 endDate보다 늦으면 endDate를 startDate로 업데이트
      const start = new Date(startDate)
      const end = new Date(endDate)
      if (start > end) {
        setEndDate(startDate)
      }
    }
  }, [startDate, endDate])

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setIsUploading(true)
    try {
      const formData = new FormData()
      formData.append("file", file)
      const response = await fetch("/api/upload", { method: "POST", body: formData })
      if (!response.ok) throw new Error("업로드 실패")
      const data = await response.json()
      setThumbnailUrl(data.url)
    } catch (error) {
      console.error("이미지 업로드 실패:", error)
      alert("이미지 업로드 실패")
    } finally {
      setIsUploading(false)
    }
  }

  const handleUnsplashSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!unsplashQuery.trim()) return
    
    setIsSearching(true)
    setUnsplashResults([]) // 이전 결과 초기화
    
    try {
      const result = await searchUnsplashImages(unsplashQuery)
      if (result.success) {
        setUnsplashResults(result.results || [])
        if (!result.results || result.results.length === 0) {
          // 검색 결과가 없을 때 피드백
          alert("검색 결과가 없습니다. 다른 검색어를 시도해보세요.")
        }
      } else {
        // 에러 발생 시 피드백
        alert(result.error || "이미지 검색에 실패했습니다.")
      }
    } catch (error) {
      console.error("Unsplash search error:", error)
      alert("이미지 검색 중 오류가 발생했습니다.")
    } finally {
      setIsSearching(false)
    }
  }

  // 다이얼로그가 열릴 때 이미 입력된 검색어가 있으면 자동 검색
  useEffect(() => {
    if (isDialogOpen && unsplashQuery.trim() && unsplashResults.length === 0 && !isSearching) {
      const performSearch = async () => {
        setIsSearching(true)
        setUnsplashResults([])
        
        try {
          const result = await searchUnsplashImages(unsplashQuery)
          if (result.success) {
            setUnsplashResults(result.results || [])
            if (!result.results || result.results.length === 0) {
              // 검색 결과가 없을 때는 조용히 처리 (사용자가 직접 확인)
            }
          } else {
            alert(result.error || "이미지 검색에 실패했습니다.")
          }
        } catch (error) {
          console.error("Unsplash search error:", error)
          alert("이미지 검색 중 오류가 발생했습니다.")
        } finally {
          setIsSearching(false)
        }
      }
      
      performSearch()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDialogOpen])

  const handleImageSelect = (imageUrl: string) => {
    setThumbnailUrl(imageUrl)
    setIsDialogOpen(false)
    setUnsplashQuery("")
    setUnsplashResults([])
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title) return alert("이벤트 이름을 입력해주세요.")

    setIsLoading(true)
    setError(null)

    try {
      const startDateTime = new Date(`${startDate}T${startTime}`)
      const endDateTime = endDate && endTime ? new Date(`${endDate}T${endTime}`) : null

      const maxParticipantsValue = maxParticipants ? parseInt(maxParticipants) : null
      if (maxParticipantsValue !== null && isNaN(maxParticipantsValue)) {
        throw new Error("최대 인원은 유효한 숫자여야 합니다.")
      }

      // ★ 보안: 서버 액션 사용 (created_by는 서버에서 세션 기반으로 자동 설정됨)
      const result = await createEvent({
        title,
        description, // Rich Text Content
        event_date: startDateTime.toISOString(),
        end_date: endDateTime ? endDateTime.toISOString() : null,
        location: location || null,
        max_participants: maxParticipantsValue,
        thumbnail_url: thumbnailUrl || null,
        // ★ 보안: created_by는 전달하지 않음 (서버에서 세션 기반으로 자동 설정)
      })

      if (!result.success) {
        throw new Error("이벤트 생성에 실패했습니다.")
      }

      if (onSuccess) onSuccess()
      else router.push("/events")
      router.refresh()
    } catch (error: any) {
      setError(error.message || "이벤트 생성에 실패했습니다.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Top Section: Image (Left) & Info (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* [Left] Image Upload Section (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div 
            className="group relative aspect-[4/3] w-full cursor-pointer overflow-hidden rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 hover:bg-slate-100 transition-colors"
            onClick={() => fileInputRef.current?.click()}
          >
            {thumbnailUrl ? (
              <>
                <img src={thumbnailUrl} alt="Thumbnail" className="h-full w-full object-cover" />
                <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Upload className="h-8 w-8 text-white" />
                </div>
              </>
            ) : (
              <div className="flex h-full flex-col items-center justify-center text-slate-400 gap-2">
                {isUploading ? (
                  <Loader2 className="h-8 w-8 animate-spin" />
                ) : (
                  <>
                    <ImageIcon className="h-10 w-10" />
                    <span className="text-sm font-medium">이미지 업로드</span>
                  </>
                )}
              </div>
            )}
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
          </div>

          {/* Unsplash Search Input (이미지 업로드 영역 아래) */}
          <div className="space-y-2">
            <div 
              className="flex gap-2"
            >
              <div className="relative flex-1">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                  <Search className="h-4 w-4" />
                </div>
                <Input
                  placeholder="Unsplash 이미지 검색 (예: party, meeting)"
                  value={unsplashQuery}
                  onChange={(e) => setUnsplashQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault()
                      if (unsplashQuery.trim()) {
                        setIsDialogOpen(true)
                      }
                    }
                  }}
                  className="pl-9 h-11"
                />
              </div>
              <Button 
                type="button" 
                variant="outline"
                disabled={!unsplashQuery.trim()}
                onClick={() => {
                  if (unsplashQuery.trim()) {
                    setIsDialogOpen(true)
                  }
                }}
                className="gap-2"
              >
                <Search className="h-4 w-4" />
                검색
              </Button>
            </div>
          </div>

          {/* Unsplash Search Dialog */}
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>이미지 검색</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                {/* Search Input (다이얼로그 내부) */}
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                      <Search className="h-4 w-4" />
                    </div>
                    <Input
                      placeholder="검색어 입력 (예: meeting, party, business)"
                      value={unsplashQuery}
                      onChange={(e) => setUnsplashQuery(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault()
                          handleUnsplashSearch()
                        }
                      }}
                      className="pl-9 h-11"
                    />
                  </div>
                  <Button 
                    type="button" 
                    onClick={() => handleUnsplashSearch()}
                    disabled={isSearching || !unsplashQuery.trim()}
                  >
                    {isSearching ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        검색 중...
                      </>
                    ) : (
                      <>
                        <Search className="mr-2 h-4 w-4" />
                        검색
                      </>
                    )}
                  </Button>
                </div>

                {/* Search Results */}
                {isSearching && (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
                  </div>
                )}

                {!isSearching && unsplashResults.length > 0 && (
                  <div className="grid grid-cols-3 gap-4">
                    {unsplashResults.map((img) => (
                      <div 
                        key={img.id} 
                        className="aspect-square relative cursor-pointer rounded-lg overflow-hidden border border-slate-200 hover:border-slate-400 hover:shadow-md transition-all group"
                        onClick={() => handleImageSelect(img.urls.regular)}
                      >
                        <img 
                          src={img.urls.small} 
                          alt={img.alt_description || "Unsplash"} 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200" 
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                      </div>
                    ))}
                  </div>
                )}

                {!isSearching && unsplashQuery && unsplashResults.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-12 text-slate-500">
                    <Search className="h-12 w-12 mb-4 opacity-50" />
                    <p className="text-sm font-medium">검색 결과가 없습니다</p>
                    <p className="text-xs mt-1">다른 검색어를 시도해보세요</p>
                  </div>
                )}

                {!isSearching && !unsplashQuery && unsplashResults.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                    <ImageIcon className="h-12 w-12 mb-4 opacity-50" />
                    <p className="text-sm">검색어를 입력하고 검색 버튼을 눌러주세요</p>
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* [Right] Event Info Section (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Title Input (Big & Bold like Luma) */}
          <div>
            <input
              type="text"
              placeholder="이벤트 이름"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full text-3xl md:text-4xl font-bold text-slate-900 placeholder:text-slate-300 border-none bg-transparent focus:ring-0 px-0 py-2"
              required
            />
          </div>

          <div className="space-y-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            {/* Date & Time Row */}
            <div className="flex items-start gap-4">
              <div className="mt-2 p-2 bg-slate-100 rounded-lg text-slate-500">
                <Calendar className="h-5 w-5" />
              </div>
              <div className="flex-1 space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold w-10">시작</span>
                  <input 
                    type="date" 
                    value={startDate} 
                    onChange={(e) => setStartDate(e.target.value)}
                    className="bg-slate-50 border-none rounded-md px-3 py-2 text-sm font-medium focus:ring-1 focus:ring-slate-200"
                  />
                  <select 
                    value={startTime} 
                    onChange={(e) => setStartTime(e.target.value)}
                    className="bg-slate-50 border-none rounded-md px-3 py-2 text-sm font-medium focus:ring-1 focus:ring-slate-200"
                  >
                    {timeOptions.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold w-10 text-slate-400">종료</span>
                  <input 
                    type="date" 
                    value={endDate} 
                    onChange={(e) => setEndDate(e.target.value)}
                    className="bg-slate-50 border-none rounded-md px-3 py-2 text-sm font-medium text-slate-600 focus:ring-1 focus:ring-slate-200"
                  />
                  <select 
                    value={endTime} 
                    onChange={(e) => setEndTime(e.target.value)}
                    className="bg-slate-50 border-none rounded-md px-3 py-2 text-sm font-medium text-slate-600 focus:ring-1 focus:ring-slate-200"
                  >
                    {timeOptions.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
              </div>
            </div>

            {/* Location Row */}
            <div className="flex items-center gap-4">
              <div className="p-2 bg-slate-100 rounded-lg text-slate-500">
                <MapPin className="h-5 w-5" />
              </div>
              <Input
                placeholder="장소 추가 (예: 강남역, Zoom)"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="border-none bg-transparent text-base px-0 shadow-none focus-visible:ring-0 placeholder:text-slate-400"
              />
            </div>

            {/* Capacity Row */}
            <div className="flex items-center gap-4">
              <div className="p-2 bg-slate-100 rounded-lg text-slate-500">
                <Users className="h-5 w-5" />
              </div>
              <div className="flex items-center gap-2 w-full">
                <Input
                  type="number"
                  placeholder="최대 인원 (선택)"
                  value={maxParticipants}
                  onChange={(e) => setMaxParticipants(e.target.value)}
                  className="border-none bg-transparent text-base px-0 shadow-none focus-visible:ring-0 placeholder:text-slate-400 w-full"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom: Rich Text Editor */}
      <div className="space-y-2">
        <Label className="text-lg font-semibold text-slate-900">상세 내용</Label>
        <RichTextEditor content={description} onChange={setDescription} />
      </div>

      {error && (
        <div className="p-4 bg-red-50 text-red-600 rounded-lg text-sm font-medium">
          {error}
        </div>
      )}

      <div className="flex justify-end pt-6 border-t border-slate-100 sticky bottom-0 bg-slate-50 z-10 pb-10">
        <Button 
          type="submit" 
          size="lg" 
          className="bg-slate-900 hover:bg-slate-800 text-white px-8 rounded-full text-base font-bold shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-0.5"
          disabled={isLoading}
        >
          {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : "이벤트 개설하기"}
        </Button>
      </div>
    </form>
  )
}