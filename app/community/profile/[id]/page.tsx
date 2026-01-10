import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Mail, Calendar, FileText, CalendarDays, Ticket, Medal, MapPin } from "lucide-react"
import Image from "next/image"
import Link from "next/link"

export const revalidate = 60

type PostItem = {
  id: string
  title: string
  created_at: string
  likes_count: number
  comments_count: number
  board_categories: { name: string; slug: string } | null
}

type EventItem = {
  id: string
  title: string
  thumbnail_url: string | null
  event_date: string
  location: string | null
}

export default async function PublicProfilePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  // 프로필 조회
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", id)
    .single()

  if (error || !profile) {
    notFound()
  }

  // 비공개 프로필인 경우 (본인이 아니면 제한된 정보만 표시)
  const { data: { user } } = await supabase.auth.getUser()
  const isOwnProfile = user?.id === id

  // 뱃지 조회
  const { data: badgesData } = await supabase
    .from("user_badges")
    .select(`badges:badge_id (icon, name, is_active)`)
    .eq("user_id", id)
    .eq("is_visible", true)
    .eq("status", "approved")
    .limit(10)

  const visibleBadges = (badgesData || [])
    .filter((item: any) => item.badges && item.badges.is_active !== false)
    .map((item: any) => ({
      icon: item.badges.icon,
      name: item.badges.name,
    }))

  // 공개 프로필이거나 본인인 경우에만 활동 내역 조회
  let userPosts: PostItem[] = []
  let createdEvents: EventItem[] = []

  if (profile.is_profile_public || isOwnProfile) {
    // 작성 게시글
    const { data: postsData } = await supabase
      .from("posts")
      .select(`id, title, created_at, likes_count, comments_count, board_categories (name, slug)`)
      .eq("author_id", id)
      .order("created_at", { ascending: false })
      .limit(10)

    userPosts = (postsData || []).map((post: any) => ({
      id: post.id,
      title: post.title,
      created_at: post.created_at,
      likes_count: post.likes_count || 0,
      comments_count: post.comments_count || 0,
      board_categories: Array.isArray(post.board_categories) ? post.board_categories[0] : post.board_categories,
    }))

    // 만든 이벤트
    const { data: eventsData } = await supabase
      .from("events")
      .select(`id, title, thumbnail_url, event_date, location`)
      .eq("created_by", id)
      .order("created_at", { ascending: false })
      .limit(10)

    createdEvents = eventsData || []
  }

  return (
    <div className="w-full">
      <div className="grid gap-6 md:grid-cols-12">
        {/* 프로필 카드 */}
        <div className="md:col-span-5 lg:col-span-4">
          <Card className="border-slate-200 bg-white shadow-sm overflow-hidden">
            <CardContent className="p-8 flex flex-col items-center text-center">
              {/* 아바타 */}
              <div className="mb-6">
                <div className="h-32 w-32 rounded-full border-4 border-white shadow-lg overflow-hidden bg-slate-100">
                  {profile.avatar_url ? (
                    <Image
                      src={profile.avatar_url}
                      alt={profile.full_name || "Profile"}
                      width={256}
                      height={256}
                      className="object-cover h-full w-full"
                    />
                  ) : (
                    <Image
                      src={`https://api.dicebear.com/9.x/notionists/svg?seed=${profile.full_name || id}`}
                      alt={profile.full_name || "Profile"}
                      width={256}
                      height={256}
                      className="object-cover h-full w-full bg-slate-50"
                    />
                  )}
                </div>
              </div>

              {/* 이름 */}
              <h1 className="text-2xl font-bold text-slate-900 mb-1">
                {profile.full_name || "이름 없음"}
              </h1>

              {/* 이메일 (본인만 표시) */}
              {isOwnProfile && profile.email && (
                <p className="text-slate-500 text-sm mb-2 flex items-center justify-center gap-1.5">
                  <Mail className="h-3.5 w-3.5" />
                  {profile.email}
                </p>
              )}

              {/* 소속/직책 */}
              {(profile.company || profile.position || profile.company_2 || profile.position_2) && (
                <div className="flex flex-col gap-1 items-center mb-4">
                  {(profile.company || profile.position) && (
                    <p className="text-slate-600 text-sm">
                      {profile.company}
                      {profile.company && profile.position && " · "}
                      {profile.position}
                    </p>
                  )}
                  {(profile.company_2 || profile.position_2) && (
                    <p className="text-slate-600 text-sm">
                      {profile.company_2}
                      {profile.company_2 && profile.position_2 && " · "}
                      {profile.position_2}
                    </p>
                  )}
                </div>
              )}

              {/* 한 줄 소개 */}
              {profile.tagline && (
                <p className="text-slate-600 text-sm mb-4 italic">"{profile.tagline}"</p>
              )}

              {/* 자기소개 */}
              {profile.introduction && (
                <p className="text-slate-600 text-sm mb-4 text-center whitespace-pre-line">
                  {profile.introduction}
                </p>
              )}

              {/* 뱃지 */}
              {visibleBadges.length > 0 && (
                <div className="w-full mt-4 pt-4 border-t border-slate-100">
                  <div className="flex items-center gap-2 mb-3 justify-center">
                    <Medal className="h-4 w-4 text-slate-700" />
                    <span className="text-sm font-bold text-slate-900">뱃지</span>
                  </div>
                  <div className="flex flex-wrap gap-2 justify-center">
                    {visibleBadges.map((badge: any, index: number) => (
                      <div
                        key={index}
                        className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2 text-sm font-medium border border-slate-200 text-slate-700"
                      >
                        <span className="text-lg">{badge.icon}</span>
                        <span>{badge.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 가입일 */}
              <div className="mt-6 text-xs text-slate-400 flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                <span>가입일: {new Date(profile.created_at).toLocaleDateString("ko-KR")}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 활동 내역 */}
        <div className="md:col-span-7 lg:col-span-8 space-y-6">
          {profile.is_profile_public || isOwnProfile ? (
            <>
              {/* 작성 게시글 */}
              <Card className="border-slate-200 bg-white shadow-sm">
                <CardContent className="p-0">
                  <div className="px-6 py-4 border-b border-slate-100">
                    <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                      <FileText className="h-5 w-5 text-slate-500" />
                      작성한 게시글
                    </h2>
                  </div>
                  {userPosts.length > 0 ? (
                    <div className="divide-y divide-slate-100">
                      {userPosts.map((post) => (
                        <Link
                          key={post.id}
                          href={`/community/board/${post.board_categories?.slug || "free"}/${post.id}`}
                          className="flex flex-col p-5 hover:bg-slate-50 transition-colors group"
                        >
                          <div className="flex items-center gap-2 mb-1.5">
                            <span className="px-2 py-0.5 rounded bg-slate-100 text-xs font-medium text-slate-600">
                              {post.board_categories?.name || "게시판"}
                            </span>
                            <span className="text-xs text-slate-400">
                              {new Date(post.created_at).toLocaleDateString("ko-KR")}
                            </span>
                          </div>
                          <h3 className="text-base font-medium text-slate-900 group-hover:text-indigo-600 transition-colors truncate">
                            {post.title}
                          </h3>
                          <div className="flex gap-3 mt-2 text-xs text-slate-500">
                            <span>좋아요 {post.likes_count}</span>
                            <span>댓글 {post.comments_count}</span>
                          </div>
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                      <FileText className="h-8 w-8 mb-2 text-slate-300" />
                      <p className="text-sm">작성한 게시글이 없습니다.</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* 만든 이벤트 */}
              <Card className="border-slate-200 bg-white shadow-sm">
                <CardContent className="p-0">
                  <div className="px-6 py-4 border-b border-slate-100">
                    <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                      <CalendarDays className="h-5 w-5 text-slate-500" />
                      만든 이벤트
                    </h2>
                  </div>
                  {createdEvents.length > 0 ? (
                    <div className="divide-y divide-slate-100">
                      {createdEvents.map((event) => (
                        <Link
                          key={event.id}
                          href={`/events/${event.id}`}
                          className="flex gap-4 p-5 hover:bg-slate-50 transition-colors group"
                        >
                          <div className="h-16 w-16 shrink-0 rounded-lg bg-slate-100 overflow-hidden relative border border-slate-200">
                            {event.thumbnail_url ? (
                              <Image src={event.thumbnail_url} alt="" fill sizes="64px" className="object-cover" />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center text-slate-300">
                                <Ticket className="h-6 w-6" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium text-slate-900 truncate mb-1 group-hover:text-indigo-600 transition-colors">
                              {event.title}
                            </h3>
                            <div className="flex items-center gap-3 text-xs text-slate-500">
                              <span className="flex items-center gap-1">
                                <CalendarDays className="h-3 w-3" />
                                {new Date(event.event_date).toLocaleDateString("ko-KR")}
                              </span>
                              <span className="flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {event.location || "장소 미정"}
                              </span>
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                      <CalendarDays className="h-8 w-8 mb-2 text-slate-300" />
                      <p className="text-sm">만든 이벤트가 없습니다.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          ) : (
            <Card className="border-slate-200 bg-white shadow-sm">
              <CardContent className="p-12 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-100 flex items-center justify-center">
                  <FileText className="h-8 w-8 text-slate-400" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">비공개 프로필</h3>
                <p className="text-slate-500 text-sm">
                  이 사용자는 프로필을 비공개로 설정했습니다.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
