"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function DebugAuthPage() {
  const [clientInfo, setClientInfo] = useState<any>(null)
  const [serverInfo, setServerInfo] = useState<any>(null)
  const supabase = createClient()

  useEffect(() => {
    const checkAuth = async () => {
      // 클라이언트 측 인증 확인
      const { data: { user }, error } = await supabase.auth.getUser()
      const { data: { session } } = await supabase.auth.getSession()
      
      // localStorage 확인
      const localStorageKeys = Object.keys(localStorage).filter(key => 
        key.includes('supabase') || key.includes('auth')
      )
      const localStorageData: Record<string, string> = {}
      localStorageKeys.forEach(key => {
        try {
          const value = localStorage.getItem(key)
          if (value) {
            localStorageData[key] = value.substring(0, 50) + (value.length > 50 ? '...' : '')
          }
        } catch (e) {
          localStorageData[key] = 'Error reading'
        }
      })

      // 쿠키 확인
      const cookies = document.cookie.split(';').reduce((acc, cookie) => {
        const [name, value] = cookie.trim().split('=')
        if (name && (name.includes('auth') || name.includes('supabase'))) {
          acc[name] = value ? value.substring(0, 50) + (value.length > 50 ? '...' : '') : 'empty'
        }
        return acc
      }, {} as Record<string, string>)

      setClientInfo({
        user: user ? { id: user.id, email: user.email } : null,
        session: session ? { expiresAt: session.expires_at } : null,
        error: error?.message,
        localStorage: localStorageData,
        cookies,
        cookieCount: Object.keys(cookies).length,
      })

      // 서버 측 정보 가져오기
      try {
        const response = await fetch('/api/debug-auth')
        const data = await response.json()
        setServerInfo(data)
      } catch (e) {
        setServerInfo({ error: 'Failed to fetch server info' })
      }
    }

    checkAuth()
  }, [supabase])

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>인증 디버깅 정보</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">클라이언트 측 (브라우저)</h3>
              <pre className="bg-slate-100 p-4 rounded text-xs overflow-auto">
                {JSON.stringify(clientInfo, null, 2)}
              </pre>
            </div>
            <div>
              <h3 className="font-semibold mb-2">서버 측</h3>
              <pre className="bg-slate-100 p-4 rounded text-xs overflow-auto">
                {JSON.stringify(serverInfo, null, 2)}
              </pre>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

