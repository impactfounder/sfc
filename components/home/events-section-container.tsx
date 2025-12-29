import { createClient } from "@/lib/supabase/server"
import { getUpcomingEvents } from "@/lib/queries/events"
import { getEventShortUrlSync } from "@/lib/utils/event-url"
import { EventsSection } from "@/components/home/events-section"

export async function EventsSectionContainer() {
    const supabase = await createClient()
    const events = await getUpcomingEvents(supabase, 4)

    // shortUrl을 동기식으로 생성 (DB 호출 없음 - 성능 최적화)
    const formattedEvents = events.map((event) => ({
        ...event,
        shortUrl: getEventShortUrlSync(event.id, event.event_date)
    }))

    return <EventsSection events={formattedEvents as any} title="주요 이벤트" createLink="/e/new" showFilters={false} />
}
