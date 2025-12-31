"use client"

import { useRef, useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Calendar, MapPin, Users, Wallet, ExternalLink, Edit, AlertCircle } from 'lucide-react'
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { EventShareButton } from "@/components/event-share-button"
import { DeleteEventButton } from "@/components/delete-event-button"
import { RegisterButton } from "@/components/register-button"
import Link from "next/link"

type Props = {
  event: any
  hostName: string
  hostAvatar?: string
  dateStr: string
  timeStr: string
  currentCount: number
  maxCount: number | null
  isFull: boolean
  isPastEvent: boolean
  isCompleted: boolean
  isCreator: boolean
  isRegistered: boolean
  userRegistration: any
  eventId: string
  basePath: string
  userId?: string
}

function InfoRow({ icon: Icon, value, href }: { icon: any, value: string, href?: string }) {
  const content = (
    <div className={`flex items-center gap-3 p-3 rounded-lg border border-slate-100 ${href ? 'hover:bg-slate-50 cursor-pointer group transition-colors' : ''}`}>
      <Icon className="w-4 h-4 text-slate-400 shrink-0" />
      <span className="text-sm font-medium text-slate-700 truncate flex-1">{value}</span>
      {href && <ExternalLink className="w-3.5 h-3.5 text-slate-300 group-hover:text-slate-500 shrink-0" />}
    </div>
  )
  if (href) return <a href={href} target="_blank" rel="noopener noreferrer" className="block">{content}</a>
  return content
}

