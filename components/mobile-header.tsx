"use client"

import Link from "next/link"
import Image from "next/image"
import { NotificationsDropdown } from "@/components/notifications-dropdown"

export function MobileHeader() {
  return (
    <header className="md:hidden fixed top-0 left-0 right-0 h-16 bg-white border-b border-slate-200 z-40 flex items-center justify-between px-4">
      <Link href="/" className="flex-shrink-0">
        <Image
          src="/images/ec-a0-9c-eb-aa-a9-20-ec-97-86-ec-9d-8c-1.png"
          alt="Seoul Founders Club"
          width={180}
          height={36}
          className="object-contain"
          priority
        />
      </Link>

      <div className="ml-auto flex items-center gap-2">
        <NotificationsDropdown />
      </div>
    </header>
  )
}
