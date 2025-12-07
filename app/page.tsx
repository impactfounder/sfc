import type { Metadata } from "next"
import { createClient } from "@/lib/supabase/server"
import { getCurrentUserProfile } from "@/lib/queries/profiles"
import { getUpcomingEvents } from "@/lib/queries/events"
import { getLatestPosts } from "@/lib/queries/posts"
import { HeroSection } from "@/components/home/hero-section"
import { FeaturedEvents } from "@/components/home/featured-events"
import { LatestFeed } from "@/components/home/latest-feed"

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

export default async function HomePage() {
  const supabase = await createClient()

  const userProfile = await getCurrentUserProfile(supabase)
  const user = userProfile?.user || null
  const profile = userProfile?.profile || null

  const [events, posts] = await Promise.all([
    getUpcomingEvents(supabase, 6),
    getLatestPosts(supabase, 20, "all"),
  ])

  return (
    <main className="max-w-6xl mx-auto px-4 py-8 space-y-12">
      <HeroSection user={user} profile={profile} onLogin={() => { window.location.href = "/auth/login" }} />
      <FeaturedEvents events={events} />
      <div className="border-b border-slate-100" />
      <LatestFeed posts={posts} />
    </main>
  )
}
