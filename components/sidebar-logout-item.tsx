"use client"

import { useState } from "react"
import { LogOut } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { DropdownMenuItem } from "@/components/ui/dropdown-menu"

export function SidebarLogoutItem() {
  const [isSigningOut, setIsSigningOut] = useState(false)

  const handleSignOut = async () => {
    if (isSigningOut) return
    
    setIsSigningOut(true)
    try {
      const supabase = createClient()
      await supabase.auth.signOut()
      localStorage.clear()
      sessionStorage.clear()
      window.location.replace('/')
    } catch (error) {
      console.error("로그아웃 실패:", error)
      setIsSigningOut(false)
    }
  }

  return (
    <DropdownMenuItem
      onClick={handleSignOut}
      disabled={isSigningOut}
      className="text-red-600 focus:text-red-600 focus:bg-red-50 cursor-pointer"
    >
      <LogOut className="mr-2 h-4 w-4" />
      {isSigningOut ? "로그아웃 중..." : "로그아웃"}
    </DropdownMenuItem>
  )
}

