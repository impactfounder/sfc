import type { Metadata } from "next"
import { Suspense } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { StandardRightSidebar } from "@/components/standard-right-sidebar"
import { SiteHeader } from "@/components/site-header"
import { ThreeColumnLayout } from "@/components/layout/three-column-layout"
import { Sidebar } from "@/components/sidebar"
import { MobileHeader } from "@/components/mobile-header"
import { HeroSectionStatic } from "@/components/home/hero-section-static"
import { EventsSectionContainer } from "@/components/home/events-section-container"
import { FeedSectionContainer } from "@/components/home/feed-section-container"
import { EventsSkeleton, FeedSkeleton } from "@/components/skeletons"

// ISR: 60초마다 백그라운드 재생성 (Cold Start 해결)
export const revalidate = 60

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

export default function HomePage() {
  return (
    <DashboardLayout
      header={<SiteHeader />}
      sidebar={<Sidebar />}
      mobileHeader={<MobileHeader />}
    >
      <ThreeColumnLayout rightSidebar={<StandardRightSidebar />}>
        <div className="flex flex-col gap-10 w-full">
          <HeroSectionStatic />

          <Suspense fallback={<EventsSkeleton />}>
            <EventsSectionContainer />
          </Suspense>

          <div className="h-px bg-slate-200" />

          <Suspense fallback={<FeedSkeleton />}>
            <FeedSectionContainer />
          </Suspense>
        </div>
      </ThreeColumnLayout>
    </DashboardLayout>
  )
}
