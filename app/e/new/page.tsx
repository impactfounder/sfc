import { requireAuth } from "@/lib/auth/server"
import { NewEventForm } from "@/components/new-event-form"

export default async function NewEventPage() {
  const { user } = await requireAuth()
  const userId = user.id

  return <NewEventForm userId={userId} />
}

