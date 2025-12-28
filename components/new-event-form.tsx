"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { createClient } from "@/lib/supabase/client"
import { Loader2, ImageIcon, Upload, Search, X, MapPin, Calendar, Users, Clock, Ticket, Plus, Trash2, GripVertical, Target } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Card, CardContent } from "@/components/ui/card"
import { searchUnsplashImages } from "@/app/actions/unsplash"
import { RichTextEditor } from "@/components/rich-text-editor" // 에디터 import
import { createEvent, updateEvent } from "@/lib/actions/events" // ★ 보안: 서버 액션 사용
import { cn } from "@/lib/utils"
import type { UnsplashImage } from "@/lib/types/unsplash"
import { useToast } from "@/hooks/use-toast"
import { useLoadScript, Autocomplete } from "@react-google-maps/api"
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core"
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"

// Google Maps libraries 설정 (컴포넌트 외부에 정적 선언)
const libraries: ("places")[] = ["places"]

// SortableItem 컴포넌트
type CustomField = {
  id: string
  label: string
  type: 'text' | 'select'
  options: string[]
  required: boolean
}

type SortableItemProps = {
  field: CustomField
  index: number
  customFields: CustomField[]
  setCustomFields: (fields: CustomField[]) => void
}

function SortableItem({ field, index, customFields, setCustomFields }: SortableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: field.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div ref={setNodeRef} style={style}>
      <Card className={`border-slate-200 bg-white ${isDragging ? 'shadow-lg' : ''}`}>
        <CardContent className="p-4 space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 space-y-4">
              {/* 질문 제목 */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <button
                    type="button"
                    {...attributes}
                    {...listeners}
                    className="cursor-grab active:cursor-grabbing text-slate-400 hover:text-slate-600 transition-colors p-1 -ml-1"
                    aria-label="드래그하여 순서 변경"
                  >
                    <GripVertical className="h-5 w-5" />
                  </button>
                  <Label className="text-sm font-semibold text-slate-700">
                    질문 제목
                  </Label>
                </div>
                <Input
                  placeholder="예: 참가 동기, 티셔츠 사이즈 등"
                  value={field.label}
                  onChange={(e) => {
                    const updated = [...customFields]
                    updated[index].label = e.target.value
                    setCustomFields(updated)
                  }}
                  className="bg-slate-50"
                />
              </div>

              {/* 답변 타입 선택 */}
              <div>
                <Label className="text-sm font-semibold text-slate-700 mb-2 block">
                  답변 타입
                </Label>
                <Select
                  value={field.type}
                  onValueChange={(value: 'text' | 'select') => {
                    const updated = [...customFields]
                    updated[index].type = value
                    if (value === 'text') {
                      updated[index].options = []
                    } else if (value === 'select' && updated[index].options.length === 0) {
                      updated[index].options = ['']
                    }
                    setCustomFields(updated)
                  }}
                >
                  <SelectTrigger className="bg-slate-50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="z-[100]">
                    <SelectItem value="text">주관식 텍스트</SelectItem>
                    <SelectItem value="select">객관식 선택</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* 객관식 옵션 추가/삭제 */}
              {field.type === 'select' && (
                <div>
                  <Label className="text-sm font-semibold text-slate-700 mb-2 block">
                    선택지
                  </Label>
                  <div className="space-y-2">
                    {field.options.map((option, optIndex) => (
                      <div key={optIndex} className="flex items-center gap-2">
                        <Input
                          placeholder={`선택지 ${optIndex + 1}`}
                          value={option}
                          onChange={(e) => {
                            const updated = [...customFields]
                            updated[index].options[optIndex] = e.target.value
                            setCustomFields(updated)
                          }}
                          className="bg-slate-50"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            const updated = [...customFields]
                            updated[index].options = updated[index].options.filter((_, i) => i !== optIndex)
                            setCustomFields(updated)
                          }}
                          className="text-red-600 hover:text-red-700"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const updated = [...customFields]
                        updated[index].options.push('')
                        setCustomFields(updated)
                      }}
                      className="gap-2"
                    >
                      <Plus className="h-4 w-4" />
                      선택지 추가
                    </Button>
                  </div>
                </div>
              )}

              {/* 필수 항목 체크박스 */}
              <div className="flex items-center gap-2">
                <Checkbox
                  id={`required-${field.id}`}
                  checked={field.required}
                  onCheckedChange={(checked) => {
                    const updated = [...customFields]
                    updated[index].required = checked === true
                    setCustomFields(updated)
                  }}
                />
                <Label
                  htmlFor={`required-${field.id}`}
                  className="text-sm text-slate-700 cursor-pointer"
                >
                  필수 항목
                </Label>
              </div>
            </div>

            {/* 삭제 버튼 */}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setCustomFields(customFields.filter((_, i) => i !== index))
              }}
              className="text-red-600 hover:text-red-700"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

