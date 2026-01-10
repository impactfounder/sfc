"use client"

import dynamic from "next/dynamic"
import { Loader2 } from "lucide-react"
import { useEffect, useState } from "react"

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
  const [mounted, setMounted] = useState(false)

  console.log('[ProfilePage] render, mounted:', mounted)

  useEffect(() => {
    console.log('[ProfilePage] useEffect - setting mounted true')
    setMounted(true)
  }, [])

  if (!mounted) {
    console.log('[ProfilePage] returning loading spinner')
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-slate-50">
        <Loader2 className="h-8 w-8 text-indigo-600 animate-spin" />
      </div>
    )
  }

  console.log('[ProfilePage] returning ProfileContent')
  return <ProfileContent />
}
