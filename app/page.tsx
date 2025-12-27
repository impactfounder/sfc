import type { Metadata } from "next"
import { createClient } from "@/lib/supabase/server"
import { getCurrentUserProfile } from "@/lib/queries/profiles"
import { getUpcomingEvents } from "@/lib/queries/events"
import { getLatestPosts } from "@/lib/queries/posts"
import { HeroSection } from "@/components/home/hero-section"
import { EventsSection } from "@/components/home/events-section"
import { FeedSection } from "@/components/home/feed-section"
import { DashboardLayout } from "@/components/dashboard-layout"
import SidebarProfile from "@/components/sidebar-profile"
import { StandardRightSidebar } from "@/components/standard-right-sidebar"
import { getEventShortUrlSync } from "@/lib/utils/event-url"
import { fetchFeedPosts } from "@/lib/actions/feed"
import { SiteHeader } from "@/components/site-header"
import { ThreeColumnLayout } from "@/components/layout/three-column-layout"

export const metadata: Metadata = {
  title: "Seoul Founders Club",
  description: "서울 파운더스 클럽",
  openGraph: {
    title: "Seoul Founders Club",
    description: "서울 파운더스 클럽",
    url: "https://seoulfounders.club",
    siteName: "Seoul Founders Club",
    images: [
      {
        url: "https://seoulfounders.club/images/logo-circle.png",
        width: 1200,
        height: 630,
        alt: "Seoul Founders Club",
      },
    ],
    locale: "ko_KR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Seoul Founders Club",
    description: "서울 파운더스 클럽",
    images: ["https://seoulfounders.club/images/logo-circle.png"],
  },
}

// ISR: 60초마다 재검증하여 캐시 활용
export const revalidate = 60

export default async function HomePage() {
  const supabase = await createClient()

  // 모든 데이터를 병렬로 가져오기
  const [userProfile, events, posts] = await Promise.all([
    getCurrentUserProfile(supabase),
    getUpcomingEvents(supabase, 4),
    fetchFeedPosts(1, "latest"),
  ])

  const user = userProfile?.user || null
  const profile = userProfile?.profile || null

  // shortUrl을 동기식으로 생성 (DB 호출 없음 - 성능 최적화)
  const formattedEvents = events.map((event) => ({
    ...event,
    shortUrl: getEventShortUrlSync(event.id, event.event_date)
  }))

  return (
    <DashboardLayout header={<SiteHeader />} userRole={profile?.role}>
      <ThreeColumnLayout rightSidebar={<StandardRightSidebar />}>
        <div className="flex flex-col gap-10 w-full">
          <HeroSection user={user} profile={profile} loginHref="/auth/login" />
          <EventsSection events={formattedEvents as any} title="주요 이벤트" createLink="/e/new" showFilters={false} />
          <div className="h-px bg-slate-200" />
          <FeedSection initialPosts={posts as any} />
        </div>
      </ThreeColumnLayout>
    </DashboardLayout>
  )
}
