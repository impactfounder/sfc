import type React from "react"
import type { Metadata } from "next"
import localFont from "next/font/local"
import Script from "next/script"
import "./globals.css"
import { DailyLoginChecker } from "@/components/daily-login-checker"
import { MobileActionBar } from "@/components/mobile-action-bar"
import { Toaster } from "@/components/ui/toaster"
import { Toaster as SonnerToaster } from "@/components/ui/sonner"
import { cn } from "@/lib/utils"
import Providers from "./providers"

// Pretendard Variable 폰트 설정
const pretendard = localFont({
  src: "./fonts/PretendardVariable.woff2",
  display: "swap",
  variable: "--font-pretendard",
  weight: "45 920",
})

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
        // opengraph-image.tsx에서 동적으로 생성됨
        url: `${process.env.NEXT_PUBLIC_SITE_URL || "https://seoulfounders.club"}/opengraph-image`,
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
    google: "GOOGLE_SITE_VERIFICATION_CODE_HERE",
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
    <html lang="ko" className={pretendard.variable} suppressHydrationWarning>
      <head>
        {/* 스크롤바 레이아웃 시프트 방지 - 초기 렌더링 전에 즉시 실행 */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
(function() {
  'use strict';
  
  // 즉시 실행하여 초기 렌더링 전에 스크롤바 너비를 확보
  function fixScrollbar() {
    try {
      // 스크롤바 너비 계산 (가장 정확한 방법)
      var scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
      
      // 스크롤바가 없는 경우 (모바일 등) 아무것도 하지 않음
      if (scrollbarWidth <= 0) return;
      
      var body = document.body;
      if (!body) return;
      
      // 이미 적용되어 있지 않은 경우에만 적용
      if (body.style.getPropertyValue('--scrollbar-fix-applied')) return;
      
      // 현재 padding-right 값 가져오기
      var computedStyle = window.getComputedStyle(body);
      var currentPaddingRight = computedStyle.paddingRight;
      var currentPaddingRightValue = parseInt(currentPaddingRight, 10) || 0;
      
      // 원본 padding-right 값 저장
      body.style.setProperty('--body-padding-right-original', currentPaddingRight || '0px', 'important');
      
      // 스크롤바 너비만큼 padding-right 추가
      var newPaddingRight = currentPaddingRightValue + scrollbarWidth;
      body.style.setProperty('padding-right', newPaddingRight + 'px', 'important');
      body.style.setProperty('--scrollbar-fix-applied', 'true');
    } catch (e) {
      // 에러 발생 시 무시 (안전하게)
      console.warn('Scrollbar fix error:', e);
    }
  }
  
  // 즉시 실행 시도
  if (document.body) {
    fixScrollbar();
  }
  
  // DOMContentLoaded 시에도 실행 (body가 준비되지 않았을 경우 대비)
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', fixScrollbar, { once: true });
  } else {
    // 이미 로드된 경우 즉시 실행
    setTimeout(fixScrollbar, 0);
  }
  
  // body가 아직 없으면 MutationObserver로 대기
  if (!document.body) {
    var observer = new MutationObserver(function() {
      if (document.body) {
        fixScrollbar();
        observer.disconnect();
      }
    });
    observer.observe(document.documentElement, { childList: true });
    
    // 타임아웃으로 안전장치 (5초 후 중단)
    setTimeout(function() {
      observer.disconnect();
    }, 5000);
  }
})();
            `,
          }}
        />
        {/* Google Tag Manager */}
        <Script
          id="gtm-script"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','GTM-K8DN9RB2');`,
          }}
        />
      </head>
      <body className={cn(pretendard.className, "pb-16 lg:pb-0")} suppressHydrationWarning>
        {/* Google Tag Manager (noscript) */}
        <noscript>
          <iframe
            src="https://www.googletagmanager.com/ns.html?id=GTM-K8DN9RB2"
            height="0"
            width="0"
            style={{ display: "none", visibility: "hidden" }}
          />
        </noscript>
        {/* Providers가 최상위에서 감싸야 합니다 */}
        <Providers>
          <DailyLoginChecker />
          {children}
          <MobileActionBar />
          <Toaster />
          <SonnerToaster />
        </Providers>
      </body>
    </html>
  )
}
