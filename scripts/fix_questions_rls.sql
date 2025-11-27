-- 이벤트 신청 모달의 추가 질문(커스텀 필드) RLS 정책 수정
-- 일반 사용자가 질문 목록을 조회하고 답변을 저장할 수 있도록 정책 강제 재설정

-- ============================================
-- 1. event_registration_fields 테이블 RLS 정책 재설정
-- ============================================

-- 기존 정책 삭제 (혹시 충돌이 있을 수 있으므로)
DROP POLICY IF EXISTS "Anyone can view event registration fields" ON event_registration_fields;
DROP POLICY IF EXISTS "Event creators can manage fields" ON event_registration_fields;
DROP POLICY IF EXISTS "Public can view event registration fields" ON event_registration_fields;

-- 누구나(인증/비인증 모두) 조회 가능하도록 정책 강제 재생성
CREATE POLICY "Anyone can view event registration fields" ON event_registration_fields
  FOR SELECT 
  USING (true);

-- 이벤트 개설자만 필드 생성/수정/삭제 가능
CREATE POLICY "Event creators can manage fields" ON event_registration_fields
  FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM events 
      WHERE events.id = event_registration_fields.event_id 
      AND events.created_by = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM events 
      WHERE events.id = event_registration_fields.event_id 
      AND events.created_by = auth.uid()
    )
  );

-- ============================================
-- 2. event_registration_responses 테이블 RLS 정책 수정
-- ============================================

-- 기존 정책 삭제
DROP POLICY IF EXISTS "Users can view their own responses" ON event_registration_responses;
DROP POLICY IF EXISTS "Event creators can view all responses" ON event_registration_responses;
DROP POLICY IF EXISTS "Registered users can submit responses" ON event_registration_responses;
DROP POLICY IF EXISTS "Anyone can insert responses" ON event_registration_responses;

-- 조회 정책: 본인 응답 또는 이벤트 개설자가 조회 가능
CREATE POLICY "Users can view their own responses" ON event_registration_responses
  FOR SELECT 
  USING (
    -- 본인 응답 조회 (로그인 사용자)
    EXISTS (
      SELECT 1 FROM event_registrations 
      WHERE event_registrations.id = event_registration_responses.registration_id 
      AND event_registrations.user_id = auth.uid()
    )
    OR
    -- 게스트 응답 조회 (게스트 등록의 경우 user_id가 NULL이므로 이벤트 개설자만 조회 가능)
    (
      EXISTS (
        SELECT 1 FROM event_registrations
        JOIN events ON events.id = event_registrations.event_id
        WHERE event_registrations.id = event_registration_responses.registration_id 
        AND event_registrations.user_id IS NULL
        AND events.created_by = auth.uid()
      )
    )
  );

-- 이벤트 개설자가 모든 응답 조회 가능
CREATE POLICY "Event creators can view all responses" ON event_registration_responses
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM event_registrations
      JOIN events ON events.id = event_registrations.event_id
      WHERE event_registrations.id = event_registration_responses.registration_id 
      AND events.created_by = auth.uid()
    )
  );

-- INSERT 정책: 누구나 답변을 저장할 수 있도록 수정 (게스트 등록 포함)
CREATE POLICY "Anyone can insert responses" ON event_registration_responses
  FOR INSERT 
  WITH CHECK (
    -- 등록 정보가 존재하는지 확인
    EXISTS (
      SELECT 1 FROM event_registrations 
      WHERE event_registrations.id = event_registration_responses.registration_id
    )
    AND
    -- 필드가 해당 이벤트에 속하는지 확인
    EXISTS (
      SELECT 1 FROM event_registration_fields
      JOIN event_registrations ON event_registrations.event_id = event_registration_fields.event_id
      WHERE event_registration_fields.id = event_registration_responses.field_id
      AND event_registrations.id = event_registration_responses.registration_id
    )
  );

-- ============================================
-- 3. 테스트용 예시 질문 데이터 추가
-- ============================================

-- 가장 최신 이벤트 하나에 예시 질문 추가
DO $$
DECLARE
  latest_event_id UUID;
  question1_id UUID;
  question2_id UUID;
BEGIN
  -- 가장 최신 이벤트 ID 가져오기
  SELECT id INTO latest_event_id
  FROM events
  ORDER BY created_at DESC
  LIMIT 1;

  -- 이벤트가 존재하는 경우에만 질문 추가
  IF latest_event_id IS NOT NULL THEN
    -- 기존 질문이 있는지 확인 (중복 방지)
    IF NOT EXISTS (
      SELECT 1 FROM event_registration_fields 
      WHERE event_id = latest_event_id 
      AND field_name = '참가 동기'
    ) THEN
      -- 질문 1: 참가 동기 (텍스트 입력)
      INSERT INTO event_registration_fields (
        event_id,
        field_name,
        field_type,
        field_options,
        is_required,
        order_index
      ) VALUES (
        latest_event_id,
        '참가 동기',
        'text',
        NULL,
        false,
        1
      ) RETURNING id INTO question1_id;
    END IF;

    -- 기존 질문이 있는지 확인 (중복 방지)
    IF NOT EXISTS (
      SELECT 1 FROM event_registration_fields 
      WHERE event_id = latest_event_id 
      AND field_name = '티셔츠 사이즈'
    ) THEN
      -- 질문 2: 티셔츠 사이즈 (객관식 선택)
      INSERT INTO event_registration_fields (
        event_id,
        field_name,
        field_type,
        field_options,
        is_required,
        order_index
      ) VALUES (
        latest_event_id,
        '티셔츠 사이즈',
        'select',
        '["XS", "S", "M", "L", "XL", "XXL"]'::jsonb,
        false,
        2
      ) RETURNING id INTO question2_id;
    END IF;

    RAISE NOTICE '테스트 질문이 추가되었습니다. 이벤트 ID: %', latest_event_id;
  ELSE
    RAISE NOTICE '등록된 이벤트가 없어 테스트 질문을 추가할 수 없습니다.';
  END IF;
END $$;

-- ============================================
-- 4. 정책 적용 확인 쿼리 (참고용)
-- ============================================

-- 정책이 제대로 적용되었는지 확인
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
WHERE tablename IN ('event_registration_fields', 'event_registration_responses')
ORDER BY tablename, policyname;




