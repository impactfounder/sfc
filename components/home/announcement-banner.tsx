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
    <div className="bg-white border border-gray-200/60 rounded-2xl shadow-sm py-2.5 px-5 flex items-center gap-2.5">
      <Bell className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />
      <Link
        href={`/community/posts/${announcement.id}`}
        className="text-sm font-medium text-gray-900 hover:underline truncate"
      >
        {announcement.title}
      </Link>
    </div>
  )
}

