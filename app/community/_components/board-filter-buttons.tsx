"use client"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export type BoardFilter = "all" | "vangol" | "hightalk" | "free-board" | "other"

const filterOptions: { value: BoardFilter; label: string }[] = [
  { value: "all", label: "전체" },
  { value: "vangol", label: "반골" },
  { value: "hightalk", label: "하이토크" },
  { value: "free-board", label: "자유게시판" },
  { value: "other", label: "기타" },
]

interface BoardFilterButtonsProps {
  activeFilter: BoardFilter
  onFilterChange: (filter: BoardFilter) => void
}

export function BoardFilterButtons({
  activeFilter,
  onFilterChange,
}: BoardFilterButtonsProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {filterOptions.map((option) => (
        <Button
          key={option.value}
          variant={activeFilter === option.value ? "default" : "outline"}
          size="sm"
          onClick={() => onFilterChange(option.value)}
          className={cn(
            activeFilter === option.value &&
              "bg-primary text-primary-foreground"
          )}
        >
          {option.label}
        </Button>
      ))}
    </div>
  )
}




