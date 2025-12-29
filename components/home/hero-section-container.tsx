import { getCachedUserProfile } from "@/lib/queries/cached"
import { HeroSection } from "@/components/home/hero-section"

export async function HeroSectionContainer() {
    const userProfile = await getCachedUserProfile()
    const user = userProfile?.user || null
    const profile = userProfile?.profile || null

    return <HeroSection user={user} profile={profile} loginHref="/auth/login" />
}
