import { cn } from "@/lib/utils"

interface PageHeaderProps {
  title: string
  description?: string
  children?: React.ReactNode
  className?: string
  compact?: boolean
}

export function PageHeader({ title, description, children, className, compact = false }: PageHeaderProps) {
  return (
    <div
      className={cn(
        "relative rounded-xl overflow-hidden bg-gradient-to-r from-slate-900 to-slate-800 text-white mb-6 shadow-sm flex flex-col",
        compact ? "min-h-[140px]" : "min-h-[180px]",
        className
      )}
    >
      {/* 배경 패턴 이미지 (투명도 조절) */}
      <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?q=80&w=2613&auto=format&fit=crop')] bg-cover bg-center opacity-10 mix-blend-overlay pointer-events-none" />

      <div className={cn(
        "relative z-10 container mx-auto",
        compact ? "px-4 py-4" : "px-6 md:px-10 py-8"
      )}>
        <div className={cn(
          "flex flex-col md:flex-row md:items-center justify-between",
          compact ? "gap-2" : "gap-6"
        )}>
          {/* 좌측: 타이틀 및 설명 */}
          <div className="flex-1">
            <h1 className={cn(
              "font-bold tracking-tight text-white",
              compact ? "text-xl md:text-2xl mb-2" : "text-2xl md:text-3xl mb-2"
            )}>
              {title}
            </h1>
            {description && (
              <p className={cn(
                "text-slate-300 max-w-3xl leading-relaxed font-light whitespace-pre-wrap",
                compact ? "text-sm md:text-base" : "text-sm md:text-base"
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
