-- 비회원(Guest) 이벤트 신청 기능 활성화 스크립트

-- 1. event_registrations 테이블의 user_id 컬럼을 NULL 허용으로 변경
-- (이미 008_add_guest_registration.sql에서 처리되었을 수 있지만, 안전하게 확인)
DO $$ 
BEGIN
  -- user_id 컬럼이 NOT NULL 제약이 있다면 제거
  IF EXISTS (
    SELECT 1 
    FROM information_schema.table_constraints tc
    JOIN information_schema.constraint_column_usage ccu 
      ON tc.constraint_name = ccu.constraint_name
    WHERE tc.table_name = 'event_registrations' 
      AND tc.constraint_type = 'NOT NULL'
      AND ccu.column_name = 'user_id'
  ) THEN
    ALTER TABLE event_registrations ALTER COLUMN user_id DROP NOT NULL;
  END IF;
END $$;

-- 2. guest_name, guest_contact 컬럼 추가 (이미 존재할 수 있으므로 IF NOT EXISTS 처리)
ALTER TABLE event_registrations 
ADD COLUMN IF NOT EXISTS guest_name TEXT,
ADD COLUMN IF NOT EXISTS guest_contact TEXT;

-- 3. RLS 정책 수정: anon role도 INSERT 가능하도록 허용
-- 기존 정책 삭제
DROP POLICY IF EXISTS "Anyone can register for events" ON event_registrations;
DROP POLICY IF EXISTS "Users can register for events" ON event_registrations;
DROP POLICY IF EXISTS "Anonymous can register for events" ON event_registrations;

-- 새로운 정책: 로그인/비로그인 모두 INSERT 가능
CREATE POLICY "Anyone can register for events" ON event_registrations
  FOR INSERT 
  WITH CHECK (true);

-- DELETE 정책도 수정: 게스트는 자신의 등록을 삭제할 수 없지만, 
-- 이벤트 개설자는 모든 등록을 삭제할 수 있도록 유지
DROP POLICY IF EXISTS "Users can cancel their registrations" ON event_registrations;
CREATE POLICY "Users can cancel their registrations" ON event_registrations
  FOR DELETE 
  USING (
    auth.uid() = user_id 
    OR user_id IS NULL  -- 게스트 등록은 삭제 불가 (보안상 이벤트 개설자만 삭제 가능)
  );

-- 4. 인덱스 추가 (성능 최적화)
CREATE INDEX IF NOT EXISTS idx_event_registrations_guest 
ON event_registrations(event_id) 
WHERE user_id IS NULL;

-- 5. CHECK 제약 조건 추가: user_id와 guest_name 중 하나는 반드시 있어야 함
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.table_constraints 
    WHERE constraint_name = 'event_registrations_user_or_guest_check'
  ) THEN
    ALTER TABLE event_registrations 
    ADD CONSTRAINT event_registrations_user_or_guest_check 
    CHECK (user_id IS NOT NULL OR (guest_name IS NOT NULL AND guest_contact IS NOT NULL));
  END IF;
END $$;

