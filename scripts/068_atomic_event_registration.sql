-- 이벤트 등록 Race Condition 해결을 위한 원자적 등록 함수
-- 정원 체크와 등록을 하나의 트랜잭션으로 처리

CREATE OR REPLACE FUNCTION register_for_event(
  p_event_id UUID,
  p_user_id UUID DEFAULT NULL,
  p_guest_name TEXT DEFAULT NULL,
  p_guest_contact TEXT DEFAULT NULL
) RETURNS TABLE(
  success BOOLEAN,
  registration_id UUID,
  message TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_max_participants INT;
  v_current_count INT;
  v_registration_id UUID;
  v_existing_id UUID;
BEGIN
  -- 이벤트 행을 락하고 정원 정보 가져오기
  SELECT max_participants INTO v_max_participants
  FROM events
  WHERE id = p_event_id
  FOR UPDATE;

  -- 이벤트가 존재하지 않으면 에러
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, NULL::UUID, '이벤트를 찾을 수 없습니다'::TEXT;
    RETURN;
  END IF;

  -- 중복 등록 체크 (로그인 사용자)
  IF p_user_id IS NOT NULL THEN
    SELECT id INTO v_existing_id
    FROM event_registrations
    WHERE event_id = p_event_id AND user_id = p_user_id;

    IF FOUND THEN
      RETURN QUERY SELECT false, v_existing_id, '이미 등록된 이벤트입니다'::TEXT;
      RETURN;
    END IF;
  END IF;

  -- 현재 참가자 수 조회
  SELECT COUNT(*) INTO v_current_count
  FROM event_registrations
  WHERE event_id = p_event_id;

  -- 정원 체크
  IF v_max_participants IS NOT NULL AND v_current_count >= v_max_participants THEN
    RETURN QUERY SELECT false, NULL::UUID, '이벤트 정원이 마감되었습니다'::TEXT;
    RETURN;
  END IF;

  -- 등록 삽입
  INSERT INTO event_registrations (event_id, user_id, guest_name, guest_contact, registered_at)
  VALUES (p_event_id, p_user_id, p_guest_name, p_guest_contact, NOW())
  RETURNING id INTO v_registration_id;

  RETURN QUERY SELECT true, v_registration_id, '등록이 완료되었습니다'::TEXT;
END;
$$;

-- 함수 권한 설정: authenticated 및 anon 사용자 모두 호출 가능
GRANT EXECUTE ON FUNCTION register_for_event(UUID, UUID, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION register_for_event(UUID, UUID, TEXT, TEXT) TO anon;

COMMENT ON FUNCTION register_for_event IS '이벤트 등록 - Race Condition 방지를 위한 원자적 처리 함수';
