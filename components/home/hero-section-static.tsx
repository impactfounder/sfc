"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { HeroSection } from "./hero-section"

export function HeroSectionStatic() {
    const [user, setUser] = useState<any>(null)
    const [profile, setProfile] = useState<any>(null)
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        const supabase = createClient()

        async function checkAuth() {
            try {
                // getUser()로 서버 쿠키를 확인하여 OAuth 콜백 직후에도 로그인 상태 감지
                const { data: { user: authUser }, error } = await supabase.auth.getUser()

                if (error || !authUser) {
                    setUser(null)
                    setProfile(null)
                    return
                }

                setUser(authUser)

                // 프로필 조회 (경량 버전)
                const { data: profileData } = await supabase
                    .from("profiles")
                    .select("id, full_name, avatar_url, role, points")
                    .eq("id", authUser.id)
                    .single()

                setProfile(profileData)
            } catch (error) {
                console.error("Auth check error:", error)
            } finally {
                setIsLoading(false)
            }
        }

        checkAuth()

        // 인증 상태 변화 구독
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            if (event === 'SIGNED_IN' && session?.user) {
                setUser(session.user)
                // 프로필 다시 조회
                supabase
                    .from("profiles")
                    .select("id, full_name, avatar_url, role, points")
                    .eq("id", session.user.id)
                    .single()
                    .then(({ data }) => setProfile(data))
            } else if (event === 'SIGNED_OUT') {
                setUser(null)
                setProfile(null)
            }
        })

        return () => subscription.unsubscribe()
    }, [])

    // 로딩 중에는 비로그인 버전 표시 (깜빡임 방지)
    if (isLoading) {
        return <HeroSection user={null} profile={null} loginHref="/auth/login" />
    }

    return <HeroSection user={user} profile={profile} loginHref="/auth/login" />
}