export function EventDetailHero(props: Props) {
  const {
    event, hostName, hostAvatar, dateStr, timeStr,
    currentCount, maxCount, isFull, isPastEvent, isCompleted,
    isCreator, isRegistered, userRegistration, eventId, basePath, userId
  } = props

  const imageRef = useRef<HTMLDivElement>(null)
  const [cardHeight, setCardHeight] = useState<number | null>(null)

  // 이미지 높이 측정 후 카드에 적용
  useEffect(() => {
    const updateHeight = () => {
      if (imageRef.current) {
        setCardHeight(imageRef.current.offsetHeight)
      }
    }

    updateHeight()
    window.addEventListener('resize', updateHeight)
    return () => window.removeEventListener('resize', updateHeight)
  }, [])

  const googleMapUrl = event.location
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.location)}`
    : undefined

  const priceStr = event.price && event.price > 0
    ? `${event.price.toLocaleString()}원`
    : '무료'

  const percent = maxCount ? Math.min(100, (currentCount / maxCount) * 100) : 100

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 items-start">

      {/* 좌측: 이미지 (1:1 고정, 높이 기준) */}
      <div ref={imageRef} className="w-full">
        <div className="aspect-square relative rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 shadow-sm">
          {event.thumbnail_url ? (
            <img
              src={event.thumbnail_url}
              alt={event.title}
              className="absolute inset-0 w-full h-full object-cover"
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-slate-100 via-slate-200 to-slate-300 flex items-center justify-center">
              <Calendar className="w-20 h-20 text-slate-400" />
            </div>
          )}

          {/* 상태 뱃지 */}
          <div className="absolute top-4 left-4 z-10 flex gap-2">
            {isCompleted ? (
              <Badge className="bg-slate-900 text-white border-none shadow-md px-2.5 py-1 text-xs">종료됨</Badge>
            ) : isPastEvent ? (
              <Badge variant="secondary" className="bg-white/90 text-slate-700 shadow-md backdrop-blur-md px-2.5 py-1 text-xs">종료됨</Badge>
            ) : isFull ? (
              <Badge variant="destructive" className="shadow-md px-2.5 py-1 text-xs">마감임박</Badge>
            ) : (
              <Badge className="bg-green-600 hover:bg-green-700 text-white border-none shadow-md px-2.5 py-1 text-xs">모집중</Badge>
            )}
          </div>

          {/* 인원 뱃지 */}
          <div className="absolute top-4 right-4 z-10">
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-black/60 text-white backdrop-blur-md shadow-md">
              <Users className="w-3.5 h-3.5" />
              <span>{currentCount}/{maxCount || '∞'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 우측: 정보 카드 (이미지와 같은 높이) */}
      <div
        className="w-full"
        style={{ height: cardHeight ? `${cardHeight}px` : 'auto' }}
      >
        <Card className="h-full border-slate-200 bg-white rounded-2xl shadow-sm flex flex-col">
          <CardContent className="p-5 lg:p-6 flex flex-col h-full">

            {/* 상단 영역 - flex-1로 남은 공간 차지 */}
            <div className="flex-1 flex flex-col gap-4">

              {/* 1. 제목 + 공유버튼 */}
              <div className="flex justify-between items-start gap-3">
                <h1 className="text-xl lg:text-2xl font-bold text-slate-900 leading-tight">
                  {event.title}
                </h1>
                <EventShareButton
                  title={event.title}
                  description={event.description?.replace(/<[^>]*>/g, "").substring(0, 100) || event.title}
                  variant="ghost"
                  size="icon"
                  className="shrink-0 text-slate-400 hover:text-slate-900 hover:bg-slate-100 w-9 h-9 rounded-full"
                />
              </div>

              {/* 2. 호스트 */}
              <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
                <Avatar className="h-9 w-9 border border-slate-100 shadow-sm">
                  <AvatarImage src={hostAvatar || undefined} />
                  <AvatarFallback className="bg-slate-100 text-slate-600 font-semibold text-xs">
                    {hostName[0]}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                  <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wide">호스트</span>
                  <span className="text-sm font-semibold text-slate-900">{hostName}</span>
                </div>
              </div>

              {/* 3. 정보 리스트 */}
              <div className="flex flex-col gap-2">
                <InfoRow icon={Calendar} value={`${dateStr} ${timeStr}`} />
                <InfoRow icon={MapPin} value={event.location || "장소 미정"} href={googleMapUrl} />
                <InfoRow icon={Wallet} value={priceStr} />
              </div>
            </div>

            {/* 하단 영역 */}
            <div className="pt-4 border-t border-slate-100">
              {/* 4. 모집 현황 */}
              <div className="mb-4">
                <div className="flex justify-between text-sm mb-1.5">
                  <span className="text-slate-500">모집 현황</span>
                  <span className="font-semibold text-slate-900">{currentCount} / {maxCount || '∞'}</span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ease-out ${isFull ? 'bg-red-500' : 'bg-slate-900'}`}
                    style={{ width: `${percent}%` }}
                  />
                </div>
              </div>

              {/* 5. 버튼 */}
              {isCreator ? (
                <div className="flex flex-col gap-2">
                  {(isPastEvent || isCompleted) && (
                    <p className="text-xs text-amber-600 text-center py-2 bg-amber-50 rounded-lg border border-amber-100">
                      종료된 이벤트입니다. 수정하여 다시 활성화할 수 있습니다.
                    </p>
                  )}
                  <div className="grid grid-cols-2 gap-2">
                    <Link href={`${basePath}/${eventId}/manage`} className="w-full">
                      <Button variant="outline" className="w-full h-11 text-sm font-semibold rounded-xl border-slate-200 hover:bg-slate-50 text-slate-700">
                        <Users className="mr-1.5 h-4 w-4" /> 참석자 관리
                      </Button>
                    </Link>
                    <Link href={`${basePath}/${eventId}/edit`} className="w-full">
                      <Button className="w-full h-11 text-sm font-semibold rounded-xl bg-slate-900 hover:bg-slate-800 text-white">
                        <Edit className="mr-1.5 h-4 w-4" /> 수정하기
                      </Button>
                    </Link>
                  </div>
                  <DeleteEventButton
                    eventId={eventId}
                    variant="outline"
                    className="w-full h-10 text-sm font-medium text-red-500 border-red-200 hover:bg-red-50 hover:border-red-300 rounded-xl"
                    label="이벤트 삭제하기"
                  />
                </div>
              ) : isPastEvent || isCompleted ? (
                <Button className="w-full h-11 rounded-xl bg-slate-100 text-slate-400 cursor-not-allowed" disabled>
                  <AlertCircle className="mr-1.5 h-4 w-4" /> 이벤트가 종료되었습니다
                </Button>
              ) : (
                <RegisterButton
                  eventId={event.id}
                  userId={userId}
                  isRegistered={isRegistered}
                  paymentStatus={userRegistration?.payment_status}
                  isFull={isFull}
                  price={event.price || 0}
                />
              )}
            </div>

          </CardContent>
        </Card>
      </div>
    </div>
  )
}
