import type { Metadata } from "next"
import { Suspense } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { StandardRightSidebar } from "@/components/standard-right-sidebar"
import { SiteHeader } from "@/components/site-header"
import { ThreeColumnLayout } from "@/components/layout/three-column-layout"
import { MobileHeader } from "@/components/mobile-header"
import { HeroSectionContainer } from "@/components/home/hero-section-container"
import { EventsSectionContainer } from "@/components/home/events-section-container"
import { FeedSectionContainer } from "@/components/home/feed-section-container"
import { PhotoReviewsContainer } from "@/components/home/photo-reviews-container"
import { EventsSkeleton, FeedSkeleton, PhotoReviewsSkeleton } from "@/components/skeletons"
import { getCachedUserProfile } from "@/lib/queries/cached"

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

export default async function HomePage() {
  const userProfile = await getCachedUserProfile()
  const userRole = userProfile?.profile?.role ?? null

  return (
    <DashboardLayout
      header={<SiteHeader />}
      userRole={userRole}
      mobileHeader={<MobileHeader userRole={userRole} />}
    >
      <ThreeColumnLayout rightSidebar={<StandardRightSidebar />}>
        <div className="flex flex-col gap-10 w-full">
          <HeroSectionContainer />

          {/* 사진 후기 섹션 - Hero 바로 아래 */}
          <Suspense fallback={<PhotoReviewsSkeleton />}>
            <PhotoReviewsContainer />
          </Suspense>

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
