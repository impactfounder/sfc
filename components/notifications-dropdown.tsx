"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Bell } from "lucide-react"
import { useRouter } from "next/navigation"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface Notification {
  id: string
  type: string
  title: string
  message: string
  related_post_id: string | null
  related_event_id: string | null
  is_read: boolean
  created_at: string
  profiles: {
    full_name: string
    avatar_url: string | null
  } | null
}

export default function NotificationsDropdown() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isOpen, setIsOpen] = useState(false)
  const [user, setUser] = useState<any>(null)
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    async function fetchNotifications() {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) return

      setUser(user)

      const { data } = await supabase
        .from("notifications")
        .select(`
          *,
          profiles:actor_id(full_name, avatar_url)
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(10)

      if (data) {
        setNotifications(data)
        setUnreadCount(data.filter((n) => !n.is_read).length)
      }
    }

    fetchNotifications()

    const channel = supabase
      .channel("notifications")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
        },
        () => {
          fetchNotifications()
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])


  async function markAsRead(notificationId: string) {
    await supabase.from("notifications").update({ is_read: true }).eq("id", notificationId)

    setNotifications((prev) => prev.map((n) => (n.id === notificationId ? { ...n, is_read: true } : n)))
    setUnreadCount((prev) => Math.max(0, prev - 1))
  }

  async function markAllAsRead() {
    if (!user) return

    await supabase.from("notifications").update({ is_read: true }).eq("user_id", user.id).eq("is_read", false)

    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))
    setUnreadCount(0)
  }

  function handleNotificationClick(notification: Notification) {
    markAsRead(notification.id)
    setIsOpen(false)

    if (notification.related_post_id) {
      router.push(`/community/posts/${notification.related_post_id}`)
    } else if (notification.related_event_id) {
      router.push(`/events/${notification.related_event_id}`)
    }
  }

  if (!user) return null

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "relative h-10 w-10 rounded-lg border-0 hover:bg-slate-100 transition-all",
            isOpen && "bg-slate-100"
          )}
          aria-label="알림"
        >
          <Bell className={cn("h-5 w-5 transition-colors", isOpen ? "text-slate-900" : "text-slate-600")} />
          {unreadCount > 0 && (
            <span className="absolute top-2 right-2 h-2 w-2 bg-red-500 rounded-full border-2 border-white shadow-sm" />
          )}
        </Button>
      </PopoverTrigger>
      
      {/* Full Height & Solid Background Panel */}
      <PopoverContent 
        className="w-full sm:w-[400px] max-w-[100vw] p-0 h-screen bg-white border-r border-slate-200 shadow-2xl rounded-none flex flex-col ml-0" 
        side="right" 
        align="start"
        sideOffset={0}
        alignOffset={-140}
        collisionPadding={0}
      >
        {/* 헤더 */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-white shrink-0">
          <div className="flex items-center gap-2.5">
            <Bell className="h-5 w-5 text-slate-900" />
            <h3 className="font-bold text-xl text-slate-900">알림</h3>
            {unreadCount > 0 && (
              <span className="bg-red-600 text-white text-[11px] font-bold px-2 py-0.5 rounded-full shadow-sm">
                {unreadCount} NEW
              </span>
            )}
          </div>
          {unreadCount > 0 && (
            <button 
              onClick={markAllAsRead} 
              className="text-xs text-slate-500 hover:text-blue-600 font-medium transition-colors underline underline-offset-4"
            >
              모두 읽음
            </button>
          )}
        </div>

        {/* 리스트 영역 */}
        <div className="overflow-y-auto flex-1 bg-white">
          {notifications.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 p-8 space-y-4">
              <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center">
                <Bell className="w-10 h-10 text-slate-300" />
              </div>
              <p className="text-base font-medium text-slate-500">새로운 알림이 없습니다</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-50">
              {notifications.map((notification) => (
                <button
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={cn(
                    "w-full p-6 text-left hover:bg-slate-50 transition-all duration-200 group relative",
                    !notification.is_read ? "bg-blue-50/30" : "bg-white"
                  )}
                >
                  {/* 읽지 않음 표시 점 (좌측) */}
                  {!notification.is_read && (
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500" />
                  )}
                  
                  <div className="flex gap-4">
                    <div className="shrink-0 mt-1">
                      <div className="w-10 h-10 rounded-full bg-white border border-slate-100 flex items-center justify-center shadow-sm overflow-hidden">
                        {notification.profiles?.avatar_url ? (
                          <img src={notification.profiles.avatar_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-sm font-bold text-slate-400">{notification.profiles?.full_name?.[0] || "!"}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0 space-y-1.5">
                      <div className="flex justify-between items-start">
                        <p className="font-bold text-sm text-slate-900 leading-tight">
                          {notification.title}
                        </p>
                        <span className="text-[10px] text-slate-400 shrink-0 font-medium">
                          {new Date(notification.created_at).toLocaleDateString("ko-KR", {
                            month: "short",
                            day: "numeric",
                          })}
                        </span>
                      </div>
                      <p className="text-sm text-slate-600 line-clamp-2 leading-relaxed">
                        {notification.message}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}

export { NotificationsDropdown }
