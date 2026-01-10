"use client"

import { createClient } from "@/lib/supabase/client"
import { Card, CardContent } from "@/components/ui/card"
import { Mail, Calendar, Edit3, CalendarDays, Ticket, Medal, Camera, LogOut, FileText, X, Loader2, Paperclip, Info } from "lucide-react"
import Image from "next/image"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { BadgeManager } from "@/components/badge-manager"
import { updateProfileAvatar, updateProfileInfo } from "@/lib/actions/user"
import { removeBadge } from "@/lib/actions/badges"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import type { User, Profile } from "@/lib/types/profile"
import type { EventListItem } from "@/lib/types/events"
import type { PostListItem } from "@/lib/types/posts"
import type { VisibleBadge, Badge as BadgeType, UserBadgeWithBadge } from "@/lib/types/badges"
import type { LucideIcon } from "lucide-react"
import Link from "next/link"
import { MapPin } from "lucide-react"

type TabType = "posts" | "created_events" | "participated_events"

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
    is_active?: boolean
  } | null
}

// ------------------------------------------------------------------
// 하위 컴포넌트들
// ------------------------------------------------------------------

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-slate-400">
      <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mb-3">
        <FileText className="h-5 w-5 text-slate-300" />
      </div>
      <p className="text-sm">{message}</p>
    </div>
  )
}

