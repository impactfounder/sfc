-- badges 테이블 RLS 정책 추가
-- 관리자가 뱃지를 관리할 수 있도록 UPDATE 정책 설정

-- 1. RLS 활성화 (이미 되어 있을 수 있음)
ALTER TABLE badges ENABLE ROW LEVEL SECURITY;

-- 2. 기존 정책 삭제 (있다면)
DROP POLICY IF EXISTS "Admins can update badges" ON badges;
DROP POLICY IF EXISTS "Anyone can view badges" ON badges;

-- 3. SELECT 정책: 모든 사람이 뱃지를 조회할 수 있음
CREATE POLICY "Anyone can view badges"
ON badges
FOR SELECT
TO public
USING (true);

-- 4. UPDATE 정책: 관리자(admin, master)만 뱃지를 수정할 수 있음
CREATE POLICY "Admins can update badges"
ON badges
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'master')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'master')
  )
);

-- 5. INSERT 정책: 관리자만 뱃지를 생성할 수 있음
DROP POLICY IF EXISTS "Admins can create badges" ON badges;
CREATE POLICY "Admins can create badges"
ON badges
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'master')
  )
);

-- 6. DELETE 정책: 관리자만 뱃지를 삭제할 수 있음
DROP POLICY IF EXISTS "Admins can delete badges" ON badges;
CREATE POLICY "Admins can delete badges"
ON badges
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'master')
  )
);

-- 정책 확인
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'badges';

