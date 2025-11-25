"use client"

import { useRouter } from "next/navigation"
import { NewEventForm } from "@/components/new-event-form"

type InitialData = {
  id: string
  title: string
  description: string
  event_date: string
  end_date?: string | null
  location?: string | null
  price?: number | null
  max_participants?: number | null
  thumbnail_url?: string | null
  event_type?: 'networking' | 'class' | 'activity' | null
}

export function ManageEventFormWrapper({
  userId,
  initialData
}: {
  userId: string
  initialData: InitialData
}) {
  const router = useRouter()

  const handleSuccess = () => {
    router.refresh()
  }

  return (
    <NewEventForm 
      userId={userId} 
      initialData={initialData}
      onSuccess={handleSuccess}
    />
  )
}

