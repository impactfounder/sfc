import { createClient } from "@/lib/supabase/server";
import { notFound } from 'next/navigation';
import { Card, CardContent } from "@/components/ui/card";
import { Calendar, MapPin, Users, Settings, ChevronLeft, Info, CheckCircle2, AlertCircle, Share2, Ticket, ShieldCheck, Edit } from 'lucide-react';
import { RegisterButton } from "@/components/register-button";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { EventShareButton } from "@/components/event-share-button";
import { DeleteEventButton } from "@/components/delete-event-button";

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  // 이벤트 정보 조회 (에러 처리 강화)
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

  // 사용자 등록 여부 조회
  let userRegistration = null;
  if (user) {
    const { data: registrationData } = await supabase
      .from("event_registrations")
      .select("id, payment_status")
      .eq("event_id", id)
      .eq("user_id", user.id)
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

              <div className="p-6 sm:p-8">
                <h1 className="text-3xl font-bold text-slate-900 leading-tight mb-8">
                  {event.title}
                </h1>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex items-start gap-4 p-5 rounded-2xl bg-slate-50 border border-slate-100">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-slate-900 shadow-sm border border-slate-100">
                      <Calendar className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Date & Time</p>
                      <p className="text-base font-bold text-slate-900">{dateStr}</p>
                      <p className="text-sm text-slate-600 font-medium">{timeStr}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4 p-5 rounded-2xl bg-slate-50 border border-slate-100">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-slate-900 shadow-sm border border-slate-100">
                      <MapPin className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Location</p>
                      <p className="text-base font-bold text-slate-900">{event.location}</p>
                      <p className="text-sm text-slate-500">현장 진행</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Row 1 - Right (4) */}
            <Card className="lg:col-span-4 border-slate-200 shadow-md bg-white h-full flex flex-col">
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
                  <div className="flex flex-col gap-2.5">
                    {isPastEvent ? (
                      <Button className="w-full bg-slate-100 text-slate-500 hover:bg-slate-200 border-0 h-12 text-base font-medium" disabled>
                        <AlertCircle className="mr-2 h-5 w-5" />
                        이벤트가 종료되었습니다
                      </Button>
                    ) : isCreator ? (
                      <>
                        {/* 버튼 1: 이벤트 수정 */}
                        <Link href={`/events/${id}/edit`}>
                          <Button className="w-full bg-slate-900 text-white hover:bg-slate-800 h-12 text-base font-medium">
                            <Edit className="mr-2 h-5 w-5" />
                            이벤트 수정
                          </Button>
                        </Link>

                        {/* 버튼 2: 참석자 관리 */}
                        <Link href={`/events/${id}/manage`}>
                          <Button variant="outline" className="w-full bg-white border-slate-300 text-slate-700 hover:bg-slate-50 h-12 text-base font-medium">
                            <Users className="mr-2 h-5 w-5" />
                            참석자 관리
                          </Button>
                        </Link>

                        {/* 버튼 3: 공유하기 */}
                        <EventShareButton
                          title={event.title}
                          description={event.description?.replace(/<[^>]*>/g, "").substring(0, 100) || event.title}
                          variant="outline"
                          className="w-full border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900 h-11 text-base font-medium transition-all shadow-sm hover:shadow"
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

                      <Separator className="my-4 bg-slate-100" />

                      <EventShareButton
                        title={event.title}
                        description={event.description?.replace(/<[^>]*>/g, "").substring(0, 100) || event.title}
                        variant="outline"
                        className="w-full border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900 h-11 text-base font-medium transition-all shadow-sm hover:shadow"
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
                <CardHeader icon={Info} title="상세 내용" />
                <div 
                  className="prose prose-slate max-w-none prose-headings:font-bold prose-p:text-slate-600 prose-p:leading-relaxed prose-strong:text-slate-900"
                  dangerouslySetInnerHTML={{ __html: event.description || "" }}
                />
              </CardContent>
            </Card>

            {/* Row 2 - Right (4) : 호스트 소개 + 참석자 멤버 */}
            <Card className="lg:col-span-4 border-slate-200 shadow-sm bg-white">
              <CardContent className="p-6 flex flex-col">
                <CardHeader icon={ShieldCheck} title="호스트 소개" />
                
                <div className="flex gap-4 mb-8 items-start">
                  <Avatar className="h-12 w-12 border border-slate-100 shrink-0">
                    <AvatarImage src={event.profiles?.avatar_url || undefined} />
                    <AvatarFallback className="bg-slate-900 text-white font-bold">
                      {event.profiles?.full_name?.[0] || "H"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0 flex flex-col">
                    <p className="text-xl font-bold text-slate-900 truncate">
                      {event.profiles?.full_name || "알 수 없음"}
                    </p>
                    {event.profiles?.bio && (
                      <p className="text-sm text-slate-600 mt-3 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-100">
                        {event.profiles.bio}
                      </p>
                    )}
                  </div>
                </div>

                <Separator className="mb-8 bg-slate-100" />

                {/* 참석자 멤버 섹션 */}
                <div>
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
                </div>
              </CardContent>
            </Card>
          </div>

        </div>

      {/* [Mobile Only] 하단 고정 액션 바 (Sticky Bottom Bar) */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-t border-slate-200 p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] lg:hidden animate-in slide-in-from-bottom-full duration-500">
        <div className="flex items-center gap-3 max-w-md mx-auto">
          
          {/* 공유 버튼 (아이콘만) */}
          <div className="shrink-0">
            <EventShareButton 
              title={event.title} 
              description={`일시: ${dateStr} ${timeStr}\n장소: ${event.location || "장소 미정"}`}
              variant="outline"
              size="icon"
            />
          </div>

          {/* 신청 버튼 (꽉 차게) */}
          <div className="flex-1">
            {isPastEvent ? (
              <Button className="w-full bg-slate-100 text-slate-400" disabled>
                종료됨
              </Button>
            ) : isCreator ? (
              <Link href={`/events/${id}/manage`} className="block w-full">
                <Button className="w-full bg-slate-100 text-slate-900 hover:bg-slate-200 font-bold">
                  관리하기
                </Button>
              </Link>
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
          </div>
        </div>
      </div>
    </div>
  );
}

