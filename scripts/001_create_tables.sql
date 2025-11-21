-- Seoul Founders Club 데이터베이스 스키마
-- 이 스크립트는 프로필, 게시글, 댓글, 이벤트, 등록 정보를 포함합니다.

-- 프로필 테이블에 컬럼 추가
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  avatar_url text,
  bio text,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- 게시글 테이블에 category 컬럼 추가 (announcement 또는 discussion)
create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  content text not null,
  category text not null check (category in ('announcement', 'discussion')),
  author_id uuid references public.profiles(id) on delete cascade not null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null,
  likes_count int default 0 not null,
  comments_count int default 0 not null
);

-- 댓글 테이블
create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid references public.posts(id) on delete cascade not null,
  author_id uuid references public.profiles(id) on delete cascade not null,
  content text not null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- 이벤트 테이블에 thumbnail_url, max_participants, created_by 추가
create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null,
  event_date timestamptz not null,
  location text not null,
  thumbnail_url text,
  max_participants int,
  created_by uuid references public.profiles(id) on delete cascade not null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- 이벤트 참가 등록 테이블
create table if not exists public.event_registrations (
  id uuid primary key default gen_random_uuid(),
  event_id uuid references public.events(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  registered_at timestamptz default now() not null,
  unique(event_id, user_id)
);

-- 게시글 좋아요 테이블
create table if not exists public.post_likes (
  id uuid primary key default gen_random_uuid(),
  post_id uuid references public.posts(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  created_at timestamptz default now() not null,
  unique(post_id, user_id)
);

-- Row Level Security 활성화
alter table public.profiles enable row level security;
alter table public.posts enable row level security;
alter table public.comments enable row level security;
alter table public.events enable row level security;
alter table public.event_registrations enable row level security;
alter table public.post_likes enable row level security;

-- 프로필 정책
create policy "Public profiles are viewable by everyone"
  on public.profiles for select
  using (true);

create policy "Users can insert their own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- 게시글 정책
create policy "Posts are viewable by everyone"
  on public.posts for select
  using (true);

create policy "Authenticated users can create posts"
  on public.posts for insert
  with check (auth.uid() = author_id);

create policy "Users can update their own posts"
  on public.posts for update
  using (auth.uid() = author_id);

create policy "Users can delete their own posts"
  on public.posts for delete
  using (auth.uid() = author_id);

-- 댓글 정책
create policy "Comments are viewable by everyone"
  on public.comments for select
  using (true);

create policy "Authenticated users can create comments"
  on public.comments for insert
  with check (auth.uid() = author_id);

create policy "Users can update their own comments"
  on public.comments for update
  using (auth.uid() = author_id);

create policy "Users can delete their own comments"
  on public.comments for delete
  using (auth.uid() = author_id);

-- 이벤트 정책
create policy "Events are viewable by everyone"
  on public.events for select
  using (true);

create policy "Authenticated users can create events"
  on public.events for insert
  with check (auth.uid() = created_by);

create policy "Users can update their own events"
  on public.events for update
  using (auth.uid() = created_by);

create policy "Users can delete their own events"
  on public.events for delete
  using (auth.uid() = created_by);

-- 이벤트 등록 정책
create policy "Event registrations are viewable by everyone"
  on public.event_registrations for select
  using (true);

create policy "Authenticated users can register for events"
  on public.event_registrations for insert
  with check (auth.uid() = user_id);

create policy "Users can cancel their own registrations"
  on public.event_registrations for delete
  using (auth.uid() = user_id);

-- 게시글 좋아요 정책
create policy "Post likes are viewable by everyone"
  on public.post_likes for select
  using (true);

create policy "Authenticated users can like posts"
  on public.post_likes for insert
  with check (auth.uid() = user_id);

create policy "Users can unlike posts"
  on public.post_likes for delete
  using (auth.uid() = user_id);
