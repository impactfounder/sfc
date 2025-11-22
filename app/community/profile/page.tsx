"use client"

import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Mail, Calendar, Coins, MapPin, Users, CalendarDays, Award } from "lucide-react"
import { BadgeManager } from "@/components/badge-manager"
import Link from "next/link"
import Image from "next/image"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

export default function ProfilePage() {
  const router = useRouter()
  const supabase = createClient()
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [createdEvents, setCreatedEvents] = useState<any[]>([])
  const [userPosts, setUserPosts] = useState<any[]>([])
  const [registeredEventsCount, setRegisteredEventsCount] = useState(0)
  const [transactions, setTransactions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser()

      if (!currentUser) {
        router.push("/")
        return
      }

      setUser(currentUser)

      const { data: profileData } = await supabase.from("profiles").select("*").eq("id", currentUser.id).single()
      setProfile(profileData)

      const { data: eventsData } = await supabase
        .from("events")
        .select(`
          *,
          profiles:created_by (full_name, avatar_url)
        `)
        .eq("created_by", currentUser.id)
        .order("created_at", { ascending: false })
        .limit(5)
      setCreatedEvents(eventsData || [])

      const { data: postsData } = await supabase
        .from("posts")
        .select(`
          *,
          board_categories (name, slug),
          profiles:author_id (full_name, avatar_url)
        `)
        .eq("author_id", currentUser.id)
        .order("created_at", { ascending: false })
        .limit(5)
      setUserPosts(postsData || [])

      const { count } = await supabase
        .from("event_registrations")
        .select("*", { count: "exact", head: true })
        .eq("user_id", currentUser.id)
      setRegisteredEventsCount(count || 0)

      const { data: transactionsData } = await supabase
        .from("point_transactions")
        .select("*")
        .eq("user_id", currentUser.id)
        .order("created_at", { ascending: false })
        .limit(10)
      setTransactions(transactionsData || [])

      setLoading(false)
    }

    loadData()
  }, [supabase, router])
  
  const [userBadges, setUserBadges] = useState<any[]>([])

  useEffect(() => {
    if (!user) return

    const loadBadges = async () => {
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

      if (data) {
        setUserBadges(data as any)
      }
    }

    loadBadges()
  }, [user, supabase])

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-lg text-muted-foreground">로딩중...</div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="p-8">
      <div className="mx-auto max-w-6xl">
        <h1 className="mb-8 text-3xl font-bold tracking-tight">내 프로필</h1>

        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2 border-slate-200">
            <CardHeader>
              <div className="flex items-center gap-4">
                {profile?.avatar_url ? (
                  <Image
                    src={profile.avatar_url || "/placeholder.svg"}
                    alt={profile.full_name || "Profile"}
                    width={80}
                    height={80}
                    className="rounded-full object-cover"
                  />
                ) : (
                  <div className="flex h-20 w-20 items-center justify-center rounded-full bg-indigo-100 text-3xl font-medium text-indigo-700">
                    {profile?.full_name?.[0] || user.email?.[0]?.toUpperCase() || "U"}
                  </div>
                )}
                <div>
                  <CardTitle className="text-2xl">{profile?.full_name || "익명"}</CardTitle>
                  <p className="mt-1 text-sm text-muted-foreground">{user.email}</p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {profile?.bio && (
                <div className="mb-6">
                  <h3 className="mb-2 text-sm font-medium">소개</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{profile.bio}</p>
                </div>
              )}
              <div className="space-y-3 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  <span>{user.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span>
                    가입일:{" "}
                    {new Date(profile?.created_at || user.created_at).toLocaleDateString("ko-KR", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-4">
            <Card className="border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg text-amber-900">
                  <Coins className="h-5 w-5" />
                  포인트
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-amber-600">{profile?.points || 0}</p>
                <p className="text-sm text-amber-700">보유 포인트</p>
              </CardContent>
            </Card>

            <Card className="border-slate-200">
              <CardHeader>
                <CardTitle className="text-lg">작성한 게시글</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{userPosts?.length || 0}</p>
                <p className="text-sm text-muted-foreground">내가 쓴 글</p>
              </CardContent>
            </Card>

            <Card className="border-slate-200">
              <CardHeader>
                <CardTitle className="text-lg">만든 이벤트</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{createdEvents?.length || 0}</p>
                <p className="text-sm text-muted-foreground">내가 만든 이벤트</p>
              </CardContent>
            </Card>

            <Card className="border-slate-200">
              <CardHeader>
                <CardTitle className="text-lg">참석 신청</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{registeredEventsCount || 0}</p>
                <p className="text-sm text-muted-foreground">참석 신청한 이벤트</p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* 뱃지 섹션 */}
        <Card className="mt-6 border-slate-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5" />
              내 뱃지
            </CardTitle>
          </CardHeader>
          <CardContent>
            {user && <BadgeManager userId={user.id} />}
          </CardContent>
        </Card>

        {createdEvents && createdEvents.length > 0 && (
          <Card className="mt-6 border-slate-200">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>내가 만든 이벤트</CardTitle>
              <Link href="/events" className="text-sm text-muted-foreground hover:text-foreground">
                전체 보기 →
              </Link>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {createdEvents.map((event) => (
                  <Link
                    key={event.id}
                    href={`/events/${event.id}`}
                    className="flex gap-4 rounded-lg border border-slate-200 p-4 transition-colors hover:bg-slate-50"
                  >
                    {event.thumbnail_url && (
                      <Image
                        src={event.thumbnail_url || "/placeholder.svg"}
                        alt={event.title}
                        width={120}
                        height={120}
                        className="h-24 w-24 rounded-lg object-cover"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-lg mb-2 line-clamp-1">{event.title}</h3>
                      <div className="space-y-1 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <CalendarDays className="h-4 w-4" />
                          <span>
                            {new Date(event.event_date).toLocaleDateString("ko-KR", {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            })}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          <span className="truncate">{event.location}</span>
                        </div>
                        {event.max_participants && (
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4" />
                            <span>최대 {event.max_participants}명</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="text-sm">
                      <span
                        className={`inline-block rounded-full px-3 py-1 ${
                          event.status === "upcoming"
                            ? "bg-blue-100 text-blue-700"
                            : event.status === "ongoing"
                              ? "bg-green-100 text-green-700"
                              : "bg-slate-100 text-slate-700"
                        }`}
                      >
                        {event.status === "upcoming" ? "예정" : event.status === "ongoing" ? "진행중" : "종료"}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {userPosts && userPosts.length > 0 && (
          <Card className="mt-6 border-slate-200">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>내가 쓴 글</CardTitle>
              <Link href="/community/board" className="text-sm text-muted-foreground hover:text-foreground">
                전체 보기 →
              </Link>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {userPosts.map((post) => (
                  <Link
                    key={post.id}
                    href={`/community/board/${post.board_categories?.slug || "free"}/${post.id}`}
                    className="flex items-center justify-between border-b border-slate-100 pb-3 last:border-0 hover:bg-slate-50 rounded p-2 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {post.board_categories && (
                          <span className="inline-block rounded bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
                            {post.board_categories.name}
                          </span>
                        )}
                        <h3 className="font-medium truncate">{post.title}</h3>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span>
                          {new Date(post.created_at).toLocaleDateString("ko-KR", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })}
                        </span>
                        <span>댓글 {post.comments_count || 0}</span>
                        <span>좋아요 {post.likes_count || 0}</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {transactions && transactions.length > 0 && (
          <Card className="mt-6 border-slate-200">
            <CardHeader>
              <CardTitle>포인트 내역</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {transactions.map((transaction) => (
                  <div
                    key={transaction.id}
                    className="flex items-center justify-between border-b border-slate-100 pb-3 last:border-0"
                  >
                    <div>
                      <p className="text-sm font-medium">{transaction.description}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(transaction.created_at).toLocaleDateString("ko-KR", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </p>
                    </div>
                    <span className={`text-sm font-bold ${transaction.amount > 0 ? "text-green-600" : "text-red-600"}`}>
                      {transaction.amount > 0 ? "+" : ""}
                      {transaction.amount}P
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
