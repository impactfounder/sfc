-- 커뮤니티 관리자 테이블 생성
-- 커뮤니티별로 관리자(모더레이터)를 지정할 수 있는 테이블

CREATE TABLE IF NOT EXISTS public.community_moderators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id UUID NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'moderator' NOT NULL, -- 'owner', 'moderator'
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(community_id, user_id)
);

-- 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_community_moderators_community ON public.community_moderators(community_id);
CREATE INDEX IF NOT EXISTS idx_community_moderators_user ON public.community_moderators(user_id);

-- RLS 활성화
ALTER TABLE public.community_moderators ENABLE ROW LEVEL SECURITY;

-- 정책 설정
CREATE POLICY "Community moderators are viewable by everyone" 
  ON public.community_moderators FOR SELECT 
  USING (true);

CREATE POLICY "Only community owners can manage moderators" 
  ON public.community_moderators FOR ALL 
  USING (
    auth.uid() IN (
      SELECT user_id FROM public.community_moderators 
      WHERE community_id = community_moderators.community_id 
      AND role = 'owner'
    )
  );

-- 코멘트 추가
COMMENT ON TABLE public.community_moderators IS '커뮤니티 관리자(모더레이터) 테이블';
COMMENT ON COLUMN public.community_moderators.role IS '관리자 역할: owner(소유자), moderator(관리자)';
