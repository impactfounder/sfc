"use client"

import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Mail, Calendar, Coins, MapPin, Users, CalendarDays, Medal, Edit3, Ticket, Crown, CheckCircle } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { useEffect, useState, useMemo, type ReactNode } from "react"
import { useRouter } from "next/navigation"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { X } from "lucide-react"
import { BadgeManager } from "@/components/badge-manager" // 뱃지 관리 컴포넌트

type TabType = "points" | "posts" | "created_events" | "participated_events";

// 뱃지 데이터 타입 정의
type VisibleBadge = { icon: string; name: string }

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

function PostListItem({ post }: { post: any }) {
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

function EventListItem({ event }: { event: any }) {
    return (
        <Link key={event.id} href={`/community/events/${event.id}`} className="flex gap-4 p-5 hover:bg-slate-50 transition-colors">
            <div className="h-16 w-16 shrink-0 rounded-lg bg-slate-100 overflow-hidden">
                {event.thumbnail_url ? (
                    <Image src={event.thumbnail_url} alt="" width={64} height={64} className="h-full w-full object-cover" />
                ) : (
                    <div className="flex h-full w-full items-center justify-center text-slate-300"><Ticket className="h-6 w-6" /></div>
                )}
            </div>
            <div className="flex-1 min-w-0">
                <h3 className="font-medium text-slate-900 truncate mb-1">{event.title}</h3>
                <div className="flex items-center gap-3 text-xs text-slate-500">
                    <span className="flex items-center gap-1"><CalendarDays className="h-3 w-3" /> {new Date(event.event_date).toLocaleDateString()}</span>
                    <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {event.location}</span>
                </div>
                <div className="mt-2">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-green-50 text-green-700">
                        {event.registration_date ? '신청 완료' : (event.status === 'upcoming' ? '예정' : '종료')}
                    </span>
                </div>
            </div>
        </Link>
    )
}




export default function ProfilePage() {
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  
  // Data States
  const [createdEvents, setCreatedEvents] = useState<any[]>([])
  const [userPosts, setUserPosts] = useState<any[]>([])
  const [registeredEvents, setRegisteredEvents] = useState<any[]>([])
  const [transactions, setTransactions] = useState<any[]>([])
  const [visibleBadges, setVisibleBadges] = useState<VisibleBadge[]>([]) // 노출 뱃지 목록
  
  // UI State
  const [activeTab, setActiveTab] = useState<TabType>("posts") // 기본값: 게시글
  const [loading, setLoading] = useState(true)
  const [showBadgeManager, setShowBadgeManager] = useState(false) // 뱃지 관리 모달 상태

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        
        const { data: { user: currentUser }, error: userError } = await supabase.auth.getUser()

        if (userError || !currentUser) {
          router.push("/")
          return
        }

        setUser(currentUser)

        // 병렬로 모든 데이터 가져오기
        const [
          { data: profileData, error: profileError },
          { data: myEvents, error: eventsError },
          { data: myPosts, error: postsError },
          { data: myRegistrations, error: registrationsError },
          { data: myTransactions, error: transactionsError },
          { data: badgesData, error: badgesError }
        ] = await Promise.all([
          supabase.from("profiles").select("*").eq("id", currentUser.id).single(),
          supabase
            .from("events")
            .select(`*, profiles:created_by (full_name, avatar_url)`)
            .eq("created_by", currentUser.id)
            .order("created_at", { ascending: false }),
          supabase
            .from("posts")
            .select(`*, board_categories (name, slug), profiles:author_id (full_name, avatar_url)`)
            .eq("author_id", currentUser.id)
            .order("created_at", { ascending: false }),
          supabase
            .from("event_registrations")
            .select(`
              *,
              events (
                id, title, thumbnail_url, event_date, location, status, max_participants
              )
            `)
            .eq("user_id", currentUser.id)
            .order("registered_at", { ascending: false }),
          supabase
            .from("point_transactions")
            .select("*")
            .eq("user_id", currentUser.id)
            .order("created_at", { ascending: false }),
          supabase
            .from("user_badges")
            .select(`
              badges:badge_id (
                icon,
                name
              )
            `)
            .eq("user_id", currentUser.id)
            .eq("is_visible", true)
        ])

        // 에러 로깅 (치명적이지 않은 에러는 무시하고 계속 진행)
        if (profileError) console.error('프로필 로드 오류:', profileError)
        if (eventsError) console.error('이벤트 로드 오류:', eventsError)
        if (postsError) console.error('게시글 로드 오류:', postsError)
        if (registrationsError) console.error('등록 이벤트 로드 오류:', registrationsError)
        if (transactionsError) console.error('포인트 내역 로드 오류:', transactionsError)
        if (badgesError) console.error('뱃지 로드 오류:', badgesError)

        // 데이터 설정
        setProfile(profileData || null)
        setCreatedEvents(myEvents || [])
        setUserPosts(myPosts || [])
        
        const flattenedRegistrations = myRegistrations?.map((reg: any) => ({
          ...reg.events,
          registration_date: reg.registered_at
        })).filter((reg: any) => reg.id) || []
        setRegisteredEvents(flattenedRegistrations)
        
        setTransactions(myTransactions || [])
        
        const mappedBadges = badgesData
          ?.map((ub: any) => ub.badges)
          .filter(Boolean)
          .map((badge: any) => ({ icon: badge.icon, name: badge.name })) || []
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

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
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
    icon: any,
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




  return (
    <>
      {/* 뱃지 관리 시트 */}
      <Sheet open={showBadgeManager} onOpenChange={setShowBadgeManager}>
        <SheetContent side="right" className="w-full sm:max-w-md p-0">
          <SheetHeader className="p-4 border-b">
            <SheetTitle className="text-lg font-bold flex items-center gap-2">
              <Medal className="h-5 w-5 text-slate-700" />
              뱃지 관리 및 노출 설정
            </SheetTitle>
            <Button variant="ghost" size="icon" className="absolute top-4 right-4" onClick={() => setShowBadgeManager(false)}>
              <X className="h-4 w-4" />
            </Button>
          </SheetHeader>
          <div className="p-4 overflow-y-auto h-[calc(100vh-65px)]">
            <BadgeManager userId={user.id} />
          </div>
        </SheetContent>
      </Sheet>

      <div className="min-h-screen bg-slate-50 p-4 md:p-8">
        <div className="mx-auto max-w-6xl">
          <h1 className="mb-8 text-2xl md:text-3xl font-bold tracking-tight text-slate-900">내 프로필</h1>

          <div className="grid gap-6 lg:grid-cols-12">
            
            {/* 1. 왼쪽: 프로필 정보 카드 - 4칸 */}
            <Card className="lg:col-span-4 h-fit border-slate-200 shadow-sm overflow-hidden">
              <CardContent className="p-8 flex flex-col items-center text-center">
                
                <div className="mb-6 relative">
                  <div className="h-32 w-32 rounded-full border-4 border-white shadow-lg overflow-hidden bg-slate-100">
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
                  </div>
                  <div className="absolute bottom-0 right-0 bg-slate-900 text-white text-[10px] font-bold px-2 py-1 rounded-full border-2 border-white shadow-sm">
                    {profile?.role?.toUpperCase() || "MEMBER"}
                  </div>
                </div>

                <h2 className="text-2xl font-bold text-slate-900 mb-1">
                  {profile?.full_name || "이름 없음"}
                </h2>
                <p className="text-slate-500 text-sm mb-6 flex items-center justify-center gap-1.5">
                  <Mail className="h-3.5 w-3.5" />
                  {user.email}
                </p>

                <Separator className="w-full mb-6" />

                {/* 내 뱃지 영역 (실제 데이터 기반) */}
                <div className="w-full space-y-3">
                  <div className="flex items-center gap-2 mb-3 justify-between">
                    <div className="flex items-center gap-2">
                        <Medal className="h-4 w-4 text-slate-900" />
                        <span className="text-sm font-bold text-slate-900">내 뱃지</span>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => setShowBadgeManager(true)} className="text-xs">
                        관리 및 등록
                    </Button>
                  </div>
                  
                  <div className="bg-slate-50 rounded-xl p-4 min-h-[80px] flex flex-wrap gap-2 justify-center md:justify-start border border-slate-200">
                    {renderBadges()}
                  </div>
                </div>

                <div className="mt-6 text-xs text-slate-400 flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  가입일: {new Date(user.created_at).toLocaleDateString()}
                </div>
              </CardContent>
            </Card>

            {/* 2. 오른쪽: 통계 카드 및 리스트 영역 - 8칸 */}
            <div className="lg:col-span-8 space-y-6">
              
              {/* 상단 통계 카드 (클릭 가능) */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard 
                  title="포인트" 
                  count={profile?.points || 0} 
                  type="points"
                  icon={Coins}
                  colorClass="bg-amber-50/30 border-amber-100"
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
              <Card className="border-slate-200 shadow-sm min-h-[400px]">
                <CardHeader className="pb-4 border-b border-slate-100">
                  <CardTitle className="text-lg flex items-center gap-2">
                    {activeTab === "points" && <><Coins className="h-5 w-5 text-amber-500" /> 포인트 내역</>}
                    {activeTab === "posts" && <><Edit3 className="h-5 w-5 text-blue-500" /> 작성한 게시글</>}
                    {activeTab === "created_events" && <><CalendarDays className="h-5 w-5 text-green-500" /> 만든 이벤트</>}
                    {activeTab === "participated_events" && <><Ticket className="h-5 w-5 text-purple-500" /> 참석 신청</>}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  
                  {/* 1. 포인트 내역 리스트 */}
                  {activeTab === "points" && (
                    <div className="divide-y divide-slate-100">
                      {transactions.length > 0 ? (
                        transactions.map((tx) => (
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
      </div>
    </>
  )
}
