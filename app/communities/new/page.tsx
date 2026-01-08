import { requireAuth } from "@/lib/auth/server"
import { NewCommunityForm } from "@/components/new-community-form"
import { StandardRightSidebar } from "@/components/standard-right-sidebar"
import { ThreeColumnLayout } from "@/components/layout/three-column-layout"

export default async function NewCommunityPage() {
  const { user } = await requireAuth()
  const userId = user.id

  return (
    <ThreeColumnLayout rightSidebar={<StandardRightSidebar />}>
      <NewCommunityForm userId={userId} />
    </ThreeColumnLayout>
  )
}
