-- user_badges 테이블에 status와 evidence 컬럼 추가
-- 뱃지 신청 및 검증 프로세스 지원

-- 1. status 컬럼 추가 (pending, approved, rejected)
ALTER TABLE user_badges 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected'));

-- 2. evidence 컬럼 추가 (증빙 자료)
ALTER TABLE user_badges 
ADD COLUMN IF NOT EXISTS evidence TEXT;

-- 3. 기존 데이터 처리: status가 없는 경우 'approved'로 설정 (기존 뱃지는 모두 승인된 것으로 간주)
UPDATE user_badges 
SET status = 'approved' 
WHERE status IS NULL;

-- 4. 인덱스 추가 (관리자 페이지에서 pending 상태 조회 최적화)
CREATE INDEX IF NOT EXISTS idx_user_badges_status ON user_badges(status);
CREATE INDEX IF NOT EXISTS idx_user_badges_user_status ON user_badges(user_id, status);



