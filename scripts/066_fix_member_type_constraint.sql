-- member_type 체크 제약 조건 수정
-- 빈 배열과 유효하지 않은 값 처리 개선
-- 주의: 이 스크립트는 member_type이 이미 text[] 타입일 때만 실행하세요.
-- 만약 아직 text 타입이라면 먼저 scripts/065_update_member_type_to_array.sql을 실행하세요.

-- 2. 기존 제약 조건 제거
ALTER TABLE public.profiles 
DROP CONSTRAINT IF EXISTS profiles_member_type_check;

-- 3. 새로운 제약 조건 추가 (더 엄격한 검증)
-- member_type이 이미 text[] 타입이므로 타입 캐스팅 없이 직접 사용
-- 참고: 중복 체크는 체크 제약 조건에서 서브쿼리를 사용할 수 없으므로 
--       애플리케이션 레벨(lib/actions/user.ts)에서 처리합니다.
ALTER TABLE public.profiles 
ADD CONSTRAINT profiles_member_type_check 
CHECK (
  member_type IS NULL 
  OR (
    -- 배열이 비어있지 않아야 함
    array_length(member_type, 1) > 0
    -- 최대 2개까지만 허용
    AND array_length(member_type, 1) <= 2 
    -- 모든 요소가 허용된 값 중 하나여야 함
    AND (member_type <@ ARRAY['사업가', '투자자', '크리에이터']::text[])
  )
);

COMMENT ON COLUMN public.profiles.member_type IS '멤버 타입 배열: 사업가, 투자자, 크리에이터 중 최대 2개 선택 가능 (중복 불가)';

