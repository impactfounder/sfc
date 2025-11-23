-- 소모임(Communities) 시스템 테이블 생성 및 RLS 정책
-- 멤버(Member) 기능을 위한 communities 및 community_members 테이블

-- 1. communities 테이블 생성
CREATE TABLE IF NOT EXISTS public.communities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  thumbnail_url text,
  created_by uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  is_private boolean DEFAULT false NOT NULL
);

-- 2. community_members 테이블 생성
CREATE TABLE IF NOT EXISTS public.community_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id uuid REFERENCES public.communities(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  role text NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
  joined_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(community_id, user_id)
);

-- 3. posts 테이블에 community_id 컬럼 추가 (이미 있으면 무시)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'posts' 
    AND column_name = 'community_id'
  ) THEN
    ALTER TABLE public.posts ADD COLUMN community_id uuid REFERENCES public.communities(id) ON DELETE SET NULL;
  END IF;
END $$;

-- 4. RLS 활성화
ALTER TABLE public.communities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_members ENABLE ROW LEVEL SECURITY;

-- 5. Communities RLS 정책
-- 5-1. 모든 사용자가 communities 조회 가능 (소개는 전체 공개)
DROP POLICY IF EXISTS "Communities are viewable by everyone" ON public.communities;
CREATE POLICY "Communities are viewable by everyone"
  ON public.communities
  FOR SELECT
  USING (true);

-- 5-2. 로그인한 사용자가 communities 생성 가능
DROP POLICY IF EXISTS "Authenticated users can create communities" ON public.communities;
CREATE POLICY "Authenticated users can create communities"
  ON public.communities
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- 5-3. 소모임 소유자 및 관리자가 수정 가능
DROP POLICY IF EXISTS "Community owners and admins can update" ON public.communities;
CREATE POLICY "Community owners and admins can update"
  ON public.communities
  FOR UPDATE
  USING (
    created_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.community_members
      WHERE community_members.community_id = communities.id
      AND community_members.user_id = auth.uid()
      AND community_members.role IN ('owner', 'admin')
    )
  );

-- 5-4. 소모임 소유자만 삭제 가능
DROP POLICY IF EXISTS "Community owners can delete" ON public.communities;
CREATE POLICY "Community owners can delete"
  ON public.communities
  FOR DELETE
  USING (created_by = auth.uid());

-- 6. Community Members RLS 정책
-- 6-1. 모든 사용자가 community_members 조회 가능 (멤버 목록은 공개)
DROP POLICY IF EXISTS "Community members are viewable by everyone" ON public.community_members;
CREATE POLICY "Community members are viewable by everyone"
  ON public.community_members
  FOR SELECT
  USING (true);

-- 6-2. 본인만 가입 가능 (가입은 본인만)
DROP POLICY IF EXISTS "Users can join communities" ON public.community_members;
CREATE POLICY "Users can join communities"
  ON public.community_members
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 6-3. 소모임 소유자 및 관리자가 멤버 역할 변경 가능
DROP POLICY IF EXISTS "Community admins can update member roles" ON public.community_members;
CREATE POLICY "Community admins can update member roles"
  ON public.community_members
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.community_members cm
      JOIN public.communities c ON c.id = cm.community_id
      WHERE cm.community_id = community_members.community_id
      AND cm.user_id = auth.uid()
      AND (cm.role IN ('owner', 'admin') OR c.created_by = auth.uid())
    )
  );

-- 6-4. 본인은 탈퇴 가능, 소유자 및 관리자는 멤버 제거 가능
DROP POLICY IF EXISTS "Users can leave or be removed from communities" ON public.community_members;
CREATE POLICY "Users can leave or be removed from communities"
  ON public.community_members
  FOR DELETE
  USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM public.community_members cm
      JOIN public.communities c ON c.id = cm.community_id
      WHERE cm.community_id = community_members.community_id
      AND cm.user_id = auth.uid()
      AND (cm.role IN ('owner', 'admin') OR c.created_by = auth.uid())
    )
  );

-- 7. 인덱스 추가 (성능 최적화)
CREATE INDEX IF NOT EXISTS idx_communities_created_by ON public.communities(created_by);
CREATE INDEX IF NOT EXISTS idx_communities_created_at ON public.communities(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_community_members_community_id ON public.community_members(community_id);
CREATE INDEX IF NOT EXISTS idx_community_members_user_id ON public.community_members(user_id);
CREATE INDEX IF NOT EXISTS idx_posts_community_id ON public.posts(community_id) WHERE community_id IS NOT NULL;

