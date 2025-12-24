"use client"

import dynamic from "next/dynamic"
import { Loader2 } from "lucide-react"

// SSR 완전 비활성화 - hydration 에러 방지
const ProfileContent = dynamic(() => import("./ProfileContent"), {
  ssr: false,
  loading: () => (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-slate-50">
      <Loader2 className="h-8 w-8 text-indigo-600 animate-spin" />
    </div>
  ),
})

export default function ProfilePage() {
  return <ProfileContent />
}
