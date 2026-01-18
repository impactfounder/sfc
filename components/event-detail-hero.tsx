"use client"

import { Calendar, MapPin, Users, Wallet, Share2, Edit, AlertCircle, MessageCircle, Flag, ExternalLink } from 'lucide-react'
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { EventShareButton } from "@/components/event-share-button"
import { RegisterButton } from "@/components/register-button"
import { ProfilePopover } from "@/components/ui/profile-popover"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import Link from "next/link"
import { ClickableAvatar } from "@/components/ui/clickable-avatar"
import DOMPurify from 'isomorphic-dompurify'

type HostProfile = {
  id: string
  full_name: string | null
  avatar_url: string | null
  bio?: string | null
  company?: string | null
  position?: string | null
  tagline?: string | null
  email?: string | null
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
  registrationStatus?: "confirmed" | "waitlist"
  waitlistPosition?: number | null
  attendees?: any[]
  description?: string
}

export function EventDetailHero(props: Props) {
  const {
    event, hostName, hostAvatar, hostProfile, dateStr, timeStr,
    currentCount, maxCount, isFull, isPastEvent, isCompleted,
    isCreator, isRegistered, userRegistration, eventId, basePath, userId,
    registrationStatus, waitlistPosition, attendees = [], description
  } = props

  const googleMapUrl = event.location
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.location)}`
    : undefined

  const priceStr = event.price && event.price > 0
    ? `${event.price.toLocaleString()}원`
    : '무료'

  const percent = maxCount ? Math.min(100, (currentCount / maxCount) * 100) : 100
  const remainingSpots = maxCount ? maxCount - currentCount : null

  // HTML 정화
  const sanitizedDescription = DOMPurify.sanitize(description || event.description || "")

  return (
    <div className="w-full">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">

        {/* ========================================= */}
        {/* 좌측: 포스터 + 호스트 + 참석자 + 연락/신고 */}
        {/* ========================================= */}
        <div className="lg:col-span-5 flex flex-col gap-5 order-2 lg:order-1">

          {/* 1. 포스터 이미지 (1:1 비율) */}
          <div className="aspect-square relative rounded-xl overflow-hidden bg-slate-100 border border-slate-200 shadow-sm">
            {event.thumbnail_url ? (
              <img
                src={event.thumbnail_url}
                alt={event.title}
                className="absolute inset-0 w-full h-full object-cover"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-slate-300 bg-slate-50">
                <Calendar className="w-16 h-16" />
              </div>
            )}

            {/* 상태 뱃지 (이미지 위) */}
            <div className="absolute top-3 left-3">
              {isCompleted ? (
                <Badge variant="secondary" className="bg-white/90 backdrop-blur text-xs">종료됨</Badge>
              ) : isPastEvent ? (
                <Badge variant="secondary" className="bg-white/90 backdrop-blur text-xs">기간 만료</Badge>
              ) : isFull ? (
                <Badge variant="destructive" className="text-xs">마감임박</Badge>
              ) : (
                <Badge className="bg-green-600 text-white border-none text-xs">모집중</Badge>
              )}
            </div>

            {/* 인원 뱃지 (이미지 위) */}
            <div className="absolute top-3 right-3">
              <div className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold bg-black/60 text-white backdrop-blur">
                <Users className="w-3 h-3" />
                <span>{currentCount}/{maxCount || '∞'}</span>
              </div>
            </div>
          </div>

          {/* 2. 호스트 정보 */}
          <div className="flex flex-col gap-3">
            <h3 className="text-sm font-bold text-slate-900">호스트</h3>
            {hostProfile?.id ? (
              <ProfilePopover profile={hostProfile}>
                <button className="flex items-center gap-3 group text-left hover:bg-slate-50 p-2 -m-2 rounded-lg transition-colors">
                  <Avatar className="h-10 w-10 border border-slate-200">
                    <AvatarImage src={hostAvatar || undefined} />
                    <AvatarFallback className="bg-slate-100 text-slate-600 font-medium">{hostName[0]}</AvatarFallback>
                  </Avatar>
                  <div>
                    <span className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors block">{hostName}</span>
                    <span className="text-xs text-slate-500">{hostProfile.tagline || hostProfile.company || "SFC 호스트"}</span>
                  </div>
                </button>
              </ProfilePopover>
            ) : (
              <div className="flex items-center gap-3 p-2 -m-2">
                <Avatar className="h-10 w-10 border border-slate-200">
                  <AvatarFallback className="bg-slate-100 text-slate-600 font-medium">{hostName[0]}</AvatarFallback>
                </Avatar>
                <span className="text-sm font-bold text-slate-900">{hostName}</span>
              </div>
            )}
          </div>

          {/* 3. 참석자 미리보기 */}
          <div className="flex flex-col gap-3">
            <h3 className="text-sm font-bold text-slate-900">{currentCount}명 참석</h3>

            {attendees && attendees.length > 0 ? (
              <div className="flex flex-wrap gap-1">
                {attendees.slice(0, 10).map((attendee: any, index: number) => {
                  const profile = Array.isArray(attendee.profiles) ? attendee.profiles[0] : attendee.profiles
                  const name = profile?.full_name || attendee.guest_name || "익명"
                  return (
                    <ClickableAvatar
                      key={attendee.id || index}
                      profile={profile ? { ...profile, full_name: name } : null}
                      size="sm"
                    />
                  )
                })}
                {attendees.length > 10 && (
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-100 text-[10px] font-bold text-slate-500 border border-slate-200">
                    +{attendees.length - 10}
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-slate-400">첫 번째 참석자가 되어보세요!</p>
            )}
          </div>

          {/* 4. 미니 지도 */}
          {event.location && process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY && (
            <div>
              <h3 className="text-sm font-bold text-slate-900 mb-3">오시는 길</h3>
              <div className="rounded-xl overflow-hidden border border-slate-200">
                <a
                  href={googleMapUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block hover:opacity-90 transition-opacity"
                >
                  <img
                    src={`https://maps.googleapis.com/maps/api/staticmap?center=${encodeURIComponent(event.location)}&zoom=15&size=400x150&scale=2&markers=color:red%7C${encodeURIComponent(event.location)}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`}
                    alt="지도"
                    className="w-full h-[120px] object-cover"
                  />
                </a>
                <div className="p-3 bg-white">
                  <p className="text-sm font-medium text-slate-900 truncate">{event.location}</p>
                </div>
              </div>
            </div>
          )}

          {/* 5. 연락/신고/공유 링크 */}
          <div className="flex flex-col gap-1 pt-3 border-t border-slate-100">
            {hostProfile?.email ? (
              <a
                href={`mailto:${hostProfile.email}?subject=[SFC] ${event.title} 문의`}
                className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900 py-1.5 transition-colors"
              >
                <MessageCircle className="w-4 h-4" />
                호스트에게 연락하기
              </a>
            ) : (
              <button
                className="flex items-center gap-2 text-sm text-slate-300 py-1.5 cursor-not-allowed"
                disabled
              >
                <MessageCircle className="w-4 h-4" />
                호스트에게 연락하기
              </button>
            )}
            <button className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900 py-1.5 transition-colors">
              <Flag className="w-4 h-4" />
              이벤트 신고
            </button>

            {/* 공유 버튼 - 강조 */}
            <div className="mt-2">
              <EventShareButton
                title={event.title}
                description={event.description?.replace(/<[^>]*>/g, "").substring(0, 100)}
                variant="outline"
                className="w-full justify-center h-10 border-slate-200 text-slate-700 hover:bg-slate-50"
              >
                공유하기
              </EventShareButton>
            </div>
          </div>
        </div>

        {/* ========================================= */}
        {/* 우측: 제목 + 일시장소 + 등록 + 상세내용 */}
        {/* ========================================= */}
        <div className="lg:col-span-7 flex flex-col gap-6 order-1 lg:order-2">

          {/* 1. 이벤트 타입 + 제목 */}
          <div>
            <span className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded inline-block mb-3">
              {event.event_type === 'class' ? '클래스' : event.event_type === 'activity' ? '액티비티' : '네트워킹'}
            </span>
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-extrabold text-slate-900 leading-tight tracking-tight break-keep">
              {event.title}
            </h1>
          </div>

          {/* 2. 일시 */}
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-slate-100 rounded-lg text-slate-500">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <p className="font-semibold text-slate-900">{dateStr}</p>
              <p className="text-sm text-slate-500">{timeStr}</p>
            </div>
          </div>

          {/* 3. 장소 */}
          <a
            href={googleMapUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 group"
          >
            <div className="p-2.5 bg-slate-100 rounded-lg text-slate-500 group-hover:bg-slate-200 transition-colors">
              <MapPin className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">{event.location || "장소 미정"}</p>
              <p className="text-xs text-slate-500">클릭하여 지도 보기</p>
            </div>
            {googleMapUrl && (
              <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-blue-600 transition-colors" />
            )}
          </a>

          {/* 4. 등록 카드 */}
          <div id="register-card" className="bg-slate-50 rounded-xl border border-slate-200 p-5">

            {/* 등록 헤더 + 남은 자리 */}
            <div className="flex items-center justify-between text-sm mb-4">
              <span className="font-semibold text-slate-900">등록</span>
              {maxCount && remainingSpots !== null && remainingSpots > 0 && (
                <span className="text-slate-500">
                  남은 자리 <span className="font-bold text-slate-900">{remainingSpots}</span>개
                </span>
              )}
            </div>

            {/* 모집 현황 */}
            {maxCount && (
              <div className="mb-4">
                <div className="flex justify-between text-xs text-slate-500 mb-1.5">
                  <span>{currentCount}명 참석</span>
                  <span>정원 {maxCount}명</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 ${isFull ? 'bg-red-500' : 'bg-slate-700'}`}
                    style={{ width: `${percent}%` }}
                  />
                </div>
              </div>
            )}

            {/* 가격 + 버튼 (한 줄) */}
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-1.5">
                <span className="text-base font-bold text-slate-900">{priceStr}</span>
                {event.price > 0 && <span className="text-xs text-slate-400">/ 1인</span>}
              </div>

              <div className="flex-1 max-w-[180px]">
                {isCreator ? (
                  <div className="flex gap-2">
                    <Link href={`${basePath}/${eventId}/manage`} className="flex-1">
                      <Button variant="outline" size="sm" className="w-full text-xs h-9">관리</Button>
                    </Link>
                    <Link href={`${basePath}/${eventId}/edit`} className="flex-1">
                      <Button size="sm" className="w-full text-xs h-9 bg-slate-900 hover:bg-slate-800">수정</Button>
                    </Link>
                  </div>
                ) : isPastEvent || isCompleted ? (
                  <Button size="sm" className="w-full h-9 bg-slate-200 text-slate-400 text-xs" disabled>
                    종료됨
                  </Button>
                ) : (
                  <RegisterButton
                    eventId={event.id}
                    userId={userId}
                    isRegistered={isRegistered}
                    paymentStatus={userRegistration?.payment_status}
                    isFull={isFull}
                    price={event.price || 0}
                    registrationStatus={registrationStatus}
                    waitlistPosition={waitlistPosition}
                  />
                )}
              </div>
            </div>

            {/* 안내 문구 */}
            {!isRegistered && !isPastEvent && !isCompleted && !isCreator && (
              <p className="text-[11px] text-slate-400 mt-3">
                {isFull ? "대기자 신청 가능" : "호스트 승인 후 참여 확정"}
              </p>
            )}
          </div>

          {/* 5. 이벤트 소개 (상세 내용) - 우측에 포함! */}
          <div className="pt-4 border-t border-slate-100">
            <h3 className="text-sm font-bold text-slate-900 mb-3">이벤트 소개</h3>
            <div
              className="prose prose-slate prose-sm max-w-none prose-p:text-slate-600 prose-p:leading-relaxed prose-img:rounded-lg"
              dangerouslySetInnerHTML={{ __html: sanitizedDescription }}
            />
          </div>

        </div>
      </div>
    </div>
  )
}
