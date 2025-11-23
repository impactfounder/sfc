import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { DailyLoginChecker } from "@/components/daily-login-checker"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: {
    default: "Seoul Founders Club - 사업가, 투자자, 인플루언서 커뮤니티",
    template: "%s | Seoul Founders Club"
  },
  description: "서울 파운더스 클럽은 사업가, 투자자, 인플루언서의 성장과 활동을 돕는 비즈니스 커뮤니티입니다. 네트워킹, 이벤트, 협업 기회를 제공합니다.",
  keywords: ["서울 파운더스 클럽", "SFC", "창업가 커뮤니티", "비즈니스 네트워킹", "스타트업", "투자자", "인플루언서", "Seoul Founders Club"],
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
    url: "/",
    siteName: "Seoul Founders Club",
    title: "Seoul Founders Club - 사업가, 투자자, 인플루언서 커뮤니티",
    description: "서울 파운더스 클럽은 사업가, 투자자, 인플루언서의 성장과 활동을 돕는 비즈니스 커뮤니티입니다.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Seoul Founders Club",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Seoul Founders Club - 사업가, 투자자, 인플루언서 커뮤니티",
    description: "서울 파운더스 클럽은 사업가, 투자자, 인플루언서의 성장과 활동을 돕는 비즈니스 커뮤니티입니다.",
    images: ["/og-image.png"],
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
    <html lang="ko">
      <body className={inter.className}>
        <DailyLoginChecker />
        <div className="mx-auto max-w-7xl">
          {children}
        </div>
      </body>
    </html>
  )
}
