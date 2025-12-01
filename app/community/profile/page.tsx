"use client"

import { createClient } from "@/lib/supabase/client"
import { getCurrentUserProfile } from "@/lib/queries/profiles"
import { Card, CardContent } from "@/components/ui/card"
import { Mail, Calendar, Edit3, CalendarDays, Ticket, Medal, Camera, LogOut, Linkedin, Instagram, Link as LinkIcon, FileText, X, Loader2, Paperclip } from "lucide-react"
import Image from "next/image"
import { useEffect, useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { BadgeManager } from "@/components/badge-manager"
import { updateProfileAvatar, updateProfileInfo } from "@/lib/actions/user"
import { removeBadge } from "@/lib/actions/badges"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Collapsible, CollapsibleContent } from "@/components/ui/collapsible"
import type { User, Profile } from "@/lib/types/profile"
import type { EventListItem } from "@/lib/types/events"
import type { PostListItem } from "@/lib/types/posts"
import type { VisibleBadge, Badge as BadgeType, UserBadgeWithBadge } from "@/lib/types/badges"
import type { LucideIcon } from "lucide-react"
import { ContentLayout } from "@/components/layouts/ContentLayout"
import { StandardRightSidebar } from "@/components/standard-right-sidebar"
import Link from "next/link"
import { MapPin } from "lucide-react"

type TabType = "posts" | "created_events" | "participated_events"

