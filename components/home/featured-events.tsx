"use client"

import { EventPostCard } from "@/components/event-post-card"
import type { EventForDisplay } from "@/lib/queries/events"
import { cn } from "@/lib/utils"

type FeaturedEventsProps = {
  events: EventForDisplay[]
}

export function FeaturedEvents({ events }: FeaturedEventsProps) {
  return (
    <section id="events-section" className="rounded-xl bg-slate-50 border border-slate-100 px-4 py-6 sm:px-6 sm:py-8 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg sm:text-xl font-bold text-slate-900">🔥 다가오는 이벤트</h2>
        <a
          href="/events"
          className="text-sm font-medium text-indigo-600 hover:text-indigo-700"
        >
          전체 보기
        </a>
      </div>

      {events.length === 0 ? (
        <div className="text-sm text-slate-500">등록된 이벤트가 없습니다. 곧 업데이트될 예정이에요.</div>
      ) : (
        <div
          className={cn(
            "flex gap-4 overflow-x-auto pb-2",
            "sm:grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 sm:gap-5 sm:overflow-visible"
          )}
        >
          {events.map((event) => (
            <div
              key={event.id}
              className="min-w-[260px] sm:min-w-0"
            >
              <EventPostCard event={event} />
            </div>
          ))}
        </div>
      )}
    </section>
  )
}

