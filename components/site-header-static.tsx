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
                // getSession은 로컬 캐시 우선 → 빠름
                const { data: { session } } = await supabase.auth.getSession()

                if (!session?.user) {
                    setUser(null)
                    setProfile(null)
                    return
                }

                setUser(session.user)

                const { data: profileData } = await supabase
                    .from("profiles")
                    .select("id, full_name, avatar_url, role, points")
                    .eq("id", session.user.id)
                    .single()

                setProfile(profileData)
            } catch (error) {
                console.error("Auth check failed:", error)
            } finally {
                setIsLoaded(true)
            }
        }

        checkAuth()

        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            if (event === 'SIGNED_IN' && session?.user) {
                setUser(session.user)
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

                <SiteHeaderClient
                    user={isLoaded ? user : null}
                    profile={isLoaded ? profile : null}
                    initialNotifications={[]}
                />
            </div>
        </header>
    )
}
