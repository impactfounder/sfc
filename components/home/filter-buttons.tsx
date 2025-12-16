"use client"

import * as React from "react"
import * as ToggleGroupPrimitive from "@radix-ui/react-toggle-group"
import { cn } from "@/lib/utils"

type BoardCategory = {
  id: string
  name: string
  slug: string
}

interface FilterButtonsProps {
  categories: BoardCategory[]
  selectedSlug: string
  onSelect: (slug: string) => void
}

export function FilterButtons({ categories, selectedSlug, onSelect }: FilterButtonsProps) {
  return (
    <ToggleGroupPrimitive.Root
      type="single"
      value={selectedSlug}
      onValueChange={(value) => {
        if (value) onSelect(value)
      }}
      className="flex flex-wrap gap-2 overflow-x-auto pb-2"
    >
      <ToggleGroupPrimitive.Item
        value="all"
        className={cn(
          "px-4 py-1.5 rounded-full border font-medium transition whitespace-nowrap text-sm",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2",
          selectedSlug === "all"
            ? "bg-slate-900 text-white border-slate-900"
            : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
        )}
      >
        전체
      </ToggleGroupPrimitive.Item>
      {categories.map((category) => (
        <ToggleGroupPrimitive.Item
          key={category.id}
          value={category.slug}
          className={cn(
            "px-4 py-1.5 rounded-full border font-medium transition whitespace-nowrap text-sm",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2",
            selectedSlug === category.slug
              ? "bg-slate-900 text-white border-slate-900"
              : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
          )}
        >
          {category.name}
        </ToggleGroupPrimitive.Item>
      ))}
    </ToggleGroupPrimitive.Root>
  )
}
