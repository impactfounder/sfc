import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { ProfileClient } from "./ProfileClient"

export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login?redirect=/community/profile")
  }

  // 프로필 로드
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single()

  // 만든 이벤트
  const { data: createdEvents } = await supabase
    .from("events")
    .select("id, title, thumbnail_url, event_date, location, created_at")
    .eq("created_by", user.id)
    .order("created_at", { ascending: false })
    .limit(20)

  // 작성 게시글
  const { data: userPosts } = await supabase
    .from("posts")
    .select("id, title, created_at, likes_count, comments_count, board_categories (name, slug)")
    .eq("author_id", user.id)
    .order("created_at", { ascending: false })
    .limit(20)

  // 참가 신청
  const { data: registrations } = await supabase
    .from("event_registrations")
    .select("registered_at, events!inner (id, title, thumbnail_url, event_date, location)")
    .eq("user_id", user.id)
    .order("registered_at", { ascending: false })
    .limit(20)

  const registeredEvents = (registrations || [])
    .filter((r: any) => r.events)
    .map((r: any) => ({
      id: r.events.id,
      title: r.events.title,
      thumbnail_url: r.events.thumbnail_url,
      event_date: r.events.event_date,
      location: r.events.location,
      registration_date: r.registered_at,
    }))

  // 뱃지
  const { data: badgesData } = await supabase
    .from("user_badges")
    .select("badges:badge_id (icon, name, is_active)")
    .eq("user_id", user.id)
    .eq("is_visible", true)
    .limit(10)

  const visibleBadges = (badgesData || [])
    .filter((item: any) => item.badges?.is_active !== false)
    .map((item: any) => ({
      icon: item.badges.icon,
      name: item.badges.name,
    }))

  return (
    <ProfileClient
      user={{
        id: user.id,
        email: user.email || "",
        created_at: user.created_at,
      }}
      profile={profile}
      createdEvents={createdEvents || []}
      userPosts={(userPosts || []).map((p: any) => ({
        ...p,
        board_categories: Array.isArray(p.board_categories) ? p.board_categories[0] : p.board_categories,
      }))}
      registeredEvents={registeredEvents}
      visibleBadges={visibleBadges}
    />
  )
}
