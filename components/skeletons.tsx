import { Skeleton } from "@/components/ui/skeleton"

export function SidebarSkeleton() {
    return (
        <div className="h-full w-full flex flex-col bg-white border-r border-slate-100 shadow-sm p-4 space-y-6">
            <div className="space-y-2">
                <Skeleton className="h-8 w-3/4 rounded-xl" />
                <Skeleton className="h-8 w-full rounded-xl" />
                <Skeleton className="h-8 w-5/6 rounded-xl" />
            </div>
            <div className="space-y-2">
                <Skeleton className="h-4 w-1/2 rounded-md" />
                <Skeleton className="h-8 w-full rounded-xl" />
                <Skeleton className="h-8 w-full rounded-xl" />
            </div>
        </div>
    )
}

export function HeroSkeleton() {
    return (
        <div className="mb-6 rounded-2xl bg-slate-900 h-[140px] w-full animate-pulse" />
    )
}

export function EventsSkeleton() {
    return (
        <div className="w-full space-y-6">
            <div className="flex justify-between items-center">
                <Skeleton className="h-8 w-32" />
                <Skeleton className="h-8 w-24 rounded-full" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 2xl:grid-cols-3 gap-5 lg:gap-6">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="w-full aspect-[4/5] rounded-[20px] overflow-hidden">
                        <Skeleton className="w-full h-full" />
                    </div>
                ))}
            </div>
        </div>
    )
}

export function FeedSkeleton() {
    return (
        <div className="space-y-4">
            <div className="flex gap-2">
                <Skeleton className="h-10 w-16 rounded-full" />
                <Skeleton className="h-10 w-16 rounded-full" />
            </div>
            <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="h-48 rounded-lg border border-slate-200 bg-white p-4 space-y-3">
                        <div className="flex items-center gap-3">
                            <Skeleton className="h-10 w-10 rounded-full" />
                            <div className="space-y-1">
                                <Skeleton className="h-4 w-24" />
                                <Skeleton className="h-3 w-16" />
                            </div>
                        </div>
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-20 w-full" />
                    </div>
                ))}
            </div>
        </div>
    )
}

export function PhotoReviewsSkeleton() {
    return (
        <div className="w-full space-y-5">
            <div className="flex justify-between items-center">
                <Skeleton className="h-8 w-40" />
                <Skeleton className="h-5 w-20" />
            </div>
            <div className="flex gap-3 overflow-hidden -mx-4 px-4 md:mx-0 md:px-0">
                {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="flex-shrink-0 w-[70%] sm:w-[45%] md:w-[35%] lg:w-[30%] xl:w-[24%]">
                        <Skeleton className="w-full aspect-[4/5] rounded-2xl" />
                    </div>
                ))}
            </div>
        </div>
    )
}

export function ReviewsPageSkeleton() {
    return (
        <div className="w-full space-y-6">
            <div className="space-y-2">
                <Skeleton className="h-10 w-48" />
                <Skeleton className="h-5 w-72" />
            </div>
            <div className="flex gap-2 mb-6">
                <Skeleton className="h-10 w-20 rounded-full" />
                <Skeleton className="h-10 w-28 rounded-full" />
            </div>
            <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4">
                {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                    <div key={i} className="break-inside-avoid mb-4">
                        <Skeleton
                            className="w-full rounded-2xl"
                            style={{ height: `${200 + (i % 3) * 80}px` }}
                        />
                    </div>
                ))}
            </div>
        </div>
    )
}
