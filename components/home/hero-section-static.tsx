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
                setIsLoading(false)
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

    if (isLoading) {
        return <HeroSection user={null} profile={null} loginHref="/auth/login" />
    }

    return <HeroSection user={user} profile={profile} loginHref="/auth/login" />
}
