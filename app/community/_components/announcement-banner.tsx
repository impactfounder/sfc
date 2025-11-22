import Link from "next/link"
import { Bell } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

type Announcement = {
  id: string
  title: string
}

interface AnnouncementBannerProps {
  announcement: Announcement
}

export function AnnouncementBanner({ announcement }: AnnouncementBannerProps) {
  return (
    <Card className="border-blue-100 bg-blue-50 text-blue-900 shadow-none">
      <CardContent className="flex flex-row items-center gap-2 px-3 py-2">
        <Bell className="w-4 h-4 text-blue-600" />
        <span className="text-xs font-medium text-blue-700">공지</span>
        <Link
          href={`/community/posts/${announcement.id}`}
          className="text-sm font-semibold truncate hover:underline"
        >
          {announcement.title}
        </Link>
      </CardContent>
    </Card>
  )
}

