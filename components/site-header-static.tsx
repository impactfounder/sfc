"use client"

import Link from "next/link"
import Image from "next/image"
import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { SiteHeaderClient } from "./site-header-client"

export function SiteHeaderStatic() {
    const [user, setUser] = useState<any>(null)
    const [profile, setProfile] = useState<any>(null)
    const [isLoaded, setIsLoaded] = useState(false)

    useEffect(() => {
        const supabase = createClient()

        async function checkAuth() {
            try {
                // getUser()로 서버와 통신하여 쿠키 기반의 확실한 인증 상태 확인
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
                setIsLoaded(true)
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

    return (
        <header className="fixed inset-x-0 top-0 z-50 h-16 w-full border-b border-slate-200/50 bg-white/80 backdrop-blur-xl supports-[backdrop-filter]:bg-white/75 shadow-sm shadow-slate-900/5">
            <div className="flex h-16 w-full items-center px-4 lg:px-[27px]">
                {/* Left: Logo */}
                <div className="ml-1 mr-4 flex items-center">
                    <Link href="/" className="flex items-center hover:opacity-85 transition-opacity">
                        <Image
                            src="/images/logo-text.png"
                            alt="Seoul Founders Club"
                            width={580}
                            height={51}
                            className="h-8 w-auto max-w-56 object-contain"
                            priority
                        />
                    </Link>
                </div>

                {/* Client Side Content - 항상 null로 초기 렌더링하여 hydration 일치 */}
                <SiteHeaderClient
                    user={isLoaded ? user : null}
                    profile={isLoaded ? profile : null}
                    initialNotifications={[]}
                />
            </div>
        </header>
    )
}
