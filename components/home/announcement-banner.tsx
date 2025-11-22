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
    // 이벤트/게시글 섹션과 동일한 레이아웃 규격(max-w-6xl, margin auto)을 적용하여 라인을 맞춤
    <div className="w-full max-w-6xl mx-auto px-4 md:px-8">
      <div className="bg-white border border-gray-200/60 rounded-2xl shadow-sm py-3 px-5 flex items-center gap-3 transition-shadow hover:shadow-md">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600">
          <Bell className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0 flex items-center gap-2">
          <span className="hidden sm:inline-block px-2 py-0.5 rounded text-[11px] font-bold bg-slate-100 text-slate-600">
            공지
          </span>
          <Link
            href={`/community/posts/${announcement.id}`}
            className="text-sm font-medium text-gray-900 hover:text-blue-600 hover:underline truncate block"
          >
            {announcement.title}
          </Link>
        </div>
        <div className="shrink-0">
           <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
           </svg>
        </div>
      </div>
    </div>
  )
}