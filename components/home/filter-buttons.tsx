"use client"

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
    <div className="flex flex-wrap gap-2 overflow-x-auto pb-2">
      <button
        onClick={() => onSelect("all")}
        className={cn(
          "px-5 py-2 rounded-2xl border font-medium transition whitespace-nowrap",
          selectedSlug === "all"
            ? "border-transparent bg-black/80 text-white shadow"
            : "border-[#e5e7eb] bg-white/40 backdrop-blur-md shadow-sm hover:bg-white/60 text-gray-800"
        )}
      >
        전체
      </button>
      {categories.map((category) => (
        <button
          key={category.id}
          onClick={() => onSelect(category.slug)}
          className={cn(
            "px-5 py-2 rounded-2xl border font-medium transition whitespace-nowrap",
            selectedSlug === category.slug
              ? "border-transparent bg-black/80 text-white shadow"
              : "border-[#e5e7eb] bg-white/40 backdrop-blur-md shadow-sm hover:bg-white/60 text-gray-800"
          )}
        >
          {category.name}
        </button>
      ))}
    </div>
  )
}

