import { cn } from "@/lib/utils"
import { Skeleton } from "@/components/ui/skeleton"

interface PageHeaderProps {
  title: string
  description?: string
  children?: React.ReactNode
  className?: string
  compact?: boolean
}

interface PageHeaderSkeletonProps {
  compact?: boolean
  className?: string
  hasAction?: boolean
}

/**
 * PageHeader의 스켈레톤 버전 - loading.tsx에서 사용
 * 실제 PageHeader와 동일한 높이/레이아웃을 유지하여 레이아웃 시프트 방지
 */
export function PageHeaderSkeleton({ compact = false, className, hasAction = false }: PageHeaderSkeletonProps) {
  return (
    <div
      className={cn(
        "relative rounded-xl overflow-hidden bg-gradient-to-r from-slate-900 to-slate-800 shadow-sm flex flex-col justify-center",
        compact ? "h-[130px]" : "h-[180px]",
        className
      )}
    >
      <div className={cn(
        "relative z-10 container mx-auto",
        compact ? "px-8 py-6" : "px-6 md:px-10 py-8"
      )}>
        <div className={cn(
          "flex flex-col md:flex-row md:items-center justify-between",
          compact ? "gap-2" : "gap-6"
        )}>
          <div className="flex-1 min-w-0">
            <Skeleton className={cn(
              "bg-slate-700/50 mb-2",
              compact ? "h-7 w-48" : "h-9 w-64"
            )} />
            <Skeleton className="h-5 w-80 max-w-full bg-slate-700/50" />
          </div>
          {hasAction && (
            <div className="flex-shrink-0">
              <Skeleton className="h-10 w-32 bg-slate-700/50" />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export function PageHeader({ title, description, children, className, compact = false }: PageHeaderProps) {
  return (
    <div
      className={cn(
        "relative rounded-xl overflow-hidden bg-gradient-to-r from-slate-900 to-slate-800 text-white mb-6 shadow-sm flex flex-col justify-center",
        compact ? "h-[130px]" : "h-[180px]",
        className
      )}
    >
      {/* 배경 패턴 이미지 (투명도 조절) */}
      <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?q=80&w=2613&auto=format&fit=crop')] bg-cover bg-center opacity-10 mix-blend-overlay pointer-events-none" />

      <div className={cn(
        "relative z-10 container mx-auto",
        compact ? "px-8 py-6" : "px-6 md:px-10 py-8"
      )}>
        <div className={cn(
          "flex flex-col md:flex-row md:items-center justify-between",
          compact ? "gap-2" : "gap-6"
        )}>
          {/* 좌측: 타이틀 및 설명 */}
          <div className="flex-1 min-w-0">
            <h1 className={cn(
              "font-bold tracking-tight text-white",
              compact ? "text-xl md:text-2xl mb-2" : "text-2xl md:text-3xl mb-2"
            )}>
              {title}
            </h1>
            {description && (
              <p className={cn(
                "text-slate-300 max-w-3xl leading-relaxed font-light",
                compact ? "text-sm md:text-base line-clamp-2" : "text-sm md:text-base line-clamp-3"
              )}>
                {description}
              </p>
            )}
          </div>

          {/* 우측: 액션 버튼 영역 (children이 있을 때만 렌더링) */}
          {children && (
            <div className="flex-shrink-0 flex items-center gap-3">
              {children}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
