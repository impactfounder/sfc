"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import Link from "next/link"
import Image from "next/image"

interface LoginModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function LoginModal({ open, onOpenChange }: LoginModalProps) {
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleGoogleLogin = async () => {
    const supabase = createClient()
    setIsLoading(true)
    setError(null)

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL || `${window.location.origin}/auth/callback`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      })
      if (error) throw error
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "An error occurred")
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[380px] p-8 bg-white border-none shadow-2xl rounded-2xl">
        <DialogHeader className="flex flex-col items-center space-y-4 pb-0">
          
          {/* 1. 로고 영역 (확실하게 키움 w-32) */}
          <div className="flex flex-col items-center gap-4">
            <div className="relative w-32 h-32 shadow-lg rounded-full overflow-hidden border-[5px] border-white bg-white">
              <Image 
                src="/images/logo.png" 
                alt="SFC Logo" 
                width={256} // 2배수로 설정하여 고화질 보장
                height={256}
                quality={100}
                className="object-cover w-full h-full"
                priority
              />
            </div>
            <Image 
              src="/images/logo-text.png" 
              alt="SEOUL FOUNDERS CLUB" 
              width={160} 
              height={28} 
              className="object-contain opacity-90"
              quality={100}
              priority
            />
          </div>

          {/* 2. 환영 문구 */}
          <div className="text-center space-y-1">
            <DialogTitle className="text-2xl font-bold text-slate-900">
              환영합니다!
            </DialogTitle>
            <p className="text-[13px] text-slate-500 leading-relaxed">
              서울 파운더스 클럽에서<br/>
              함께 성장하고 연결되세요.
            </p>
          </div>
        </DialogHeader>

        {/* 3. 버튼 영역 (공백 축소 mt-2) */}
        <div className="flex flex-col gap-3 mt-2">
          <Button
            type="button"
            variant="outline"
            className="w-full h-12 text-[15px] bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-medium relative shadow-sm transition-all hover:shadow-md rounded-xl"
            onClick={handleGoogleLogin}
            disabled={isLoading}
          >
            <div className="absolute left-4 flex items-center justify-center">
              <svg className="h-5 w-5" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
            </div>
            {isLoading ? "연결 중..." : "Google로 계속하기"}
          </Button>

          {error && <p className="text-xs text-red-600 text-center bg-red-50 p-2 rounded-lg">{error}</p>}

          <div className="mt-1 text-center">
            <p className="text-[10px] text-slate-400 leading-relaxed">
              계속 진행함으로써 SFC의{" "}
              <Link href="/terms" className="underline underline-offset-2 hover:text-slate-600 transition-colors" target="_blank">
                이용약관
              </Link>
              {" "}및{" "}
              <Link href="/privacy" className="underline underline-offset-2 hover:text-slate-600 transition-colors" target="_blank">
                개인정보 처리방침
              </Link>
              에<br />
              동의하는 것으로 간주됩니다.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}