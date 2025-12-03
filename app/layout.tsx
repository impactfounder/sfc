import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { DailyLoginChecker } from "@/components/daily-login-checker"
import { MobileActionBar } from "@/components/mobile-action-bar"
import { Toaster } from "@/components/ui/toaster"
import { cn } from "@/lib/utils"
import Providers from "./providers"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  // 카카오톡/메신저 링크 미리보기용 기본 메타데이터
  // 제목은 "Seoul Founders Club" 만 보이도록 심플하게 설정
  title: {
    default: "Seoul Founders Club",
    template: "%s | Seoul Founders Club",
  },
  description: "서울 파운더스 클럽",
  keywords: ["서울 파운더스 클럽", "창업가 커뮤니티", "비즈니스 네트워킹", "스타트업", "투자자", "인플루언서", "Seoul Founders Club"],
  authors: [{ name: "Seoul Founders Club" }],
  creator: "Seoul Founders Club",
  publisher: "Seoul Founders Club",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://seoulfounders.club"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "ko_KR",
    url: "https://seoulfounders.club",
    siteName: "Seoul Founders Club",
    title: "Seoul Founders Club",
    description: "서울 파운더스 클럽",
    images: [
      {
        // 카카오톡 등에서 사용할 대표 OG 이미지 (원형 로고 중앙 정렬된 이미지)
        // 카카오톡 권장 비율: 1200x630 (1.91:1)
        url: "https://seoulfounders.club/images/logo-circle.png",
        width: 1200,
        height: 630,
        alt: "Seoul Founders Club",
        type: "image/png",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Seoul Founders Club",
    description: "서울 파운더스 클럽",
    images: ["https://seoulfounders.club/images/logo-circle.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    // Google Search Console 등에서 제공하는 verification 코드를 여기에 추가
    // google: "verification-code",
  },
}

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <body className={cn(inter.className, "pb-16 lg:pb-0")}>
        {/* Providers가 최상위에서 감싸야 합니다 */}
        <Providers>
          <DailyLoginChecker />
          {children}
          <MobileActionBar />
          <Toaster />
        </Providers>
      </body>
    </html>
  )
}
