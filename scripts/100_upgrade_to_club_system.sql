-- SFC 커뮤니티 기능을 "Disquiet 스타일의 클럽 시스템"으로 고도화
-- 기존 board_categories의 '반골(vangol)'과 '하이토크(hightalk)'를 독립적인 클럽으로 전환

-- ============================================
-- 1. communities 테이블 확장
-- ============================================

-- slug 컬럼 추가 (unique)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'communities' 
    AND column_name = 'slug'
  ) THEN
    ALTER TABLE public.communities ADD COLUMN slug text UNIQUE;
    CREATE UNIQUE INDEX IF NOT EXISTS idx_communities_slug ON public.communities(slug);
  END IF;
END $$;

-- cover_image_url 컬럼 추가
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'communities' 
    AND column_name = 'cover_image_url'
  ) THEN
    ALTER TABLE public.communities ADD COLUMN cover_image_url text;
  END IF;
END $$;

-- subtitle 컬럼 추가 (짧은 한 줄 소개)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'communities' 
    AND column_name = 'subtitle'
  ) THEN
    ALTER TABLE public.communities ADD COLUMN subtitle text;
  END IF;
END $$;

-- requires_approval 컬럼 추가 (가입 승인 필요 여부)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'communities' 
    AND column_name = 'requires_approval'
  ) THEN
    ALTER TABLE public.communities ADD COLUMN requires_approval boolean DEFAULT false NOT NULL;
  END IF;
END $$;

-- ============================================
-- 2. community_members 테이블 확장
-- ============================================

-- status 컬럼 추가 (멤버 상태)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'community_members' 
    AND column_name = 'status'
  ) THEN
    ALTER TABLE public.community_members ADD COLUMN status text DEFAULT 'active' NOT NULL;
    -- CHECK 제약 추가
    ALTER TABLE public.community_members ADD CONSTRAINT community_members_status_check 
      CHECK (status IN ('active', 'pending', 'rejected', 'banned'));
  END IF;
END $$;

-- answer 컬럼 추가 (가입 신청 시 답변)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'community_members' 
    AND column_name = 'answer'
  ) THEN
    ALTER TABLE public.community_members ADD COLUMN answer text;
  END IF;
END $$;

-- 기존 멤버들의 status를 'active'로 설정 (이미 기본값이지만 명시적으로)
UPDATE public.community_members 
SET status = 'active' 
WHERE status IS NULL;

-- ============================================
-- 3. Master 관리자 ID 찾기
-- ============================================

DO $$
DECLARE
  master_user_id uuid;
  vangol_board_id uuid;
  hightalk_board_id uuid;
  vangol_community_id uuid;
  hightalk_community_id uuid;
