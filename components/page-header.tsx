import { cn } from "@/lib/utils"

interface PageHeaderProps {
  title: string
  description?: string
  children?: React.ReactNode
  className?: string
}

export function PageHeader({ title, description, children, className }: PageHeaderProps) {
  return (
    <div className={cn(
      "relative rounded-2xl overflow-hidden bg-gradient-to-r from-slate-900 to-slate-800 text-white mb-6 shadow-md min-h-[140px] flex flex-col justify-center",
      className
    )}>
      {/* 배경 패턴 이미지 (투명도 조절) */}
      <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?q=80&w=2613&auto=format&fit=crop')] bg-cover bg-center opacity-10 mix-blend-overlay" />
      
      <div className="relative z-10 px-6 py-6 md:py-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          {/* 좌측: 타이틀 및 설명 */}
          <div className="flex-1">
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold tracking-tight mb-2 text-white">
              {title}
            </h1>
            {description && (
              <p className="text-slate-300 text-sm md:text-base max-w-3xl leading-relaxed font-light">
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
