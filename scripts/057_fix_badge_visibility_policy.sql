-- user_badges 테이블의 조회 권한(RLS) 문제를 해결하는 스크립트
-- 공개 프로필을 가진 사용자의 공개 뱃지는 로그인 여부와 상관없이 누구나 볼 수 있어야 합니다.

BEGIN;

-- 1. user_badges 테이블 RLS 활성화 확인
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;

-- 2. 기존 정책 정리 (충돌 방지)
DROP POLICY IF EXISTS "Public badges are viewable by everyone" ON public.user_badges;
DROP POLICY IF EXISTS "Users can view own badges" ON public.user_badges;

-- 3. 새 정책: 공개 뱃지 조회 허용
-- 조건: 뱃지가 공개(is_visible=true) 상태이고, 뱃지 소유자의 프로필도 공개(is_profile_public=true) 상태일 때
CREATE POLICY "Public badges are viewable by everyone"
ON public.user_badges FOR SELECT
USING (
  is_visible = true 
  AND 
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = user_badges.user_id
    AND profiles.is_profile_public = true
  )
);

-- 4. 새 정책: 본인 뱃지 조회 허용 (본인은 비공개 뱃지도 볼 수 있어야 함)
CREATE POLICY "Users can view own badges"
ON public.user_badges FOR SELECT
USING (
  auth.uid() = user_id
);

-- 5. 스키마 캐시 리로드
NOTIFY pgrst, 'reload schema';

COMMIT;
