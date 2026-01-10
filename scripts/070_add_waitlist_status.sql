-- 대기자(waitlist) 기능 추가
-- event_registrations 테이블에 status 컬럼 추가

-- 1. status 컬럼 추가 (confirmed: 확정, waitlist: 대기)
ALTER TABLE public.event_registrations
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'waitlist'));

-- 2. 대기 순번 컬럼 추가 (대기자일 때만 사용)
ALTER TABLE public.event_registrations
ADD COLUMN IF NOT EXISTS waitlist_position INTEGER;

-- 3. 대기자 승격 알림 전송 여부
ALTER TABLE public.event_registrations
ADD COLUMN IF NOT EXISTS waitlist_notified_at TIMESTAMPTZ;

-- 4. 기존 등록은 모두 confirmed로 설정
UPDATE public.event_registrations SET status = 'confirmed' WHERE status IS NULL;

-- 5. 인덱스 추가 (대기자 조회 최적화)
CREATE INDEX IF NOT EXISTS idx_event_registrations_status ON public.event_registrations(event_id, status);
CREATE INDEX IF NOT EXISTS idx_event_registrations_waitlist ON public.event_registrations(event_id, waitlist_position) WHERE status = 'waitlist';

-- 6. 대기자 승격 알림 함수
CREATE OR REPLACE FUNCTION notify_waitlist_promotion()
RETURNS TRIGGER AS $$
DECLARE
  next_waitlist_id UUID;
  next_user_id UUID;
  event_title TEXT;
  event_max INT;
  current_confirmed INT;
BEGIN
  -- 삭제된 등록이 confirmed 상태였는지 확인
  IF OLD.status != 'confirmed' THEN
    RETURN OLD;
  END IF;

  -- 이벤트 정보 조회
  SELECT title, max_participants INTO event_title, event_max
  FROM events WHERE id = OLD.event_id;

  -- 현재 확정 인원 수 확인
  SELECT COUNT(*) INTO current_confirmed
  FROM event_registrations
  WHERE event_id = OLD.event_id AND status = 'confirmed';

  -- 정원이 없거나 아직 꽉 차 있으면 승격 불필요
  IF event_max IS NULL OR current_confirmed >= event_max THEN
    RETURN OLD;
  END IF;

  -- 다음 대기자 찾기 (가장 낮은 waitlist_position)
  SELECT id, user_id INTO next_waitlist_id, next_user_id
  FROM event_registrations
  WHERE event_id = OLD.event_id
    AND status = 'waitlist'
    AND waitlist_notified_at IS NULL
  ORDER BY waitlist_position ASC, registered_at ASC
  LIMIT 1;

  -- 대기자가 있으면 알림 생성
  IF next_waitlist_id IS NOT NULL AND next_user_id IS NOT NULL THEN
    -- 알림 생성
    INSERT INTO notifications (user_id, type, title, message, related_event_id)
    VALUES (
      next_user_id,
      'waitlist_promotion',
      '참가 가능 알림',
      '대기 중이던 "' || event_title || '" 이벤트에 자리가 생겼습니다! 지금 참가를 확정해주세요.',
      OLD.event_id
    );

    -- 알림 전송 시간 기록
    UPDATE event_registrations
    SET waitlist_notified_at = NOW()
    WHERE id = next_waitlist_id;
  END IF;

  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- 7. 트리거 생성 (등록 삭제 시)
DROP TRIGGER IF EXISTS trigger_notify_waitlist_on_cancel ON event_registrations;
CREATE TRIGGER trigger_notify_waitlist_on_cancel
  AFTER DELETE ON event_registrations
  FOR EACH ROW
  EXECUTE FUNCTION notify_waitlist_promotion();

-- 8. 대기자 승격 함수 (수동 또는 자동 승격용)
CREATE OR REPLACE FUNCTION promote_from_waitlist(p_event_id UUID)
RETURNS INTEGER AS $$
DECLARE
  event_max INT;
  current_confirmed INT;
  slots_available INT;
  promoted_count INT := 0;
  waitlist_record RECORD;
BEGIN
  -- 이벤트 최대 인원 조회
  SELECT max_participants INTO event_max FROM events WHERE id = p_event_id;

  -- 정원 제한이 없으면 종료
  IF event_max IS NULL THEN
    RETURN 0;
  END IF;

  -- 현재 확정 인원 수
  SELECT COUNT(*) INTO current_confirmed
  FROM event_registrations
  WHERE event_id = p_event_id AND status = 'confirmed';

  -- 빈 자리 수
  slots_available := event_max - current_confirmed;

  -- 빈 자리가 없으면 종료
  IF slots_available <= 0 THEN
    RETURN 0;
  END IF;

  -- 대기자 순서대로 승격
  FOR waitlist_record IN
    SELECT id, user_id
    FROM event_registrations
    WHERE event_id = p_event_id
      AND status = 'waitlist'
    ORDER BY waitlist_position ASC, registered_at ASC
    LIMIT slots_available
  LOOP
    -- 상태를 confirmed로 변경
    UPDATE event_registrations
    SET status = 'confirmed', waitlist_position = NULL
    WHERE id = waitlist_record.id;

    -- 알림 생성 (로그인 사용자만)
    IF waitlist_record.user_id IS NOT NULL THEN
      INSERT INTO notifications (user_id, type, title, message, related_event_id)
      VALUES (
        waitlist_record.user_id,
        'waitlist_confirmed',
        '참가 확정',
        '대기 중이던 이벤트에 참가가 확정되었습니다!',
        p_event_id
      );
    END IF;

    promoted_count := promoted_count + 1;
  END LOOP;

  RETURN promoted_count;
END;
$$ LANGUAGE plpgsql;
