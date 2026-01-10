"use client"

import { useRef, useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Calendar, MapPin, Users, Wallet, ExternalLink, Edit, AlertCircle } from 'lucide-react'
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { EventShareButton } from "@/components/event-share-button"
import { RegisterButton } from "@/components/register-button"
import { ProfilePopover } from "@/components/ui/profile-popover"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import Link from "next/link"

type HostProfile = {
  id: string
  full_name: string | null
  avatar_url: string | null
  bio?: string | null
  company?: string | null
  position?: string | null
  tagline?: string | null
}

type Props = {
  event: any
  hostName: string
  hostAvatar?: string
  hostProfile?: HostProfile | null
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
    <div className={`flex items-center gap-2.5 py-2.5 px-3 rounded-lg bg-slate-50/50 ${href ? 'hover:bg-slate-100 cursor-pointer group transition-colors' : ''}`}>
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
    event, hostName, hostAvatar, hostProfile, dateStr, timeStr,
    currentCount, maxCount, isFull, isPastEvent, isCompleted,
    isCreator, isRegistered, userRegistration, eventId, basePath, userId
  } = props

  const imageContainerRef = useRef<HTMLDivElement>(null)
  const [imageHeight, setImageHeight] = useState<number | null>(null)

  // 이미지 컨테이너 높이를 측정하여 카드에 적용 (데스크탑에서만)
  useEffect(() => {
    const updateHeight = () => {
      const isDesktop = window.innerWidth >= 1024
      if (imageContainerRef.current && isDesktop) {
        // 이미지 컨테이너의 실제 높이 측정
        setImageHeight(imageContainerRef.current.offsetHeight)
      } else {
        setImageHeight(null)
      }
    }

    // 초기 실행 + 이미지 로드 후 실행
    updateHeight()

    // ResizeObserver로 더 정확하게 감지
    const resizeObserver = new ResizeObserver(updateHeight)
    if (imageContainerRef.current) {
      resizeObserver.observe(imageContainerRef.current)
    }

    window.addEventListener('resize', updateHeight)
    return () => {
      window.removeEventListener('resize', updateHeight)
      resizeObserver.disconnect()
    }
  }, [])

  const googleMapUrl = event.location
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.location)}`
    : undefined

  const priceStr = event.price && event.price > 0
    ? `${event.price.toLocaleString()}원`
    : '무료'

  const percent = maxCount ? Math.min(100, (currentCount / maxCount) * 100) : 100

  return (
    <div className="flex flex-col gap-6">
      {/* 상단: 이미지 + 카드 그리드 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 items-start">

        {/* 좌측: 이미지 (1:1 비율 고정) */}
        <div ref={imageContainerRef} className="w-full">
          <div className="aspect-square relative rounded-xl overflow-hidden bg-slate-100 border border-slate-200 shadow-sm">
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

        {/* 우측: 정보 카드 (이미지와 동일한 높이) */}
        <div
          className="w-full lg:aspect-square"
          style={imageHeight ? { height: `${imageHeight}px`, aspectRatio: 'unset' } : undefined}
        >
          <Card className="h-full border-slate-200 bg-white rounded-xl shadow-sm flex flex-col overflow-hidden">
            <CardContent className="p-5 lg:p-6 flex flex-col h-full justify-between">

              {/* 상단 영역 */}
              <div className="flex flex-col gap-3">

                {/* 1. 제목 + 공유버튼 */}
                <div className="flex justify-between items-start gap-2">
                  <h1 className="text-lg lg:text-xl font-bold text-slate-900 leading-tight line-clamp-2">
                    {event.title}
                  </h1>
                  <EventShareButton
                    title={event.title}
                    description={event.description?.replace(/<[^>]*>/g, "").substring(0, 100) || event.title}
                    variant="ghost"
                    size="icon"
                    className="shrink-0 text-slate-400 hover:text-slate-900 hover:bg-slate-100 w-8 h-8 rounded-full"
                  />
                </div>

                {/* 2. 정보 리스트 */}
                <div className="flex flex-col gap-1.5">
                  <InfoRow icon={Calendar} value={`${dateStr} ${timeStr}`} />
                  <InfoRow icon={MapPin} value={event.location || "장소 미정"} href={googleMapUrl} />
                  <InfoRow icon={Wallet} value={priceStr} />
                </div>
              </div>

              {/* 하단 영역 */}
              <div className="pt-3 border-t border-slate-100">
                {/* 모집 현황 */}
                <div className="mb-3">
                  <div className="flex justify-between text-sm mb-1.5">
                    <span className="text-slate-500">모집 현황</span>
                    <span className="font-semibold text-slate-900">{currentCount} / {maxCount || '∞'}</span>
                  </div>
                  <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ease-out ${isFull ? 'bg-red-500' : 'bg-slate-900'}`}
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>

                {/* 버튼 */}
                {isCreator ? (
                  <div className="flex flex-col gap-2">
                    {(isPastEvent || isCompleted) && (
                      <p className="text-xs text-amber-600 text-center py-2 bg-amber-50 rounded-lg border border-amber-100">
                        종료된 이벤트입니다. 수정하여 다시 활성화할 수 있습니다.
                      </p>
                    )}
                    <div className="grid grid-cols-2 gap-2">
                      <Link href={`${basePath}/${eventId}/manage`} className="w-full">
                        <Button variant="outline" className="w-full h-10 text-sm font-semibold rounded-xl border-slate-200 hover:bg-slate-50 text-slate-700">
                          <Users className="mr-1.5 h-4 w-4" /> 참석자 관리
                        </Button>
                      </Link>
                      <Link href={`${basePath}/${eventId}/edit`} className="w-full">
                        <Button className="w-full h-10 text-sm font-semibold rounded-xl bg-slate-900 hover:bg-slate-800 text-white">
                          <Edit className="mr-1.5 h-4 w-4" /> 수정하기
                        </Button>
                      </Link>
                    </div>
                  </div>
                ) : isPastEvent || isCompleted ? (
                  <Button className="w-full h-10 rounded-xl bg-slate-100 text-slate-400 cursor-not-allowed text-sm" disabled>
                    <AlertCircle className="mr-1.5 h-4 w-4 shrink-0" />
                    <span className="truncate">이벤트가 종료되었습니다</span>
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

      {/* 하단: 호스트 정보 */}
      <Card className="border-slate-200 shadow-sm bg-white rounded-xl">
        <CardContent className="p-4 flex items-center gap-3">
          {hostProfile?.id ? (
            <ProfilePopover profile={hostProfile}>
              <button className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity" type="button">
                <Avatar className="h-12 w-12 border-2 border-white shadow-sm">
                  <AvatarImage src={hostAvatar || undefined} />
                  <AvatarFallback className="bg-slate-100 text-slate-600 font-semibold">
                    {hostName[0]}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col text-left">
                  <span className="text-xs font-medium text-slate-500">호스트</span>
                  <span className="text-base font-bold text-slate-900 hover:underline">{hostName}</span>
                </div>
              </button>
            </ProfilePopover>
          ) : (
            <>
              <Avatar className="h-12 w-12 border-2 border-white shadow-sm">
                <AvatarImage src={hostAvatar || undefined} />
                <AvatarFallback className="bg-slate-100 text-slate-600 font-semibold">
                  {hostName[0]}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col">
                <span className="text-xs font-medium text-slate-500">호스트</span>
                <span className="text-base font-bold text-slate-900">{hostName}</span>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
