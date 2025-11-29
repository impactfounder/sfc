-- 뱃지 테이블에 is_active 컬럼 추가 (안전한 마이그레이션)
-- 이미 컬럼이 있어도 에러 없이 실행되도록 IF NOT EXISTS 사용

-- 1. 컬럼 추가 (없는 경우에만)
DO $$
BEGIN
  -- is_active 컬럼이 있는지 확인
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'badges' 
    AND column_name = 'is_active'
  ) THEN
    -- 컬럼 추가
    ALTER TABLE badges 
    ADD COLUMN is_active BOOLEAN DEFAULT true NOT NULL;
    
    RAISE NOTICE 'is_active 컬럼이 추가되었습니다.';
  ELSE
    RAISE NOTICE 'is_active 컬럼이 이미 존재합니다.';
  END IF;
END $$;

-- 2. 기존 데이터의 is_active 값이 NULL인 경우 true로 설정
UPDATE badges 
SET is_active = true 
WHERE is_active IS NULL;

-- 3. 인덱스 추가 (없는 경우에만)
CREATE INDEX IF NOT EXISTS idx_badges_is_active 
ON badges(is_active);

-- 4. 코멘트 추가
COMMENT ON COLUMN badges.is_active IS '뱃지의 공개/비공개 상태. true면 공개, false면 비공개 (관리자용)';

-- 5. 확인 쿼리
SELECT 
  column_name, 
  data_type, 
  column_default, 
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'badges' 
AND column_name = 'is_active';

