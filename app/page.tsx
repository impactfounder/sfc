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
import { getEventShortUrl } from "@/lib/utils/event-url"
import { fetchFeedPosts } from "@/lib/actions/feed"
import { SiteHeader } from "@/components/site-header"

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

// 홈은 실시간 이벤트/피드 노출이 필요하므로 정적 캐시를 사용하지 않는다.
export const dynamic = "force-dynamic"
export const revalidate = 0

export default async function HomePage() {
  const supabase = await createClient()

  const userProfile = await getCurrentUserProfile(supabase)
  const user = userProfile?.user || null
  const profile = userProfile?.profile || null

  const [events, posts] = await Promise.all([
    getUpcomingEvents(supabase, 4),
    fetchFeedPosts(1, "latest"),
  ])

  const formattedEvents = await Promise.all(
    events.map(async (event) => {
      const shortUrl = await getEventShortUrl(event.id, event.event_date, supabase)
      return { ...event, shortUrl }
    })
  )

  return (
    <DashboardLayout
      header={<SiteHeader />}
      rightSidebar={
        <div className="sticky top-8">
          <StandardRightSidebar />
        </div>
      }
    >
      <div className="flex flex-col gap-10 w-full">
        <HeroSection user={user} profile={profile} loginHref="/auth/login" />
        <EventsSection events={formattedEvents as any} title="주요 이벤트" createLink="/e/new" showFilters={false} />
        <div className="h-px bg-slate-200" />
        <FeedSection initialPosts={posts as any} />
      </div>
    </DashboardLayout>
  )
}
