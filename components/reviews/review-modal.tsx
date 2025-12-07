"use client"

import { useState } from "react"
import { Star } from "lucide-react"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { createReview } from "@/lib/actions/reviews"

const REVIEW_KEYWORDS = [
    "인사이트가 넘쳐요",
    "네트워킹이 좋아요",
    "운영이 매끄러워요",
    "분위기가 편안해요",
    "동기부여가 돼요",
    "실무에 유용해요",
    "다음에 또 오고 싶어요",
    "강연이 알차요",
]

interface ReviewModalProps {
    userId: string
    eventId: string
    open?: boolean
    onOpenChange?: (open: boolean) => void
}

export function ReviewModal({ userId, eventId, open, onOpenChange }: ReviewModalProps) {
    const [rating, setRating] = useState(0)
    const [hoveredRating, setHoveredRating] = useState(0)
    const [selectedKeywords, setSelectedKeywords] = useState<string[]>([])
    const [oneLiner, setOneLiner] = useState("")
    const [detailContent, setDetailContent] = useState("")
    const [isOptionalOpen, setIsOptionalOpen] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [internalOpen, setInternalOpen] = useState(false)

    const isControlled = typeof open === "boolean" && typeof onOpenChange === "function"
    const isOpen = isControlled ? open : internalOpen
    const handleOpenChange = isControlled ? onOpenChange! : setInternalOpen

    const isValid = rating >= 0.5 && oneLiner.length >= 20 && oneLiner.length <= 100 && selectedKeywords.length > 0

    const handleStarClick = (index: number, isHalf: boolean) => {
        const newRating = index + (isHalf ? 0.5 : 1)
        setRating(newRating)
    }

    const toggleKeyword = (keyword: string) => {
        setSelectedKeywords((prev) =>
            prev.includes(keyword) ? prev.filter((k) => k !== keyword) : [...prev, keyword]
        )
    }

    const handleSubmit = async () => {
        // userId 체크는 호출하는 쪽(ReviewWriteButton)에서 이미 수행했으므로 여기선 생략하거나 이중 체크
        if (!userId) {
            toast.error("로그인이 필요한 서비스입니다.")
            return
        }

        if (!isValid) return

            setIsSubmitting(true)
            try {
                await createReview({
                    user_id: userId,
                    event_id: eventId,
                    rating,
                    keywords: selectedKeywords,
                    one_liner: oneLiner,
                    detail_content: detailContent || null,
                    is_public: true,
                })

                toast.success("후기가 등록되었습니다! 🎉")

                // 폼 초기화
                setRating(0)
                setSelectedKeywords([])
                setOneLiner("")
                setDetailContent("")
                setIsOptionalOpen(false)
                handleOpenChange(false) // 닫기
            } catch (error: any) {
                console.error(error)
                toast.error(error.message || "후기 등록에 실패했습니다. 다시 시도해주세요.")
            } finally {
                setIsSubmitting(false)
            }
    }

    const renderStars = () => {
        return (
            <div className="flex gap-1.5">
                {[1, 2, 3, 4, 5].map((index) => {
                    const isFilled = rating >= index
                    const isHalfFilled = rating === index - 0.5

                    return (
                        <div
                            key={index}
                            className="relative cursor-pointer transition-transform hover:scale-110"
                            onMouseLeave={() => setHoveredRating(0)}
                        >
                            {/* 왼쪽 절반 (0.5점) */}
                            <div
                                className="absolute inset-0 w-1/2 z-10"
                                onMouseEnter={() => setHoveredRating(index - 0.5)}
                                onClick={() => handleStarClick(index - 1, true)}
                            />
                            {/* 오른쪽 절반 (1점) */}
                            <div
                                className="absolute inset-0 left-1/2 w-1/2 z-10"
                                onMouseEnter={() => setHoveredRating(index)}
                                onClick={() => handleStarClick(index - 1, false)}
                            />

                            <Star
                                className={cn(
                                    "h-9 w-9 sm:h-10 sm:w-10 transition-colors duration-200",
                                    (hoveredRating >= index || isFilled)
                                        ? "fill-yellow-400 text-yellow-400 drop-shadow-sm"
                                        : (hoveredRating === index - 0.5 || isHalfFilled)
                                            ? "fill-yellow-400/50 text-yellow-400"
                                            : "fill-slate-100 text-slate-200"
                                )}
                                style={{
                                    clipPath:
                                        (hoveredRating === index - 0.5 || isHalfFilled) && !(hoveredRating >= index || isFilled)
                                            ? "polygon(0 0, 50% 0, 50% 100%, 0 100%)"
                                            : undefined,
                                }}
                            />
                            {/* 배경 별 (반만 채워졌을 때 뒤에 깔리는 회색 별) */}
                            {(hoveredRating === index - 0.5 || isHalfFilled) && !(hoveredRating >= index || isFilled) && (
                                <Star
                                    className="absolute inset-0 h-9 w-9 sm:h-10 sm:w-10 fill-slate-100 text-slate-200 -z-10"
                                />
                            )}
                        </div>
                    )
                })}
            </div>
        )
    }

    return (
        <Dialog open={isOpen} onOpenChange={handleOpenChange}>
            <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto p-0 flex flex-col gap-0 select-none">
                <DialogHeader className="p-6 pb-2">
                    <DialogTitle className="text-2xl font-bold text-slate-900 tracking-tight">
                        ✨ 후기 남기기
                    </DialogTitle>
                    <DialogDescription className="text-base text-slate-500">
                        이 모임, 어떠셨나요? 솔직한 이야기를 들려주세요.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto px-6 py-2 space-y-8">
                    {/* 1단계: 별점 선택 */}
                    <div className="space-y-3 bg-slate-50/50 p-4 rounded-xl border border-slate-100">
                        <div className="flex items-center justify-between">
                            <label className="text-sm font-bold text-slate-900">
                                만족도
                            </label>
                            <span className="text-sm font-bold text-yellow-500 bg-yellow-50 px-2 py-0.5 rounded-md border border-yellow-100">
                                {rating > 0 ? `${rating.toFixed(1)}점` : "선택 전"}
                            </span>
                        </div>
                        <div className="flex justify-center py-2">
                            {renderStars()}
                        </div>
                        <p className="text-xs text-center text-slate-400">
                            반 개 단위로 평가할 수 있어요
                        </p>
                    </div>

                    {/* 2단계: 키워드 선택 */}
                    <div className="space-y-3">
                        <label className="text-sm font-bold text-slate-900 flex items-center gap-2">
                            좋았던 점 <span className="text-xs font-normal text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">중복 가능</span>
                        </label>
                        <div className="flex flex-wrap gap-2">
                            {REVIEW_KEYWORDS.map((keyword) => {
                                const isSelected = selectedKeywords.includes(keyword)
                                return (
                                    <div
                                        key={keyword}
                                        onClick={() => toggleKeyword(keyword)}
                                        className={cn(
                                            "cursor-pointer text-sm px-3 py-2 rounded-lg border transition-all duration-200 flex items-center gap-2 select-none active:scale-95",
                                            isSelected
                                                ? "bg-slate-900 text-white border-slate-900 shadow-md ring-2 ring-slate-200 ring-offset-1 font-medium"
                                                : "bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                                        )}
                                    >
                                        <span>{keyword}</span>
                                        {isSelected && <span className="text-xs opacity-80">✓</span>}
                                    </div>
                                )
                            })}
                        </div>
                    </div>

                    {/* 3단계: 한 줄 평 */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <label className="text-sm font-bold text-slate-900">
                                한 줄 평 <span className="text-red-500">*</span>
                            </label>
                            <span
                                className={cn(
                                    "text-xs font-medium px-2 py-0.5 rounded-full transition-colors",
                                    oneLiner.length >= 20 && oneLiner.length <= 100
                                        ? "bg-green-100 text-green-700"
                                        : oneLiner.length > 100
                                            ? "bg-red-100 text-red-700"
                                            : "bg-slate-100 text-slate-500"
                                )}
                            >
                                {oneLiner.length} / 100
                            </span>
                        </div>
                        <Input
                            placeholder="최소 20자 이상 입력해주세요"
                            value={oneLiner}
                            onChange={(e) => setOneLiner(e.target.value)}
                            maxLength={100}
                            className="h-12 text-base bg-white focus-visible:ring-slate-900 transition-shadow"
                        />
                        {oneLiner.length > 0 && oneLiner.length < 20 && (
                            <p className="text-xs text-red-500 flex items-center gap-1 animate-pulse">
                                🚨 조금만 더 작성해주세요! ({20 - oneLiner.length}자 부족)
                            </p>
                        )}
                    </div>

                    {/* 4단계: 선택 사항 (접기) */}
                    <div className="border-t border-slate-100 pt-2">
                        <Collapsible open={isOptionalOpen} onOpenChange={setIsOptionalOpen}>
                            <CollapsibleTrigger asChild>
                                <Button variant="ghost" className="w-full flex items-center justify-between p-0 h-10 hover:bg-transparent hover:text-slate-900 text-slate-500">
                                    <span className="text-sm font-medium flex items-center gap-2">
                                        <span className="text-lg">✍️</span> 더 자세히 쓰고 싶다면 (선택)
                                    </span>
                                    <span className="text-xs bg-slate-100 px-2 py-1 rounded-full">
                                        {isOptionalOpen ? "접기 ▲" : "펼치기 ▼"}
                                    </span>
                                </Button>
                            </CollapsibleTrigger>
                            <CollapsibleContent className="space-y-4 pt-4">
                                <Textarea
                                    placeholder="자유롭게 후기를 남겨주세요."
                                    value={detailContent}
                                    onChange={(e) => setDetailContent(e.target.value)}
                                    rows={5}
                                    className="resize-none bg-slate-50 border-slate-200 focus:bg-white transition-colors"
                                />
                                <div className="border-2 border-dashed border-slate-200 rounded-xl p-6 text-center">
                                    <div className="text-2xl mb-2">📸</div>
                                    <p className="text-sm font-medium text-slate-900">사진 추가</p>
                                    <p className="text-xs text-slate-400 mt-1">준비 중인 기능입니다</p>
                                </div>
                            </CollapsibleContent>
                        </Collapsible>
                    </div>
                </div>

                {/* 하단 버튼 */}
                <div className="p-6 border-t border-slate-100 bg-white">
                    <div className="flex gap-3">
                        <Button
                            variant="outline"
                            className="flex-1 h-12 text-base font-medium border-slate-200 hover:bg-slate-50 hover:text-slate-900"
                            onClick={() => handleOpenChange(false)}
                        >
                            닫기
                        </Button>
                        <Button
                            className={cn(
                                "flex-[2] h-12 text-base font-bold shadow-md transition-all",
                                isValid
                                    ? "bg-slate-900 hover:bg-slate-800 text-white hover:shadow-lg hover:-translate-y-0.5"
                                    : "bg-slate-100 text-slate-400 shadow-none cursor-not-allowed"
                            )}
                            onClick={handleSubmit}
                            disabled={!isValid || isSubmitting}
                        >
                            {isSubmitting ? (
                                <span className="flex items-center gap-2">
                                    <span className="animate-spin text-xl">◌</span> 등록 중...
                                </span>
                            ) : (
                                "✨ 후기 등록 완료"
                            )}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}

interface ReviewWriteButtonProps {
    userId: string
    eventId: string
}

export function ReviewWriteButton({ userId, eventId }: ReviewWriteButtonProps) {
    const [isModalOpen, setIsModalOpen] = useState(false)

    const handleClick = () => {
        if (!userId) {
            toast.error("로그인이 필요한 서비스입니다.", {
                description: "후기를 작성하시려면 먼저 로그인해주세요.",
                action: {
                    label: "로그인",
                    onClick: () => window.location.href = `/auth/login?next=${encodeURIComponent(window.location.pathname)}`
                }
            })
            return
        }
        setIsModalOpen(true)
    }

    return (
        <>
            <Button
                size="lg"
                className="bg-slate-900 text-white hover:bg-slate-800 font-medium px-8 shadow-sm transition-all hover:shadow-md"
                onClick={handleClick}
            >
                ✍️ 새 후기 작성
            </Button>

            <ReviewModal
                userId={userId}
                eventId={eventId}
                open={isModalOpen}
                onOpenChange={setIsModalOpen}
            />
        </>
    )
}
