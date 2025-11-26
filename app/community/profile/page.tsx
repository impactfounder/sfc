"use client"

import { createClient } from "@/lib/supabase/client"
import { getCurrentUserProfile } from "@/lib/queries/profiles"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Mail, Calendar, Coins, MapPin, Users, CalendarDays, Medal, Edit3, Ticket, Crown, CheckCircle, LogOut } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { useEffect, useState, useMemo, type ReactNode } from "react"
import { useRouter } from "next/navigation"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Camera, Loader2 } from "lucide-react"
import { BadgeManager } from "@/components/badge-manager" // 뱃지 관리 컴포넌트
import { updateProfileAvatar, updateProfileInfo } from "@/lib/actions/user"
import { grantBadge, removeBadge } from "@/lib/actions/badges"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { X, Plus } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import type { User, Profile } from "@/lib/types/profile"
import type { EventListItem } from "@/lib/types/events"
import type { PostListItem } from "@/lib/types/posts"
import type { VisibleBadge, Badge, UserBadgeWithBadge } from "@/lib/types/badges"
import type { LucideIcon } from "lucide-react"

type TabType = "points" | "posts" | "created_events" | "participated_events"

// 포인트 거래 내역 타입
type PointTransaction = {
  id: string
  amount: number
  description: string | null
  created_at: string
}

// 이벤트 등록 쿼리 결과 타입
type EventRegistrationQueryResult = {
  registered_at: string
  events: {
    id: string
    title: string
    thumbnail_url: string | null
    event_date: string
    location: string | null
  } | null
}

// 뱃지 쿼리 결과 타입
type BadgeQueryResult = {
  badges: {
    icon: string
    name: string
  } | null
}

// ------------------------------------------------------------------
// 하위 컴포넌트들 (주요 컴포넌트보다 먼저 정의되어야 함)
// ------------------------------------------------------------------

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-slate-400">
      <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mb-3">
        <Users className="h-5 w-5 text-slate-300" />
      </div>
      <p className="text-sm">{message}</p>
    </div>
  )
}

function PostListItem({ post }: { post: PostListItem }) {
    return (
        <Link key={post.id} href={`/community/board/${post.board_categories?.slug || "free"}/${post.id}`} className="flex flex-col p-5 hover:bg-slate-50 transition-colors group">
            <div className="flex items-center gap-2 mb-1.5">
                <span className="px-2 py-0.5 rounded bg-slate-100 text-xs font-medium text-slate-600">
                    {post.board_categories?.name || "게시판"}
                </span>
                <span className="text-xs text-slate-400">
                    {new Date(post.created_at).toLocaleDateString()}
                </span>
            </div>
            <h3 className="text-base font-medium text-slate-900 group-hover:text-blue-600 transition-colors truncate">
                {post.title}
            </h3>
            <div className="flex gap-3 mt-2 text-xs text-slate-500">
                <span>좋아요 {post.likes_count || 0}</span>
                <span>댓글 {post.comments_count || 0}</span>
            </div>
        </Link>
    )
}

function EventListItem({ event }: { event: EventListItem }) {
    // 날짜 비교를 통한 상태 판별 로직
    const eventDate = new Date(event.event_date)
    const now = new Date()
    const isPast = eventDate < now
    
    // 표시할 텍스트 및 스타일 결정
    let badgeText = "모집중"
    let badgeStyle = "bg-blue-50 text-blue-700"

    if (event.registration_date) {
        badgeText = "신청 완료"
        badgeStyle = "bg-green-50 text-green-700"
    } else if (isPast) {
        badgeText = "종료"
        badgeStyle = "bg-slate-100 text-slate-500"
    } else if (event.status === 'cancelled') {
        badgeText = "취소됨"
        badgeStyle = "bg-red-50 text-red-700"
    }

    return (
        <Link key={event.id} href={`/events/${event.id}`} className="flex gap-4 p-5 hover:bg-slate-50 transition-colors group">
            <div className="h-16 w-16 shrink-0 rounded-lg bg-slate-100 overflow-hidden relative border border-slate-200">
                {event.thumbnail_url ? (
                    <Image src={event.thumbnail_url} alt="" fill className="object-cover" />
                ) : (
                    <div className="flex h-full w-full items-center justify-center text-slate-300"><Ticket className="h-6 w-6" /></div>
                )}
            </div>
            <div className="flex-1 min-w-0">
                <h3 className="font-medium text-slate-900 truncate mb-1 group-hover:text-blue-600 transition-colors">{event.title}</h3>
                <div className="flex items-center gap-3 text-xs text-slate-500">
                    <span className="flex items-center gap-1"><CalendarDays className="h-3 w-3" /> {new Date(event.event_date).toLocaleDateString()}</span>
                    <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {event.location || "장소 미정"}</span>
                </div>
                <div className="mt-2">
                    <span className={cn("inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium", badgeStyle)}>
                        {badgeText}
                    </span>
                </div>
            </div>
        </Link>
    )
}




