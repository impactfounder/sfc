import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft, Users, CheckCircle } from 'lucide-react';
import { CompleteEventButton } from "@/components/complete-event-button";
import { AddGuestForm } from "@/components/add-guest-form";

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
    redirect(`/events/${id}`);
  }

  // 게스트 등록과 사용자 등록을 모두 가져오기
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
          <Link href={`/events/${id}`}>
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 참석자 목록 */}
          <div className="lg:col-span-2">
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
                    {registrations.map((registration) => {
                      const isGuest = !registration.user_id;
                      const displayName = isGuest
                        ? (registration as { guest_name?: string }).guest_name || "게스트"
                        : registration.profiles?.full_name || "익명";
                      const displayContact = isGuest
                        ? (registration as { guest_contact?: string }).guest_contact
                        : registration.profiles?.email;

                      return (
                        <div
                          key={registration.id}
                          className="flex items-center justify-between rounded-lg border border-slate-200 p-4"
                        >
                          <div className="flex items-center gap-4">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-200 text-sm font-medium text-slate-700">
                              {displayName[0]?.toUpperCase() || "U"}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="font-medium text-slate-900">{displayName}</p>
                                {isGuest && (
                                  <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-blue-100 text-blue-700">
                                    게스트
                                  </span>
                                )}
                              </div>
                              {displayContact && (
                                <p className="text-sm text-slate-600">{displayContact}</p>
                              )}
                            </div>
                          </div>
                          <div className="text-sm text-slate-500">
                            {new Date(registration.registered_at).toLocaleDateString("ko-KR")}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="py-12 text-center text-slate-500">
                    아직 참석 신청자가 없습니다
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* 수동 등록 폼 */}
          <div className="lg:col-span-1">
            <AddGuestForm eventId={id} />
          </div>
        </div>
      </div>
    </div>
  );
}

