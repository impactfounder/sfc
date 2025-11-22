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
          "px-4 py-1.5 rounded-full border font-medium transition whitespace-nowrap text-sm",
          selectedSlug === "all"
            ? "bg-gray-900 text-white border-gray-900"
            : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
        )}
      >
        전체
      </button>
      {categories.map((category) => (
        <button
          key={category.id}
          onClick={() => onSelect(category.slug)}
          className={cn(
            "px-4 py-1.5 rounded-full border font-medium transition whitespace-nowrap text-sm",
            selectedSlug === category.slug
              ? "bg-gray-900 text-white border-gray-900"
              : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
          )}
        >
          {category.name}
        </button>
      ))}
    </div>
  )
}
