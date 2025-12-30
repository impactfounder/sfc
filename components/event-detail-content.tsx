/**
 * 이벤트 상세 페이지 공통 렌더링 로직
 * /e/[id]와 /events/[id]에서 공통으로 사용
 */

import { createClient } from "@/lib/supabase/server";
import { notFound } from 'next/navigation';
import { Card, CardContent } from "@/components/ui/card";
import { Calendar, MapPin, Users, ChevronLeft, AlertCircle, Edit, Wallet } from 'lucide-react';
import { RegisterButton } from "@/components/register-button";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { EventShareButton } from "@/components/event-share-button";
import { DeleteEventButton } from "@/components/delete-event-button";
import { FloatingActionBar } from "@/components/floating-action-bar";
import { getReviewsByEvent } from "@/lib/queries/posts";
import { ReviewModal } from "@/components/reviews/review-modal";
import { ReviewCard } from "@/components/reviews/review-card";


export default async function EventDetailContent({
  eventId,
  basePath = '/events'
}: {
  eventId: string;
  basePath?: string;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let event;
  try {
    const { data, error } = await supabase
      .from("events")
      .select(`
        *,
        profiles:created_by (
          id,
          full_name,
          avatar_url,
          email,
          bio,
          tagline
        )
      `)
      .eq("id", eventId)
      .single();

    if (error || !data) {
      notFound();
    }
    event = data;
  } catch (error) {
    notFound();
  }

  let userRegistration = null;
  if (user) {
    const { data: registrationData } = await supabase
      .from("event_registrations")
      .select("id, payment_status")
      .eq("event_id", eventId)
      .eq("user_id", user.id)
      .single();
    userRegistration = registrationData;
  }

  const { count: attendeesCount } = await supabase
    .from("event_registrations")
    .select("*", { count: "exact", head: true })
    .eq("event_id", eventId);

  const { data: attendeesData } = await supabase
    .from("event_registrations")
    .select(`
      id,
      user_id,
      guest_name,
      profiles:user_id (id, full_name, avatar_url)
    `)
    .eq("event_id", eventId);

  const reviews = await getReviewsByEvent(supabase, eventId);

  const attendees = attendeesData || [];
  const isRegistered = !!userRegistration;
  const isPastEvent = new Date(event.event_date) < new Date();
  const currentCount = attendeesCount || 0;
  const maxCount = event.max_participants;
  const isFull = maxCount && currentCount >= maxCount;
  const isCreator = user && event.created_by === user.id;
  const isCompleted = event.status === 'completed';

  const eventDate = new Date(event.event_date);
  const year = eventDate.getFullYear();
  const month = eventDate.getMonth() + 1;
  const dayNum = eventDate.getDate();
  const weekday = eventDate.toLocaleDateString("ko-KR", { weekday: "short" });
  const dateStr = `${year}.${String(month).padStart(2, '0')}.${String(dayNum).padStart(2, '0')} (${weekday})`;

  const timeStr = eventDate.toLocaleTimeString("ko-KR", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true
  });

  return (
    <div className="w-full">
      {/* 상단 네비게이션 */}
      <div className="mb-6 flex items-center justify-between">
        <Link href="/e" className="group flex items-center text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors">
          <div className="mr-2 flex h-8 w-8 items-center justify-center rounded-full bg-white border border-slate-200 group-hover:border-slate-300 shadow-sm transition-all">
            <ChevronLeft className="h-4 w-4" />
          </div>
          이벤트 목록
        </Link>
      </div>

      <div className="flex flex-col gap-10">
        {/* [Main Section] Grid 기본 stretch로 높이 동기화 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">

          {/* Left: 1:1 이미지 고정 */}
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

              {/* 뱃지들 */}
              <div className="absolute top-4 left-4 z-10 flex gap-2">
                {isCompleted ? (
                  <Badge className="bg-slate-800 text-white border-none px-3 py-1.5 text-sm font-medium shadow-md">종료됨</Badge>
                ) : isPastEvent ? (
                  <Badge variant="secondary" className="bg-white/90 text-slate-700 border-none px-3 py-1.5 text-sm font-medium shadow-md backdrop-blur-md">기간 만료</Badge>
                ) : isFull ? (
                  <Badge variant="destructive" className="px-3 py-1.5 text-sm font-medium shadow-md">마감임박</Badge>
                ) : (
                  <Badge className="bg-green-600 hover:bg-green-700 text-white border-none px-3 py-1.5 text-sm font-medium shadow-md">
                    모집중
                  </Badge>
                )}
              </div>
              <div className="absolute top-4 right-4 z-10">
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-bold bg-black/60 text-white backdrop-blur-md shadow-md">
                  <Users className="w-4 h-4" />
                  <span>{currentCount}/{maxCount || '∞'}</span>
                </div>
              </div>
          </div>

          {/* Right: 정보 박스 - h-full로 이미지 높이에 맞춤 */}
          <Card className="border-slate-200 shadow-sm bg-white h-full">
            <CardContent className="p-8 h-full flex flex-col">

              {/* 제목 + 공유 */}
              <div className="flex justify-between items-start gap-4 mb-2">
                <h1 className="text-2xl font-bold text-slate-900 leading-tight">
                  {event.title}
                </h1>
                <EventShareButton
                  title={event.title}
                  description={event.description?.replace(/<[^>]*>/g, "").substring(0, 100) || event.title}
                  variant="ghost"
                  size="icon"
                  className="shrink-0 text-slate-400 hover:text-slate-900 hover:bg-slate-100 -mr-2 -mt-1 rounded-full h-10 w-10"
                />
              </div>

              {/* 호스트 - 컴팩트하게 */}
              <div className="flex items-center gap-2 mb-8">
                <Avatar className="h-8 w-8 border border-slate-100">
                  <AvatarImage src={event.profiles?.avatar_url || undefined} />
                  <AvatarFallback className="bg-slate-100 text-slate-600 font-bold text-xs">
                    {event.profiles?.full_name?.[0] || "H"}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm text-slate-600">
                  {event.profiles?.full_name || "알 수 없음"}
                </span>
              </div>

              {/* 일시/장소/참가비 - Luma 스타일 */}
              <div className="space-y-5 mb-8">

                {/* 일시 */}
                <div className="flex items-center gap-4">
                  <div className="w-11 h-11 rounded-lg bg-slate-50 border border-slate-100 flex flex-col items-center justify-center shrink-0">
                    <span className="text-[10px] text-slate-400 font-medium leading-none">{month}월</span>
                    <span className="text-base font-bold text-slate-900 leading-none">{dayNum}</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-900">{dateStr}</p>
                    <p className="text-sm text-slate-500">{timeStr}</p>
                  </div>
                </div>

                {/* 장소 */}
                <div className="flex items-center gap-4">
                  <div className="w-11 h-11 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0">
                    <MapPin className="w-5 h-5 text-slate-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-900">{event.location || "장소 미정"}</p>
                  </div>
                </div>

                {/* 참가비 */}
                <div className="flex items-center gap-4">
                  <div className="w-11 h-11 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0">
                    <Wallet className="w-5 h-5 text-slate-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-900">
                      {event.price && event.price > 0 ? `${event.price.toLocaleString()}원` : '무료'}
                    </p>
                  </div>
                </div>
              </div>

              {/* 하단 영역 - mt-auto로 아래 고정 */}
              <div className="mt-auto">
                {/* 모집 현황 */}
                <div className="mb-5">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-slate-500">모집 현황</span>
                    <span>
                      <strong className="text-lg text-slate-900">{currentCount}</strong>
                      <span className="text-slate-400 ml-1">/ {maxCount || '∞'}</span>
                    </span>
                  </div>
                  {maxCount && maxCount > 0 ? (
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ease-out ${isFull ? 'bg-red-500' : 'bg-slate-900'}`}
                        style={{ width: `${Math.min(100, (currentCount / maxCount) * 100)}%` }}
                      />
                    </div>
                  ) : null}
                </div>

                {/* 버튼 */}
                <div className="flex flex-col gap-3">
                  {isPastEvent ? (
                    <Button className="w-full bg-slate-100 text-slate-500 border-0 h-12 rounded-xl text-base font-medium" disabled>
                      <AlertCircle className="mr-2 h-5 w-5" />
                      이벤트가 종료되었습니다
                    </Button>
                  ) : isCreator ? (
                    <div className="grid grid-cols-2 gap-3">
                      <Link href={`${basePath}/${eventId}/manage`} className="w-full">
                        <Button variant="outline" className="w-full border-slate-300 text-slate-700 hover:bg-slate-50 h-12 rounded-xl text-base font-medium">
                          <Users className="mr-2 h-5 w-5" />
                          참석자 관리
                        </Button>
                      </Link>
                      <Link href={`${basePath}/${eventId}/edit`} className="w-full">
                        <Button className="w-full bg-slate-900 text-white hover:bg-slate-800 h-12 rounded-xl text-base font-medium">
                          <Edit className="mr-2 h-5 w-5" />
                          수정하기
                        </Button>
                      </Link>
                    </div>
                  ) : (
                    <RegisterButton
                      eventId={event.id}
                      userId={user?.id}
                      isRegistered={isRegistered}
                      paymentStatus={userRegistration?.payment_status}
                      isFull={!!isFull}
                      price={event.price || 0}
                    />
                  )}

                  {isCreator && !isPastEvent && (
                    <DeleteEventButton
                      eventId={eventId}
                      variant="ghost"
                      className="w-full text-red-600 hover:bg-red-50 hover:text-red-700 h-10 text-sm font-medium"
                      label="이벤트 삭제하기"
                    />
                  )}
                </div>
              </div>

            </CardContent>
          </Card>
        </div>

        {/* [Sub Section] 상세 내용 & 참석자 등 (기존 코드 유지) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-8">
            <Card className="border-slate-200 shadow-sm bg-white overflow-hidden">
               <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                 <h2 className="text-lg font-bold text-slate-900">상세 내용</h2>
               </div>
              <CardContent className="p-6 sm:p-8">
                <div
                  className="prose prose-slate max-w-none prose-headings:font-bold prose-p:text-slate-600 prose-p:leading-relaxed prose-strong:text-slate-900 prose-img:rounded-xl"
                  dangerouslySetInnerHTML={{ __html: event.description || "" }}
                />
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-4 space-y-6">
            <Card className="border-slate-200 shadow-sm bg-white overflow-hidden">
               <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                 <h2 className="text-base font-bold text-slate-900">참석자 멤버</h2>
                 <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded-full">
                    {currentCount}명
                  </span>
               </div>
              <CardContent className="p-5">
                {attendees && Array.isArray(attendees) && attendees.length > 0 ? (
                  <div className="flex flex-wrap gap-3">
                    {attendees.map((attendee: any, index: number) => {
                      const profile = Array.isArray(attendee.profiles)
                        ? attendee.profiles[0]
                        : attendee.profiles;
                      const name = profile?.full_name || attendee.guest_name || "익명";
                      return (
                        <div key={attendee.id || index} className="flex flex-col items-center gap-1 w-12 group cursor-default" title={name}>
                          <Avatar className="h-10 w-10 border border-slate-100 shadow-sm transition-all duration-200 group-hover:scale-105 group-hover:border-slate-300">
                            <AvatarImage src={profile?.avatar_url || undefined} />
                            <AvatarFallback className="bg-slate-100 text-slate-500 font-bold text-[10px]">
                              {name[0]}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-[10px] text-slate-500 truncate w-full text-center group-hover:text-slate-900">
                            {name}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="py-8 text-center">
                    <p className="text-slate-400 text-sm">아직 참석자가 없습니다.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* 후기 섹션 */}
        <Card className="border-slate-200 shadow-sm bg-white overflow-hidden">
           <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
             <div>
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  참가자 후기
                  <span className="text-sm text-slate-500 font-medium bg-white border border-slate-200 px-2 py-0.5 rounded-full">
                    {reviews ? reviews.length : 0}
                  </span>
                </h2>
             </div>
              {user && <ReviewModal userId={user.id} eventId={eventId} />}
           </div>
          <CardContent className="p-6">
            {reviews && reviews.length > 0 ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {reviews.map((review: any) => (
                  <ReviewCard key={review.id} review={review} className="h-full border border-slate-100 shadow-sm" />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mb-3 text-2xl">
                  💬
                </div>
                <h3 className="text-base font-medium text-slate-900 mb-1">아직 작성된 후기가 없어요</h3>
                <p className="text-sm text-slate-500 max-w-sm mx-auto">
                  모임이 끝난 후 첫 번째 후기를 남겨주세요!
                </p>
              </div>
            )}
          </CardContent>
        </Card>

      </div>

      {/* [Mobile Only] 하단 고정 액션 바 */}
      <FloatingActionBar
        eventId={eventId}
        userId={user?.id}
        isRegistered={isRegistered}
        paymentStatus={userRegistration?.payment_status}
        isFull={!!isFull}
        price={event.price || 0}
        isPastEvent={isPastEvent}
        isCreator={!!isCreator}
        eventTitle={event.title}
        dateStr={dateStr}
        timeStr={timeStr}
        location={event.location || ""}
      />
    </div>
  );
}