function PostListItem({ post }: { post: PostListItem }) {
  return (
    <Link key={post.id} href={`/community/board/${post.board_categories?.slug || "free"}/${post.id}`} className="flex flex-col p-5 hover:bg-slate-50 transition-colors group border-b border-slate-100 last:border-0">
      <div className="flex items-center gap-2 mb-1.5">
        <span className="px-2 py-0.5 rounded bg-slate-100 text-xs font-medium text-slate-600">
          {post.board_categories?.name || "게시판"}
        </span>
        <span className="text-xs text-slate-400" suppressHydrationWarning>
          {new Date(post.created_at).toLocaleDateString()}
        </span>
      </div>
      <h3 className="text-base font-medium text-slate-900 group-hover:text-indigo-600 transition-colors truncate">
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
  // isPast 계산을 클라이언트에서만 수행하여 hydration 불일치 방지
  const [isPast, setIsPast] = useState(false)

  useEffect(() => {
    const eventDate = new Date(event.event_date)
    setIsPast(eventDate < new Date())
  }, [event.event_date])

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
    <Link key={event.id} href={`/events/${event.id}`} className="flex gap-4 p-5 hover:bg-slate-50 transition-colors group border-b border-slate-100 last:border-0">
      <div className="h-16 w-16 shrink-0 rounded-lg bg-slate-100 overflow-hidden relative border border-slate-200">
        {event.thumbnail_url ? (
          <Image src={event.thumbnail_url} alt="" fill sizes="64px" className="object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-slate-300"><Ticket className="h-6 w-6" /></div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="font-medium text-slate-900 truncate mb-1 group-hover:text-indigo-600 transition-colors">{event.title}</h3>
        <div className="flex items-center gap-3 text-xs text-slate-500">
          <span className="flex items-center gap-1" suppressHydrationWarning><CalendarDays className="h-3 w-3" /> {new Date(event.event_date).toLocaleDateString()}</span>
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

export default function ProfileContent() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)

  // Hydration 안전을 위한 mounted 상태
  const [mounted, setMounted] = useState(false)

  // Data States
  const [createdEvents, setCreatedEvents] = useState<EventListItem[]>([])
  const [userPosts, setUserPosts] = useState<PostListItem[]>([])
  const [registeredEvents, setRegisteredEvents] = useState<EventListItem[]>([])
  const [visibleBadges, setVisibleBadges] = useState<VisibleBadge[]>([])
  const [userBadges, setUserBadges] = useState<UserBadgeWithBadge[]>([])
  const [allBadges, setAllBadges] = useState<BadgeType[]>([])

  // UI State
  const [activeTab, setActiveTab] = useState<TabType>("posts")
  const [loading, setLoading] = useState(true)
  const [sessionError, setSessionError] = useState<string | null>(null)
  const [showBadgeManager, setShowBadgeManager] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [showProfileEdit, setShowProfileEdit] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isSigningOut, setIsSigningOut] = useState(false)
  const [selectedBadgeId, setSelectedBadgeId] = useState<string>("")
  const [addingBadge, setAddingBadge] = useState(false)
  const [showBadgeRequestDialog, setShowBadgeRequestDialog] = useState(false)
  const [badgeEvidence, setBadgeEvidence] = useState("")
  const [badgeProofFile, setBadgeProofFile] = useState<File | null>(null)

  // 프로필 편집 폼 상태
  const [editForm, setEditForm] = useState({
    full_name: "",
    company: "",
    position: "",
    company_2: "",
    position_2: "",
    tagline: "",
    introduction: "",
    member_type: [] as ("사업가" | "투자자" | "크리에이터")[],
    is_profile_public: false,
  })



  // 클라이언트 마운트 확인
  useEffect(() => {
    setMounted(true)
  }, [])

  // 로딩 상태 안전장치: 15초가 지나면 에러 메시지 표시 (시간 연장)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (loading && !user) {
        setSessionError('로딩 시간이 너무 오래 걸립니다.')
        setLoading(false)
      }
    }, 15000)
    return () => clearTimeout(timer)
  }, [loading, user])

  // 통합된 인증 및 데이터 로딩 로직
  useEffect(() => {
    const supabase = createClient()
    let isMounted = true

    // 리스트 데이터 비동기 로딩 (Fire & Forget)
    // await를 쓰지 않고 .then()으로 처리하여 메인 스레드를 막지 않음
    const loadListData = (userId: string) => {

      // (1) 만든 이벤트
      supabase
        .from("events")
        .select(`id, title, thumbnail_url, event_date, location, created_at`)
        .eq("created_by", userId)
        .order("created_at", { ascending: false })
        .limit(20)
        .then(({ data, error }) => {
          if (!isMounted) return
          if (error) console.error(`Events error: ${error.message}`)

          if (!error && data) {
            setCreatedEvents(data.map((event) => ({
              id: event.id,
              title: event.title,
              thumbnail_url: event.thumbnail_url,
              event_date: event.event_date,
              location: event.location,
              created_at: event.created_at,
            })))
          }
        })

      // (2) 작성 게시글
      supabase
        .from("posts")
        .select(`id, title, created_at, likes_count, comments_count, board_categories (name, slug)`)
        .eq("author_id", userId)
        .order("created_at", { ascending: false })
        .limit(20)
        .then(({ data, error }) => {
          if (!isMounted) return
          if (error) console.error(`Posts error: ${error.message}`)

          if (!error && data) {
            setUserPosts(data.map((post) => ({
              id: post.id,
              title: post.title,
              created_at: post.created_at,
              board_categories: Array.isArray(post.board_categories) ? post.board_categories[0] : post.board_categories,
              likes_count: post.likes_count || 0,
              comments_count: post.comments_count || 0,
            })))
          }
        })

      // (3) 신청 내역
      supabase
        .from("event_registrations")
        .select(`
          registered_at,
          events!inner (
            id, title, thumbnail_url, event_date, location
          )
        `)
        .eq("user_id", userId)
        .order("registered_at", { ascending: false })
        .limit(20)
        .then(({ data, error }) => {
          if (error) console.error(`Registrations error: ${error.message}`)
          else if (isMounted && data) {
            const flattened: EventListItem[] = data
              .filter((reg: any) => reg.events)
              .map((reg: any) => ({
                id: reg.events.id,
                title: reg.events.title,
                thumbnail_url: reg.events.thumbnail_url,
                event_date: reg.events.event_date,
                location: reg.events.location,
                created_at: reg.events.event_date,
                registration_date: reg.registered_at ?? undefined,
              }))
            setRegisteredEvents(flattened)
          }
        })

      // (4) 뱃지 정보
      supabase
        .from("user_badges")
        .select(`badges:badge_id (icon, name, is_active)`)
        .eq("user_id", userId)
        .eq("is_visible", true)
        .eq("is_visible", true)
        .limit(10)
        .then(({ data, error }) => {
          if (error) console.error(`Badges error: ${error.message}`)
          else if (isMounted && data) {
            const mappedBadges = data
              .filter((item: any) => item.badges && item.badges.is_active !== false)
              .map((item: any) => ({
                icon: item.badges.icon,
                name: item.badges.name,
              }))
            setVisibleBadges(mappedBadges)
          }
        })

      // (5) 전체 뱃지 및 내 뱃지 상세
      supabase
        .from("user_badges")
        .select(`
          id, badge_id, is_visible, status, evidence,
          badges:badge_id (id, name, icon, category, description, is_active)
        `)
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .then(({ data }) => {
          if (data && isMounted) setUserBadges(data as any)
        })
    }

    // 통합된 인증 및 데이터 로딩 로직
    const loadUserData = async (currentUser: User) => {
      if (!isMounted) return


      setUser(currentUser)

      // 프로필 로드
      const { data: profileData, error: profileFetchError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", currentUser.id)
        .single()



      if (profileData && isMounted) {
        setProfile(profileData as Profile)
        setEditForm({
          full_name: profileData.full_name || "",
          company: profileData.company || "",
          position: profileData.position || "",
          company_2: profileData.company_2 || "",
          position_2: profileData.position_2 || "",
          tagline: (profileData as any).tagline || "",
          introduction: profileData.introduction || "",
          member_type: Array.isArray((profileData as any).member_type)
            ? (profileData as any).member_type
            : (profileData as any).member_type
              ? [(profileData as any).member_type]
              : [],
          is_profile_public: profileData.is_profile_public || false,
        })

      }

      if (isMounted) {
        setLoading(false)
      }

      loadListData(currentUser.id)
    }

    // ------------------------------------------------------------------
    // ROBUST AUTH INITIALIZATION (NO SINGLETON, EXPLICIT TIMEOUT)
    // ------------------------------------------------------------------
    const initAuth = async () => {


      // 1. Create FRESH client (bypass singleton)


      // 1. Create FRESH client (bypass singleton)
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

      // 배포 환경 디버깅용 (민감 정보 마스킹)
      const maskedUrl = supabaseUrl ? `${supabaseUrl.slice(0, 10)}...` : 'undefined'
      const maskedKey = supabaseKey ? `${supabaseKey.slice(0, 5)}...` : 'undefined'
      console.log(`Debug Auth: URL=${maskedUrl}, Key=${maskedKey}`)

      if (!supabaseUrl || !supabaseKey) {
        console.error("CRITICAL: Missing Supabase Env Vars")
        setSessionError("환경 변수 설정 오류")
        setLoading(false)
        return
      }

      // 정적 import 사용으로 변경 (번들링 이슈 방지)
      const freshSupabase = createBrowserClient(supabaseUrl, supabaseKey)

      // 2. Race Condition implementation
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Auth check timed out")), 15000)
      )

      try {
        // Race!
        // getSession() 대신 getUser() 사용: 서버에 직접 검증 요청하여 로컬 스토리지 행(hang) 이슈 회피
        const result = await Promise.race([
          authClient.auth.getUser(),
          timeoutPromise
        ]) as { data: { user: User | null }, error: any }

        const { data: { user }, error } = result

        if (!isMounted) return

        if (error || !user) {
          console.log("No valid user. Redirecting to login.")
          setLoading(false)
          router.push("/auth/login")
          return
        }

        // 성공!
        await loadUserData(user)

      } catch (e) {
        // 타임아웃 또는 기타 에러
        console.error("Auth Exception:", e)

        if (isMounted) {
          setSessionError("인증 정보를 확인하는 데 실패했습니다. 다시 시도해주세요.")
          setLoading(false)
        }
      }
    }

    initAuth()

    return () => {
      isMounted = false
    }
  }, [router])

  const handleSignOut = async () => {
    if (isSigningOut) return

    setIsSigningOut(true)
    try {
      const supabase = createClient()
      await supabase.auth.signOut()
      localStorage.clear()
      sessionStorage.clear()
      window.location.replace('/')
    } catch (error) {
      console.error('로그아웃 오류:', error)
      setIsSigningOut(false)
    }
  }

  // 강력 초기화 함수 (배포 환경 디버깅용)
  const handleResetAuth = () => {
    if (confirm("로그인 정보를 초기화하고 다시 로그인하시겠습니까?")) {
      try {
        localStorage.clear()
        sessionStorage.clear()
        // 쿠키도 가능한 범위에서 삭제 시도
        document.cookie.split(";").forEach(function (c) {
          document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
        });
        window.location.href = "/auth/login"
      } catch (e) {
        console.error("Reset failed", e)
        window.location.href = "/auth/login"
      }
    }
  }

  // 서버/클라이언트 hydration 일치를 위해 mounted 전에는 로딩 UI 표시
  if (!mounted || loading) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-slate-50 flex-col gap-4">
        <Loader2 className="h-8 w-8 text-indigo-600 animate-spin" />
        <span className="text-sm text-slate-500">프로필 불러오는 중...</span>
      </div>
    )
  }

  // 세션 에러 시 재시도 UI 표시
  if (sessionError) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-slate-50">
        <div className="text-center p-8 max-w-md">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-amber-100 flex items-center justify-center">
            <Info className="h-8 w-8 text-amber-600" />
          </div>
          <h2 className="text-lg font-bold text-slate-900 mb-2">연결 지연</h2>
          <p className="text-slate-600 mb-6">{sessionError}</p>

          <div className="flex gap-3 justify-center">
            <Button
              onClick={() => window.location.reload()}
              className="bg-slate-900 hover:bg-slate-800 text-white"
            >
              다시 시도
            </Button>
            <Button
              variant="destructive"
              onClick={handleResetAuth}
            >
              초기화 및 재로그인
            </Button>
            <Button
              variant="outline"
              onClick={() => router.push("/")}
            >
              홈으로
            </Button>
          </div>
        </div>
      </div>
    )
  }

  if (!user) return null

  const StatCard = ({
    title,
    count,
    type,
    icon: Icon,
  }: {
    title: string,
    count: number,
    type: TabType,
    icon: LucideIcon,
  }) => (
    <div
      onClick={() => setActiveTab(type)}
      className={cn(
        "relative overflow-hidden rounded-xl border p-5 cursor-pointer transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 group bg-white",
        activeTab === type ? "ring-2 ring-indigo-600 border-transparent shadow-md" : "border-slate-200"
      )}
    >
      <div className="flex justify-between items-start mb-2">
        <h3 className="text-sm font-medium text-slate-500">{title}</h3>
        <div className={cn("p-2 rounded-full bg-slate-50 text-slate-400 group-hover:text-indigo-600 transition-colors", activeTab === type && "bg-indigo-50 text-indigo-600")}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <div className="flex items-baseline gap-1">
        <span className="text-3xl font-bold text-slate-900">{count}</span>
        <span className="text-xs text-slate-400 ml-1">건</span>
      </div>
    </div>
  )

  const renderBadges = () => (
    <div className="flex flex-col gap-2 w-full">
      {visibleBadges.length > 0 ? (
        visibleBadges.slice(0, 3).map((badge, index) => (
          <div key={index} className="flex items-center justify-center gap-2 rounded-lg bg-slate-50 px-3 py-2.5 text-sm font-medium border border-slate-200 w-full text-slate-700">
            <span className="text-lg">{badge.icon}</span>
            <span>{badge.name}</span>
          </div>
        ))
      ) : (
        <p className="text-sm text-slate-500 text-center w-full py-2">노출 중인 인증 뱃지가 없습니다.</p>
      )}
    </div>
  )

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
        company_2: editForm.company_2,
        position_2: editForm.position_2,
        tagline: editForm.tagline,
        introduction: editForm.introduction,
        member_type: editForm.member_type,
        is_profile_public: editForm.is_profile_public,
      })

      if (!result.success) {
        const errorMessage = result.error || "서버 저장 실패"
        throw new Error(errorMessage)
      }

      setProfile((prev) => {
        if (!prev) return prev
        return {
          ...prev,
          full_name: editForm.full_name,
          company: editForm.company,
          position: editForm.position,
          company_2: editForm.company_2,
          position_2: editForm.position_2,
          tagline: editForm.tagline,
          introduction: editForm.introduction,
          member_type: editForm.member_type,
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

  const handleToggleProfileVisibility = async (isPublic: boolean) => {
    try {
      const { updateProfileVisibility } = await import("@/lib/actions/user")
      await updateProfileVisibility(isPublic)

      setProfile((prev) => {
        if (!prev) return prev
        return { ...prev, is_profile_public: isPublic }
      })
    } catch (error) {
      console.error("Failed to update profile visibility:", error)
      setEditForm(prev => ({ ...prev, is_profile_public: !isPublic }))
    }
  }

  // 뱃지별 필요한 증빙서류 안내 함수
  const getRequiredDocuments = (badgeId: string | null): string[] => {
    if (!badgeId) return []

    const badge = allBadges.find(b => b.id === badgeId)
    if (!badge) return []

    const { name, category } = badge

    // 카테고리별 기본 안내
    const categoryDocs: Record<string, string[]> = {
      corporate_revenue: ['손익계산서', '법인세 신고서', '재무제표', '사업자등록증'],
      investment: ['출자증서', '투자계약서', '주식인수증명서', '투자집행증명서'],
      valuation: ['투자유치계약서', '기업가치평가서', '주식인수계약서', '투자공고문', '언론보도', '주주명부'],
      influence: ['SNS 계정 스크린샷', '팔로워 수 확인 가능한 화면'],
      professional: ['자격증 사본', '면허증 사본', '자격 인증서'],
      community: [] // 커뮤니티 뱃지는 자동 부여
    }

    // 특정 뱃지에 대한 추가 안내
    const specificDocs: Record<string, string[]> = {
      '변호사': ['변호사 자격증', '변호사 등록증'],
      '공인회계사': ['공인회계사 자격증', '회계사 등록증'],
      '세무사': ['세무사 자격증', '세무사 등록증'],
      '변리사': ['변리사 자격증', '변리사 등록증'],
      '노무사': ['공인노무사 자격증', '노무사 등록증'],
      '의사': ['의사 면허증'],
      '한의사': ['한의사 면허증'],
      '수의사': ['수의사 면허증'],
      '약사': ['약사 면허증'],
    }

    // 특정 뱃지에 대한 안내가 있으면 우선 사용
    if (specificDocs[name]) {
      return specificDocs[name]
    }

    // 카테고리별 기본 안내 사용
    return categoryDocs[category] || []
  }

  const handleRequestBadge = async () => {
    if (!selectedBadgeId || !user || (!badgeEvidence.trim() && !badgeProofFile)) {
      alert("증빙 자료를 입력하거나 파일을 첨부해주세요.")
      return
    }

    const existingBadge = userBadges.find((ub) => ub.badge_id === selectedBadgeId)
    if (existingBadge) {
      alert("이미 신청하거나 부여된 뱃지입니다.")
      return
    }

    setAddingBadge(true)
    try {
      const supabase = createClient()
      let proofUrl = null

      if (badgeProofFile) {
        const formData = new FormData()
        formData.append("file", badgeProofFile)

        const uploadResponse = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        })

        if (!uploadResponse.ok) {
          throw new Error("파일 업로드 실패")
        }

        const uploadData = await uploadResponse.json()
        proofUrl = uploadData.url
      }

      const { requestBadge } = await import("@/lib/actions/badges")
      await requestBadge(user.id, selectedBadgeId, badgeEvidence, proofUrl)

      const { data } = await supabase
        .from("user_badges")
        .select(`
          id,
          badge_id,
          is_visible,
          status,
          evidence,
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
        setUserBadges(data as unknown as UserBadgeWithBadge[])
        const visible: VisibleBadge[] = data
          .filter((ub) => ub.is_visible && ub.badges && ub.status === 'approved')
          .map((ub) => {
            const badge = Array.isArray(ub.badges) ? ub.badges[0] : ub.badges
            return {
              icon: badge?.icon || "",
              name: badge?.name || "",
            }
          })
        setVisibleBadges(visible)
      }

      setSelectedBadgeId("")
      setBadgeEvidence("")
      setBadgeProofFile(null)
      setShowBadgeRequestDialog(false)
      alert("뱃지 신청이 완료되었습니다. 검토 후 승인되면 프로필에 노출됩니다.")
    } catch (error) {
      console.error("Failed to request badge:", error)
      const errorMessage = error instanceof Error ? error.message : "뱃지 신청에 실패했습니다."
      alert(errorMessage)
    } finally {
      setAddingBadge(false)
    }
  }

  const handleRemoveBadge = async (userBadgeId: string) => {
    if (!showProfileEdit) return

    if (!confirm("뱃지를 삭제하시겠습니까?")) return

    try {
      await removeBadge(userBadgeId)

      if (user) {
        const supabase = createClient()
        const { data } = await supabase
          .from("user_badges")
          .select(`
            id,
            badge_id,
            is_visible,
            status,
            evidence,
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
          setUserBadges(data as unknown as UserBadgeWithBadge[])
          const visible: VisibleBadge[] = data
            .filter((ub) => ub.is_visible && ub.badges)
            .map((ub) => {
              const badge = Array.isArray(ub.badges) ? ub.badges[0] : ub.badges
              return {
                icon: badge?.icon || "",
                name: badge?.name || "",
              }
            })
          setVisibleBadges(visible)
        }
      }
    } catch (error) {
      console.error("Failed to remove badge:", error)
      const errorMessage = error instanceof Error ? error.message : "뱃지 삭제에 실패했습니다."
      alert(errorMessage)
    }
  }

  const handleOpenProfileEdit = async () => {
    setShowProfileEdit(true)

    if (user) {
      const supabase = createClient()
      const [userBadgesResult, allBadgesResult] = await Promise.all([
        supabase
          .from("user_badges")
          .select(`
            id,
            badge_id,
            is_visible,
            status,
            evidence,
            badges:badge_id (
              id,
              name,
              icon,
              category,
              description,
              is_active
            )
          `)
          .eq("user_id", user.id)
          .order("created_at", { ascending: false }),
        supabase
          .from("badges")
          .select("id, name, icon, category, description")
          .or("is_active.eq.true,is_active.is.null") // 활성화된 뱃지만 조회 (true 또는 null)
          .order("category", { ascending: true })
          .order("name", { ascending: true })
      ])

      if (userBadgesResult.data) {
        // Filter out inactive badges from user's badges in edit mode
        const activeUserBadges = userBadgesResult.data.filter((ub: any) =>
          !ub.badges || ub.badges.is_active !== false
        )
        setUserBadges(activeUserBadges as unknown as UserBadgeWithBadge[])
      }
      if (allBadgesResult.data) {
        setAllBadges(allBadgesResult.data as unknown as BadgeType[])
      }
    }
  }

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith("image/")) {
      alert("이미지 파일만 업로드 가능합니다.")
      return
    }

    setIsUploading(true)
    try {
      const formData = new FormData()
      formData.append("file", file)

      const uploadResponse = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })

      if (!uploadResponse.ok) {
        let errorMessage = "이미지 업로드 실패"
        try {
          const errorData = await uploadResponse.json()
          errorMessage = errorData.error || errorMessage
        } catch {
          const errorText = await uploadResponse.text()
          errorMessage = errorText || errorMessage
        }
        throw new Error(errorMessage)
      }

      const uploadData = await uploadResponse.json()

      if (!uploadData.url) {
        throw new Error("업로드된 이미지 URL을 받지 못했습니다.")
      }

      await updateProfileAvatar(uploadData.url)

      setProfile((prev) => {
        if (!prev) return prev
        return {
          ...prev,
          avatar_url: uploadData.url,
        }
      })

      // 프로필 사진 업데이트 후 페이지 새로고침
      router.refresh()
    } catch (error) {
      console.error("Avatar upload error:", error)
      const errorMessage = error instanceof Error ? error.message : "프로필 이미지 업로드에 실패했습니다."
      alert(`프로필 이미지 업로드 실패\n\n${errorMessage}`)
    } finally {
      setIsUploading(false)
    }
  }

  const mainContent = (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">내 프로필</h1>
      </div>

      <div className="grid gap-6 md:grid-cols-12">

        {/* 1. 왼쪽 컬럼 (프로필 카드) */}
        <div className="md:col-span-5 lg:col-span-5 xl:col-span-4 flex flex-col gap-4">

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
                        alt={profile.full_name || "Profile"}
                        width={256}
                        height={256}
                        quality={100}
                        priority
                        unoptimized
                        className="object-cover h-full w-full"
                      />
                    ) : (
                      <Image
                        src={`https://api.dicebear.com/9.x/notionists/svg?seed=${profile?.full_name || user.email}`}
                        alt={profile?.full_name || "Profile"}
                        width={256}
                        height={256}
                        quality={100}
                        priority
                        unoptimized
                        className="object-cover h-full w-full bg-slate-50"
                      />
                    )}
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

              {(profile?.company || profile?.position || profile?.company_2 || profile?.position_2) && (
                <div className="flex flex-col gap-1 items-center">
                  {(profile?.company || profile?.position) && (
                    <p className="text-slate-600 text-sm">
                      {profile?.company}
                      {profile?.company && profile?.position && " · "}
                      {profile?.position}
                    </p>
                  )}
                  {(profile?.company_2 || profile?.position_2) && (
                    <p className="text-slate-600 text-sm">
                      {profile?.company_2}
                      {profile?.company_2 && profile?.position_2 && " · "}
                      {profile?.position_2}
                    </p>
                  )}
                </div>
              )}

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

              {profile?.introduction && (
                <p className="text-slate-600 text-sm mb-4 text-center whitespace-pre-line">
                  {profile.introduction}
                </p>
              )}

              <Separator className="w-full mb-6" />

              <Button
                variant="outline"
                size="sm"
                onClick={handleOpenProfileEdit}
                className="w-full mb-6"
              >
                <Edit3 className="h-4 w-4 mr-2" />
                프로필 편집
              </Button>

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
                <span suppressHydrationWarning>가입일: {new Date(user.created_at).toLocaleDateString()}</span>
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

        {/* 2. 오른쪽 컬럼 (통계 및 리스트) */}
        <div className="md:col-span-7 lg:col-span-7 xl:col-span-8 space-y-6">

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
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

          <Card className="border-slate-200 bg-white shadow-sm min-h-[400px]">
            <CardContent className="p-0">
              <div className="px-6 py-4 border-b border-slate-100">
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  {activeTab === "posts" && <><Edit3 className="h-5 w-5 text-indigo-600" /> 작성한 게시글</>}
                  {activeTab === "created_events" && <><CalendarDays className="h-5 w-5 text-indigo-600" /> 만든 이벤트</>}
                  {activeTab === "participated_events" && <><Ticket className="h-5 w-5 text-indigo-600" /> 참석 신청</>}
                </h2>
              </div>

              <div className="min-h-[300px]">
                {activeTab === "posts" && (
                  <div className="flex flex-col">
                    {userPosts.length > 0 ? (
                      userPosts.map((post) => (
                        <PostListItem post={post} key={post.id} />
                      ))
                    ) : (
                      <EmptyState message="작성한 게시글이 없습니다." />
                    )}
                  </div>
                )}

                {activeTab === "created_events" && (
                  <div className="flex flex-col">
                    {createdEvents.length > 0 ? (
                      createdEvents.map((event) => (
                        <EventListItem event={event} key={event.id} />
                      ))
                    ) : (
                      <EmptyState message="만든 이벤트가 없습니다." />
                    )}
                  </div>
                )}

                {activeTab === "participated_events" && (
                  <div className="flex flex-col">
                    {registeredEvents.length > 0 ? (
                      registeredEvents.map((event) => (
                        <EventListItem event={event} key={event.id} />
                      ))
                    ) : (
                      <EmptyState message="참석 신청한 이벤트가 없습니다." />
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )

  return (
    <>
      <Dialog open={showBadgeManager} onOpenChange={setShowBadgeManager}>
        <DialogContent className="sm:max-w-lg bg-white rounded-xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2">
              <Medal className="h-5 w-5 text-slate-700" />
              뱃지 관리 및 노출 설정
            </DialogTitle>
          </DialogHeader>
          <div className="mt-6">
            <BadgeManager userId={user.id} />
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showBadgeRequestDialog} onOpenChange={setShowBadgeRequestDialog}>
        <DialogContent className="sm:max-w-lg bg-white rounded-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">
              뱃지 발급 신청
            </DialogTitle>
            <DialogDescription className="text-sm text-slate-500">
              신청할 뱃지를 선택하고 증빙 자료를 제출해주세요.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-6 space-y-6">
            {/* 뱃지 선택 */}
            <div>
              <Label className="mb-3 block text-slate-700">
                신청할 뱃지 선택 <span className="text-red-500">*</span>
              </Label>
              <div className="max-h-[400px] overflow-y-auto border border-slate-200 rounded-lg p-4 bg-slate-50">
                {(() => {
                  const availableBadges = allBadges.filter(
                    (badge) => !userBadges.some((ub) => ub.badge_id === badge.id)
                  )

                  // 뱃지 이름에서 숫자 추출 함수
                  const extractNumber = (badgeName: string): number => {
                    // 유니콘은 가장 큰 숫자로 처리 (정렬 시 마지막에 오도록)
                    if (badgeName.includes('유니콘')) return Infinity

                    // 숫자와 단위(억, 만, 조 등) 추출
                    const match = badgeName.match(/(\d+(?:\.\d+)?)\s*(억|만|조|만\+|억\+|조\+)/)
                    if (!match) return 0

                    const num = parseFloat(match[1])
                    const unit = match[2]

                    // 단위를 숫자로 변환
                    if (unit.includes('조')) return num * 1000000000000
                    if (unit.includes('억')) return num * 100000000
                    if (unit.includes('만')) return num * 10000
                    return num
                  }

                  // 카테고리별로 그룹화하고 정렬
                  const groupedBadges = availableBadges.reduce((acc, badge) => {
                    const category = badge.category || '기타'
                    if (!acc[category]) {
                      acc[category] = []
                    }
                    acc[category].push(badge)
                    return acc
                  }, {} as Record<string, typeof availableBadges>)

                  // 각 카테고리 내에서 숫자 순서로 정렬 (유니콘은 마지막)
                  Object.keys(groupedBadges).forEach(category => {
                    groupedBadges[category].sort((a, b) => {
                      const numA = extractNumber(a.name)
                      const numB = extractNumber(b.name)
                      // Infinity는 항상 마지막에 오도록
                      if (numA === Infinity && numB === Infinity) return 0
                      if (numA === Infinity) return 1
                      if (numB === Infinity) return -1
                      return numA - numB
                    })
                  })

                  const categoryLabels: Record<string, string> = {
                    corporate_revenue: '기업 매출',
                    investment: '투자 규모',
                    valuation: '기업가치',
                    influence: '인플루언서',
                    professional: '전문직',
                    community: '커뮤니티',
                  }

                  if (availableBadges.length === 0) {
                    return (
                      <div className="text-center py-8 text-slate-500 text-sm">
                        신청 가능한 뱃지가 없습니다.
                      </div>
                    )
                  }

                  return (
                    <div className="space-y-4">
                      {Object.entries(groupedBadges).map(([category, badges]) => (
                        <div key={category}>
                          <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                            {categoryLabels[category] || category}
                          </h4>
                          <div className="grid grid-cols-2 gap-2">
                            {badges.map((badge) => (
                              <button
                                key={badge.id}
                                type="button"
                                onClick={() => setSelectedBadgeId(badge.id)}
                                className={cn(
                                  "flex items-center gap-2 p-3 rounded-lg border-2 transition-all text-left",
                                  selectedBadgeId === badge.id
                                    ? "border-slate-900 bg-slate-900 text-white"
                                    : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                                )}
                              >
                                <span className="text-lg">{badge.icon}</span>
                                <span className="text-sm font-medium flex-1">{badge.name}</span>
                                {selectedBadgeId === badge.id && (
                                  <span className="text-white">✓</span>
                                )}
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )
                })()}
              </div>
            </div>

            {/* 필요한 증빙서류 안내 */}
            {selectedBadgeId && getRequiredDocuments(selectedBadgeId).length > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-2">
                  <Info className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <h4 className="text-sm font-semibold text-blue-900 mb-2">
                      필요한 증빙서류
                    </h4>
                    <ul className="text-sm text-blue-800 space-y-1">
                      {getRequiredDocuments(selectedBadgeId).map((doc, idx) => (
                        <li key={idx} className="flex items-center gap-2">
                          <span className="text-blue-500">•</span>
                          <span>{doc}</span>
                        </li>
                      ))}
                    </ul>
                    <p className="text-xs text-blue-700 mt-2">
                      위 증빙서류 중 하나 이상을 첨부하거나 링크로 제공해주세요.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* 증빙 자료 입력 */}
            <div>
              <Label htmlFor="badge_evidence" className="mb-2 block text-slate-700">
                증빙 자료 <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="badge_evidence"
                value={badgeEvidence}
                onChange={(e) => setBadgeEvidence(e.target.value)}
                placeholder={
                  selectedBadgeId && getRequiredDocuments(selectedBadgeId).length > 0
                    ? `예: ${getRequiredDocuments(selectedBadgeId)[0]} 링크 또는 설명을 입력해주세요`
                    : "예: 링크, 설명, 참고 자료 등을 입력해주세요"
                }
                rows={5}
                className="bg-white border-slate-200 focus-visible:ring-slate-900 resize-none mb-3"
              />

              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <input
                    type="file"
                    id="badge-proof-file"
                    className="hidden"
                    accept=".jpg,.jpeg,.png,.pdf"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) {
                        // 파일 확장자 검증
                        const allowedExtensions = ['.jpg', '.jpeg', '.png', '.pdf']
                        const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase()
                        if (!allowedExtensions.includes(fileExtension)) {
                          alert('JPG, JPEG, PNG, PDF 파일만 업로드 가능합니다.')
                          e.target.value = ''
                          return
                        }
                        // 파일 크기 검증 (10MB)
                        const maxSize = 10 * 1024 * 1024
                        if (file.size > maxSize) {
                          alert('파일 크기는 10MB를 초과할 수 없습니다.')
                          e.target.value = ''
                          return
                        }
                        setBadgeProofFile(file)
                      }
                    }}
                  />
                  <Label
                    htmlFor="badge-proof-file"
                    className="cursor-pointer flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 transition-colors text-sm font-medium text-slate-600"
                  >
                    <Paperclip className="h-4 w-4" />
                    파일 첨부
                  </Label>
                  {badgeProofFile && (
                    <div className="flex items-center gap-2 text-sm text-slate-600 bg-blue-50 px-3 py-2 rounded-lg border border-blue-100">
                      <FileText className="h-4 w-4 text-blue-600" />
                      <span className="truncate max-w-[200px]">{badgeProofFile.name}</span>
                      <button
                        onClick={() => setBadgeProofFile(null)}
                        className="ml-1 p-0.5 hover:bg-blue-100 rounded-full transition-colors"
                      >
                        <X className="h-3 w-3 text-slate-400 hover:text-red-500" />
                      </button>
                    </div>
                  )}
                </div>
                <p className="text-xs text-slate-500">
                  업로드 가능: JPG, JPEG, PNG, PDF (최대 10MB)
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowBadgeRequestDialog(false)
                  setBadgeEvidence("")
                  setBadgeProofFile(null)
                }}
                className="h-11 px-6"
              >
                취소
              </Button>
              <Button
                onClick={handleRequestBadge}
                disabled={(!badgeEvidence.trim() && !badgeProofFile) || addingBadge}
                className={cn(
                  "h-11 px-8 font-bold transition-all",
                  "bg-slate-900 hover:bg-slate-800 text-white shadow-md hover:shadow-lg",
                  addingBadge && "opacity-70 cursor-not-allowed"
                )}
              >
                {addingBadge ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    제출 중...
                  </>
                ) : (
                  "제출하기"
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showProfileEdit} onOpenChange={setShowProfileEdit} modal={false}>
        <DialogContent className="sm:max-w-lg bg-white rounded-xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">프로필 편집</DialogTitle>
            <DialogDescription className="text-sm text-slate-500">
              다른 멤버들에게 보여질 프로필 정보를 수정합니다.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-6 space-y-6">
            {/* 기본 정보 섹션 */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="full_name" className="mb-2 block text-sm font-semibold text-slate-900">이름 <span className="text-red-500">*</span></Label>
                <Input
                  id="full_name"
                  value={editForm.full_name}
                  onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
                  placeholder="이름을 입력하세요"
                  className="bg-white border-slate-200 focus-visible:ring-slate-900 h-11"
                />
              </div>

              <div>
                <div className="flex gap-3">
                  <div className="flex-1">
                    <Label htmlFor="company" className="mb-2 block text-sm font-semibold text-slate-900">소속 1</Label>
                    <Input
                      id="company"
                      value={editForm.company}
                      onChange={(e) => setEditForm({ ...editForm, company: e.target.value })}
                      placeholder="회사 또는 조직명"
                      className="bg-white border-slate-200 focus-visible:ring-slate-900 h-11"
                    />
                  </div>
                  <div className="flex-1">
                    <Label htmlFor="position" className="mb-2 block text-sm font-semibold text-slate-900">직책 1</Label>
                    <Input
                      id="position"
                      value={editForm.position}
                      onChange={(e) => setEditForm({ ...editForm, position: e.target.value })}
                      placeholder="예: CEO"
                      className="bg-white border-slate-200 focus-visible:ring-slate-900 h-11"
                    />
                  </div>
                </div>
              </div>

              <div>
                <div className="flex gap-3">
                  <div className="flex-1">
                    <Label htmlFor="company_2" className="mb-2 block text-sm font-semibold text-slate-900">소속 2 <span className="text-xs font-normal text-slate-500">(선택)</span></Label>
                    <Input
                      id="company_2"
                      value={editForm.company_2 || ""}
                      onChange={(e) => setEditForm({ ...editForm, company_2: e.target.value })}
                      placeholder="추가 소속"
                      className="bg-white border-slate-200 focus-visible:ring-slate-900 h-11"
                    />
                  </div>
                  <div className="flex-1">
                    <Label htmlFor="position_2" className="mb-2 block text-sm font-semibold text-slate-900">직책 2 <span className="text-xs font-normal text-slate-500">(선택)</span></Label>
                    <Input
                      id="position_2"
                      value={editForm.position_2 || ""}
                      onChange={(e) => setEditForm({ ...editForm, position_2: e.target.value })}
                      placeholder="추가 직책"
                      className="bg-white border-slate-200 focus-visible:ring-slate-900 h-11"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* 역할 섹션 */}
            <div className="pt-2 border-t border-slate-100">
              <Label className="mb-3 block text-sm font-semibold text-slate-900">역할 <span className="text-xs font-normal text-slate-500">(최대 2개 선택 가능)</span></Label>
              <div className="flex gap-2">
                {(["사업가", "투자자", "크리에이터"] as const).map((type) => {
                  const isSelected = editForm.member_type.includes(type)
                  const canSelect = !isSelected && editForm.member_type.length < 2

                  return (
                    <Button
                      key={type}
                      type="button"
                      variant={isSelected ? "default" : "outline"}
                      onClick={() => {
                        if (isSelected) {
                          // 선택 해제
                          setEditForm({
                            ...editForm,
                            member_type: editForm.member_type.filter(t => t !== type)
                          })
                        } else if (canSelect) {
                          // 선택 추가
                          setEditForm({
                            ...editForm,
                            member_type: [...editForm.member_type, type]
                          })
                        }
                      }}
                      disabled={!isSelected && !canSelect}
                      className={cn(
                        "flex-1 h-11",
                        isSelected
                          ? "bg-slate-900 hover:bg-slate-800 text-white"
                          : canSelect
                            ? "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                            : "bg-white border-slate-200 text-slate-400 cursor-not-allowed opacity-50"
                      )}
                    >
                      {type}
                    </Button>
                  )
                })}
              </div>

              <Label htmlFor="tagline" className="mb-2 block text-sm font-semibold text-slate-900">나를 표현하는 한마디</Label>
              <Input
                id="tagline"
                value={editForm.tagline || ""}
                onChange={(e) => setEditForm({ ...editForm, tagline: e.target.value })}
                placeholder="예) 좋은 사람들과 함께 성장하는 창업가입니다."
                className="bg-white border-slate-200 focus-visible:ring-slate-900 h-11"
              />
            </div>

            {/* 자기소개 섹션 */}
            <div className="pt-2 border-t border-slate-100">
              <Label htmlFor="introduction" className="mb-2 block text-sm font-semibold text-slate-900">자기소개</Label>
              <Textarea
                id="introduction"
                value={editForm.introduction}
                onChange={(e) => setEditForm({ ...editForm, introduction: e.target.value })}
                placeholder="나의 경험, 관심사, 커뮤니티에서 하고 싶은 활동 등을 자유롭게 적어주세요."
                rows={4}
                className="bg-white border-slate-200 focus-visible:ring-slate-900 resize-none"
              />
            </div>

            {/* 프로필 공개 설정 */}
            <div className="pt-2 border-t border-slate-100">
              <div
                className="flex items-center justify-between p-4 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50 transition-colors bg-white"
                onClick={() => {
                  const newValue = !editForm.is_profile_public
                  setEditForm(prev => ({ ...prev, is_profile_public: newValue }))
                  handleToggleProfileVisibility(newValue)
                }}
              >
                <div className="flex-1">
                  <Label className="text-sm font-semibold text-slate-900 cursor-pointer pointer-events-none">
                    멤버 리스트에 내 프로필을 공개합니다
                  </Label>
                  <p className="text-xs text-slate-500 mt-1 pointer-events-none">
                    공개 시 멤버 페이지에서 프로필을 확인할 수 있습니다
                  </p>
                </div>
                <Switch
                  checked={editForm.is_profile_public}
                  onCheckedChange={(checked) => {
                    setEditForm(prev => ({ ...prev, is_profile_public: checked }))
                    handleToggleProfileVisibility(checked)
                  }}
                  className="data-[state=checked]:bg-slate-900 data-[state=unchecked]:bg-slate-300"
                />
              </div>
            </div>

            {/* 뱃지 섹션 */}
            <div className="pt-2 border-t border-slate-100">
              <Label className="mb-2 block text-sm font-semibold text-slate-900">
                뱃지 발급 신청
              </Label>
              <p className="text-xs text-slate-500 mb-4">
                나의 성과를 증명할 뱃지를 신청하세요. 증빙 자료 검토 후 승인되면 프로필에 노출됩니다.
              </p>

              <Button
                onClick={() => {
                  setSelectedBadgeId("")
                  setBadgeEvidence("")
                  setBadgeProofFile(null)
                  setShowBadgeRequestDialog(true)
                }}
                disabled={addingBadge || userBadges.length >= 5}
                className="h-11 px-6 w-full border-2 border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 text-slate-900 font-medium"
                variant="outline"
              >
                <Medal className="h-4 w-4 mr-2" />
                뱃지 발급 신청하기
              </Button>

              <div className="space-y-3">
                {userBadges.filter(ub => ub.status === 'approved' || !ub.status).length > 0 && (
                  <div>
                    <p className="text-xs text-slate-500 mb-2">승인된 뱃지</p>
                    <div className="flex flex-wrap gap-2 min-h-[60px] p-3 border border-slate-200 rounded-lg bg-slate-50">
                      {userBadges
                        .filter(ub => ub.status === 'approved' || !ub.status)
                        .map((userBadge) => {
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
                        })}
                    </div>
                  </div>
                )}

                {userBadges.filter(ub => ub.status === 'pending').length > 0 && (
                  <div>
                    <p className="text-xs text-slate-500 mb-2">심사 중인 뱃지</p>
                    <div className="flex flex-wrap gap-2 min-h-[60px] p-3 border border-amber-200 rounded-lg bg-amber-50">
                      {userBadges
                        .filter(ub => ub.status === 'pending')
                        .map((userBadge) => {
                          const badge = userBadge.badges
                          if (!badge) return null
                          return (
                            <div
                              key={userBadge.id}
                              className="flex items-center gap-2 rounded-full bg-white px-3 py-1.5 text-sm font-medium border border-amber-300 shadow-sm"
                            >
                              <span className="text-base">{badge.icon}</span>
                              <span>{badge.name}</span>
                              <Badge variant="outline" className="ml-1 text-xs bg-amber-100 text-amber-700 border-amber-300">
                                심사 중
                              </Badge>
                            </div>
                          )
                        })}
                    </div>
                  </div>
                )}

                {userBadges.filter(ub => ub.status === 'rejected').length > 0 && (
                  <div>
                    <p className="text-xs text-slate-500 mb-2">거절된 뱃지</p>
                    <div className="flex flex-wrap gap-2 min-h-[60px] p-3 border border-red-200 rounded-lg bg-red-50">
                      {userBadges
                        .filter(ub => ub.status === 'rejected')
                        .map((userBadge) => {
                          const badge = userBadge.badges
                          if (!badge) return null
                          return (
                            <div
                              key={userBadge.id}
                              className="flex items-center gap-2 rounded-full bg-white px-3 py-1.5 text-sm font-medium border border-red-300 shadow-sm opacity-60"
                            >
                              <span className="text-base">{badge.icon}</span>
                              <span>{badge.name}</span>
                              <Badge variant="outline" className="ml-1 text-xs bg-red-100 text-red-700 border-red-300">
                                거절됨
                              </Badge>
                            </div>
                          )
                        })}
                    </div>
                  </div>
                )}

                {userBadges.length === 0 && (
                  <div className="flex flex-wrap gap-2 min-h-[60px] p-3 border border-slate-200 rounded-lg bg-slate-50">
                    <p className="text-sm text-slate-500 w-full text-center py-2">
                      추가된 뱃지가 없습니다.
                    </p>
                  </div>
                )}
              </div>
            </div>

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

      {mainContent}
    </>
  )
}
