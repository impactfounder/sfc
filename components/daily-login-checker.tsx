"use client"

import { useEffect, useRef } from "react"
import { checkDailyLoginPoints } from "@/lib/actions/user"

export function DailyLoginChecker() {
  const hasChecked = useRef(false)

  useEffect(() => {
    // 중복 호출 방지
    if (hasChecked.current) return
    hasChecked.current = true

    // 서버 액션을 통해 안전하게 일일 로그인 체크 수행
    checkDailyLoginPoints().catch((error) => {
      console.error("Failed to check daily login points:", error)
    })
  }, [])

  return null
}