type InitialData = {
  id: string
  title: string
  description: string
  event_date: string
  end_date?: string | null
  location?: string | null
  price?: number | null
  max_participants?: number | null
  thumbnail_url?: string | null
  event_type?: 'networking' | 'class' | 'activity' | null
  customFields?: CustomField[]
}

// 날짜/시간 파싱 헬퍼 함수
const parseDateTime = (dateString?: string | null) => {
  if (!dateString) return { date: "", time: "" }
  const dateObj = new Date(dateString)
  const year = dateObj.getFullYear()
  const month = String(dateObj.getMonth() + 1).padStart(2, "0")
  const day = String(dateObj.getDate()).padStart(2, "0")
  const hours = String(dateObj.getHours()).padStart(2, "0")
  const minutes = String(dateObj.getMinutes()).padStart(2, "0")
  return {
    date: `${year}-${month}-${day}`,
    time: `${hours}:${minutes}`,
  }
}

// 초기값 계산 함수
const getInitialValues = (initialData?: InitialData) => {
  if (!initialData) {
    // 생성 모드: 기본값 설정
    const now = new Date()
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, "0")
    const day = String(now.getDate()).padStart(2, "0")
    
    return {
      title: "",
      description: "",
      eventType: "networking" as const,
      startDate: `${year}-${month}-${day}`,
      startTime: "19:00",
      endDate: `${year}-${month}-${day}`,
      endTime: "21:00",
      location: "",
      price: "",
      maxParticipants: "",
      thumbnailUrl: "",
      customFields: [],
      isEndDateManuallyChanged: false,
    }
  }

  // 수정 모드: initialData에서 값 추출
  const startDateTime = parseDateTime(initialData.event_date)
  const endDateTime = initialData.end_date ? parseDateTime(initialData.end_date) : startDateTime

  return {
    title: initialData.title || "",
    description: initialData.description || "",
    eventType: (initialData.event_type || "networking") as "networking" | "class" | "activity",
    startDate: startDateTime.date,
    startTime: startDateTime.time,
    endDate: endDateTime.date,
    endTime: endDateTime.time,
    location: initialData.location || "",
    price: initialData.price && initialData.price > 0 ? String(initialData.price) : "",
    maxParticipants: initialData.max_participants && initialData.max_participants > 0 ? String(initialData.max_participants) : "",
    thumbnailUrl: initialData.thumbnail_url || "",
    customFields: initialData.customFields || [],
    isEndDateManuallyChanged: !!initialData.end_date,
  }
}

