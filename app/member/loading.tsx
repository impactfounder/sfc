import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { PageHeader } from "@/components/page-header"

export default function MemberLoading() {
  return (
    // [수정 핵심] 복잡한 레이아웃(grid, sidebar) 다 지우고 단순하게 변경
    <div className="flex flex-col gap-6">
      <PageHeader
        title="멤버"
        description="각자의 영역에서 성과를 증명한, 검증된 멤버들을 만나보세요."
        compact={true}
      />

      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-7 w-32" />
          <Skeleton className="h-5 w-24" />
        </div>

        {/* page.tsx와 동일한 비율(3열)로 맞춤 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <Card key={i} className="border-slate-200 bg-white h-full">
              <CardContent className="py-3 px-5 flex flex-col gap-4">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-16 w-16 rounded-full" />
                  <Skeleton className="h-5 w-20" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}