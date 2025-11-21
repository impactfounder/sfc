-- Projects 기능을 위한 데이터베이스 스키마
-- 프로젝트, 프로젝트 멤버, 기술 스택 테이블 생성

-- 프로젝트 테이블
create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null,
  status text not null check (status in ('planning', 'in_progress', 'completed', 'on_hold')),
  category text not null check (category in ('web', 'mobile', 'ai', 'blockchain', 'hardware', 'other')),
  thumbnail_url text,
  created_by uuid references public.profiles(id) on delete cascade not null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null,
  start_date date,
  end_date date,
  github_url text,
  demo_url text,
  looking_for_members boolean default false not null,
  views_count int default 0 not null
);

-- 프로젝트 멤버 테이블
create table if not exists public.project_members (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references public.projects(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  role text not null, -- 예: 'owner', 'developer', 'designer', 'pm'
  joined_at timestamptz default now() not null,
  unique(project_id, user_id)
);

-- 프로젝트 기술 스택 테이블
create table if not exists public.project_tech_stack (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references public.projects(id) on delete cascade not null,
  tech_name text not null,
  created_at timestamptz default now() not null
);

-- Row Level Security 활성화
alter table public.projects enable row level security;
alter table public.project_members enable row level security;
alter table public.project_tech_stack enable row level security;

-- 프로젝트 정책
create policy "Projects are viewable by everyone"
  on public.projects for select
  using (true);

create policy "Authenticated users can create projects"
  on public.projects for insert
  with check (auth.uid() = created_by);

create policy "Project creators can update their projects"
  on public.projects for update
  using (auth.uid() = created_by);

create policy "Project creators can delete their projects"
  on public.projects for delete
  using (auth.uid() = created_by);

-- 프로젝트 멤버 정책
create policy "Project members are viewable by everyone"
  on public.project_members for select
  using (true);

create policy "Project creators can add members"
  on public.project_members for insert
  with check (
    exists (
      select 1 from public.projects
      where id = project_id and created_by = auth.uid()
    )
  );

create policy "Project creators and members can leave"
  on public.project_members for delete
  using (
    auth.uid() = user_id or
    exists (
      select 1 from public.projects
      where id = project_id and created_by = auth.uid()
    )
  );

-- 프로젝트 기술 스택 정책
create policy "Tech stack is viewable by everyone"
  on public.project_tech_stack for select
  using (true);

create policy "Project creators can manage tech stack"
  on public.project_tech_stack for all
  using (
    exists (
      select 1 from public.projects
      where id = project_id and created_by = auth.uid()
    )
  );

-- 인덱스 생성 (성능 최적화)
create index if not exists idx_projects_created_by on public.projects(created_by);
create index if not exists idx_projects_status on public.projects(status);
create index if not exists idx_projects_category on public.projects(category);
create index if not exists idx_project_members_project_id on public.project_members(project_id);
create index if not exists idx_project_members_user_id on public.project_members(user_id);
create index if not exists idx_project_tech_stack_project_id on public.project_tech_stack(project_id);

-- 샘플 프로젝트 데이터 생성
insert into public.projects (title, description, status, category, created_by, looking_for_members, start_date)
select 
  'AI 기반 스타트업 매칭 플랫폼',
  '투자자와 스타트업을 AI로 매칭하는 플랫폼입니다. 머신러닝을 활용하여 최적의 매칭을 제공하고, 실시간 피드백 시스템을 통해 지속적으로 개선됩니다.',
  'in_progress',
  'ai',
  p.id,
  true,
  current_date - interval '2 months'
from public.profiles p
limit 1;

insert into public.projects (title, description, status, category, created_by, looking_for_members, start_date)
select 
  '블록체인 기반 투명한 기부 플랫폼',
  '기부금의 사용 내역을 블록체인에 기록하여 투명성을 보장하는 플랫폼입니다. 스마트 컨트랙트를 통해 자동화된 기부금 배분이 가능합니다.',
  'planning',
  'blockchain',
  p.id,
  true,
  null
from public.profiles p
limit 1;

insert into public.projects (title, description, status, category, created_by, looking_for_members, start_date, end_date)
select 
  'Seoul Founders Club 커뮤니티 플랫폼',
  '서울 창업가들을 위한 네트워킹 및 협업 플랫폼입니다. 이벤트, 게시판, 프로젝트 공유 기능을 제공합니다.',
  'in_progress',
  'web',
  p.id,
  false,
  current_date - interval '3 months',
  null
from public.profiles p
limit 1;

-- 샘플 프로젝트의 기술 스택 추가
insert into public.project_tech_stack (project_id, tech_name)
select p.id, unnest(array['Next.js', 'TypeScript', 'Supabase', 'Tailwind CSS'])
from public.projects p
where p.title = 'Seoul Founders Club 커뮤니티 플랫폼';

insert into public.project_tech_stack (project_id, tech_name)
select p.id, unnest(array['Python', 'TensorFlow', 'FastAPI', 'PostgreSQL'])
from public.projects p
where p.title = 'AI 기반 스타트업 매칭 플랫폼';

insert into public.project_tech_stack (project_id, tech_name)
select p.id, unnest(array['Solidity', 'React', 'Web3.js', 'IPFS'])
from public.projects p
where p.title = '블록체인 기반 투명한 기부 플랫폼';

-- 프로젝트 생성자를 멤버로 자동 추가
insert into public.project_members (project_id, user_id, role)
select p.id, p.created_by, 'owner'
from public.projects p;
