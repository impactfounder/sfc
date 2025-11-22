import Link from "next/link"
import { Bell } from "lucide-react"

type Announcement = {
  id: string
  title: string
}

interface AnnouncementBannerProps {
  announcement: Announcement | null
}

export function AnnouncementBanner({ announcement }: AnnouncementBannerProps) {
  if (!announcement) return null

  return (
    <div className="bg-blue-50 border rounded-xl py-3 px-4 flex items-center gap-2">
      <Bell className="w-4 h-4 text-blue-600 flex-shrink-0" />
      <Link
        href={`/community/posts/${announcement.id}`}
        className="text-sm font-medium text-blue-900 hover:underline truncate"
      >
        {announcement.title}
      </Link>
    </div>
  )
}

