"use client"

import { Share2, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useState } from "react"
import { toast } from "@/hooks/use-toast"

type EventShareButtonProps = {
  title: string
  description?: string
  className?: string
  variant?: "default" | "outline" | "ghost" | "link" | "destructive" | "secondary"
  size?: "default" | "sm" | "lg" | "icon"
  children?: React.ReactNode
}

export function EventShareButton({
  title,
  description,
  className,
  variant = "outline",
  size = "default",
  children
}: EventShareButtonProps) {
  const [copied, setCopied] = useState(false)

  const handleShare = async () => {
    // 짧은 URL 생성 (/events/xxx -> /e/xxx)
    const currentUrl = window.location.href
    const shortUrl = currentUrl.replace('/events/', '/e/')

    // 1. 모바일 네이티브 공유 (Web Share API) - 모바일에서만 실행
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)

    if (isMobile && navigator.share) {
      try {
        await navigator.share({
          title: title,
          text: description || title,
          url: shortUrl,
        })
        toast({
          description: "공유되었습니다!",
          duration: 2000,
        })
        return
      } catch (error: any) {
        // 사용자가 공유를 취소한 경우는 정상 동작이므로 fallback하지 않음
        if (error.name === 'AbortError') {
          return
        }
        // 다른 에러면 클립보드 복사로 fallback
        if (process.env.NODE_ENV === 'development') {
          console.log('Share API error, falling back to clipboard:', error)
        }
      }
    }

    // 2. PC 등 미지원 브라우저: 클립보드 복사
    try {
      await navigator.clipboard.writeText(shortUrl)
      setCopied(true)
      toast({
        description: "링크가 복사되었습니다!",
        duration: 2000,
      })
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
      toast({
        title: "복사 실패",
        description: "링크를 복사할 수 없습니다. 수동으로 복사해주세요.",
        variant: "destructive",
      })
    }
  }

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleShare}
      className={className}
    >
      {children ? (
        <>
          {copied ? (
            <>
              <Check className="h-4 w-4 mr-2" />
              복사됨
            </>
          ) : (
            <>
              <Share2 className="h-4 w-4 mr-2" />
              {children}
            </>
          )}
        </>
      ) : (
        copied ? <Check className="h-4 w-4" /> : <Share2 className="h-4 w-4" />
      )}
    </Button>
  )
}
