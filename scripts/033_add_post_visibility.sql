-- 게시글 공개 설정 기능 추가
-- 하이브리드 피드 시스템: 전체 공개 vs 그룹 전용

-- 1. posts 테이블에 visibility 컬럼 추가
ALTER TABLE public.posts 
ADD COLUMN IF NOT EXISTS visibility text DEFAULT 'public' NOT NULL;

-- 2. CHECK 제약 조건 추가
DO $$ 
BEGIN
  -- 기존 제약 조건이 있으면 제거
  IF EXISTS (
    SELECT 1 FROM information_schema.constraint_column_usage 
    WHERE table_name = 'posts' 
    AND constraint_name LIKE '%visibility%'
  ) THEN
    ALTER TABLE public.posts DROP CONSTRAINT IF EXISTS posts_visibility_check;
  END IF;
  
  -- 새 제약 조건 추가
  ALTER TABLE public.posts 
  ADD CONSTRAINT posts_visibility_check 
  CHECK (visibility IN ('public', 'group'));
END $$;

-- 3. 기존 데이터는 모두 'public'으로 설정 (이미 DEFAULT로 설정됨)
-- 명시적으로 업데이트 (NULL이 있을 경우 대비)
UPDATE public.posts 
SET visibility = 'public' 
WHERE visibility IS NULL;

-- 4. 인덱스 추가 (성능 최적화)
CREATE INDEX IF NOT EXISTS idx_posts_visibility ON public.posts(visibility);

-- 5. 주석 추가
COMMENT ON COLUMN public.posts.visibility IS '게시글 공개 설정: public(전체 공개) 또는 group(그룹 전용)';

