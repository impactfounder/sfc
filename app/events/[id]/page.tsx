// [app/events/[id]/page.tsx]
import { Suspense } from 'react';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { Calendar, MapPin, User, Share2, Heart, Clock, Users, Globe, Info } from 'lucide-react';
import Link from 'next/link';

import { format } from 'date-fns';
import { ko } from 'date-fns/locale';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import EventRegisterButton from '@/components/events/event-register-button';
import EventLikeButton from '@/components/events/event-like-button';
import ShareButton from '@/components/share-button';
import { EventContentEditor } from '@/components/events/event-content-editor';
import EventAttendees from '@/components/events/event-attendees';

// ... (getEvent, generateMetadata 함수는 기존 코드와 동일하게 유지)

// ... (중략) ...

export default async function EventPage({ params }: { params: { id: string } }) {
  const { event, user, isLiked, isRegistered, participants } = await getEvent(params.id);

  const startDate = new Date(event.start_date);
  const endDate = new Date(event.end_date);
  const now = new Date();

  let status: { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' } = {
    label: '진행중',
    variant: 'default',
  };

  if (now < startDate) {
    status = { label: '예정', variant: 'secondary' };
  } else if (now > endDate) {
    status = { label: '종료', variant: 'destructive' };
  }

  return (
    <div className="container max-w-5xl mx-auto py-8 px-4 md:px-6">
      {/* 1. 헤더 영역 개선: 카드 형태로 묶어 통일성 부여 */}
      <Card className="mb-8 overflow-hidden">
        <CardHeader className="p-0">
          {event.thumbnail_url && (
            <div className="relative w-full h-64 md:h-96">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={event.thumbnail_url}
                alt={event.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute top-4 right-4 flex gap-2">
                <Badge variant={status.variant} className="text-sm px-3 py-1">
                  {status.label}
                </Badge>
                {event.is_online && (
                  <Badge variant="secondary" className="text-sm px-3 py-1">
                    온라인
                  </Badge>
                )}
              </div>
            </div>
          )}
        </CardHeader>
        <CardContent className="p-6 md:p-8 space-y-6">
          <div className="flex flex-col md:flex-row justify-between items-start gap-4">
            <div className="space-y-4 flex-1">
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-gray-900 dark:text-white">
                {event.title}
              </h1>
              <div className="flex flex-wrap gap-3">
                <Badge variant="outline" className="text-sm text-primary border-primary">
                  {event.category}
                </Badge>
                {event.tags?.map((tag: string) => (
                  <Badge key={tag} variant="secondary" className="text-sm">
                    #{tag}
                  </Badge>
                ))}
              </div>
            </div>
            <div className="flex gap-2 shrink-0">
              <EventLikeButton eventId={event.id} initialIsLiked={isLiked} />
              <ShareButton
                title={event.title}
                url={`${process.env.NEXT_PUBLIC_App_URL}/events/${event.id}`}
              />
            </div>
          </div>

          <Separator />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm md:text-base">
            <div className="space-y-4">
              <div className="flex items-center gap-3 text-muted-foreground">
                <Calendar className="h-5 w-5 text-primary shrink-0" />
                <span>
                  {format(startDate, 'PPP p', { locale: ko })} ~{' '}
                  {format(endDate, 'PPP p', { locale: ko })}
                </span>
              </div>
              <div className="flex items-center gap-3 text-muted-foreground">
                <MapPin className="h-5 w-5 text-primary shrink-0" />
                <span>{event.location || '추후 공지'}</span>
              </div>
              {event.is_online && (
                <div className="flex items-center gap-3 text-muted-foreground">
                  <Globe className="h-5 w-5 text-primary shrink-0" />
                  <span>온라인 진행</span>
                </div>
              )}
            </div>
            <div className="space-y-4">
              <div className="flex items-center gap-3 text-muted-foreground">
                <Users className="h-5 w-5 text-primary shrink-0" />
                <span>
                  최대 {event.max_participants.toLocaleString()}명 (현재 {event.current_participants.toLocaleString()}명 신청)
                </span>
              </div>
              <div className="flex items-center gap-3 text-muted-foreground">
                <CreditCard className="h-5 w-5 text-primary shrink-0" />
                <span>
                  {event.price > 0 ? `${event.price.toLocaleString()}원` : '무료'}
                </span>
              </div>
            </div>
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <Link href={`/profile/${event.organizer_id}`} className="flex items-center gap-3 group">
              <Avatar className="h-12 w-12 border-2 border-transparent group-hover:border-primary transition-colors">
                <AvatarImage src={event.organizer.avatar_url || ''} alt={event.organizer.username} />
                <AvatarFallback>{event.organizer.username[0].toUpperCase()}</AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm text-muted-foreground mb-1">주최자</p>
                <p className="font-medium group-hover:text-primary transition-colors">
                  {event.organizer.username}
                </p>
              </div>
            </Link>
            <EventRegisterButton
              eventId={event.id}
              isRegistered={isRegistered}
              isFull={event.current_participants >= event.max_participants}
              eventStatus={status.label}
              price={event.price}
              currentParticipants={event.current_participants}
              maxParticipants={event.max_participants}
            />
          </div>
        </CardContent>
      </Card>

      {/* 2. 탭 디자인 및 콘텐츠 구조 개선 */}
      <Tabs defaultValue="details" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-8 p-1 bg-muted rounded-lg">
          <TabsTrigger
            value="details"
            className="rounded-md py-3 text-sm font-medium transition-all data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm"
          >
            상세 내용
          </TabsTrigger>
          <TabsTrigger
            value="participants"
            className="rounded-md py-3 text-sm font-medium transition-all data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm"
          >
            참여자 ({participants.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="mt-0">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <Info className="h-5 w-5 text-primary" />
                이벤트 소개
              </CardTitle>
            </CardHeader>
            <CardContent className="prose dark:prose-invert max-w-none p-6 md:p-8">
              <EventContentEditor content={event.content} readOnly={true} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="participants" className="mt-0">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <Users className="h-5 w-5 text-primary" />
                참여자 목록
              </CardTitle>
              <CardDescription>
                함께하는 멤버들을 확인해보세요.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 md:p-8">
              <ScrollArea className="h-[400px] pr-4">
                <EventAttendees
                  participants={participants}
                  currentUserId={user?.id}
                  organizerId={event.organizer_id}
                />
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// CreditCard 아이콘 추가
import { CreditCard } from 'lucide-react';