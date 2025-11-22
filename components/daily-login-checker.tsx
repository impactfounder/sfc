"use client"

import { useEffect } from "react"
import { createClient } from "@/lib/supabase/client"

export function DailyLoginChecker() {
  useEffect(() => {
    const checkDailyLogin = async () => {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (user) {
        // 일일 로그인 포인트 체크 함수 호출
        try {
          await supabase.rpc("check_daily_login_points")
        } catch (error) {
          console.error("Failed to check daily login points:", error)
        }
      }
    }

    checkDailyLogin()
  }, [])

  return null
}

