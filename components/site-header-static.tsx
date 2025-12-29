"use client"

import Link from "next/link"
import Image from "next/image"
import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { SiteHeaderClient } from "./site-header-client"

export function SiteHeaderStatic() {
    const [user, setUser] = useState<any>(null)
    const [profile, setProfile] = useState<any>(null)
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        const supabase = createClient()

        async function checkAuth() {
            try {
                const { data: { session } } = await supabase.auth.getSession()
                if (session?.user) {
                    setUser(session.user)

                    // 프로필 조회 (경량 버전)
                    const { data: profileData } = await supabase
                        .from("profiles")
                        .select("id, full_name, avatar_url, role, points")
                        .eq("id", session.user.id)
                        .single()

                    setProfile(profileData)
                }
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

                {/* Client Side Content */}
                <SiteHeaderClient
                    user={isLoading ? undefined : user}
                    profile={isLoading ? undefined : profile}
                    initialNotifications={[]}
                />
            </div>
        </header>
    )
}
