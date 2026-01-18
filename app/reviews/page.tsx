import type { Metadata } from "next"
import { Suspense } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { StandardRightSidebar } from "@/components/standard-right-sidebar"
import { SiteHeader } from "@/components/site-header"
import { ThreeColumnLayout } from "@/components/layout/three-column-layout"
import { MobileHeader } from "@/components/mobile-header"
import { ReviewsPageContent } from "@/components/reviews/reviews-page-content"
import { ReviewsPageSkeleton } from "@/components/skeletons"
import { getCachedUserProfile } from "@/lib/queries/cached"

export const revalidate = 60

export const metadata: Metadata = {
  title: "참가자 후기 | Seoul Founders Club",
  description: "서울 파운더스 클럽 이벤트 참가자들의 생생한 후기를 확인해보세요.",
  openGraph: {
    title: "참가자 후기 | Seoul Founders Club",
    description: "서울 파운더스 클럽 이벤트 참가자들의 생생한 후기를 확인해보세요.",
    url: "https://seoulfounders.club/reviews",
    siteName: "Seoul Founders Club",
    images: [
      {
        url: "https://seoulfounders.club/images/logo-circle.png",
        width: 1200,
        height: 630,
        alt: "Seoul Founders Club Reviews",
      },
    ],
    locale: "ko_KR",
    type: "website",
  },
}

export default async function ReviewsPage() {
  const userProfile = await getCachedUserProfile()
  const userRole = userProfile?.profile?.role ?? null

  return (
    <DashboardLayout
      header={<SiteHeader />}
      userRole={userRole}
      mobileHeader={<MobileHeader userRole={userRole} />}
    >
      <ThreeColumnLayout rightSidebar={<StandardRightSidebar />}>
        <Suspense fallback={<ReviewsPageSkeleton />}>
          <ReviewsPageContent />
        </Suspense>
      </ThreeColumnLayout>
    </DashboardLayout>
  )
}
