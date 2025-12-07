import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from 'next/navigation';
import { getEventShortUrl } from "@/lib/utils/event-url";
import { getReviewsByEvent } from "@/lib/queries/posts";
import EventDetailContent from "@/components/event-detail-content";
import type { Metadata } from 'next';
import Link from "next/link";
import { ChevronLeft, Calendar, MapPin, Ticket, AlertCircle, Users, Edit } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { RegisterButton } from "@/components/register-button";
import { EventShareButton } from "@/components/event-share-button";
import { DeleteEventButton } from "@/components/delete-event-button";
import { FloatingActionBar } from "@/components/floating-action-bar";
import { ReviewModal } from "@/components/reviews/review-modal";
import { ReviewCard } from "@/components/reviews/review-card";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const supabase = await createClient();

  try {
    const { data: event } = await supabase
      .from("events")
      .select(`
        title,
        description,
        thumbnail_url,
        event_date,
        location
      `)
      .eq("id", id)
      .single();

    if (!event) {
      return {
        title: '이벤트를 찾을 수 없습니다',
      };
    }

    // 날짜 포맷팅
    const eventDate = new Date(event.event_date);
    const dateStr = eventDate.toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "long",
      day: "numeric",
      weekday: "short",
    });

    // HTML 태그 제거 및 텍스트 정리
    const plainDescription = event.description?.replace(/<[^>]*>/g, "").substring(0, 200) || event.title;

    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://seoulfounders.club";

    return {
      title: event.title,
      description: `${dateStr} · ${event.location}\n${plainDescription}`,
      openGraph: {
        title: event.title,
        description: `${dateStr} · ${event.location}`,
        images: event.thumbnail_url ? [
          {
            url: event.thumbnail_url,
            width: 1200,
            height: 630,
            alt: event.title,
          }
        ] : [
          {
            url: `${baseUrl}/events/${id}/opengraph-image`,
            width: 1200,
            height: 630,
            alt: event.title,
          }
        ],
        type: 'website',
        siteName: 'Seoul Founders Club',
      },
      twitter: {
        card: 'summary_large_image',
        title: event.title,
        description: `${dateStr} · ${event.location}`,
        images: event.thumbnail_url ? [event.thumbnail_url] : [`${baseUrl}/events/${id}/opengraph-image`],
      },
    };
  } catch (error) {
    console.error("Error generating metadata:", error);
    return {
      title: 'Seoul Founders Club',
    };
  }
}

// 캐싱 방지
export const dynamic = 'force-dynamic';