// 포인트 거래 내역 타입 (현재 미사용이나 타입 유지)
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
                <span className="text-xs text-slate-400">
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
    const eventDate = new Date(event.event_date)
    const now = new Date()
    const isPast = eventDate < now
    
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
                    <Image src={event.thumbnail_url} alt="" fill className="object-cover" />
                ) : (
                    <div className="flex h-full w-full items-center justify-center text-slate-300"><Ticket className="h-6 w-6" /></div>
                )}
            </div>
            <div className="flex-1 min-w-0">
                <h3 className="font-medium text-slate-900 truncate mb-1 group-hover:text-indigo-600 transition-colors">{event.title}</h3>
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
  const [visibleBadges, setVisibleBadges] = useState<VisibleBadge[]>([]) 
  const [userBadges, setUserBadges] = useState<UserBadgeWithBadge[]>([]) 
  const [allBadges, setAllBadges] = useState<BadgeType[]>([]) 
  
  // UI State
  const [activeTab, setActiveTab] = useState<TabType>("posts") 
  const [loading, setLoading] = useState(true)
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
    introduction: "",
    is_profile_public: false,
    linkedin_url: "",
    instagram_url: "",
    threads_url: "",
    website_url: "",
  })

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        
        const userProfile = await getCurrentUserProfile(supabase)

        if (!userProfile || !userProfile.user) {
          setLoading(false) 
          router.push("/")
          return
        }

        setUser(userProfile.user)
        let profileData: Profile | null = userProfile.profile

        let myEvents: EventListItem[] = []
        let myPosts: PostListItem[] = []
        let myRegistrations: EventRegistrationQueryResult[] = []
        let badgesData: BadgeQueryResult[] = []

        if (profileData) {
          setProfile(profileData)
          
          setEditForm({
            full_name: profileData.full_name || "",
            company: profileData.company || "",
            position: profileData.position || "",
            company_2: profileData.company_2 || "",
            position_2: profileData.position_2 || "",
            introduction: profileData.introduction || "",
            is_profile_public: profileData.is_profile_public || false,
            linkedin_url: profileData.linkedin_url || "",
            instagram_url: profileData.instagram_url || "",
            threads_url: profileData.threads_url || "",
            website_url: profileData.website_url || "",
          })
        }

        await Promise.all([
          (async () => {
            try {
              const result = await supabase
                .from("events")
                .select(`id, title, thumbnail_url, event_date, location, created_at`)
                .eq("created_by", userProfile.user.id)
                .order("created_at", { ascending: false })
                .limit(20)
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
                .limit(20)
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
                .limit(20)
              
              const timeoutPromise = new Promise((_, reject) => 
                setTimeout(() => reject(new Error('쿼리 타임아웃')), 5000)
              )
              
              const result = await Promise.race([queryPromise, timeoutPromise]) as { error?: Error; data?: EventRegistrationQueryResult[] }
              if (!result.error && result.data) {
                myRegistrations = result.data
              }
            } catch (error) {
              console.error('등록 이벤트 로드 오류:', error)
              myRegistrations = []
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
                .limit(10)
              if (!result.error && result.data) {
                badgesData = result.data
              }
            } catch (error) {
              console.error('뱃지 로드 오류:', error)
            }
          })()
        ])

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
              created_at: reg.events.event_date, 
              registration_date: reg.registered_at,
            }
          })
          .filter((reg): reg is EventListItem => reg !== null)
        setRegisteredEvents(flattenedRegistrations)
        
        const mappedBadges: VisibleBadge[] = badgesData
          .map((ub) => ub.badges)
          .filter((badge): badge is { icon: string; name: string } => badge !== null)
          .map((badge) => ({ icon: badge.icon, name: badge.name }))
        setVisibleBadges(mappedBadges)

      } catch (error) {
        console.error('데이터 로드 중 오류 발생:', error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [supabase, router])

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
        <Loader2 className="h-8 w-8 text-indigo-600 animate-spin" />
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

  const handleSaveProfile = async () => {
    if (!editForm.full_name.trim()) {
      alert("이름을 입력해주세요.")
      return
    }
    
    const formatSocialLink = (input: string, baseUrl: string) => {
      if (!input || !input.trim()) return ""
      let value = input.trim()
      
      // 이미 프로토콜이 있는 경우
      if (value.startsWith("http://") || value.startsWith("https://")) {
        return value
      }
      
      // 도메인이 포함된 경우 (프로토콜만 추가)
      // 간단하게 체크: baseUrl의 도메인 부분(예: instagram.com)이 포함되어 있으면 https:// 만 붙임
      const domain = baseUrl.replace("https://", "").split("/")[0]
      if (value.includes(domain)) {
        return `https://${value}`
      }
      
      // ID만 입력된 경우 (@ 제거 후 URL 생성)
      return `${baseUrl}${value.replace(/^@/, "")}`
    }

    const formatWebsiteUrl = (input: string) => {
      if (!input || !input.trim()) return ""
      let value = input.trim()
      if (!value.startsWith("http://") && !value.startsWith("https://")) {
        return `https://${value}`
      }
      return value
    }

    setIsSaving(true)
    try {
      const result = await updateProfileInfo({
        full_name: editForm.full_name,
        company: editForm.company,
        position: editForm.position,
        company_2: editForm.company_2,
        position_2: editForm.position_2,
        introduction: editForm.introduction,
        is_profile_public: editForm.is_profile_public,
        linkedin_url: formatSocialLink(editForm.linkedin_url, "https://linkedin.com/in/"),
        instagram_url: formatSocialLink(editForm.instagram_url, "https://instagram.com/"),
        threads_url: formatSocialLink(editForm.threads_url, "https://threads.net/"),
        website_url: formatWebsiteUrl(editForm.website_url),
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
          introduction: editForm.introduction,
          is_profile_public: editForm.is_profile_public,
          linkedin_url: editForm.linkedin_url,
          instagram_url: editForm.instagram_url,
          threads_url: editForm.threads_url,
          website_url: editForm.website_url,
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
        setUserBadges(data as UserBadgeWithBadge[])
        const visible: VisibleBadge[] = data
          .filter((ub) => ub.is_visible && ub.badges && ub.status === 'approved')
          .map((ub) => ({
            icon: ub.badges!.icon,
            name: ub.badges!.name,
          }))
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
          setUserBadges(data as UserBadgeWithBadge[])
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

  const handleOpenProfileEdit = async () => {
    setShowProfileEdit(true)
    
    if (user) {
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
        setAllBadges(allBadgesResult.data as BadgeType[])
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
        throw new Error("이미지 업로드 실패")
      }

      const uploadData = await uploadResponse.json()

      await updateProfileAvatar(uploadData.url)

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
        <DialogContent className="sm:max-w-lg bg-white rounded-xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">
              {selectedBadgeId && allBadges.find(b => b.id === selectedBadgeId) 
                ? `${allBadges.find(b => b.id === selectedBadgeId)!.name} 발급 신청`
                : "뱃지 발급 신청"}
            </DialogTitle>
            <DialogDescription className="text-sm text-slate-500">
              해당 뱃지를 증명할 수 있는 링크나 설명을 입력해주세요.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-6 space-y-4">
            <div>
              <Label htmlFor="badge_evidence" className="mb-2 block text-slate-700">
                증빙 자료
              </Label>
              <Textarea
                id="badge_evidence"
                value={badgeEvidence}
                onChange={(e) => setBadgeEvidence(e.target.value)}
                placeholder="예: 링크, 설명, 참고 자료 등을 입력해주세요"
                rows={5}
                className="bg-white border-slate-200 focus-visible:ring-slate-900 resize-none mb-3"
              />
              
              <div className="flex items-center gap-3">
                <input
                  type="file"
                  id="badge-proof-file"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files?.[0]) {
                      setBadgeProofFile(e.target.files[0])
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

      <Dialog open={showProfileEdit} onOpenChange={setShowProfileEdit}>
        <DialogContent className="sm:max-w-lg bg-white rounded-xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">프로필 편집</DialogTitle>
            <DialogDescription className="text-sm text-slate-500">
              다른 멤버들에게 보여질 프로필 정보를 수정합니다.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-6 space-y-6 px-1">
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

            <div>
              <div className="flex gap-4">
                <div className="flex-1">
                  <Label htmlFor="company" className="mb-2 block text-slate-700">소속 1</Label>
                  <Input
                    id="company"
                    value={editForm.company}
                    onChange={(e) => setEditForm({ ...editForm, company: e.target.value })}
                    placeholder="회사 또는 조직명"
                    className="bg-white border-slate-200 focus-visible:ring-slate-900 h-11"
                  />
                </div>
                <div className="flex-1">
                  <Label htmlFor="position" className="mb-2 block text-slate-700">직책 1</Label>
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
              <div className="flex gap-4">
                <div className="flex-1">
                  <Label htmlFor="company_2" className="mb-2 block text-slate-700">소속 2 (선택)</Label>
                  <Input
                    id="company_2"
                    value={editForm.company_2 || ""}
                    onChange={(e) => setEditForm({ ...editForm, company_2: e.target.value })}
                    placeholder="추가 소속"
                    className="bg-white border-slate-200 focus-visible:ring-slate-900 h-11"
                  />
                </div>
                <div className="flex-1">
                  <Label htmlFor="position_2" className="mb-2 block text-slate-700">직책 2 (선택)</Label>
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

            <div 
              className="flex items-center justify-between p-4 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50 transition-colors"
              onClick={() => {
                const newValue = !editForm.is_profile_public
                setEditForm(prev => ({ ...prev, is_profile_public: newValue }))
                handleToggleProfileVisibility(newValue)
              }}
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
                onCheckedChange={(checked) => {
                  setEditForm(prev => ({ ...prev, is_profile_public: checked }))
                  handleToggleProfileVisibility(checked)
                }}
                className="data-[state=checked]:bg-blue-600 data-[state=unchecked]:bg-slate-400 border border-slate-300 data-[state=checked]:border-blue-600"
              />
            </div>

            <Collapsible open={editForm.is_profile_public}>
              <CollapsibleContent className="space-y-4 data-[state=open]:animate-collapsible-down data-[state=closed]:animate-collapsible-up overflow-hidden">
                <Label className="mb-2 block text-slate-700">소셜 링크</Label>
                <p className="text-xs text-slate-500 mb-3">
                  멤버 카드에 표시될 소셜 링크를 입력해주세요.
                </p>
                
                <div>
                  <Label htmlFor="linkedin_url" className="mb-2 block text-sm text-slate-600 flex items-center gap-2">
                    <Linkedin className="h-4 w-4 text-blue-600" />
                    LinkedIn
                  </Label>
                  <Input
                    id="linkedin_url"
                    type="text"
                    value={editForm.linkedin_url}
                    onChange={(e) => setEditForm({ ...editForm, linkedin_url: e.target.value })}
                    placeholder="LinkedIn ID 또는 URL"
                    className="bg-white border-slate-200 focus-visible:ring-slate-900 h-11"
                  />
                </div>

                <div>
                  <Label htmlFor="instagram_url" className="mb-2 block text-sm text-slate-600 flex items-center gap-2">
                    <Instagram className="h-4 w-4 text-pink-600" />
                    Instagram
                  </Label>
                  <Input
                    id="instagram_url"
                    type="text"
                    value={editForm.instagram_url}
                    onChange={(e) => setEditForm({ ...editForm, instagram_url: e.target.value })}
                    placeholder="Instagram ID 또는 URL (@username)"
                    className="bg-white border-slate-200 focus-visible:ring-slate-900 h-11"
                  />
                </div>

                <div>
                  <Label htmlFor="threads_url" className="mb-2 block text-sm text-slate-600 flex items-center gap-2">
                    <LinkIcon className="h-4 w-4 text-slate-600" />
                    Threads
                  </Label>
                  <Input
                    id="threads_url"
                    type="text"
                    value={editForm.threads_url}
                    onChange={(e) => setEditForm({ ...editForm, threads_url: e.target.value })}
                    placeholder="Threads ID 또는 URL (@username)"
                    className="bg-white border-slate-200 focus-visible:ring-slate-900 h-11"
                  />
                </div>

                <div>
                  <Label htmlFor="website_url" className="mb-2 block text-sm text-slate-600 flex items-center gap-2">
                    <LinkIcon className="h-4 w-4 text-slate-600" />
                    웹사이트
                  </Label>
                  <Input
                    id="website_url"
                    type="url"
                    value={editForm.website_url}
                    onChange={(e) => setEditForm({ ...editForm, website_url: e.target.value })}
                    placeholder="https://example.com"
                    className="bg-white border-slate-200 focus-visible:ring-slate-900 h-11"
                  />
                </div>
              </CollapsibleContent>
            </Collapsible>

            <div>
              <Label className="mb-2 block text-slate-700">
                뱃지 발급 신청
              </Label>
              <p className="text-xs text-slate-500 mb-3">
                나의 성과를 증명할 뱃지를 신청하세요. 증빙 자료 검토 후 승인되면 프로필에 노출됩니다.
              </p>
              
              <div className="flex gap-2 mb-4">
                <Select value={selectedBadgeId} onValueChange={setSelectedBadgeId}>
                  <SelectTrigger className="flex-1 h-11 bg-white border-slate-200 focus-visible:ring-slate-900">
                    <SelectValue placeholder="신청할 뱃지 선택" />
                  </SelectTrigger>
                  <SelectContent className="z-[9999]">
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
                  onClick={() => {
                    if (!selectedBadgeId) return
                    setShowBadgeRequestDialog(true)
                  }}
                  disabled={!selectedBadgeId || addingBadge || userBadges.length >= 5}
                  className="h-11 px-6 shrink-0"
                >
                  {addingBadge ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      신청 중...
                    </>
                  ) : (
                    <>
                      <FileText className="h-4 w-4 mr-2" />
                      신청하기
                    </>
                  )}
                </Button>
              </div>

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

      <ContentLayout
        mainContent={mainContent}
        rightSidebar={<StandardRightSidebar />}
      />
    </>
  )
}
