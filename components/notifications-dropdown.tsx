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
          className="relative h-8 w-8"
          aria-label="알림"
        >
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 bg-red-500 rounded-full border-2 border-white flex items-center justify-center">
              {unreadCount > 9 && (
                <span className="text-[6px] text-white font-bold leading-none">9+</span>
              )}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-96 p-0" 
        align="end"
        side="bottom"
        sideOffset={8}
      >
        <div className="flex flex-col max-h-[500px]">
          <div className="flex items-center justify-between p-4 border-b">
            <h3 className="font-bold text-lg">알림</h3>
            {unreadCount > 0 && (
              <button 
                onClick={markAllAsRead} 
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                모두 읽음
              </button>
            )}
          </div>

          <div className="overflow-y-auto flex-1">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <Bell className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                <p className="text-sm">알림이 없습니다</p>
              </div>
            ) : (
              <div>
                {notifications.map((notification) => (
                  <button
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    className={cn(
                      "w-full p-4 text-left hover:bg-gray-50 transition-colors border-b last:border-b-0",
                      !notification.is_read && "bg-blue-50"
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold flex-shrink-0">
                        {notification.profiles?.full_name?.[0] || "?"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm mb-1">{notification.title}</p>
                        <p className="text-sm text-gray-600 line-clamp-2">{notification.message}</p>
                        <p className="text-xs text-gray-400 mt-1">
                          {new Date(notification.created_at).toLocaleDateString("ko-KR", {
                            month: "long",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                      {!notification.is_read && (
                        <div className="w-2 h-2 rounded-full bg-blue-600 flex-shrink-0 mt-2" />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}

export { NotificationsDropdown }
