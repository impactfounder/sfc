import { requireAuth } from "@/lib/auth/server"
import { NewCommunityForm } from "@/components/new-community-form"

export default async function NewCommunityPage() {
  const { user } = await requireAuth()
  const userId = user.id

  return (
    <div className="w-full max-w-4xl mx-auto">
      <NewCommunityForm userId={userId} />
    </div>
  )
}