BEGIN
  -- Master 관리자 찾기 (role이 'master'이거나 이메일이 'jaewook@mvmt.city')
  SELECT id INTO master_user_id
  FROM public.profiles
  WHERE role = 'master' OR email = 'jaewook@mvmt.city'
  ORDER BY created_at ASC
  LIMIT 1;

  -- Master가 없으면 첫 번째 관리자 또는 첫 번째 사용자 사용
  IF master_user_id IS NULL THEN
    SELECT id INTO master_user_id
    FROM public.profiles
    WHERE role = 'admin'
    ORDER BY created_at ASC
    LIMIT 1;
  END IF;

  IF master_user_id IS NULL THEN
    SELECT id INTO master_user_id
    FROM public.profiles
    ORDER BY created_at ASC
    LIMIT 1;
  END IF;

  -- ============================================
  -- 4. board_categories에서 '반골(vangol)'과 '하이토크(hightalk)' 찾기
  -- ============================================

  -- 반골 board_category 찾기
  SELECT id INTO vangol_board_id
  FROM public.board_categories
  WHERE slug IN ('vangol', 'bangol')
  LIMIT 1;

  -- 하이토크 board_category 찾기
  SELECT id INTO hightalk_board_id
  FROM public.board_categories
  WHERE slug = 'hightalk'
  LIMIT 1;

  -- ============================================
  -- 5. communities에 반골 클럽 생성/업데이트
  -- ============================================

  IF vangol_board_id IS NOT NULL THEN
    -- 기존 communities에서 slug가 'vangol'인 것 찾기
    SELECT id INTO vangol_community_id
    FROM public.communities
    WHERE slug = 'vangol'
    LIMIT 1;

    IF vangol_community_id IS NULL THEN
      -- 새로 생성
      INSERT INTO public.communities (
        name,
        slug,
        description,
        subtitle,
        created_by,
        requires_approval,
        is_private
      )
      SELECT 
        bc.name,
        'vangol',
        bc.description,
        '반골 모임 클럽',
        master_user_id,
        false,
        false
      FROM public.board_categories bc
      WHERE bc.id = vangol_board_id
      RETURNING id INTO vangol_community_id;
    ELSE
      -- 기존 것 업데이트
      UPDATE public.communities
      SET 
        name = COALESCE((SELECT name FROM public.board_categories WHERE id = vangol_board_id), name),
        description = COALESCE((SELECT description FROM public.board_categories WHERE id = vangol_board_id), description),
        subtitle = COALESCE(subtitle, '반골 모임 클럽')
      WHERE id = vangol_community_id;
    END IF;

    -- ============================================
    -- 6. posts 테이블의 반골 게시글들을 새 community에 연결
    -- ============================================
    UPDATE public.posts
    SET community_id = vangol_community_id
    WHERE board_category_id = vangol_board_id
      AND (community_id IS NULL OR community_id != vangol_community_id);

    RAISE NOTICE '반골 클럽 생성/업데이트 완료: community_id = %', vangol_community_id;
  ELSE
    RAISE NOTICE '반골 board_category를 찾을 수 없습니다.';
  END IF;

  -- ============================================
  -- 7. communities에 하이토크 클럽 생성/업데이트
  -- ============================================

  IF hightalk_board_id IS NOT NULL THEN
    -- 기존 communities에서 slug가 'hightalk'인 것 찾기
    SELECT id INTO hightalk_community_id
    FROM public.communities
    WHERE slug = 'hightalk'
    LIMIT 1;

    IF hightalk_community_id IS NULL THEN
      -- 새로 생성
      INSERT INTO public.communities (
        name,
        slug,
        description,
        subtitle,
        created_by,
        requires_approval,
        is_private
      )
      SELECT 
        bc.name,
        'hightalk',
        bc.description,
        '하이토크 모임 클럽',
        master_user_id,
        false,
        false
      FROM public.board_categories bc
      WHERE bc.id = hightalk_board_id
      RETURNING id INTO hightalk_community_id;
    ELSE
      -- 기존 것 업데이트
      UPDATE public.communities
      SET 
        name = COALESCE((SELECT name FROM public.board_categories WHERE id = hightalk_board_id), name),
        description = COALESCE((SELECT description FROM public.board_categories WHERE id = hightalk_board_id), description),
        subtitle = COALESCE(subtitle, '하이토크 모임 클럽')
      WHERE id = hightalk_community_id;
    END IF;

    -- ============================================
    -- 8. posts 테이블의 하이토크 게시글들을 새 community에 연결
    -- ============================================
    UPDATE public.posts
    SET community_id = hightalk_community_id
    WHERE board_category_id = hightalk_board_id
      AND (community_id IS NULL OR community_id != hightalk_community_id);

    RAISE NOTICE '하이토크 클럽 생성/업데이트 완료: community_id = %', hightalk_community_id;
  ELSE
    RAISE NOTICE '하이토크 board_category를 찾을 수 없습니다.';
  END IF;

  -- ============================================
  -- 9. 마이그레이션 결과 확인
  -- ============================================
  RAISE NOTICE '========================================';
  RAISE NOTICE '클럽 시스템 업그레이드 완료';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Master User ID: %', master_user_id;
  RAISE NOTICE '반골 Board ID: %', vangol_board_id;
  RAISE NOTICE '하이토크 Board ID: %', hightalk_board_id;
  RAISE NOTICE '반골 Community ID: %', vangol_community_id;
  RAISE NOTICE '하이토크 Community ID: %', hightalk_community_id;

END $$;

-- ============================================
-- 10. 마이그레이션 결과 검증 쿼리
-- ============================================

-- 생성된 클럽 확인
SELECT 
  c.id,
  c.name,
  c.slug,
  c.subtitle,
  c.description,
  c.requires_approval,
  c.is_private,
  COUNT(DISTINCT p.id) as post_count,
  COUNT(DISTINCT cm.id) as member_count
FROM public.communities c
LEFT JOIN public.posts p ON p.community_id = c.id
LEFT JOIN public.community_members cm ON cm.community_id = c.id AND cm.status = 'active'
WHERE c.slug IN ('vangol', 'hightalk')
GROUP BY c.id, c.name, c.slug, c.subtitle, c.description, c.requires_approval, c.is_private
ORDER BY c.slug;

-- 게시글 연결 확인
SELECT 
  bc.name as board_category,
  bc.slug as board_slug,
  COUNT(p.id) as posts_in_board,
  c.name as community_name,
  c.slug as community_slug,
  COUNT(p2.id) as posts_in_community
FROM public.board_categories bc
LEFT JOIN public.posts p ON p.board_category_id = bc.id
LEFT JOIN public.communities c ON c.slug = bc.slug
LEFT JOIN public.posts p2 ON p2.community_id = c.id
WHERE bc.slug IN ('vangol', 'bangol', 'hightalk')
GROUP BY bc.id, bc.name, bc.slug, c.id, c.name, c.slug
ORDER BY bc.slug;


