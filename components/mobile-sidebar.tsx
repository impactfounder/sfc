"use client"

import { useState } from "react"
import { Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sidebar } from "./sidebar"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"

export function MobileSidebar() {
  const [open, setOpen] = useState(false)

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="md:hidden fixed top-4 left-4 z-50 bg-white border-2 border-slate-200 shadow-lg hover:bg-slate-50"
          aria-label="메뉴 열기"
        >
          <Menu className="h-5 w-5 text-slate-700" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="p-0 w-64" onPointerDownOutside={() => setOpen(false)}>
        <Sidebar isMobile={true} />
      </SheetContent>
    </Sheet>
  )
}
