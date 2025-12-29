import { getCachedUserProfile } from "@/lib/queries/cached"
import { MobileHeader } from "@/components/mobile-header"

export async function MobileHeaderContainer() {
    const userProfile = await getCachedUserProfile()
    const role = userProfile?.profile?.role

    return <MobileHeader userRole={role} />
}
