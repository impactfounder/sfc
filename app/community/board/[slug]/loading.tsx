import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function BoardLoading() {
  return (
    <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* [LEFT] 메인 콘텐츠 영역 */}
      <div className="lg:col-span-9 flex flex-col gap-6">
        {/* 배너 스켈레톤 */}
        <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-8">
          <Skeleton className="h-8 w-48 mb-2 bg-slate-700" />
          <Skeleton className="h-5 w-96 bg-slate-700" />
        </div>

        {/* 헤더 영역 스켈레톤 */}
        <div className="flex items-center justify-between w-full">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>

        {/* 게시글 리스트 스켈레톤 */}
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="bg-white rounded-2xl border border-slate-100 p-5">
              <div className="flex items-center gap-3 mb-3">
                <Skeleton className="h-8 w-8 rounded-full" />
                <div className="flex-1">
                  <Skeleton className="h-4 w-24 mb-1" />
                  <Skeleton className="h-3 w-32" />
                </div>
              </div>
              <Skeleton className="h-6 w-3/4 mb-2" />
              <Skeleton className="h-4 w-full mb-1" />
              <Skeleton className="h-4 w-2/3 mb-4" />
              <div className="flex items-center gap-4">
                <Skeleton className="h-4 w-12" />
                <Skeleton className="h-4 w-12" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* [RIGHT] 우측 사이드바 영역 */}
      <div className="hidden lg:block lg:col-span-3">
        <div className="sticky top-8 flex flex-col gap-6 h-fit">
          <Skeleton className="h-48 w-full rounded-xl" />
          <Skeleton className="h-32 w-full rounded-xl" />
        </div>
      </div>
    </div>
  );
}