export default function ProfilePage() {
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  
  // Data States
  const [createdEvents, setCreatedEvents] = useState<EventListItem[]>([])
  const [userPosts, setUserPosts] = useState<PostListItem[]>([])
  const [registeredEvents, setRegisteredEvents] = useState<EventListItem[]>([])
  const [transactions, setTransactions] = useState<PointTransaction[]>([])
  const [visibleBadges, setVisibleBadges] = useState<VisibleBadge[]>([]) // 노출 뱃지 목록
  const [userBadges, setUserBadges] = useState<UserBadgeWithBadge[]>([]) // 편집 모달용 전체 뱃지 목록
  const [allBadges, setAllBadges] = useState<Badge[]>([]) // 사용 가능한 모든 뱃지 목록
  
  // UI State
  const [activeTab, setActiveTab] = useState<TabType>("posts") // 기본값: 게시글
  const [loading, setLoading] = useState(true)
  const [showBadgeManager, setShowBadgeManager] = useState(false) // 뱃지 관리 모달 상태
  const [isUploading, setIsUploading] = useState(false) // 아바타 업로드 상태
  const [showProfileEdit, setShowProfileEdit] = useState(false) // 프로필 편집 모달 상태
  const [isSaving, setIsSaving] = useState(false) // 프로필 저장 중 상태
  const [isSigningOut, setIsSigningOut] = useState(false) // 로그아웃 상태
  const [selectedBadgeId, setSelectedBadgeId] = useState<string>("") // 편집 모달에서 선택한 뱃지
  const [addingBadge, setAddingBadge] = useState(false) // 뱃지 추가 중 상태
  
  // 프로필 편집 폼 상태
  const [editForm, setEditForm] = useState({
    full_name: "",
    company: "",
    position: "",
    introduction: "",
    is_profile_public: false,
  })

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        
        // 프로필 정보 가져오기 (재사용 함수 사용)
        const userProfile = await getCurrentUserProfile(supabase)

        if (!userProfile || !userProfile.user) {
          setLoading(false) // 로딩 상태 먼저 해제
          router.push("/")
          return
        }

        setUser(userProfile.user)
        let profileData: Profile | null = userProfile.profile

        // 근본 원인: Promise.all은 하나의 쿼리가 무한 대기하면 전체가 블로킹됨
        // 해결: 각 쿼리를 개별 try-catch로 감싸서 독립적으로 처리
        let myEvents: EventListItem[] = []
        let myPosts: PostListItem[] = []
        let myRegistrations: EventRegistrationQueryResult[] = []
        let myTransactions: PointTransaction[] = []
        let badgesData: BadgeQueryResult[] = []

        // 근본 원인: 모든 쿼리에 limit이 없어서 전체 데이터를 가져옴
        // 해결: 1) 프로필 정보를 먼저 로드하여 즉시 표시
        //       2) 나머지 데이터는 limit을 추가하여 최적화
        //       3) 필요한 필드만 선택하여 네트워크 트래픽 감소
        
        // 1단계: 프로필 정보 표시 (이미 가져온 데이터 사용)
        if (profileData) {
          setProfile(profileData) // 즉시 프로필 정보 표시
          
          // 프로필 편집 폼 초기화
          setEditForm({
            full_name: profileData.full_name || "",
            company: profileData.company || "",
            position: profileData.position || "",
            introduction: profileData.introduction || "",
            is_profile_public: profileData.is_profile_public || false,
          })
        }

        // 2단계: 나머지 데이터를 병렬로 로드 (limit 추가 및 필드 최적화)
        await Promise.all([
          (async () => {
            try {
              const result = await supabase
                .from("events")
                .select(`id, title, thumbnail_url, event_date, location, created_at`)
                .eq("created_by", userProfile.user.id)
                .order("created_at", { ascending: false })
                .limit(20) // 최근 20개만
              if (!result.error && result.data) {
                myEvents = result.data.map((event) => ({
                  id: event.id,
                  title: event.title,
                  thumbnail_url: event.thumbnail_url,
                  event_date: event.event_date,
                  location: event.location,
                  created_at: event.created_at,
                }))
              }
            } catch (error) {
              console.error('이벤트 로드 오류:', error)
            }
          })(),
          (async () => {
            try {
              const result = await supabase
                .from("posts")
                .select(`id, title, created_at, board_categories (name, slug)`)
                .eq("author_id", userProfile.user.id)
                .order("created_at", { ascending: false })
                .limit(20) // 최근 20개만
              if (!result.error && result.data) {
                myPosts = result.data.map((post) => ({
                  id: post.id,
                  title: post.title,
                  created_at: post.created_at,
                  board_categories: post.board_categories,
                  likes_count: 0,
                  comments_count: 0,
                }))
              }
            } catch (error) {
              console.error('게시글 로드 오류:', error)
            }
          })(),
          (async () => {
            try {
              // 근본 원인: event_registrations 쿼리에서 events를 join하는 부분이 느림
              // 해결: 타임아웃 추가 및 필요한 필드만 선택
              const queryPromise = supabase
                .from("event_registrations")
                .select(`
                  registered_at,
                  events!inner (
                    id, title, thumbnail_url, event_date, location
                  )
                `)
                .eq("user_id", userProfile.user.id)
                .order("registered_at", { ascending: false })
                .limit(20) // 최근 20개만
              
              // 타임아웃 설정 (5초)
              const timeoutPromise = new Promise((_, reject) => 
                setTimeout(() => reject(new Error('쿼리 타임아웃')), 5000)
              )
              
              const result = await Promise.race([queryPromise, timeoutPromise]) as { error?: Error; data?: EventRegistrationQueryResult[] }
              if (!result.error && result.data) {
                myRegistrations = result.data
              }
            } catch (error) {
              console.error('등록 이벤트 로드 오류:', error)
              // 타임아웃이나 에러가 발생해도 빈 배열로 설정하여 계속 진행
              myRegistrations = []
            }
          })(),
          (async () => {
            try {
              const result = await supabase
                .from("point_transactions")
                .select("id, amount, description, created_at")
                .eq("user_id", userProfile.user.id)
                .order("created_at", { ascending: false })
                .limit(50) // 최근 50개만
              if (!result.error && result.data) {
                myTransactions = result.data
              }
            } catch (error) {
              console.error('포인트 내역 로드 오류:', error)
            }
          })(),
          (async () => {
            try {
              const result = await supabase
                .from("user_badges")
                .select(`
                  badges:badge_id (
                    icon,
                    name
                  )
                `)
                .eq("user_id", userProfile.user.id)
                .eq("is_visible", true)
                .limit(10) // 최대 10개만
              if (!result.error && result.data) {
                badgesData = result.data
              }
            } catch (error) {
              console.error('뱃지 로드 오류:', error)
            }
          })()
        ])

        // 데이터 설정 (에러가 있어도 사용 가능한 데이터는 설정)
        setProfile(profileData)
        setCreatedEvents(myEvents)
        setUserPosts(myPosts)
        
        const flattenedRegistrations: EventListItem[] = myRegistrations
          .map((reg) => {
            if (!reg.events) return null
            return {
              id: reg.events.id,
              title: reg.events.title,
              thumbnail_url: reg.events.thumbnail_url,
              event_date: reg.events.event_date,
              location: reg.events.location,
              created_at: reg.events.event_date, // 등록일이 없으므로 이벤트 날짜 사용
              registration_date: reg.registered_at,
            }
          })
          .filter((reg): reg is EventListItem => reg !== null)
        setRegisteredEvents(flattenedRegistrations)
        
        setTransactions(myTransactions)
        
        const mappedBadges: VisibleBadge[] = badgesData
          .map((ub) => ub.badges)
          .filter((badge): badge is { icon: string; name: string } => badge !== null)
          .map((badge) => ({ icon: badge.icon, name: badge.name }))
        setVisibleBadges(mappedBadges)

      } catch (error) {
        console.error('데이터 로드 중 오류 발생:', error)
        // 에러가 발생해도 로딩 상태는 해제
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [supabase, router])

  // 로그아웃 핸들러
  const handleSignOut = async () => {
    if (isSigningOut) return
    
    setIsSigningOut(true)
    try {
      await supabase.auth.signOut()
      localStorage.clear()
      sessionStorage.clear()
      window.location.replace('/')
    } catch (error) {
      console.error('로그아웃 오류:', error)
      setIsSigningOut(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-slate-50">
        <div className="text-lg text-slate-500 animate-pulse">로딩중...</div>
      </div>
    )
  }

  if (!user) return null

  // 탭 변경 핸들러
  const StatCard = ({ 
    title, 
    count, 
    type, 
    icon: Icon,
    colorClass = "bg-white border-slate-200" 
  }: { 
    title: string, 
    count: number, 
    type: TabType, 
    icon: LucideIcon,
    colorClass?: string 
  }) => (
    <div 
      onClick={() => setActiveTab(type)}
      className={cn(
        "relative overflow-hidden rounded-xl border p-5 cursor-pointer transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 group",
        colorClass,
        activeTab === type ? "ring-2 ring-slate-900 border-slate-900 shadow-md" : "border-slate-200"
      )}
    >
      <div className="flex justify-between items-start mb-2">
        <h3 className="text-sm font-medium text-slate-500">{title}</h3>
        <div className={cn("p-2 rounded-full bg-slate-50 text-slate-400 group-hover:text-slate-900 transition-colors", activeTab === type && "bg-slate-900 text-white")}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <div className="flex items-baseline gap-1">
        <span className="text-3xl font-bold text-slate-900">{count}</span>
        {title === "포인트" && <span className="text-sm font-medium text-slate-500">P</span>}
      </div>
      <p className="text-xs text-slate-400 mt-1">{title}</p>
    </div>
  )

  // 뱃지 렌더링 함수
  const renderBadges = () => (
    <div className="flex flex-wrap gap-2 justify-center md:justify-start">
      {visibleBadges.length > 0 ? (
        visibleBadges.map((badge, index) => (
          <div key={index} className="flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-sm font-medium border border-slate-200">
            <span className="text-base">{badge.icon}</span>
            <span>{badge.name}</span>
          </div>
        ))
      ) : (
        <p className="text-sm text-slate-500">노출 중인 인증 뱃지가 없습니다.</p>
      )}
    </div>
  )

  // 프로필 정보 저장 핸들러
  const handleSaveProfile = async () => {
    if (!editForm.full_name.trim()) {
      alert("이름을 입력해주세요.")
      return
    }
    
    setIsSaving(true)
    try {
      const result = await updateProfileInfo({
        full_name: editForm.full_name,
        company: editForm.company,
        position: editForm.position,
        introduction: editForm.introduction,
        is_profile_public: editForm.is_profile_public,
      })
      
      if (!result.success) {
        const errorMessage = result.error || "서버 저장 실패"
        throw new Error(errorMessage)
      }
      
      // 로컬 상태 업데이트
      setProfile((prev) => {
        if (!prev) return prev
        return {
          ...prev,
          full_name: editForm.full_name,
          company: editForm.company,
          position: editForm.position,
          introduction: editForm.introduction,
          is_profile_public: editForm.is_profile_public,
        }
      })
      
      setShowProfileEdit(false)
      alert("프로필이 저장되었습니다.")
    } catch (error) {
      console.error("Profile save failed:", error)
      const errorMessage = error instanceof Error ? error.message : "프로필 저장에 실패했습니다. 잠시 후 다시 시도해주세요."
      alert(`프로필 저장에 실패했습니다.\n\n오류: ${errorMessage}`)
    } finally {
      setIsSaving(false)
    }
  }

  // 뱃지 추가 핸들러 (편집 모달용)
  const handleAddBadge = async () => {
    if (!selectedBadgeId || !user) return

    const existingBadge = userBadges.find((ub) => ub.badge_id === selectedBadgeId)
    if (existingBadge) {
      alert("이미 부여된 뱃지입니다.")
      return
    }

    setAddingBadge(true)
    try {
      await grantBadge(user.id, selectedBadgeId)
      
      // 뱃지 목록 다시 로드
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
            description
          )
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })

      if (data) {
        setUserBadges(data as UserBadgeWithBadge[])
        // visibleBadges도 업데이트
        const visible: VisibleBadge[] = data
          .filter((ub) => ub.is_visible && ub.badges)
          .map((ub) => ({
            icon: ub.badges!.icon,
            name: ub.badges!.name,
          }))
        setVisibleBadges(visible)
      }
      
      setSelectedBadgeId("")
      alert("뱃지가 추가되었습니다.")
    } catch (error) {
      console.error("Failed to add badge:", error)
      const errorMessage = error instanceof Error ? error.message : "뱃지 추가에 실패했습니다."
      alert(errorMessage)
    } finally {
      setAddingBadge(false)
    }
  }

  // 뱃지 삭제 핸들러 (편집 모달용)
  const handleRemoveBadge = async (userBadgeId: string) => {
    if (!showProfileEdit) return // 편집 모달이 열려있을 때만 작동
    
    if (!confirm("뱃지를 삭제하시겠습니까?")) return

    try {
      await removeBadge(userBadgeId)
      
      // 뱃지 목록 다시 로드
      if (user) {
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
              description
            )
          `)
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })

        if (data) {
          setUserBadges(data as UserBadgeWithBadge[])
          // visibleBadges도 업데이트
          const visible: VisibleBadge[] = data
            .filter((ub) => ub.is_visible && ub.badges)
            .map((ub) => ({
              icon: ub.badges!.icon,
              name: ub.badges!.name,
            }))
          setVisibleBadges(visible)
        }
      }
    } catch (error) {
      console.error("Failed to remove badge:", error)
      const errorMessage = error instanceof Error ? error.message : "뱃지 삭제에 실패했습니다."
      alert(errorMessage)
    }
  }

  // 프로필 편집 모달 열 때 뱃지 데이터 로드
  const handleOpenProfileEdit = async () => {
    setShowProfileEdit(true)
    
    if (user) {
      // 전체 뱃지 목록 로드
      const [userBadgesResult, allBadgesResult] = await Promise.all([
        supabase
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
              description
            )
          `)
          .eq("user_id", user.id)
          .order("created_at", { ascending: false }),
        supabase
          .from("badges")
          .select("id, name, icon, category, description")
          .order("category", { ascending: true })
          .order("name", { ascending: true })
      ])

      if (userBadgesResult.data) {
        setUserBadges(userBadgesResult.data as UserBadgeWithBadge[])
      }
      if (allBadgesResult.data) {
        setAllBadges(allBadgesResult.data as Badge[])
      }
    }
  }

  // 아바타 업로드 핸들러
  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // 이미지 파일인지 확인
    if (!file.type.startsWith("image/")) {
      alert("이미지 파일만 업로드 가능합니다.")
      return
    }

    setIsUploading(true)
    try {
      // 1단계: 이미지 업로드
      const formData = new FormData()
      formData.append("file", file)

      const uploadResponse = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })

      if (!uploadResponse.ok) {
        throw new Error("이미지 업로드 실패")
      }

      const uploadData = await uploadResponse.json()

      // 2단계: 프로필 업데이트
      await updateProfileAvatar(uploadData.url)

      // 3단계: 로컬 상태 업데이트
      setProfile((prev) => {
        if (!prev) return prev
        return {
          ...prev,
          avatar_url: uploadData.url,
        }
      })
    } catch (error) {
      console.error("Avatar upload error:", error)
      alert("프로필 이미지 업로드에 실패했습니다.")
    } finally {
      setIsUploading(false)
    }
  }




  return (
    <>
      {/* 뱃지 관리 모달 */}
      <Dialog open={showBadgeManager} onOpenChange={setShowBadgeManager}>
        <DialogContent className="sm:max-w-lg bg-white rounded-xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2">
              <Medal className="h-5 w-5 text-slate-700" />
              뱃지 관리 및 노출 설정
            </DialogTitle>
          </DialogHeader>
          <div className="mt-6 max-h-[80vh] overflow-y-auto">
            <BadgeManager userId={user.id} />
          </div>
        </DialogContent>
      </Dialog>

      {/* 프로필 편집 모달 */}
      <Dialog open={showProfileEdit} onOpenChange={setShowProfileEdit}>
        <DialogContent className="sm:max-w-lg bg-white rounded-xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">프로필 편집</DialogTitle>
            <DialogDescription className="text-sm text-slate-500">
              다른 멤버들에게 보여질 프로필 정보를 수정합니다.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-6 space-y-6 max-h-[80vh] overflow-y-auto px-1">
            {/* 이름 입력 필드 */}
            <div>
              <Label htmlFor="full_name" className="mb-2 block text-slate-700">이름 <span className="text-red-500">*</span></Label>
              <Input
                id="full_name"
                value={editForm.full_name}
                onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
                placeholder="이름을 입력하세요"
                className="bg-white border-slate-200 focus-visible:ring-slate-900 h-11"
              />
            </div>

            {/* 소속 */}
            <div>
              <Label htmlFor="company" className="mb-2 block text-slate-700">소속</Label>
              <Input
                id="company"
                value={editForm.company}
                onChange={(e) => setEditForm({ ...editForm, company: e.target.value })}
                placeholder="회사 또는 조직명"
                className="bg-white border-slate-200 focus-visible:ring-slate-900 h-11"
              />
            </div>

            {/* 직책 */}
            <div>
              <Label htmlFor="position" className="mb-2 block text-slate-700">직책</Label>
              <Input
                id="position"
                value={editForm.position}
                onChange={(e) => setEditForm({ ...editForm, position: e.target.value })}
                placeholder="예: CEO, 대표이사, 파트너"
                className="bg-white border-slate-200 focus-visible:ring-slate-900 h-11"
              />
            </div>

            {/* 자기소개 */}
            <div>
              <Label htmlFor="introduction" className="mb-2 block text-slate-700">한줄 자기소개</Label>
              <Textarea
                id="introduction"
                value={editForm.introduction}
                onChange={(e) => setEditForm({ ...editForm, introduction: e.target.value })}
                placeholder="간단한 자기소개를 입력해주세요"
                rows={3}
                className="bg-white border-slate-200 focus-visible:ring-slate-900 resize-none min-h-[80px]"
              />
            </div>

            {/* 공개 설정 */}
            <div 
              className="flex items-center justify-between p-4 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50 transition-colors"
              onClick={() => setEditForm(prev => ({ ...prev, is_profile_public: !prev.is_profile_public }))}
            >
              <div className="flex-1">
                <Label className="font-medium cursor-pointer pointer-events-none">
                  멤버 리스트에 내 프로필을 공개합니다
                </Label>
                <p className="text-xs text-slate-500 mt-1 pointer-events-none">
                  공개 시 멤버 페이지에서 프로필을 확인할 수 있습니다
                </p>
              </div>
              <Switch
                checked={editForm.is_profile_public}
                onCheckedChange={(checked) =>
                  setEditForm(prev => ({ ...prev, is_profile_public: checked }))
                }
                className="data-[state=checked]:bg-blue-600"
              />
            </div>

            {/* 뱃지 관리 섹션 */}
            <div>
              <Label className="mb-2 block text-slate-700">
                뱃지 관리
              </Label>
              <p className="text-xs text-slate-500 mb-3">
                자신을 표현하는 키워드를 선택하고 추가하세요 (최대 5개)
              </p>
              
              {/* 뱃지 추가 입력창 */}
              <div className="flex gap-2 mb-4">
                <Select value={selectedBadgeId} onValueChange={setSelectedBadgeId}>
                  <SelectTrigger className="flex-1 h-11 bg-white border-slate-200 focus-visible:ring-slate-900">
                    <SelectValue placeholder="뱃지를 선택하세요" />
                  </SelectTrigger>
                  <SelectContent>
                    {allBadges
                      .filter((badge) => !userBadges.some((ub) => ub.badge_id === badge.id))
                      .slice(0, 20)
                      .map((badge) => (
                        <SelectItem key={badge.id} value={badge.id}>
                          <div className="flex items-center gap-2">
                            <span>{badge.icon}</span>
                            <span>{badge.name}</span>
                          </div>
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                <Button
                  onClick={handleAddBadge}
                  disabled={!selectedBadgeId || addingBadge || userBadges.length >= 5}
                  className="h-11 px-6 shrink-0"
                >
                  {addingBadge ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      추가 중...
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4 mr-2" />
                      추가
                    </>
                  )}
                </Button>
              </div>

              {/* 현재 뱃지 목록 */}
              <div className="flex flex-wrap gap-2 min-h-[60px] p-3 border border-slate-200 rounded-lg bg-slate-50">
                {userBadges.length > 0 ? (
                  userBadges.map((userBadge) => {
                    const badge = userBadge.badges
                    if (!badge) return null
                    return (
                      <div
                        key={userBadge.id}
                        className="flex items-center gap-2 rounded-full bg-white px-3 py-1.5 text-sm font-medium border border-slate-200 shadow-sm"
                      >
                        <span className="text-base">{badge.icon}</span>
                        <span>{badge.name}</span>
                        <button
                          onClick={() => handleRemoveBadge(userBadge.id)}
                          className="ml-1 hover:bg-red-50 rounded-full p-0.5 transition-colors"
                          aria-label="뱃지 삭제"
                        >
                          <X className="h-3.5 w-3.5 text-slate-400 hover:text-red-600" />
                        </button>
                      </div>
                    )
                  })
                ) : (
                  <p className="text-sm text-slate-500 w-full text-center py-2">
                    추가된 뱃지가 없습니다.
                  </p>
                )}
              </div>
            </div>

            {/* 저장 버튼 */}
            <div className="flex justify-end gap-2 pt-2">
              <Button 
                variant="outline" 
                onClick={() => setShowProfileEdit(false)}
                className="h-11 px-6"
              >
                취소
              </Button>
              <Button 
                onClick={handleSaveProfile} 
                disabled={isSaving}
                className={cn(
                  "h-11 px-8 font-bold transition-all",
                  "bg-slate-900 hover:bg-slate-800 text-white shadow-md hover:shadow-lg",
                  isSaving && "opacity-70 cursor-not-allowed"
                )}
              >
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    저장 중...
                  </>
                ) : (
                  "저장하기"
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <div className="mx-auto max-w-6xl">
          <h1 className="mb-8 text-2xl md:text-3xl font-bold tracking-tight text-slate-900">내 프로필</h1>

          <div className="grid gap-6 lg:grid-cols-12">
            
            {/* 1. 왼쪽 컬럼 (4칸) */}
            <div className="lg:col-span-4 flex flex-col gap-4">
              
              {/* 상단: 프로필 정보 카드 */}
              <Card className="border-slate-200 bg-white shadow-sm overflow-hidden h-fit">
              <CardContent className="p-8 flex flex-col items-center text-center bg-white">
                
                <div className="mb-6 relative group">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarUpload}
                    className="hidden"
                    id="avatar-upload"
                    disabled={isUploading}
                  />
                  <label
                    htmlFor="avatar-upload"
                    className="cursor-pointer block relative"
                  >
                    <div className="h-32 w-32 rounded-full border-4 border-white shadow-lg overflow-hidden bg-slate-100 relative">
                      {profile?.avatar_url ? (
                        <Image
                          src={profile.avatar_url}
                          alt={profile.full_name}
                          width={128}
                          height={128}
                          className="object-cover h-full w-full"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-blue-100 to-indigo-100 text-4xl font-bold text-indigo-600">
                          {profile?.full_name?.[0] || "U"}
                        </div>
                      )}
                      {/* 호버 오버레이 */}
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        {isUploading ? (
                          <Loader2 className="h-8 w-8 text-white animate-spin" />
                        ) : (
                          <Camera className="h-8 w-8 text-white" />
                        )}
                      </div>
                    </div>
                  </label>
                  <div className="absolute bottom-0 right-0 bg-slate-900 text-white text-[10px] font-bold px-2 py-1 rounded-full border-2 border-white shadow-sm">
                    {profile?.role?.toUpperCase() || "MEMBER"}
                  </div>
                </div>

                <h2 className="text-2xl font-bold text-slate-900 mb-1">
                  {profile?.full_name || "이름 없음"}
                </h2>
                <p className="text-slate-500 text-sm mb-2 flex items-center justify-center gap-1.5">
                  <Mail className="h-3.5 w-3.5" />
                  {user.email}
                </p>
                
                {/* 소속/직책 표시 */}
                {(profile?.company || profile?.position) && (
                  <p className="text-slate-600 text-sm mb-2">
                    {profile?.company}
                    {profile?.company && profile?.position && " · "}
                    {profile?.position}
                  </p>
                )}
                
                {/* 역할 뱃지 */}
                {profile?.roles && profile.roles.length > 0 && (
                  <div className="flex flex-wrap gap-2 justify-center mb-2">
                    {profile.roles.map((role: string) => (
                      <span
                        key={role}
                        className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-xs font-medium"
                      >
                        {role}
                      </span>
                    ))}
                  </div>
                )}
                
                {/* 자기소개 */}
                {profile?.introduction && (
                  <p className="text-slate-600 text-sm mb-4 text-center">
                    {profile.introduction}
                  </p>
                )}

                <Separator className="w-full mb-6" />
                
                {/* 프로필 편집 버튼 */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleOpenProfileEdit}
                  className="w-full mb-6"
                >
                  <Edit3 className="h-4 w-4 mr-2" />
                  프로필 편집
                </Button>

                {/* 내 뱃지 영역 (보기 전용) */}
                <div className="w-full space-y-3">
                  <div className="flex items-center gap-2 mb-3">
                    <Medal className="h-4 w-4 text-slate-900" />
                    <span className="text-sm font-bold text-slate-900">내 뱃지</span>
                  </div>
                  
                  <div className="bg-white rounded-xl p-4 min-h-[80px] flex flex-wrap gap-2 justify-center md:justify-start border border-slate-200">
                    {renderBadges()}
                  </div>
                </div>

                <div className="mt-6 text-xs text-slate-400 flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  가입일: {new Date(user.created_at).toLocaleDateString()}
                </div>
              </CardContent>
            </Card>

            {/* 하단: 별도 로그아웃 카드 */}
            <Card className="border-red-100 bg-red-50/10 shadow-sm overflow-hidden hover:border-red-200 transition-colors">
              <CardContent className="p-0">
                <Button
                  onClick={handleSignOut}
                  disabled={isSigningOut}
                  variant="ghost"
                  className="w-full h-12 rounded-none text-red-600 hover:text-red-700 hover:bg-red-50 font-medium flex items-center justify-center gap-2"
                >
                  <LogOut className="h-4 w-4" />
                  {isSigningOut ? "로그아웃 중..." : "로그아웃"}
                </Button>
              </CardContent>
            </Card>

            </div>

            {/* 2. 오른쪽: 통계 카드 및 리스트 영역 - 8칸 */}
            <div className="lg:col-span-8 space-y-6">
              
              {/* 상단 통계 카드 (클릭 가능) */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard 
                  title="포인트" 
                  count={profile?.points || 0} 
                  type="points"
                  icon={Coins}
                  colorClass="bg-white border-slate-200"
                />
                <StatCard 
                  title="작성한 게시글" 
                  count={userPosts.length} 
                  type="posts"
                  icon={Edit3}
                />
                <StatCard 
                  title="만든 이벤트" 
                  count={createdEvents.length} 
                  type="created_events"
                  icon={CalendarDays}
                />
                <StatCard 
                  title="참석 신청" 
                  count={registeredEvents.length} 
                  type="participated_events"
                  icon={Ticket}
                />
              </div>

              {/* 하단 리스트 영역 (탭에 따라 변경) */}
              <Card className="border-slate-200 bg-white shadow-sm min-h-[400px]">
                <CardHeader className="pb-4 border-b border-slate-100 bg-white">
                  <CardTitle className="text-lg flex items-center gap-2">
                    {activeTab === "points" && <><Coins className="h-5 w-5 text-amber-500" /> 포인트 내역</>}
                    {activeTab === "posts" && <><Edit3 className="h-5 w-5 text-blue-500" /> 작성한 게시글</>}
                    {activeTab === "created_events" && <><CalendarDays className="h-5 w-5 text-green-500" /> 만든 이벤트</>}
                    {activeTab === "participated_events" && <><Ticket className="h-5 w-5 text-purple-500" /> 참석 신청</>}
                  </CardTitle>
                </CardHeader>
                <CardContent 
                  className="p-0 h-[600px] overflow-y-scroll" 
                  style={{ scrollbarGutter: 'stable' }}
                >
                  
                  {/* 1. 포인트 내역 리스트 */}
                  {activeTab === "points" && (
                    <div className="divide-y divide-slate-100">
                      {transactions.length > 0 ? (
                        transactions.map((tx: PointTransaction) => (
                          <div key={tx.id} className="flex items-center justify-between p-5 hover:bg-slate-50 transition-colors">
                            <div>
                              <p className="font-medium text-slate-900">{tx.description}</p>
                              <p className="text-xs text-slate-500 mt-1">
                                {new Date(tx.created_at).toLocaleDateString()} · {new Date(tx.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                              </p>
                            </div>
                            <span className={cn("font-bold text-sm px-3 py-1 rounded-full bg-slate-100", tx.amount > 0 ? "text-blue-600 bg-blue-50" : "text-red-600 bg-red-50")}>
                              {tx.amount > 0 ? "+" : ""}{tx.amount} P
                            </span>
                          </div>
                        ))
                      ) : (
                        <EmptyState message="포인트 내역이 없습니다." />
                      )}
                    </div>
                  )}

                  {/* 2. 작성한 게시글 리스트 */}
                  {activeTab === "posts" && (
                    <div className="divide-y divide-slate-100">
                      {userPosts.length > 0 ? (
                        userPosts.map((post) => (
                          <PostListItem post={post} key={post.id} />
                        ))
                      ) : (
                        <EmptyState message="작성한 게시글이 없습니다." />
                      )}
                    </div>
                  )}

                  {/* 3. 만든 이벤트 리스트 */}
                  {activeTab === "created_events" && (
                    <div className="divide-y divide-slate-100">
                      {createdEvents.length > 0 ? (
                        createdEvents.map((event) => (
                          <EventListItem event={event} key={event.id} />
                        ))
                      ) : (
                        <EmptyState message="만든 이벤트가 없습니다." />
                      )}
                    </div>
                  )}

                  {/* 4. 참석 신청 리스트 */}
                  {activeTab === "participated_events" && (
                    <div className="divide-y divide-slate-100">
                      {registeredEvents.length > 0 ? (
                        registeredEvents.map((event) => (
                          <EventListItem event={event} key={event.id} />
                        ))
                      ) : (
                        <EmptyState message="참석 신청한 이벤트가 없습니다." />
                      )}
                    </div>
                  )}

                </CardContent>
              </Card>
            </div>
          </div>
        </div>
    </>
  )
}
