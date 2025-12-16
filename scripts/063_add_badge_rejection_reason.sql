-- user_badges 테이블에 rejection_reason 컬럼 추가
-- 뱃지 신청 반려 시 사유를 저장

ALTER TABLE user_badges
ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- 인덱스 추가 (optional, rejection_reason으로 조회할 일은 적지만 일관성 유지)
COMMENT ON COLUMN user_badges.rejection_reason IS '뱃지 신청 반려 사유';
