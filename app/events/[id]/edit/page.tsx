import { createClient } from "@/lib/supabase/server"
import { redirect, notFound } from "next/navigation"
import { requireAuth } from "@/lib/auth/server"
import { NewEventForm } from "@/components/new-event-form"

export default async function EditEventPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const { user, supabase } = await requireAuth()

  // 이벤트 정보 조회
  const { data: event, error } = await supabase
    .from("events")
    .select("*")
    .eq("id", id)
    .single()

  if (error || !event) {
    notFound()
  }

  // 작성자 확인
  if (event.created_by !== user.id) {
    redirect("/")
  }

  // 초기 데이터 준비
  const initialData = {
    id: event.id,
    title: event.title,
    description: event.description || "",
    event_date: event.event_date,
    end_date: event.end_date,
    location: event.location,
    price: event.price,
    max_participants: event.max_participants,
    thumbnail_url: event.thumbnail_url,
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">이벤트 수정</h1>
          <p className="mt-2 text-slate-600">이벤트 정보를 수정할 수 있습니다.</p>
        </div>
        <NewEventForm 
          userId={user.id} 
          initialData={initialData}
        />
      </div>
    </div>
  )
}

