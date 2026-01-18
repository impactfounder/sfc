"use client"

import { useState } from "react"
import { Star, ChevronDown, ChevronUp, Award, Calendar } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import type { ReviewForDisplay } from "@/lib/types/reviews"
import { cn } from "@/lib/utils"
import Link from "next/link"

interface ReviewCardProps {
    review: ReviewForDisplay
    className?: string
}

export function ReviewCard({ review, className }: ReviewCardProps) {
    const [isExpanded, setIsExpanded] = useState(false)

    const handleExpandClick = (e: React.MouseEvent) => {
        e.preventDefault()
        e.stopPropagation()
        setIsExpanded(!isExpanded)
    }

    const renderStars = (rating: number) => {
        const stars = []
        const fullStars = Math.floor(rating)
        const hasHalfStar = rating % 1 !== 0

        for (let i = 0; i < 5; i++) {
            if (i < fullStars) {
                stars.push(<Star key={i} className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />)
            } else if (i === fullStars && hasHalfStar) {
                stars.push(
                    <div key={i} className="relative h-3.5 w-3.5">
                        <Star className="h-3.5 w-3.5 fill-gray-200 text-gray-300 absolute" />
                        <Star
                            className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400 absolute"
                            style={{ clipPath: "polygon(0 0, 50% 0, 50% 100%, 0 100%)" }}
                        />
                    </div>
                )
            } else {
                stars.push(<Star key={i} className="h-3.5 w-3.5 fill-gray-200 text-gray-300" />)
            }
        }
        return stars
    }

    const getInitials = (name: string | null) => {
        if (!name) return "?"
        return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    }

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString("ko-KR", {
            year: "numeric",
            month: "long",
            day: "numeric",
        })
    }

    return (
        <Link href={`/events/${review.event_id}`} className="block">
        <Card
            className={cn(
                "group relative overflow-hidden cursor-pointer",
                "bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl",
                "border border-slate-200/60 dark:border-slate-700/60",
                "shadow-sm hover:shadow-lg transition-all duration-300",
                "hover:border-primary/30",
                className
            )}
        >
            {/* 베스트 뱃지 */}
            {review.is_best && (
                <div className="absolute top-3 right-3 z-10">
                    <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0 gap-1 shadow-sm text-xs">
                        <Award className="h-3 w-3" />
                        BEST
                    </Badge>
                </div>
            )}

            {/* 가로 레이아웃 */}
            <div className="flex flex-col sm:flex-row">
                {/* 왼쪽: 날짜 & 사용자 정보 & 별점 - 중앙 정렬 적용 */}
                <div className="sm:w-48 flex-shrink-0 p-5 border-b sm:border-b-0 sm:border-r border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex flex-col items-center text-center space-y-4">
                    <div className="w-full flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                        <Calendar className="h-3 w-3" />
                        <time>{formatDate(review.created_at)}</time>
                    </div>

                    <div className="flex flex-col items-center gap-3 w-full pt-1">
                        <Avatar className="h-14 w-14 ring-4 ring-white dark:ring-slate-900 shadow-sm">
                            <AvatarImage src={review.profiles?.avatar_url || undefined} />
                            <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/10 text-primary font-semibold text-sm">
                                {getInitials(review.profiles?.full_name ?? "")}
                            </AvatarFallback>
                        </Avatar>

                        <div className="space-y-0.5">
                            <div className="flex items-center justify-center gap-1.5">
                                <h3 className="font-bold text-slate-900 dark:text-slate-50 text-[15px]">
                                    {review.profiles?.full_name || "익명"}
                                </h3>
                                {review.profiles?.role === "admin" && (
                                    <Badge variant="secondary" className="text-[10px] py-0 h-4 px-1">
                                        운영진
                                    </Badge>
                                )}
                            </div>
                            {(review.profiles?.company || review.profiles?.position) && (
                                <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1 max-w-[140px] mx-auto">
                                    {review.profiles?.company && review.profiles?.position
                                        ? `${review.profiles.company} · ${review.profiles.position}`
                                        : review.profiles?.company || review.profiles?.position}
                                </p>
                            )}
                        </div>

                        <div className="flex items-center gap-1.5 bg-white dark:bg-slate-900 px-2.5 py-1 rounded-full border border-slate-100 dark:border-slate-800 shadow-sm mt-1">
                            <div className="flex gap-0.5">{renderStars(review.rating)}</div>
                            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 ml-0.5">
                                {review.rating.toFixed(1)}
                            </span>
                        </div>
                    </div>
                </div>

                {/* 오른쪽: 리뷰 내용 */}
                <div className="flex-1 p-5 space-y-3">
                    {/* 행사명 + 날짜 */}
                    <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 group-hover:border-primary/20 group-hover:bg-slate-100 dark:group-hover:bg-slate-800 transition-all duration-300">
                        <div className="flex items-center gap-2 min-w-0">
                            <Calendar className="h-4 w-4 text-primary shrink-0" />
                            <div className="flex flex-col gap-0.5 min-w-0">
                                <h4 className="font-semibold text-sm text-slate-900 dark:text-slate-100 truncate pr-1 group-hover:text-primary transition-colors">
                                    {review.events.title}
                                </h4>
                                <span className="text-xs text-slate-500 dark:text-slate-400">
                                    {formatDate(review.events.event_date)}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* 키워드 */}
                    {review.keywords.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                            {review.keywords.map((keyword, index) => (
                                <Badge
                                    key={index}
                                    variant="outline"
                                    className="bg-primary/5 border-primary/20 text-primary text-xs px-2.5 py-0.5 font-normal"
                                >
                                    {keyword}
                                </Badge>
                            ))}
                        </div>
                    )}

                    {/* 한 줄 평 */}
                    <blockquote className="relative pl-3 py-1 before:content-[''] before:absolute before:left-0 before:top-0 before:bottom-0 before:w-0.5 before:bg-gradient-to-b before:from-primary before:to-primary/50 before:rounded-full">
                        <p className="text-sm font-semibold text-slate-900 dark:text-slate-50 leading-relaxed line-clamp-2">
                            "{review.one_liner}"
                        </p>
                    </blockquote>

                    {/* 상세 내용 */}
                    {review.detail_content && (
                        <div className="space-y-2 pt-2 border-t border-slate-100/50 dark:border-slate-800/50">
                            {isExpanded && (
                                <div className="prose prose-sm dark:prose-invert max-w-none animate-in fade-in duration-300">
                                    <p className="text-sm text-slate-600 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
                                        {review.detail_content}
                                    </p>
                                </div>
                            )}
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleExpandClick}
                                className="w-full justify-center gap-1 text-xs text-slate-500 hover:text-primary hover:bg-primary/5 h-8"
                            >
                                {isExpanded ? (
                                    <>
                                        접기 <ChevronUp className="h-3 w-3" />
                                    </>
                                ) : (
                                    <>
                                        더보기 <ChevronDown className="h-3 w-3" />
                                    </>
                                )}
                            </Button>
                        </div>
                    )}

                    {/* 이미지 */}
                    {review.images && review.images.length > 0 && (
                        <div className="grid grid-cols-4 gap-2 pt-1">
                            {review.images.slice(0, 4).map((image, index) => (
                                <div
                                    key={index}
                                    className="aspect-square rounded-md bg-slate-100 dark:bg-slate-800 overflow-hidden shadow-sm"
                                >
                                    <img
                                        src={image}
                                        alt={`후기 이미지 ${index + 1}`}
                                        className="w-full h-full object-cover hover:scale-110 transition-transform duration-300"
                                    />
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </Card>
        </Link>
    )
}
