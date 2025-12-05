-- 관리자가 다른 사용자의 프로필(역할)을 업데이트할 수 있도록 RLS 정책 추가
-- 마스터 관리자만 다른 사용자의 역할을 변경할 수 있음

-- 기존 정책은 유지 (사용자가 자신의 프로필을 업데이트하는 정책)
-- 새로운 정책 추가: 마스터 관리자가 다른 사용자의 역할을 변경할 수 있음

-- 기존 정책이 있다면 삭제 (중복 방지)
DROP POLICY IF EXISTS "Master admins can update any profile role" ON public.profiles;

-- 새로운 정책 생성
CREATE POLICY "Master admins can update any profile role"
ON public.profiles
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'master'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'master'
  )
);

-- 주석 추가
COMMENT ON POLICY "Master admins can update any profile role" ON public.profiles IS 
'마스터 관리자가 다른 사용자의 프로필(특히 role 컬럼)을 업데이트할 수 있도록 허용';

