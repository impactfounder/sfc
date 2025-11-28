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
        else router.push(`/events/${initialData.id}`)
      } else {
        // 생성 모드
        result = await createEvent(eventData)
        if (!result.success) {
          throw new Error("이벤트 생성에 실패했습니다.")
        }
        if (onSuccess) onSuccess()
        else router.push("/events")
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
            <div className="flex gap-2">
              <div className="relative flex-1">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                  <Search className="h-4 w-4" />
                </div>
                <Input
                  placeholder="Unsplash 이미지 검색 (예: startup, meeting)"
                  value={unsplashQuery}
                  onChange={(e) => setUnsplashQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault() // ★ 폼 제출 막기 (가장 중요)
                      handleUnsplashSearch() // 검색 실행
                    }
                  }}
                  className="pl-9 h-11"
                />
              </div>
              <Button 
                type="button" 
                variant="outline"
                disabled={!unsplashQuery.trim()}
                onClick={handleUnsplashSearch}
                className="gap-2"
              >
                <Search className="h-4 w-4" />
                검색
              </Button>
            </div>
          </div>

          {/* Unsplash Search Dialog */}
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogContent className="max-w-4xl h-[80vh] overflow-y-auto">
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
                    onClick={handleUnsplashSearch}
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
          
          {/* Title Input (Big & Bold like Luma) - 최상단 */}
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
                    onChange={(e) => {
                      setEndDate(e.target.value)
                      setIsEndDateManuallyChanged(true)
                    }}
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
              <span className="text-sm font-semibold w-12 shrink-0">장소</span>
              <div className="flex-1 relative">
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
                      placeholder="강남역 1번 출구 스타벅스, 줌(Zoom) 링크 등"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      className="border-none bg-transparent text-base px-0 shadow-none focus-visible:ring-0 placeholder:text-slate-400 w-full"
                    />
                  </Autocomplete>
                ) : (
                  <Input
                    placeholder="강남역 1번 출구 스타벅스, 줌(Zoom) 링크 등"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="border-none bg-transparent text-base px-0 shadow-none focus-visible:ring-0 placeholder:text-slate-400 w-full"
                  />
                )}
              </div>
            </div>

            {/* Price Row */}
            <div className="flex items-center gap-4">
              <div className="p-2 bg-slate-100 rounded-lg text-slate-500">
                <Ticket className="h-5 w-5" />
              </div>
              <span className="text-sm font-semibold w-12 shrink-0">가격</span>
              <div className="flex items-center gap-2 w-full">
                <Input
                  type="number"
                  placeholder="참가비 (원) - 비워두면 무료"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="border-none bg-transparent text-base px-0 shadow-none focus-visible:ring-0 placeholder:text-slate-400 w-full"
                  min="0"
                />
              </div>
            </div>

            {/* Capacity Row */}
            <div className="flex items-center gap-4">
              <div className="p-2 bg-slate-100 rounded-lg text-slate-500">
                <Users className="h-5 w-5" />
              </div>
              <span className="text-sm font-semibold w-12 shrink-0">인원</span>
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

            {/* Event Type Row */}
            <div className="flex items-start gap-4">
              <div className="p-2 bg-slate-100 rounded-lg text-slate-500">
                <Target className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <span className="text-sm font-semibold block mb-2">이벤트 유형</span>
                <RadioGroup
                  value={eventType}
                  onValueChange={(value) => setEventType(value as "networking" | "class" | "activity")}
                  className="grid grid-cols-3 gap-3 w-full"
                >
                  <label
                    htmlFor="networking"
                    className={cn(
                      "flex items-center space-x-2 p-3 border rounded-lg hover:bg-slate-50 transition-all w-full cursor-pointer",
                      eventType === "networking" ? "border-slate-900 ring-1 ring-slate-900 bg-slate-50" : "border-slate-200"
                    )}
                  >
                    <RadioGroupItem value="networking" id="networking" className="text-slate-900" />
                    <div className="flex-1">
                      <div className="font-medium text-slate-900">네트워킹</div>
                      <div className="text-xs text-slate-500">모임, 소셜링, 파티</div>
                    </div>
                  </label>
                  <label
                    htmlFor="class"
                    className={cn(
                      "flex items-center space-x-2 p-3 border rounded-lg hover:bg-slate-50 transition-all w-full cursor-pointer",
                      eventType === "class" ? "border-slate-900 ring-1 ring-slate-900 bg-slate-50" : "border-slate-200"
                    )}
                  >
                    <RadioGroupItem value="class" id="class" className="text-slate-900" />
                    <div className="flex-1">
                      <div className="font-medium text-slate-900">클래스</div>
                      <div className="text-xs text-slate-500">워크샵, 강의, 세미나</div>
                    </div>
                  </label>
                  <label
                    htmlFor="activity"
                    className={cn(
                      "flex items-center space-x-2 p-3 border rounded-lg hover:bg-slate-50 transition-all w-full cursor-pointer",
                      eventType === "activity" ? "border-slate-900 ring-1 ring-slate-900 bg-slate-50" : "border-slate-200"
                    )}
                  >
                    <RadioGroupItem value="activity" id="activity" className="text-slate-900" />
                    <div className="flex-1">
                      <div className="font-medium text-slate-900">액티비티</div>
                      <div className="text-xs text-slate-500">운동, 야외 활동</div>
                    </div>
                  </label>
                </RadioGroup>
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

      {/* 커스텀 필드 섹션 */}
      <div className="space-y-4 bg-white border border-slate-200 rounded-2xl shadow-sm p-6">
        <div className="flex items-center justify-between">
          <Label className="text-lg font-semibold text-slate-900">참가자 질문 추가</Label>
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
            질문 추가
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
              <div className="space-y-4 pb-32">
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
        
        {customFields.length > 0 && (
          <div className="flex justify-end mt-4">
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
              질문 추가
            </Button>
          </div>
        )}
      </div>

      {error && (
        <div className="p-4 bg-red-50 text-red-600 rounded-lg text-sm font-medium">
          {error}
        </div>
      )}

      <div className="sticky bottom-0 z-20 bg-slate-50/80 backdrop-blur-md border-t border-slate-200/60 py-4 px-6 mt-8 flex justify-end">
        <Button 
          type="submit" 
          size="lg" 
          className="bg-slate-900 hover:bg-slate-800 text-white px-8 rounded-full text-base font-bold shadow-lg hover:shadow-xl transition-all duration-300"
          disabled={isLoading}
        >
          {isLoading ? (
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
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