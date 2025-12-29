/**
 * 이벤트 상세 페이지 공통 렌더링 로직
 * /e/[id]와 /events/[id]에서 공통으로 사용
 */

import { createClient } from "@/lib/supabase/server";
import { notFound } from 'next/navigation';
import { Card, CardContent } from "@/components/ui/card";
import { Calendar, MapPin, Users, ChevronLeft, AlertCircle, Ticket, Edit } from 'lucide-react';
import { RegisterButton } from "@/components/register-button";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { EventShareButton } from "@/components/event-share-button";
import { DeleteEventButton } from "@/components/delete-event-button";
import { FloatingActionBar } from "@/components/floating-action-bar";

import { getReviewsByEvent } from "@/lib/queries/posts";
import { ReviewWriteButton } from "@/components/reviews/review-modal";
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

  // 이벤트 정보 조회
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

  // 사용자 등록 여부 조회
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

  // 참석자 수 조회
  const { count: attendeesCount } = await supabase
    .from("event_registrations")
    .select("*", { count: "exact", head: true })
    .eq("event_id", eventId);

  // 참석자 목록 조회
  const { data: attendeesData } = await supabase
    .from("event_registrations")
    .select(`
      id,
      user_id,
      guest_name,
      profiles:user_id (
        id,
        full_name,
        avatar_url
      )
    `)
    .eq("event_id", eventId);

  // 후기 목록 조회
  const reviews = await getReviewsByEvent(supabase, eventId);

  const attendees = attendeesData || [];
  const isRegistered = !!userRegistration;
  const isPastEvent = new Date(event.event_date) < new Date();
  const isFull = event.max_participants && attendeesCount && attendeesCount >= event.max_participants;
  const isCreator = user && event.created_by === user.id;
  const isCompleted = event.status === 'completed';

  // 날짜/시간 포맷팅
  const eventDate = new Date(event.event_date);
  const dateStr = eventDate.toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const weekdayStr = eventDate.toLocaleDateString("ko-KR", {
    weekday: "short",
  });
  const timeStr = eventDate.toLocaleTimeString("ko-KR", {
    hour: "numeric",
    minute: "2-digit",
  });

  const CardHeader = ({ icon: Icon, title, rightElement }: { icon: React.ComponentType<{ className?: string }>, title: string, rightElement?: React.ReactNode }) => (
    <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
      <div className="flex items-center gap-2">
        <div className="p-1.5 rounded-md bg-slate-50 text-slate-500 border border-slate-100">
          <Icon className="h-4 w-4" />
        </div>
        <h3 className="text-lg font-bold text-slate-900 tracking-tight">{title}</h3>
      </div>
      {rightElement}
    </div>
  );

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

      <div className="flex flex-col gap-8">
        {/* [ROW 1] - 모바일: 세로 스택, 데스크톱: 가로 그리드 (5:7 비율) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-stretch">
          {/* Row 1 - Left: 1:1 이미지 */}
          <div className="lg:col-span-5">
            <div className="rounded-2xl overflow-hidden shadow-md border border-slate-200 bg-white h-full">
              <div className="relative aspect-square w-full overflow-hidden">
                {event.thumbnail_url ? (
                  <img
                    src={event.thumbnail_url}
                    alt={event.title}
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-br from-slate-100 via-slate-200 to-slate-300 flex items-center justify-center">
                    <Calendar className="w-20 h-20 text-slate-400" />
                  </div>
                )}
                {/* 상태 배지 */}
                <div className="absolute top-4 left-4 z-10">
                  {isCompleted ? (
                    <Badge className="bg-slate-800/90 text-white border-none px-3 py-1.5 text-sm font-medium backdrop-blur-sm">종료됨</Badge>
                  ) : isPastEvent ? (
                    <Badge variant="secondary" className="bg-white/90 text-slate-700 border-none px-3 py-1.5 text-sm font-medium backdrop-blur-sm">기간 만료</Badge>
                  ) : isFull ? (
                    <Badge variant="destructive" className="px-3 py-1.5 text-sm font-medium backdrop-blur-sm">마감임박</Badge>
                  ) : (
                    <Badge className="bg-green-600/90 hover:bg-green-700 text-white border-none px-3 py-1.5 text-sm font-medium shadow-sm backdrop-blur-sm">
                      모집중
                    </Badge>
                  )}
                </div>
                {/* 인원 배지 */}
                <div className="absolute top-4 right-4 z-10">
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-bold bg-black/60 text-white backdrop-blur-sm">
                    <Users className="w-4 h-4" />
                    <span>{attendeesCount || 0}/{event.max_participants || '∞'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Row 1 - Right: 제목 + 정보 + 신청 */}
          <Card id="register-card" className="lg:col-span-7 border-slate-200 shadow-md bg-white flex flex-col">
            <CardContent className="p-5 sm:p-6 flex flex-col h-full">
              {/* 제목 */}
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-900 leading-tight mb-4">
                {event.title}
              </h1>

              {/* 호스트 정보 */}
              <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100 mb-5">
                <Avatar className="h-10 w-10 border-2 border-white shadow-sm shrink-0">
                  <AvatarImage src={event.profiles?.avatar_url || undefined} />
                  <AvatarFallback className="bg-slate-900 text-white font-bold text-sm">
                    {event.profiles?.full_name?.[0] || "H"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-slate-500 font-medium">호스트</p>
                  <p className="text-sm font-bold text-slate-900 truncate">
                    {event.profiles?.full_name || "알 수 없음"}
                  </p>
                  {event.profiles && (event.profiles as any).tagline && (
                    <p className="text-xs text-slate-500 truncate">
                      {(event.profiles as any).tagline}
                    </p>
                  )}
                </div>
              </div>

              {/* 날짜, 시간, 장소, 금액 정보 - 가로 그리드 */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
                {/* 날짜 */}
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="flex items-center gap-2 mb-1">
                    <Calendar className="h-3.5 w-3.5 text-slate-400" />
                    <span className="text-xs text-slate-500">날짜</span>
                  </div>
                  <p className="text-sm font-bold text-slate-900">{dateStr} ({weekdayStr})</p>
                </div>

                {/* 시간 */}
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="flex items-center gap-2 mb-1">
                    <Ticket className="h-3.5 w-3.5 text-slate-400" />
                    <span className="text-xs text-slate-500">시간</span>
                  </div>
                  <p className="text-sm font-bold text-slate-900">{timeStr}</p>
                </div>

                {/* 장소 */}
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="flex items-center gap-2 mb-1">
                    <MapPin className="h-3.5 w-3.5 text-slate-400" />
                    <span className="text-xs text-slate-500">장소</span>
                  </div>
                  <p className="text-sm font-bold text-slate-900 truncate">{event.location || "장소 미정"}</p>
                </div>

                {/* 금액 */}
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold text-slate-400">₩</span>
                    <span className="text-xs text-slate-500">참가비</span>
                  </div>
                  <p className="text-sm font-bold text-slate-900">
                    {event.price && event.price > 0 ? `${event.price.toLocaleString()}원` : '무료'}
                  </p>
                </div>
              </div>

              {/* 현재 모집 현황 */}
              <div className="mb-6">
                <div className="flex justify-between items-end mb-2">
                  <span className="text-sm text-slate-500 font-medium">현재 모집 현황</span>
                  <div className="text-right">
                    <span className="text-2xl font-bold text-slate-900">{attendeesCount || 0}</span>
                    <span className="text-slate-400 text-sm font-medium ml-1">
                      / {event.max_participants ? event.max_participants : '∞'}
                    </span>
                  </div>
                </div>
                {event.max_participants && event.max_participants > 0 ? (
                  <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ease-out ${isFull ? 'bg-red-500' : 'bg-slate-900'}`}
                      style={{ width: `${Math.min(100, ((attendeesCount || 0) / event.max_participants) * 100)}%` }}
                    />
                  </div>
                ) : null}
              </div>

              <div className="flex flex-col flex-1">
                <div className="flex flex-col gap-2">
                  {isPastEvent ? (
                    <Button className="w-full bg-slate-100 text-slate-500 hover:bg-slate-200 border-0 h-11 text-sm font-medium" disabled>
                      <AlertCircle className="mr-2 h-4 w-4" />
                      이벤트가 종료되었습니다
                    </Button>
                  ) : isCreator ? (
                    <>
                      <Link href={`${basePath}/${eventId}/edit`}>
                        <Button className="w-full bg-slate-900 text-white hover:bg-slate-800 h-11 text-sm font-medium">
                          <Edit className="mr-2 h-4 w-4" />
                          이벤트 수정
                        </Button>
                      </Link>

                      <Link href={`${basePath}/${eventId}/manage`}>
                        <Button variant="outline" className="w-full bg-white border-slate-300 text-slate-700 hover:bg-slate-50 h-11 text-sm font-medium">
                          <Users className="mr-2 h-4 w-4" />
                          참석자 관리
                        </Button>
                      </Link>

                      <EventShareButton
                        title={event.title}
                        description={event.description?.replace(/<[^>]*>/g, "").substring(0, 100) || event.title}
                        variant="outline"
                        className="w-full border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900 h-10 text-sm font-medium transition-all shadow-sm hover:shadow"
                      >
                        공유하기
                      </EventShareButton>
                    </>
                  ) : (
                    <>
                      <RegisterButton
                        eventId={event.id}
                        userId={user?.id}
                        isRegistered={isRegistered}
                        paymentStatus={userRegistration?.payment_status}
                        isFull={!!isFull}
                        price={event.price || 0}
                      />

                      <Separator className="my-2 bg-slate-100" />

                      <EventShareButton
                        title={event.title}
                        description={event.description?.replace(/<[^>]*>/g, "").substring(0, 100) || event.title}
                        variant="outline"
                        className="w-full border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900 h-10 text-sm font-medium transition-all shadow-sm hover:shadow"
                      >
                        공유하기
                      </EventShareButton>
                    </>
                  )}
                </div>

                {isCreator && !isPastEvent && (
                  <div className="mt-auto pt-4 border-t border-slate-100">
                    <DeleteEventButton
                      eventId={eventId}
                      variant="outline"
                      className="w-full border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 h-11 text-base font-medium"
                    />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* [ROW 2] */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          {/* Row 2 - Left (8) : 상세 내용 */}
          <Card className="lg:col-span-8 border-slate-200 shadow-sm bg-white">
            <CardContent className="p-6 sm:p-8">
              <div
                className="prose prose-slate max-w-none prose-headings:font-bold prose-p:text-slate-600 prose-p:leading-relaxed prose-strong:text-slate-900"
                dangerouslySetInnerHTML={{ __html: event.description || "" }}
              />
            </CardContent>
          </Card>

          {/* Row 2 - Right (4) : 참석자 멤버 */}
          <Card className="lg:col-span-4 border-slate-200 shadow-sm bg-white">
            <CardContent className="p-6">
              <CardHeader
                icon={Users}
                title="참석자 멤버"
                rightElement={
                  <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
                    {attendeesCount || 0}명
                  </span>
                }
              />

              {attendees && Array.isArray(attendees) && attendees.length > 0 ? (
                <div className="flex flex-wrap gap-3 max-h-[400px] overflow-y-auto">
                  {attendees.map((attendee: any, index: number) => {
                    const profile = Array.isArray(attendee.profiles)
                      ? attendee.profiles[0]
                      : attendee.profiles;
                    const name = profile?.full_name || attendee.guest_name || "익명";
                    return (
                      <div key={attendee.id || index} className="flex flex-col items-center gap-1.5 w-14 group cursor-default">
                        <Avatar className="h-12 w-12 border-2 border-white shadow-sm transition-all duration-200 group-hover:scale-105 group-hover:border-slate-200">
                          <AvatarImage src={profile?.avatar_url || undefined} />
                          <AvatarFallback className="bg-slate-100 text-slate-500 font-bold text-xs">
                            {name[0]}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-xs text-slate-600 truncate w-full text-center font-medium group-hover:text-slate-900">
                          {name}
                        </span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="py-8 text-center bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                  <p className="text-slate-500 text-xs">아직 참석자가 없습니다.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>


        {/* [ROW 3] 후기 섹션 */}
        <Card className="border-slate-200 shadow-sm bg-white mt-4">
          <CardContent className="p-4 sm:p-5">
            <div className="flex flex-col gap-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2">
                    참가자 후기
                    <span className="text-base sm:text-lg text-slate-500 font-medium bg-slate-100 px-2 py-0.5 rounded-full">
                      {reviews ? reviews.length : 0}
                    </span>
                  </h2>
                  <p className="text-sm sm:text-base text-slate-500 mt-1">
                    이 모임에 참여한 분들의 생생한 이야기를 확인해보세요.
                  </p>
                </div>
              </div>

              {reviews && reviews.length > 0 ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                  {reviews.map((review: any) => (
                    <ReviewCard key={review.id} review={review} className="h-full border border-slate-100 shadow-sm" />
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-10 sm:py-16 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-center">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 bg-white rounded-full flex items-center justify-center shadow-sm mb-3 sm:mb-4">
                    <span className="text-2xl sm:text-3xl">📝</span>
                  </div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 mb-1">아직 작성된 후기가 없어요</h3>
                  <p className="text-sm sm:text-base text-slate-500 max-w-sm mx-auto mb-6 px-4">
                    이 모임의 첫 번째 후기 작성자가 되어주세요!
                    참여자들에게 큰 도움이 됩니다.
                  </p>
                  <ReviewWriteButton
                    userId={user?.id || ""}
                    eventId={eventId}
                  />
                </div>
              )}
            </div>
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
        location={event.location}
      />
    </div>
  );
}

