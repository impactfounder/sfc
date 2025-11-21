import Image from "next/image"
import Link from "next/link"
import { Calendar, Clock, MapPin, Users } from "lucide-react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"
import { AspectRatio } from "@/components/ui/aspect-ratio"
import { Card, CardContent, CardDescription, CardTitle } from "@/components/ui/card"

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

const eventCardVariants = cva(
  "rounded-2xl border bg-card text-card-foreground shadow-xs transition-shadow hover:shadow-sm",
  {
    variants: {
      layout: {
        poster: "flex flex-col gap-0 p-0",
        square: "flex flex-col gap-0 p-0",
        list: "flex flex-row items-center gap-4 p-3 sm:p-4",
      },
    },
    defaultVariants: {
      layout: "poster",
    },
  }
)

const mediaVariants = cva("relative overflow-hidden bg-gradient-to-br from-blue-500 to-indigo-600 text-white", {
  variants: {
    layout: {
      poster: "w-full rounded-none",
      square: "w-full rounded-none",
      list: "size-16 flex-shrink-0 rounded-lg",
    },
  },
  defaultVariants: {
    layout: "poster",
  },
})

const contentVariants = cva("flex flex-col gap-3", {
  variants: {
    layout: {
      poster: "p-5",
      square: "p-5",
      list: "flex-1 p-0",
    },
  },
  defaultVariants: {
    layout: "poster",
  },
})

type EventCardProps = VariantProps<typeof eventCardVariants> & {
  event: Event
  href?: string
  className?: string
}

export function EventCard({ event, layout = "poster", href, className }: EventCardProps) {
  const media = (
    <div className={cn(mediaVariants({ layout }))}>
      {layout === "list" ? (
        <div className="relative size-full">
          {renderImage(event)}
        </div>
      ) : (
        <AspectRatio ratio={layout === "poster" ? 4 / 3 : 1} className="relative">
          {renderImage(event)}
        </AspectRatio>
      )}
    </div>
  )

  const body = (
    <Card className={cn(eventCardVariants({ layout }), className)}>
      {media}
      <CardContent className={contentVariants({ layout })}>
        <div className="flex items-start justify-between gap-4">
          <CardTitle className={cn("text-lg", layout === "list" && "text-base line-clamp-1")}>{event.title}</CardTitle>
          {(event.current_participants || event.max_participants) && (
            <CardDescription className="flex items-center gap-1 text-xs font-medium">
              <Users className="size-4" />
              {event.current_participants || 0}/{event.max_participants ?? 0}
            </CardDescription>
          )}
        </div>
        <div className="space-y-2 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Calendar className="size-4 flex-shrink-0" />
            <span>{new Date(event.event_date).toLocaleDateString("ko-KR")}</span>
          </div>
          {event.event_time && (
            <div className="flex items-center gap-2">
              <Clock className="size-4 flex-shrink-0" />
              <span>{event.event_time}</span>
            </div>
          )}
          {event.location && (
            <div className="flex items-center gap-2">
              <MapPin className="size-4 flex-shrink-0" />
              <span className="truncate">{event.location}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )

  if (!href) {
    return body
  }

  return (
    <Link href={href} className="block">
      {body}
    </Link>
  )
}

function renderImage(event: Event) {
  if (event.thumbnail_url) {
    return (
      <Image
        src={event.thumbnail_url}
        alt={event.title}
        fill
        sizes="(max-width:768px) 100vw, 33vw"
        className="object-cover"
        priority={false}
      />
    )
  }

  return (
    <div className="flex h-full w-full items-center justify-center text-3xl font-semibold uppercase text-white">
      {event.title?.[0] || "E"}
    </div>
  )
}

