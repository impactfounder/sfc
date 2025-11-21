import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft, Users, CheckCircle } from 'lucide-react';
import { CompleteEventButton } from "@/components/complete-event-button";

export default async function ManageEventPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect("/auth/login");
  }

  const { data: event } = await supabase
    .from("events")
    .select("*")
    .eq("id", id)
    .single();

  if (!event) {
    notFound();
  }

  if (event.created_by !== user.id) {
    redirect(`/community/events/${id}`);
  }

  const { data: registrations } = await supabase
    .from("event_registrations")
    .select(`
      *,
      profiles:user_id (
        id,
        full_name,
        email
      )
    `)
    .eq("event_id", id)
    .order("registered_at", { ascending: true });

  const isPastEvent = new Date(event.event_date) < new Date();
  const isCompleted = event.status === 'completed';

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="mx-auto max-w-4xl">
        <div className="mb-6 flex items-center justify-between">
          <Link href={`/community/events/${id}`}>
            <Button variant="ghost">
              <ArrowLeft className="mr-2 h-4 w-4" />
              이벤트로 돌아가기
            </Button>
          </Link>
        </div>

        <Card className="mb-6 border-slate-200">
          <CardHeader>
            <CardTitle className="text-2xl">{event.title}</CardTitle>
            <p className="text-sm text-slate-600">
              {new Date(event.event_date).toLocaleDateString("ko-KR", {
                year: "numeric",
                month: "long",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          </CardHeader>
          <CardContent>
            {isPastEvent && !isCompleted && (
              <div className="rounded-lg bg-amber-50 p-4">
                <p className="mb-3 text-sm text-amber-800">
                  이벤트가 종료되었습니다. 이벤트를 완료 처리하면 100 포인트를 받습니다.
                </p>
                <CompleteEventButton eventId={id} userId={user.id} />
              </div>
            )}
            {isCompleted && (
              <div className="flex items-center gap-2 rounded-lg bg-green-50 p-4 text-green-700">
                <CheckCircle className="h-5 w-5" />
                <span className="font-medium">이벤트가 완료되었습니다</span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                참석자 관리 ({registrations?.length || 0}명)
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {registrations && registrations.length > 0 ? (
              <div className="space-y-3">
                {registrations.map((registration, index) => (
                  <div
                    key={registration.id}
                    className="flex items-center justify-between rounded-lg border border-slate-200 p-4"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-200 text-sm font-medium text-slate-700">
                        {registration.profiles?.full_name?.[0] || "U"}
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">
                          {registration.profiles?.full_name || "익명"}
                        </p>
                        <p className="text-sm text-slate-600">
                          {registration.profiles?.email}
                        </p>
                      </div>
                    </div>
                    <div className="text-sm text-slate-500">
                      {new Date(registration.registered_at).toLocaleDateString("ko-KR")}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-12 text-center text-slate-500">
                아직 참석 신청자가 없습니다
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
