-- ============================================
-- 커뮤니티 Reddit 스타일 대개편 마이그레이션
-- SFC 프로젝트용 (기존 communities, community_members 테이블 확장)
-- ============================================
--
-- 사전 조건:
-- - 031_create_communities.sql이 이미 실행되어 있어야 함
-- - communities, community_members 테이블이 존재해야 함
--
-- 변경 사항:
-- 1. communities 테이블에 rules, join_type, slug 컬럼 추가
-- 2. community_join_requests 테이블 생성 (승인제 가입)
-- 3. 인덱스 추가
-- 4. vangol, hightalk 보드를 커뮤니티로 연동

-- ============================================
-- 1. communities 테이블 확장
-- ============================================

-- 1.1 rules 컬럼 추가 (커뮤니티 이용수칙)
ALTER TABLE public.communities
ADD COLUMN IF NOT EXISTS rules TEXT;

-- 1.2 join_type 컬럼 추가 (가입 방식: free, approval, invite)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'communities'
    AND column_name = 'join_type'
  ) THEN
    ALTER TABLE public.communities
    ADD COLUMN join_type TEXT DEFAULT 'free'
    CHECK (join_type IN ('free', 'approval', 'invite'));
  END IF;
END $$;

-- 1.3 slug 컬럼 추가 (URL용)
ALTER TABLE public.communities
ADD COLUMN IF NOT EXISTS slug TEXT UNIQUE;

-- 기존 커뮤니티에 slug 생성 (name 기반, 특수문자 제거)
UPDATE public.communities
SET slug = LOWER(REGEXP_REPLACE(REPLACE(name, ' ', '-'), '[^a-z0-9가-힣-]', '', 'g'))
WHERE slug IS NULL;

-- ============================================
-- 2. community_join_requests 테이블 생성 (승인제 가입)
-- ============================================

CREATE TABLE IF NOT EXISTS public.community_join_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id UUID REFERENCES public.communities(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  message TEXT,  -- 가입 신청 메시지
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES public.profiles(id),
  rejection_reason TEXT,  -- 거절 사유
  UNIQUE(community_id, user_id)
);

-- RLS 활성화
ALTER TABLE public.community_join_requests ENABLE ROW LEVEL SECURITY;

-- 2.1 본인의 가입 신청 또는 운영자가 조회 가능
DROP POLICY IF EXISTS "Users can view own join requests" ON public.community_join_requests;
CREATE POLICY "Users can view own join requests"
  ON public.community_join_requests
  FOR SELECT
  USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM public.communities c
      WHERE c.id = community_join_requests.community_id
      AND (
        c.created_by = auth.uid() OR
        EXISTS (
          SELECT 1 FROM public.community_members cm
          WHERE cm.community_id = c.id
          AND cm.user_id = auth.uid()
          AND cm.role IN ('owner', 'admin')
        )
      )
    )
  );

-- 2.2 로그인한 사용자가 가입 신청 가능
DROP POLICY IF EXISTS "Authenticated users can create join requests" ON public.community_join_requests;
CREATE POLICY "Authenticated users can create join requests"
  ON public.community_join_requests
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 2.3 커뮤니티 운영자만 가입 신청 상태 변경 가능
DROP POLICY IF EXISTS "Community admins can update join requests" ON public.community_join_requests;
CREATE POLICY "Community admins can update join requests"
  ON public.community_join_requests
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.communities c
      WHERE c.id = community_join_requests.community_id
      AND (
        c.created_by = auth.uid() OR
        EXISTS (
          SELECT 1 FROM public.community_members cm
          WHERE cm.community_id = c.id
          AND cm.user_id = auth.uid()
          AND cm.role IN ('owner', 'admin')
        )
      )
    )
  );

-- 2.4 본인이 가입 신청 취소 가능
DROP POLICY IF EXISTS "Users can delete own pending requests" ON public.community_join_requests;
CREATE POLICY "Users can delete own pending requests"
  ON public.community_join_requests
  FOR DELETE
  USING (auth.uid() = user_id AND status = 'pending');

-- ============================================
-- 3. 인덱스 추가
-- ============================================

CREATE INDEX IF NOT EXISTS idx_community_join_requests_community_id
  ON public.community_join_requests(community_id);
CREATE INDEX IF NOT EXISTS idx_community_join_requests_user_id
  ON public.community_join_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_community_join_requests_status
  ON public.community_join_requests(status);
CREATE INDEX IF NOT EXISTS idx_communities_slug
  ON public.communities(slug);
CREATE INDEX IF NOT EXISTS idx_communities_is_private
  ON public.communities(is_private);

-- ============================================
-- 4. 기존 board_categories의 vangol, hightalk를 communities와 연동
-- ============================================

DO $$
DECLARE
  master_id UUID;
BEGIN
  -- master 역할의 프로필 ID 가져오기
  SELECT id INTO master_id FROM public.profiles WHERE role = 'master' LIMIT 1;

  -- master가 없으면 스킵
  IF master_id IS NULL THEN
    RAISE NOTICE 'No master user found, skipping community creation';
    RETURN;
  END IF;

  -- vangol 커뮤니티가 없으면 생성
  IF NOT EXISTS (SELECT 1 FROM public.communities WHERE slug = 'vangol') THEN
    INSERT INTO public.communities (name, description, slug, is_private, join_type, created_by)
    SELECT
      bc.name,
      bc.description,
      bc.slug,
      false,
      'free',
      master_id
    FROM public.board_categories bc
    WHERE bc.slug = 'vangol';

    RAISE NOTICE 'Created vangol community';
  END IF;

  -- hightalk 커뮤니티가 없으면 생성
  IF NOT EXISTS (SELECT 1 FROM public.communities WHERE slug = 'hightalk') THEN
    INSERT INTO public.communities (name, description, slug, is_private, join_type, created_by)
    SELECT
      bc.name,
      bc.description,
      bc.slug,
      false,
      'free',
      master_id
    FROM public.board_categories bc
    WHERE bc.slug = 'hightalk';

    RAISE NOTICE 'Created hightalk community';
  END IF;

  -- 해당 보드의 posts에 community_id 매핑 (아직 매핑 안된 것만)
  UPDATE public.posts p
  SET community_id = c.id
  FROM public.communities c, public.board_categories bc
  WHERE p.board_category_id = bc.id
    AND bc.slug IN ('vangol', 'hightalk')
    AND c.slug = bc.slug
    AND p.community_id IS NULL;

  RAISE NOTICE 'Posts migration completed';
END $$;

-- ============================================
-- 5. 코멘트 추가 (문서화)
-- ============================================

COMMENT ON TABLE public.community_join_requests IS '커뮤니티 가입 신청 테이블 (승인제 가입 지원)';
COMMENT ON COLUMN public.communities.rules IS '커뮤니티 이용수칙';
COMMENT ON COLUMN public.communities.join_type IS '가입 방식: free(자유가입), approval(승인제), invite(초대제)';
COMMENT ON COLUMN public.communities.slug IS 'URL용 슬러그';

-- ============================================
-- 완료!
-- ============================================