export function NewEventForm({ 
  userId, 
  onSuccess,
  initialData 
}: { 
  userId?: string
  onSuccess?: () => void
  initialData?: InitialData
}) {
  const initialValues = getInitialValues(initialData)
  
  const [title, setTitle] = useState(initialValues.title)
  const [description, setDescription] = useState(initialValues.description) // Editor content (HTML)
  const [eventType, setEventType] = useState<"networking" | "class" | "activity">(initialValues.eventType)
  const [startDate, setStartDate] = useState(initialValues.startDate)
  const [startTime, setStartTime] = useState(initialValues.startTime)
  const [endDate, setEndDate] = useState(initialValues.endDate)
  const [endTime, setEndTime] = useState(initialValues.endTime)
  const [location, setLocation] = useState(initialValues.location)
  const [price, setPrice] = useState(initialValues.price)
  const [maxParticipants, setMaxParticipants] = useState(initialValues.maxParticipants)
  const [thumbnailUrl, setThumbnailUrl] = useState(initialValues.thumbnailUrl)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [unsplashQuery, setUnsplashQuery] = useState("")
  const [unsplashResults, setUnsplashResults] = useState<UnsplashImage[]>([])
  const { toast } = useToast()
  const [isSearching, setIsSearching] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [currentUserId, setCurrentUserId] = useState<string | null>(userId || null)
  const [isEndDateManuallyChanged, setIsEndDateManuallyChanged] = useState(initialValues.isEndDateManuallyChanged)
  const [scriptLoadError, setScriptLoadError] = useState(false)
  
  // 커스텀 필드 상태
  const [customFields, setCustomFields] = useState<CustomField[]>(initialValues.customFields)
  
  // 드래그 앤 드롭 센서 설정
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )
  
  // 드래그 종료 핸들러
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    
    if (over && active.id !== over.id) {
      setCustomFields((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id)
        const newIndex = items.findIndex((item) => item.id === over.id)
        
        return arrayMove(items, oldIndex, newIndex)
      })
    }
  }
  
  const fileInputRef = useRef<HTMLInputElement>(null)
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null)
  const router = useRouter()

  // Google Maps API 키 확인
  const googleMapsApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ""
  const hasApiKey = googleMapsApiKey.length > 0

  // Google Maps 스크립트 로드 (API 키가 있을 때만)
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: hasApiKey ? googleMapsApiKey : "",
    libraries: hasApiKey ? libraries : [],
    ...(hasApiKey ? {} : { preventGoogleFontsLoading: true }),
  })

  // 스크립트 로드 실패 시 fallback 활성화
  useEffect(() => {
    if (loadError || !hasApiKey) {
      setScriptLoadError(true)
    }
  }, [loadError, hasApiKey])

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

  // userId 설정 (initialData와 무관하게 실행)
  useEffect(() => {
    if (!userId) {
      const fetchUser = async () => {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (user) setCurrentUserId(user.id)
      }
      fetchUser()
    }
  }, [userId])

  // startDate 변경 시 endDate 자동 설정 (사용자가 수동으로 수정한 경우 제외)
  useEffect(() => {
    if (!isEndDateManuallyChanged && startDate) {
      setEndDate(startDate)
    } else if (startDate && endDate) {
      // startDate가 endDate보다 늦으면 endDate를 startDate로 업데이트
      const start = new Date(startDate)
      const end = new Date(endDate)
      if (start > end) {
        setEndDate(startDate)
      }
    }
  }, [startDate, endDate, isEndDateManuallyChanged])

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
      toast({
        variant: "destructive",
        title: "업로드 실패",
        description: "이미지 업로드에 실패했습니다. 다시 시도해주세요.",
      })
    } finally {
      setIsUploading(false)
    }
  }

  const handleUnsplashSearch = async () => {
    if (!unsplashQuery.trim()) return
    
    // 검색 시작 시 Dialog 자동 열기
    setIsDialogOpen(true)
    setIsSearching(true)
    setUnsplashResults([]) // 이전 결과 초기화
    
    try {
      const result = await searchUnsplashImages(unsplashQuery)
      if (result.success) {
        setUnsplashResults(result.results || [])
        if (!result.results || result.results.length === 0) {
          // 검색 결과가 없을 때는 조용히 처리 (사용자가 직접 확인)
        }
      } else {
        // 에러 발생 시 피드백
        toast({
          variant: "destructive",
          title: "검색 실패",
          description: result.error || "이미지 검색에 실패했습니다.",
        })
      }
    } catch (error) {
      console.error("Unsplash search error:", error)
      toast({
        variant: "destructive",
        title: "오류 발생",
        description: "이미지 검색 중 오류가 발생했습니다.",
      })
    } finally {
      setIsSearching(false)
    }
  }


  const handleImageSelect = (imageUrl: string) => {
    setThumbnailUrl(imageUrl)
    setIsDialogOpen(false)
    setUnsplashQuery("")
    setUnsplashResults([])
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title) {
      toast({
        variant: "destructive",
        title: "입력 필요",
        description: "이벤트 이름을 입력해주세요.",
      })
      return
    }

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
      const priceValue = price ? parseInt(price) : 0

      const eventData = {
        title,
        description, // Rich Text Content
        event_date: startDateTime.toISOString(),
        end_date: endDateTime ? endDateTime.toISOString() : null,
        location: location || null,
        price: priceValue > 0 ? priceValue : null,
        max_participants: maxParticipantsValue,
        thumbnail_url: thumbnailUrl || null,
        event_type: eventType,
        // 수정 모드에서는 항상 customFields를 전달 (빈 배열이어도 기존 질문 삭제를 위해)
        // 생성 모드에서는 질문이 있을 때만 전달
        customFields: initialData ? customFields : (customFields.length > 0 ? customFields : undefined),
      }

      let result
      if (initialData) {
        // 수정 모드
        result = await updateEvent(initialData.id, eventData)
        if (!result.success) {
          throw new Error("이벤트 수정에 실패했습니다.")
        }
        if (onSuccess) onSuccess()
        else router.push(`/e/${initialData.id}`)
      } else {
        // 생성 모드
        result = await createEvent(eventData)
        if (!result.success) {
          throw new Error("이벤트 생성에 실패했습니다.")
        }
        if (onSuccess) onSuccess()
        else router.push("/e")
      }
      router.refresh()
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : (initialData ? "이벤트 수정에 실패했습니다." : "이벤트 생성에 실패했습니다.")
      setError(errorMessage)
      toast({
        variant: "destructive",
        title: initialData ? "수정 실패" : "생성 실패",
        description: errorMessage,
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-8">
      {/* 1. 제목 입력 - 최상단 (전체 너비, Luma 스타일) */}
      <div className="space-y-3">
        <input
          type="text"
          placeholder="이벤트 이름을 입력하세요"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full text-3xl sm:text-4xl font-bold text-slate-900 placeholder:text-slate-300 border-none bg-transparent focus:outline-none focus:ring-0 px-0 py-1"
          required
        />
        <div className="h-px bg-slate-200 w-full" />
      </div>

      {/* 2. 이미지(좌) + 상세정보(우) 그리드 */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">

        {/* [Left] Image Upload Section (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div
            className="group relative aspect-[4/3] w-full cursor-pointer overflow-hidden rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 hover:bg-slate-100 hover:border-slate-400 transition-all"
            onClick={() => fileInputRef.current?.click()}
          >
            {thumbnailUrl ? (
              <>
                <img src={thumbnailUrl} alt="Thumbnail" className="h-full w-full object-cover" />
                <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Upload className="h-8 w-8 text-white" />
                </div>
              </>
            ) : (
              <div className="flex h-full flex-col items-center justify-center text-slate-400 gap-3">
                {isUploading ? (
                  <Loader2 className="h-10 w-10 animate-spin" />
                ) : (
                  <>
                    <ImageIcon className="h-12 w-12" />
                    <span className="text-sm font-medium">클릭하여 이미지 업로드</span>
                    <span className="text-xs text-slate-400">또는 아래에서 Unsplash 검색</span>
                  </>
                )}
              </div>
            )}
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
          </div>

          {/* Unsplash Search */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Unsplash 검색 (예: meeting)"
                value={unsplashQuery}
                onChange={(e) => setUnsplashQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault()
                    handleUnsplashSearch()
                  }
                }}
                className="pl-9 h-10"
              />
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={!unsplashQuery.trim()}
              onClick={handleUnsplashSearch}
              className="h-10 px-4"
            >
              검색
            </Button>
          </div>

          {/* Unsplash Dialog */}
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>이미지 검색</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                      placeholder="검색어 입력"
                      value={unsplashQuery}
                      onChange={(e) => setUnsplashQuery(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault()
                          handleUnsplashSearch()
                        }
                      }}
                      className="pl-9"
                    />
                  </div>
                  <Button
                    type="button"
                    onClick={handleUnsplashSearch}
                    disabled={isSearching || !unsplashQuery.trim()}
                  >
                    {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : "검색"}
                  </Button>
                </div>

                {isSearching && (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
                  </div>
                )}

                {!isSearching && unsplashResults.length > 0 && (
                  <div className="grid grid-cols-3 gap-3">
                    {unsplashResults.map((img) => (
                      <div
                        key={img.id}
                        className="aspect-square relative cursor-pointer rounded-lg overflow-hidden border border-slate-200 hover:border-slate-400 hover:shadow-md transition-all group"
                        onClick={() => handleImageSelect(img.urls.regular)}
                      >
                        <img
                          src={img.urls.small}
                          alt={img.alt_description || "Unsplash"}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                      </div>
                    ))}
                  </div>
                )}

                {!isSearching && unsplashQuery && unsplashResults.length === 0 && (
                  <div className="text-center py-12 text-slate-500">
                    <p className="text-sm">검색 결과가 없습니다</p>
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* [Right] Event Info Section (7 cols) - 카드 형태 */}
        <div className="lg:col-span-7">
          <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5">
            {/* 시작/종료 시간 */}
            <div className="flex items-start gap-4">
              <div className="mt-1 p-2 bg-slate-100 rounded-lg text-slate-500">
                <Calendar className="h-5 w-5" />
              </div>
              <div className="flex-1 space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-semibold text-slate-700 w-10">시작</span>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-slate-200"
                  />
                  <select
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-slate-200"
                  >
                    {timeOptions.map((t) => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-semibold text-slate-400 w-10">종료</span>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => {
                      setEndDate(e.target.value)
                      setIsEndDateManuallyChanged(true)
                    }}
                    className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 focus:outline-none focus:ring-2 focus:ring-slate-200"
                  />
                  <select
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 focus:outline-none focus:ring-2 focus:ring-slate-200"
                  >
                    {timeOptions.map((t) => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* 장소 */}
            <div className="flex items-center gap-4">
              <div className="p-2 bg-slate-100 rounded-lg text-slate-500">
                <MapPin className="h-5 w-5" />
              </div>
              <div className="flex-1">
                {hasApiKey && isLoaded && !scriptLoadError ? (
                  <Autocomplete
                    onLoad={(autocomplete) => {
                      autocompleteRef.current = autocomplete
                    }}
                    onPlaceChanged={() => {
                      if (autocompleteRef.current) {
                        const place = autocompleteRef.current.getPlace()
                        const address = place.formatted_address || place.name || ""
                        setLocation(address)
                      }
                    }}
                    options={{
                      types: ["establishment", "geocode"],
                      componentRestrictions: { country: "kr" },
                    }}
                  >
                    <Input
                      placeholder="장소 입력 (예: 강남역 스타벅스, Zoom 링크)"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      className="border-slate-200 bg-slate-50 h-10 focus-visible:ring-slate-200"
                    />
                  </Autocomplete>
                ) : (
                  <Input
                    placeholder="장소 입력 (예: 강남역 스타벅스, Zoom 링크)"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="border-slate-200 bg-slate-50 h-10 focus-visible:ring-slate-200"
                  />
                )}
              </div>
            </div>

            {/* 가격 & 인원 - 한 줄에 배치 */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-slate-100 rounded-lg text-slate-500">
                  <Ticket className="h-5 w-5" />
                </div>
                <Input
                  type="number"
                  placeholder="가격 (무료면 비워두기)"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="border-slate-200 bg-slate-50 h-10 focus-visible:ring-slate-200"
                  min="0"
                />
              </div>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-slate-100 rounded-lg text-slate-500">
                  <Users className="h-5 w-5" />
                </div>
                <Input
                  type="number"
                  placeholder="최대 인원 (선택)"
                  value={maxParticipants}
                  onChange={(e) => setMaxParticipants(e.target.value)}
                  className="border-slate-200 bg-slate-50 h-10 focus-visible:ring-slate-200"
                />
              </div>
            </div>

            {/* 이벤트 유형 */}
            <div className="flex items-start gap-4">
              <div className="mt-1 p-2 bg-slate-100 rounded-lg text-slate-500">
                <Target className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <span className="text-sm font-semibold text-slate-700 block mb-3">이벤트 유형</span>
                <RadioGroup
                  value={eventType}
                  onValueChange={(value) => setEventType(value as "networking" | "class" | "activity")}
                  className="grid grid-cols-3 gap-2"
                >
                  {[
                    { value: "networking", label: "네트워킹", desc: "모임, 파티" },
                    { value: "class", label: "클래스", desc: "강의, 세미나" },
                    { value: "activity", label: "액티비티", desc: "운동, 야외" },
                  ].map((type) => (
                    <label
                      key={type.value}
                      htmlFor={type.value}
                      className={cn(
                        "flex flex-col items-center p-3 border rounded-xl cursor-pointer transition-all text-center",
                        eventType === type.value
                          ? "border-slate-900 bg-slate-900 text-white"
                          : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                      )}
                    >
                      <RadioGroupItem value={type.value} id={type.value} className="sr-only" />
                      <span className="font-medium text-sm">{type.label}</span>
                      <span className={cn("text-xs mt-0.5", eventType === type.value ? "text-slate-300" : "text-slate-500")}>
                        {type.desc}
                      </span>
                    </label>
                  ))}
                </RadioGroup>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 상세 내용 에디터 */}
      <div className="space-y-3">
        <Label className="text-lg font-semibold text-slate-900">상세 내용</Label>
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
          <RichTextEditor content={description} onChange={setDescription} />
        </div>
      </div>

      {/* 참가자 질문 섹션 */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5 sm:p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <Label className="text-lg font-semibold text-slate-900">참가자 질문</Label>
            <p className="text-sm text-slate-500 mt-0.5">참가 신청 시 받을 질문을 추가하세요</p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              setCustomFields([
                ...customFields,
                {
                  id: `field-${Date.now()}`,
                  label: "",
                  type: "text",
                  options: [],
                  required: false,
                },
              ])
            }}
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            추가
          </Button>
        </div>

        {customFields.length > 0 && (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={customFields.map((field) => field.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-3">
                {customFields.map((field, index) => (
                  <SortableItem
                    key={field.id}
                    field={field}
                    index={index}
                    customFields={customFields}
                    setCustomFields={setCustomFields}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}

        {customFields.length === 0 && (
          <div className="text-center py-8 text-slate-400">
            <p className="text-sm">아직 추가된 질문이 없습니다</p>
          </div>
        )}
      </div>

      {/* 에러 메시지 */}
      {error && (
        <div className="p-4 bg-red-50 text-red-600 rounded-xl text-sm font-medium border border-red-100">
          {error}
        </div>
      )}

      {/* 제출 버튼 */}
      <div className="sticky bottom-0 z-20 bg-gradient-to-t from-slate-50 via-slate-50 to-transparent pt-4 pb-6 -mx-4 px-4 sm:-mx-6 sm:px-6">
        <Button
          type="submit"
          size="lg"
          className="w-full sm:w-auto sm:min-w-[200px] sm:ml-auto sm:flex bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-base font-semibold shadow-lg hover:shadow-xl transition-all h-12"
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              처리 중...
            </>
          ) : initialData ? (
            "이벤트 수정하기"
          ) : (
            "이벤트 개설하기"
          )}
        </Button>
      </div>
    </form>
  )
}