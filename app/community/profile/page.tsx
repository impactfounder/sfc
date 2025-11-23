"use client"

import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Mail, Calendar, Coins, MapPin, Users, CalendarDays, Medal, Edit3, Ticket, Crown } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"

type TabType = "points" | "posts" | "created_events" | "participated_events";

export default function ProfilePage() {
  const router = useRouter()
  const supabase = createClient()
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  
  // Data States
  const [createdEvents, setCreatedEvents] = useState<any[]>([])
  const [userPosts, setUserPosts] = useState<any[]>([])
  const [registeredEvents, setRegisteredEvents] = useState<any[]>([])
  const [transactions, setTransactions] = useState<any[]>([])
  const [globalError, setGlobalError] = useState<string | null>(null); // 에러 상태 추가
  
  // UI State
  const [activeTab, setActiveTab] = useState<TabType>("posts")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      const { data: { user: currentUser } } = await supabase.auth.getUser()

      if (!currentUser) {
        router.push("/")
        return
      }

      setUser(currentUser)

      try { // ★ try 블록 시작
        setGlobalError(null);

        // 1. 프로필 조회
        const { data: profileData, error: profileError } = await supabase.from("profiles").select("*").eq("id", currentUser.id).single()
        if (profileError) throw profileError;
        setProfile(profileData)

        // 2. 내가 만든 이벤트
        const { data: myEvents } = await supabase
          .from("events")
          .select(`*, profiles:created_by (full_name, avatar_url)`)
          .eq("created_by", currentUser.id)
          .order("created_at", { ascending: false })
        setCreatedEvents(myEvents || [])

        // 3. 작성한 게시글
        const { data: myPosts } = await supabase
          .from("posts")
          .select(`*, board_categories (name, slug), profiles:author_id (full_name, avatar_url)`)
          .eq("author_id", currentUser.id)
          .order("created_at", { ascending: false })
        setUserPosts(myPosts || [])

        // 4. 참석 신청한 이벤트 (가장 복잡한 쿼리)
        const { data: myRegistrations } = await supabase
          .from("event_registrations")
          .select(`
            *,
            events (
              id, title, thumbnail_url, event_date, location, status, max_participants
            )
          `)
          .eq("user_id", currentUser.id)
          .order("registered_at", { ascending: false })
        
        const flattenedRegistrations = myRegistrations?.map((reg: any) => ({
          ...reg.events,
          registration_date: reg.registered_at
        })) || []
        setRegisteredEvents(flattenedRegistrations)

        // 5. 포인트 내역
        const { data: myTransactions } = await supabase
          .from("point_transactions")
          .select("*")
          .eq("user_id", currentUser.id)
          .order("created_at", { ascending: false })
        setTransactions(myTransactions || [])

      } catch (e: any) { // ★ catch 블록: 에러 발생 시 로깅
        console.error("Critical Profile Load Error:", e);
        setGlobalError("데이터 로딩 중 치명적인 오류가 발생했습니다. 콘솔을 확인해주세요.");
      } finally {
        setLoading(false) // ★ finally 블록: 무조건 실행 보장
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

  // 탭 변경 핸들러 및 StatCard 정의 (기존과 동일)
  const StatCard = ({ 
    title, 
    count, 
    subText, 
    type, 
    icon: Icon,
    colorClass = "bg-white border-slate-200" 
  }: { 
    title: string, 
    count: number, 
    subText: string, 
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
      <p className="text-xs text-slate-400 mt-1">{subText}</p>
    </div>
  )

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="mx-auto max-w-6xl">
        <h1 className="mb-8 text-2xl md:text-3xl font-bold tracking-tight text-slate-900">내 프로필</h1>

        {/* Global Error Message */}
        {globalError && (
          <div className="mb-6 rounded-xl bg-red-50 border border-red-200 p-4 text-red-700 text-sm font-medium">
            ⚠️ {globalError}
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-12">
          
          {/* 1. 왼쪽: 프로필 정보 카드 */}
          <Card className="lg:col-span-4 h-fit border-slate-200 shadow-sm overflow-hidden">
            <CardContent className="p-8 flex flex-col items-center text-center">
              {/* ... (프로필 이미지, 이름, 뱃지 영역은 기존과 동일) ... */}
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
                  MEMBER
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

              <div className="w-full">
                <div className="flex items-center gap-2 mb-4 justify-center md:justify-start">
                  <Medal className="h-4 w-4 text-slate-900" />
                  <span className="text-sm font-bold text-slate-900">내 뱃지</span>
                </div>
                
                <div className="bg-slate-50 rounded-xl p-4 grid grid-cols-3 gap-2">
                  <div className="flex flex-col items-center gap-1">
                    <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center text-yellow-600 border border-yellow-200">
                      <Crown className="h-5 w-5" />
                    </div>
                    <span className="text-[10px] font-medium text-slate-600">가입완료</span>
                  </div>
                  <div className="flex flex-col items-center gap-1 opacity-30 grayscale">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 border border-blue-200">
                      <Edit3 className="h-5 w-5" />
                    </div>
                    <span className="text-[10px] font-medium text-slate-600">첫 글 작성</span>
                  </div>
                  <div className="flex flex-col items-center gap-1 opacity-30 grayscale">
                    <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 border border-purple-200">
                      <Users className="h-5 w-5" />
                    </div>
                    <span className="text-[10px] font-medium text-slate-600">인싸</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 text-xs text-slate-400 flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                가입일: {new Date(user.created_at).toLocaleDateString()}
              </div>
            </CardContent>
          </Card>

          {/* 2. 오른쪽: 통계 카드 및 리스트 영역 */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* 상단 통계 카드 */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard 
                title="포인트" 
                count={profile?.points || 0} 
                subText="보유 포인트" 
                type="points"
                icon={Coins}
                colorClass="bg-amber-50/30 border-amber-100"
              />
              <StatCard 
                title="작성한 게시글" 
                count={userPosts.length} 
                subText="작성한 게시글" 
                type="posts"
                icon={Edit3}
              />
              <StatCard 
                title="만든 이벤트" 
                count={createdEvents.length} 
                subText="내가 만든 이벤트" 
                type="created_events"
                icon={CalendarDays}
              />
              <StatCard 
                title="참석 신청" 
                count={registeredEvents.length} 
                subText="신청한 이벤트" 
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
                  {activeTab === "created_events" && <><CalendarDays className="h-5 w-5 text-green-500" /> 내가 만든 이벤트</>}
                  {activeTab === "participated_events" && <><Ticket className="h-5 w-5 text-purple-500" /> 참석 신청한 이벤트</>}
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
                            {/* 추가 정보가 있다면 여기에 표시 */}
                          </div>
                        </Link>
                      ))
                    ) : (
                      <EmptyState message="작성한 게시글이 없습니다." />
                    )}
                  </div>
                )}

                {/* 3. 내가 만든 이벤트 리스트 */}
                {activeTab === "created_events" && (
                  <div className="divide-y divide-slate-100">
                    {createdEvents.length > 0 ? (
                      createdEvents.map((event) => (
                        <Link key={event.id} href={`/events/${event.id}`} className="flex items-center gap-4 p-5 hover:bg-slate-50 transition-colors group">
                          {event.thumbnail_url && (
                            <div className="relative w-20 h-20 rounded-lg overflow-hidden bg-slate-100 flex-shrink-0">
                              <Image
                                src={event.thumbnail_url}
                                alt={event.title}
                                fill
                                className="object-cover"
                              />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <h3 className="text-base font-medium text-slate-900 group-hover:text-blue-600 transition-colors truncate">
                              {event.title}
                            </h3>
                            <div className="flex items-center gap-3 mt-2 text-xs text-slate-500">
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {new Date(event.event_date).toLocaleDateString()}
                              </span>
                              {event.location && (
                                <span className="flex items-center gap-1">
                                  <MapPin className="h-3 w-3" />
                                  {event.location}
                                </span>
                              )}
                            </div>
                          </div>
                        </Link>
                      ))
                    ) : (
                      <EmptyState message="만든 이벤트가 없습니다." />
                    )}
                  </div>
                )}

                {/* 4. 참석 신청한 이벤트 리스트 */}
                {activeTab === "participated_events" && (
                  <div className="divide-y divide-slate-100">
                    {registeredEvents.length > 0 ? (
                      registeredEvents.map((event) => (
                        <Link key={event.id} href={`/events/${event.id}`} className="flex items-center gap-4 p-5 hover:bg-slate-50 transition-colors group">
                          {event.thumbnail_url && (
                            <div className="relative w-20 h-20 rounded-lg overflow-hidden bg-slate-100 flex-shrink-0">
                              <Image
                                src={event.thumbnail_url}
                                alt={event.title}
                                fill
                                className="object-cover"
                              />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <h3 className="text-base font-medium text-slate-900 group-hover:text-blue-600 transition-colors truncate">
                              {event.title}
                            </h3>
                            <div className="flex items-center gap-3 mt-2 text-xs text-slate-500">
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {new Date(event.event_date).toLocaleDateString()}
                              </span>
                              {event.location && (
                                <span className="flex items-center gap-1">
                                  <MapPin className="h-3 w-3" />
                                  {event.location}
                                </span>
                              )}
                            </div>
                          </div>
                        </Link>
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
  )
}

// EmptyState 컴포넌트
function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
        <Calendar className="h-8 w-8 text-slate-400" />
      </div>
      <p className="text-slate-500 font-medium">{message}</p>
    </div>
  )
}