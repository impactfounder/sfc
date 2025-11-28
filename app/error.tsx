"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle, RefreshCw } from "lucide-react"
import Link from "next/link"

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // 에러 로깅 (선택사항)
    console.error("Application error:", error)
  }, [error])

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md border-red-200">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
            <AlertCircle className="h-8 w-8 text-red-600" />
          </div>
          <CardTitle className="text-2xl text-red-900">
            문제가 발생했습니다
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-center text-slate-600">
            예상치 못한 오류가 발생했습니다.
            <br />
            잠시 후 다시 시도해주세요.
          </p>
          
          {error.digest && (
            <div className="text-center">
              <p className="text-xs text-slate-400">
                오류 코드: {error.digest}
              </p>
            </div>
          )}

          <div className="flex flex-col gap-2">
            <Button
              onClick={reset}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              다시 시도
            </Button>
            <Button
              variant="outline"
              asChild
              className="w-full"
            >
              <Link href="/">
                홈으로 돌아가기
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