export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  // UUID 형식인 경우 (길이가 36자 이상) 짧은 코드로 리다이렉트
  if (id.length > 6) {
    const { data: eventData } = await supabase
      .from("events")
      .select("event_date")
      .eq("id", id)
      .single();

    if (eventData) {
      const { getEventShortUrl } = await import("@/lib/utils/event-url");
      const shortUrl = await getEventShortUrl(id, eventData.event_date, supabase);
      redirect(shortUrl);
    }
    notFound();
  }

  // 짧은 코드인 경우 /e/[id]로 리다이렉트
  redirect(`/e/${id}`);

  // 이벤트 정보 조회 (에러 처리 강화)
  let event: any;
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
          bio
        )
      `)
      .eq("id", id)
      .single();

    if (error) {
      console.error("Event fetch error:", error);
      notFound();
    }

    if (!data) {
      notFound();
    }

    event = data;
  } catch (error) {
    console.error("Unexpected error fetching event:", error);
    notFound();
  }

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // 사용자 등록 여부 조회
  let userRegistration: any = null;
  const userId: string | null = user?.id ?? null
  if (userId) {
    const { data: registrationData } = await supabase
      .from("event_registrations")
      .select("id, payment_status")
      .eq("event_id", id)
      .eq("user_id", userId)
      .single();

    userRegistration = registrationData;
  }

  // 참석자 수 조회
  const { count: attendeesCount } = await supabase
    .from("event_registrations")
    .select("*", { count: "exact", head: true })
    .eq("event_id", id);

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
    .eq("event_id", id);

  const attendees = attendeesData || [];

  // 후기 목록 조회
  const reviews = await getReviewsByEvent(supabase, id);


  const isRegistered = !!userRegistration;
  const isPastEvent = new Date(event.event_date) < new Date();
  const attendeeCountValue = attendeesCount ?? 0;
  const maxParticipants = event.max_participants ?? null;
  const isFull = maxParticipants ? attendeeCountValue >= maxParticipants : false;
  const isCreator = userId ? event.created_by === userId : false;
  const isCompleted = event.status === 'completed';

  // 날짜/시간 포맷팅
  const eventDate = new Date(event.event_date);
  const dateStr = eventDate.toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "short",
  });
  const timeStr = eventDate.toLocaleTimeString("ko-KR", {
    hour: "numeric",
    minute: "2-digit",
  });

  // [공통 컴포넌트] 카드 헤더
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
        <Link href="/events" className="group flex items-center text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors">
          <div className="mr-2 flex h-8 w-8 items-center justify-center rounded-full bg-white border border-slate-200 group-hover:border-slate-300 shadow-sm transition-all">
            <ChevronLeft className="h-4 w-4" />
          </div>
          이벤트 목록
        </Link>
      </div>

      <div className="flex flex-col gap-8">

        {/* [ROW 3] 후기 섹션 (위치 이동 테스트: 상단 배치) */}
        <Card className="border-blue-500 border-4 shadow-lg bg-white mb-10">
          <CardContent className="p-6 sm:p-8">
            <div className="flex flex-col gap-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                    참가자 후기 (상단 테스트)
                    <span className="text-lg text-slate-500 font-medium bg-slate-100 px-2 py-0.5 rounded-full">
                      {reviews ? reviews.length : 0}
                    </span>
                  </h2>
                  <p className="text-slate-500 mt-1">
                    이 모임에 참여한 분들의 생생한 이야기를 확인해보세요.
                  </p>
                </div>

                {userId ? <ReviewModal userId={userId as string} eventId={id} /> : null} 
              </div>

              {reviews && reviews.length > 0 ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {reviews.map((review: any) => (
                    <ReviewCard key={review.id} review={review} className="h-full border border-slate-100 shadow-sm" />
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-16 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-center">
                  <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm mb-4">
                    <span className="text-3xl">📝</span>
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mb-1">아직 작성된 후기가 없어요</h3>
                  <p className="text-slate-500 max-w-sm mx-auto mb-6">
                    이 모임의 첫 번째 후기 작성자가 되어주세요!
                    참여자들에게 큰 도움이 됩니다.
                  </p>
                  {userId ? <ReviewModal userId={userId as string} eventId={id} /> : null}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* [ROW 1] */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Row 1 - Left (8) */}
          <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden h-full">
            <div className="relative aspect-video w-full bg-slate-100">
              <img
                src={event.thumbnail_url || "/placeholder.svg"}
                alt={event.title}
                className="absolute inset-0 h-full w-full object-cover"
              />
              <div className="absolute top-4 left-4">
                {isCompleted ? (
                  <Badge className="bg-slate-800 text-white border-none px-3 py-1.5 text-sm font-medium">종료됨</Badge>
                ) : isPastEvent ? (
                  <Badge variant="secondary" className="bg-slate-200 text-slate-700 border-none px-3 py-1.5 text-sm font-medium">기간 만료</Badge>
                ) : isFull ? (
                  <Badge variant="destructive" className="px-3 py-1.5 text-sm font-medium">마감임박</Badge>
                ) : (
                  <Badge className="bg-green-600 hover:bg-green-700 text-white border-none px-3 py-1.5 text-sm font-medium shadow-sm">
                    모집중
                  </Badge>
                )}
              </div>
            </div>

            <div className="p-4 sm:p-8">
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 leading-tight mb-4 sm:mb-8">
                {event.title}
              </h1>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                {/* 날짜 - 모바일에서 한 줄 */}
                <div className="flex items-center gap-3 p-3 sm:p-5 rounded-xl sm:rounded-2xl bg-slate-50 border border-slate-100">
                  <div className="flex h-10 w-10 sm:h-11 sm:w-11 shrink-0 items-center justify-center rounded-lg sm:rounded-xl bg-white text-slate-900 shadow-sm border border-slate-100">
                    <Calendar className="h-4 w-4 sm:h-5 sm:w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm sm:text-base font-bold text-slate-900 truncate">{dateStr} {timeStr}</p>
                  </div>
                </div>

                {/* 장소 */}
                <div className="flex items-center gap-3 p-3 sm:p-5 rounded-xl sm:rounded-2xl bg-slate-50 border border-slate-100">
                  <div className="flex h-10 w-10 sm:h-11 sm:w-11 shrink-0 items-center justify-center rounded-lg sm:rounded-xl bg-white text-slate-900 shadow-sm border border-slate-100">
                    <MapPin className="h-4 w-4 sm:h-5 sm:w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm sm:text-base font-bold text-slate-900 truncate">{event.location}</p>
                  </div>
                </div>

                {/* 호스트 */}
                <div className="flex items-center gap-3 p-3 sm:p-5 rounded-xl sm:rounded-2xl bg-slate-50 border border-slate-100">
                  <Avatar className="h-10 w-10 sm:h-11 sm:w-11 border border-slate-100 shrink-0">
                    <AvatarImage src={event.profiles?.avatar_url || undefined} />
                    <AvatarFallback className="bg-slate-900 text-white font-bold text-xs sm:text-sm">
                      {event.profiles?.full_name?.[0] || "H"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-slate-500 font-medium mb-0.5">호스트</p>
                    <p className="text-sm sm:text-base font-bold text-slate-900 truncate">
                      {event.profiles?.full_name || "알 수 없음"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Row 1 - Right (4) */}
          <Card id="register-card" className="lg:col-span-4 border-slate-200 shadow-md bg-white h-full flex flex-col">
            <CardContent className="p-6 flex flex-col h-full">
              <CardHeader
                icon={Ticket}
                title="참가 신청"
                rightElement={
                  <Badge variant="outline" className="font-medium text-slate-500 border-slate-200 bg-slate-50">
                    {event.price && event.price > 0 ? `${event.price.toLocaleString()}원` : 'Free'}
                  </Badge>
                }
              />

              <div className="mb-8">
                <div className="flex justify-between items-end mb-2">
                  <span className="text-sm text-slate-500 font-medium">현재 모집 현황</span>
                  <div className="text-right">
                    <span className="text-2xl font-bold text-slate-900">{attendeesCount || 0}</span>
                    <span className="text-slate-400 text-sm font-medium ml-1">
                      / {event.max_participants ? event.max_participants : '∞'}
                    </span>
                  </div>
                </div>
                {/* 최대 인원이 설정된 경우에만 바 표시 */}
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
                      {/* 버튼 1: 이벤트 수정 */}
                      <Link href={`/events/${id}/edit`}>
                        <Button className="w-full bg-slate-900 text-white hover:bg-slate-800 h-11 text-sm font-medium">
                          <Edit className="mr-2 h-4 w-4" />
                          이벤트 수정
                        </Button>
                      </Link>

                      {/* 버튼 2: 참석자 관리 */}
                      <Link href={`/events/${id}/manage`}>
                        <Button variant="outline" className="w-full bg-white border-slate-300 text-slate-700 hover:bg-slate-50 h-11 text-sm font-medium">
                          <Users className="mr-2 h-4 w-4" />
                          참석자 관리
                        </Button>
                      </Link>

                      {/* 버튼 3: 공유하기 */}
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

                {/* 이벤트 삭제 버튼 (호스트일 때만, 최하단 별도 배치) */}
                {isCreator && !isPastEvent && (
                  <div className="mt-auto pt-4 border-t border-slate-100">
                    <DeleteEventButton
                      eventId={id}
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

      </div>

      {/* [Mobile Only] 하단 고정 액션 바 (Sticky Bottom Bar) - 참가신청 카드를 지나면 표시 */}
      <FloatingActionBar
        eventId={id}
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
