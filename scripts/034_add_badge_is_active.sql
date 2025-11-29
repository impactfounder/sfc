-- 뱃지 테이블에 is_active 필드 추가
-- 관리자가 뱃지의 공개/비공개 상태를 제어할 수 있도록 함
-- 안전한 마이그레이션: 컬럼이 이미 있으면 에러 없이 건너뜀

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

-- 기존 뱃지들은 모두 활성화 상태로 설정
UPDATE badges 
SET is_active = true 
WHERE is_active IS NULL;

-- 인덱스 추가 (활성화된 뱃지만 조회할 때 성능 향상)
CREATE INDEX IF NOT EXISTS idx_badges_is_active 
ON badges(is_active);

-- 코멘트 추가
COMMENT ON COLUMN badges.is_active IS '뱃지의 공개/비공개 상태. true면 공개, false면 비공개 (관리자용)';

