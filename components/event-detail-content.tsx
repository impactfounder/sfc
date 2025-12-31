import { createClient } from "@/lib/supabase/server";
import { notFound } from 'next/navigation';
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, ChevronLeft, ExternalLink, FileText, Users } from 'lucide-react';
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { FloatingActionBar } from "@/components/floating-action-bar";
import { getReviewsByEvent } from "@/lib/queries/posts";
import { ReviewModal } from "@/components/reviews/review-modal";
import { ReviewCard } from "@/components/reviews/review-card";
import { GoogleMapEmbed } from "@/components/google-map-embed";
import { EventDetailHero } from "@/components/event-detail-hero";

export default async function EventDetailContent({
  eventId,
  basePath = '/events'
}: {
  eventId: string;
  basePath?: string;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // 1. 이벤트 정보 조회
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

    if (error || !data) notFound();
    event = data;
  } catch (error) { notFound(); }

  // 2. 관련 정보 조회 (등록 여부, 참석자, 후기)
  let userRegistration = null;
  if (user) {
    const { data } = await supabase
      .from("event_registrations")
      .select("id, payment_status")
      .eq("event_id", eventId)
      .eq("user_id", user.id)
      .single();
    userRegistration = data;
  }

  const { count: attendeesCount } = await supabase
    .from("event_registrations")
    .select("*", { count: "exact", head: true })
    .eq("event_id", eventId);

  const { data: attendeesData } = await supabase
    .from("event_registrations")
    .select(`id, user_id, guest_name, profiles:user_id (id, full_name, avatar_url)`)
    .eq("event_id", eventId);

  const reviews = await getReviewsByEvent(supabase, eventId);

  // 3. 상태 계산
  const attendees = attendeesData || [];
  const isRegistered = !!userRegistration;
  const currentCount = attendeesCount || 0;
  const maxCount = event.max_participants;
  const isFull = maxCount && currentCount >= maxCount;
  const isCreator = user && event.created_by === user.id;

  // 종료 여부 판단: end_date가 있으면 그것을 기준, 없으면 start_date + 3시간을 종료 시점으로 간주
  const now = new Date();
  const eventStartDate = new Date(event.event_date);
  const eventEndDate = event.end_date
    ? new Date(event.end_date)
    : new Date(eventStartDate.getTime() + 3 * 60 * 60 * 1000); // 기본 3시간

  const isPastEvent = eventEndDate < now;
  const isCompleted = event.status === 'completed'; // 수동 종료 상태

  // 날짜 포맷팅
  const dateStr = eventStartDate.toLocaleDateString("ko-KR", { year: 'numeric', month: 'long', day: 'numeric', weekday: 'short' });
  const timeStr = eventStartDate.toLocaleTimeString("ko-KR", { hour: "numeric", minute: "2-digit", hour12: true });

  // 프로필 처리 (배열/객체 호환)
  const hostProfile = Array.isArray(event.profiles) ? event.profiles[0] : event.profiles;
  const hostName = hostProfile?.full_name || "알 수 없음";
  const hostAvatar = hostProfile?.avatar_url;

  // 구글 맵 URL 및 키
  const googleMapUrl = event.location
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.location)}`
    : undefined;
  const googleMapsApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";

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
        {/* Hero 섹션 - 클라이언트 컴포넌트로 높이 동기화 */}
        <EventDetailHero
          event={event}
          hostName={hostName}
          hostAvatar={hostAvatar}
          dateStr={dateStr}
          timeStr={timeStr}
          currentCount={currentCount}
          maxCount={maxCount}
          isFull={!!isFull}
          isPastEvent={isPastEvent}
          isCompleted={isCompleted}
          isCreator={!!isCreator}
          isRegistered={isRegistered}
          userRegistration={userRegistration}
          eventId={eventId}
          basePath={basePath}
          userId={user?.id}
        />

        {/* 상세 내용 & 참석자 */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-8">

            {/* 상세 내용 (헤더 분리) */}
            <div className="mb-8">
              <h3 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5 text-slate-500" />
                상세 내용
              </h3>
              <Card className="border-slate-200 shadow-sm bg-white overflow-hidden rounded-3xl">
                <CardContent className="p-8">
                  <div
                    className="prose max-w-none"
                    dangerouslySetInnerHTML={{ __html: event.description || "" }}
                  />
                </CardContent>
              </Card>
            </div>

            {/* 위치 안내 */}
            {event.location && googleMapsApiKey && (
              <div className="mb-8">
                <h3 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-slate-500" />
                  위치 안내
                </h3>
                <GoogleMapEmbed location={event.location} apiKey={googleMapsApiKey} />
                <div className="mt-2 text-right">
                  <a
                    href={googleMapUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-medium text-blue-600 hover:underline inline-flex items-center gap-1"
                  >
                    Google 지도에서 보기 <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            )}
          </div>

          {/* 참석자 (헤더 분리) */}
          <div className="lg:col-span-4 space-y-6">
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  <Users className="w-5 h-5 text-slate-500" />
                  참석자
                </h2>
                <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full border border-slate-200">
                  {currentCount}명
                </span>
              </div>
              <Card className="border-slate-200 shadow-sm bg-white overflow-hidden rounded-3xl">
                <CardContent className="p-6">
                  {attendees.length > 0 ? (
                    <div className="flex flex-wrap gap-3">
                      {attendees.map((attendee: any, index: number) => {
                        const profile = Array.isArray(attendee.profiles) ? attendee.profiles[0] : attendee.profiles;
                        const name = profile?.full_name || attendee.guest_name || "익명";
                        return (
                          <div key={attendee.id || index} className="flex flex-col items-center gap-1.5 w-14 group cursor-default">
                            <Avatar className="h-14 w-14 border-2 border-white shadow-sm transition-all duration-200 group-hover:scale-105 group-hover:border-slate-200 ring-1 ring-slate-100">
                              <AvatarImage src={profile?.avatar_url || undefined} />
                              <AvatarFallback className="bg-slate-100 text-slate-500 font-bold text-xs">{name[0]}</AvatarFallback>
                            </Avatar>
                            <span className="text-xs text-slate-600 truncate w-full text-center font-medium group-hover:text-slate-900 transition-colors">{name}</span>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="py-10 text-center text-slate-400 text-sm bg-slate-50 rounded-xl border border-dashed border-slate-200">
                      아직 참석자가 없습니다.
                      <br />첫 번째 멤버가 되어보세요!
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* 후기 섹션 */}
        <Card className="border-slate-200 shadow-sm bg-white overflow-hidden rounded-3xl">
           <div className="px-8 py-6 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
             <div>
                <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  참가자 후기
                  <span className="text-sm text-slate-500 font-medium bg-white border border-slate-200 px-2 py-0.5 rounded-full">
                    {reviews ? reviews.length : 0}
                  </span>
                </h2>
             </div>
              {user && <ReviewModal userId={user.id} eventId={eventId} />}
           </div>
          <CardContent className="p-8">
            {reviews && reviews.length > 0 ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {reviews.map((review: any) => (
                  <ReviewCard key={review.id} review={review} className="h-full border border-slate-100 shadow-sm hover:shadow-md transition-all" />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm mb-4 text-3xl">💬</div>
                <h3 className="text-lg font-bold text-slate-900 mb-1">아직 작성된 후기가 없어요</h3>
                <p className="text-slate-500 max-w-sm mx-auto">모임이 끝난 후 첫 번째 후기를 남겨주세요!<br/>여러분의 경험 공유가 큰 힘이 됩니다.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

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
