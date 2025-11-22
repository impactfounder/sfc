"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { EventCard } from "@/components/ui/event-card"
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty"
import { Plus } from "lucide-react"
import Link from "next/link"

type Event = {
  id: string
  title: string
  thumbnail_url?: string | null
  event_date: string
  event_time?: string | null
  location?: string | null
  current_participants?: number | null
  max_participants?: number | null
}

interface EventsSectionProps {
  events: Event[]
  onCreateEvent?: () => void
}

export function EventsSection({ events, onCreateEvent }: EventsSectionProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>이벤트</CardTitle>
        {onCreateEvent && (
          <Button onClick={onCreateEvent} size="sm" className="hidden lg:inline-flex">
            <Plus className="mr-2 h-4 w-4" />
            새 이벤트
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {events.length > 0 ? (
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {events.map((event) => (
              <EventCard
                key={event.id}
                event={event}
                layout="poster"
                href={`/community/events/${event.id}`}
              />
            ))}
          </div>
        ) : (
          <Empty className="bg-white/60">
            <EmptyHeader>
              <EmptyTitle>아직 예정된 이벤트가 없어요</EmptyTitle>
              <EmptyDescription>첫 번째 이벤트를 만들어 커뮤니티를 시작해보세요.</EmptyDescription>
            </EmptyHeader>
            {onCreateEvent && (
              <EmptyContent>
                <Button onClick={onCreateEvent}>이벤트 만들기</Button>
              </EmptyContent>
            )}
          </Empty>
        )}
      </CardContent>
    </Card>
  )
}

