import { CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Plus } from "lucide-react"

export function EventsSectionHeader() {
  return (
    <CardHeader className="flex flex-row items-center justify-between">
      <CardTitle>이벤트</CardTitle>
      <div className="hidden lg:block">
        <Button asChild size="sm">
          <Link href="/events/new">
            <Plus className="mr-2 h-4 w-4" />
            새 이벤트
          </Link>
        </Button>
      </div>
    </CardHeader>
  )
}

