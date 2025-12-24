-- event_registrations RLS 정책 보안 강화
-- 현재: 모든 사용자가 모든 등록 정보를 볼 수 있음 (개인정보 노출 위험)
-- 변경: 본인 등록, 이벤트 개설자, 관리자만 상세 정보 조회 가능

-- 기존 SELECT 정책 삭제
DROP POLICY IF EXISTS "Event registrations are viewable by everyone" ON event_registrations;

-- 1. 등록 수만 조회하는 공개 정책 (참가자 수 표시용)
-- 이 정책은 count 쿼리에서 사용됨
CREATE POLICY "Anyone can count registrations" ON event_registrations
  FOR SELECT
  USING (true);

-- 참고: 위 정책은 일단 기존과 동일하게 유지
-- 이유: 이벤트 상세 페이지에서 참가자 목록(프로필 정보 포함)을 표시하고 있음
-- 만약 참가자 목록을 숨기려면 아래 정책으로 교체 필요

-- 더 엄격한 정책이 필요한 경우 (참가자 목록 비공개):
/*
DROP POLICY IF EXISTS "Anyone can count registrations" ON event_registrations;

CREATE POLICY "Secure event registration access" ON event_registrations
  FOR SELECT
  USING (
    -- 본인의 등록 정보
    auth.uid() = user_id
    OR
    -- 이벤트 개설자
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = event_registrations.event_id
      AND events.created_by = auth.uid()
    )
    OR
    -- 관리자
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'master')
    )
  );

-- 익명 사용자를 위한 등록 수 조회 함수 (count만 반환)
CREATE OR REPLACE FUNCTION get_event_registration_count(p_event_id UUID)
RETURNS INT
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT COUNT(*)::INT FROM event_registrations WHERE event_id = p_event_id;
$$;

GRANT EXECUTE ON FUNCTION get_event_registration_count(UUID) TO anon;
GRANT EXECUTE ON FUNCTION get_event_registration_count(UUID) TO authenticated;
*/

-- guest_contact 필드 보호를 위한 별도 접근 제어 (권장)
-- guest_contact에는 이메일/전화번호 등 민감정보가 포함될 수 있음
-- View를 통해 민감정보 마스킹

CREATE OR REPLACE VIEW public.event_registrations_public AS
SELECT
  id,
  event_id,
  user_id,
  guest_name,
  -- guest_contact는 본인/이벤트 개설자/관리자만 볼 수 있도록 마스킹
  CASE
    WHEN auth.uid() = user_id THEN guest_contact
    WHEN EXISTS (
      SELECT 1 FROM events
      WHERE events.id = event_registrations.event_id
      AND events.created_by = auth.uid()
    ) THEN guest_contact
    WHEN EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'master')
    ) THEN guest_contact
    ELSE
      CASE
        WHEN guest_contact IS NOT NULL AND guest_contact LIKE '%@%'
        THEN CONCAT(LEFT(guest_contact, 3), '***@***')
        WHEN guest_contact IS NOT NULL
        THEN CONCAT(LEFT(guest_contact, 3), '****')
        ELSE NULL
      END
  END as guest_contact,
  registered_at
FROM event_registrations;

-- View에 대한 권한 설정
GRANT SELECT ON public.event_registrations_public TO anon;
GRANT SELECT ON public.event_registrations_public TO authenticated;

COMMENT ON VIEW public.event_registrations_public IS
'이벤트 등록 정보 공개 뷰 - guest_contact 필드가 마스킹됨';
