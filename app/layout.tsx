import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { DailyLoginChecker } from "@/components/daily-login-checker"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Seoul Founders Club - 사업가, 투자자, 인플루언서 커뮤니티",
  description: "서울 파운더스 클럽은 사업가, 투자자, 인플루언서의 성장과 활동을 돕는 비즈니스 커뮤니티입니다.",
    generator: 'v0.app'
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
        {children}
      </body>
    </html>
  )
}
