import { createClient } from "@/lib/supabase/server";
import { notFound } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, MapPin, Users, User, Settings } from 'lucide-react';
import { RegisterButton } from "@/components/register-button";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  const { data: event } = await supabase
    .from("events")
    .select(`
      *,
      profiles:created_by (
        id,
        full_name
      )
    `)
    .eq("id", id)
    .single();

  if (!event) {
    notFound();
  }

  let userRegistration = null;
  if (user) {
    const { data } = await supabase
      .from("event_registrations")
      .select("id")
      .eq("event_id", id)
      .eq("user_id", user.id)
      .single();
    userRegistration = data;
  }

  const { count: attendeesCount } = await supabase
    .from("event_registrations")
    .select("*", { count: "exact", head: true })
    .eq("event_id", id);

  const { data: attendees } = await supabase
    .from("event_registrations")
    .select(`
      profiles:user_id (
        id,
        full_name
      ),
      guest_name,
      guest_contact
    `)
    .eq("event_id", id);

  const isPastEvent = new Date(event.event_date) < new Date();
  const isFull = event.max_participants && attendeesCount && attendeesCount >= event.max_participants;
  const isCreator = user && event.created_by === user.id;

  const attendancePercentage = event.max_participants 
    ? ((attendeesCount || 0) / event.max_participants) * 100 
    : 0;
  
  // Determine badge color based on attendance
  let attendanceBadgeClass = "bg-slate-100 text-slate-600"; // No participants
  if (attendeesCount && attendeesCount > 0) {
    if (attendancePercentage >= 80) {
      attendanceBadgeClass = "bg-red-100 text-red-700 border-red-200"; // Almost full
    } else {
      attendanceBadgeClass = "bg-sky-100 text-sky-700 border-sky-200"; // Has participants
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="mx-auto max-w-4xl">
        <div className="mb-6 flex items-center justify-between">
          <Link href="/community/events">
            <Button variant="ghost">← 목록으로</Button>
          </Link>
          {isCreator && (
            <Link href={`/community/events/${id}/manage`}>
              <Button variant="outline">
                <Settings className="mr-2 h-4 w-4" />
                참석자 관리
              </Button>
            </Link>
          )}
        </div>

        <Card className="border-slate-200">
          <div className="aspect-video w-full overflow-hidden rounded-t-lg bg-gradient-to-br from-blue-50 to-slate-100">
            <img
              src={event.thumbnail_url || "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&h=450&fit=crop"}
              alt={event.title}
              className="h-full w-full object-cover"
            />
          </div>
          {/* */}
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle className="mb-4 text-3xl">{event.title}</CardTitle>
                <div className="space-y-3 text-slate-600">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    <span>
                      {new Date(event.event_date).toLocaleDateString("ko-KR", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    <span>{event.location}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    <span>주최자: {event.profiles?.full_name || "익명"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    <span 
                      className={`inline-flex items-center rounded-full border px-4 py-1.5 text-sm font-semibold ${attendanceBadgeClass}`}
                    >
                      참석 {attendeesCount || 0}
                      {event.max_participants && ` / ${event.max_participants}`} 명
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="mb-6">
              <h2 className="mb-3 text-xl font-semibold text-slate-900">
                이벤트 소개
              </h2>
              <p className="whitespace-pre-wrap text-slate-700 leading-relaxed">
                {event.description}
              </p>
            </div>

            {isPastEvent ? (
              <div className="rounded-lg bg-slate-100 p-4 text-center text-slate-600">
                이 이벤트는 종료되었습니다
              </div>
            ) : isCreator ? (
              <div className="rounded-lg bg-blue-50 p-4 text-center text-blue-700">
                내가 만든 이벤트입니다
              </div>
            ) : (
              <RegisterButton
                eventId={event.id}
                userId={user?.id}
                isRegistered={!!userRegistration}
                isFull={!!isFull}
              />
            )}
          </CardContent>
        </Card>

        {attendees && attendees.length > 0 && (
          <Card className="mt-8 border-slate-200">
            <CardHeader>
              <CardTitle>참석자 ({attendeesCount})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 sm:grid-cols-2">
                {attendees.map((attendee, index) => {
                  const name = attendee.profiles?.full_name || attendee.guest_name || "익명";
                  return (
                    <div
                      key={index}
                      className="flex items-center gap-3 rounded-lg border border-slate-200 p-3"
                    >
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-200 text-sm font-medium text-slate-700">
                        {name[0]}
                      </div>
                      <p className="font-medium text-slate-900">{name}</p>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
