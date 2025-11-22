-- 포인트 이코노미 시스템 전체 구축
-- 적립 규칙: 매일 로그인(+1P), 게시글 작성(+5P), 댓글 작성(+2P), 이벤트 개설(+50P)
-- 사용 규칙: 최소 100P 이상부터 사용 가능, 1P 단위 자유롭게 사용

-- ============================================
-- 1. 일일 로그인 포인트 함수 수정 (5P -> 1P)
-- ============================================
CREATE OR REPLACE FUNCTION check_daily_login_points()
RETURNS void AS $$
DECLARE
  current_user_id UUID := auth.uid();
  last_login DATE;
BEGIN
  IF current_user_id IS NULL THEN
    RETURN;
  END IF;
  
  SELECT last_login_date INTO last_login
  FROM profiles
  WHERE id = current_user_id;
  
  -- 오늘 첫 로그인이면 포인트 지급 (1P)
  IF last_login IS NULL OR last_login < CURRENT_DATE THEN
    PERFORM award_points(
      current_user_id,
      1,  -- 매일 로그인: +1P
      'daily_login',
      '일일 로그인 보상'
    );
    
    UPDATE profiles
    SET last_login_date = CURRENT_DATE
    WHERE id = current_user_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 2. 게시글 작성 시 포인트 지급 트리거
-- ============================================
CREATE OR REPLACE FUNCTION award_points_on_post_insert()
RETURNS TRIGGER AS $$
BEGIN
  -- 게시글 작성 시 +5P 지급
  PERFORM award_points(
    NEW.author_id,
    5,
    'post_creation',
    '게시글 작성 보상',
    NULL
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_award_points_on_post_insert ON posts;
CREATE TRIGGER trigger_award_points_on_post_insert
  AFTER INSERT ON posts
  FOR EACH ROW
  EXECUTE FUNCTION award_points_on_post_insert();

-- ============================================
-- 3. 댓글 작성 시 포인트 지급 트리거
-- ============================================
CREATE OR REPLACE FUNCTION award_points_on_comment_insert()
RETURNS TRIGGER AS $$
BEGIN
  -- 댓글 작성 시 +2P 지급
  PERFORM award_points(
    NEW.author_id,
    2,
    'comment_creation',
    '댓글 작성 보상',
    NULL
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_award_points_on_comment_insert ON comments;
CREATE TRIGGER trigger_award_points_on_comment_insert
  AFTER INSERT ON comments
  FOR EACH ROW
  EXECUTE FUNCTION award_points_on_comment_insert();

-- ============================================
-- 4. 이벤트 개설 시 포인트 지급 트리거
-- ============================================
CREATE OR REPLACE FUNCTION award_points_on_event_insert()
RETURNS TRIGGER AS $$
BEGIN
  -- 이벤트 개설 시 +50P 지급
  PERFORM award_points(
    NEW.created_by,
    50,
    'event_creation',
    '이벤트 개설 보상',
    NEW.id
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_award_points_on_event_insert ON events;
CREATE TRIGGER trigger_award_points_on_event_insert
  AFTER INSERT ON events
  FOR EACH ROW
  EXECUTE FUNCTION award_points_on_event_insert();

-- ============================================
-- 5. 포인트 사용 함수 (이벤트 신청 시 사용)
-- ============================================
CREATE OR REPLACE FUNCTION register_event_with_points(
  p_event_id UUID,
  p_user_id UUID,
  p_used_points INTEGER DEFAULT 0
)
RETURNS UUID AS $$
DECLARE
  v_user_points INTEGER;
  v_registration_id UUID;
  v_event_cost INTEGER;
BEGIN
  -- 포인트 사용 검증
  IF p_used_points > 0 THEN
    -- 최소 사용 한도 체크 (100P 미만 사용 시도 시 에러)
    IF p_used_points < 100 THEN
      RAISE EXCEPTION '포인트는 최소 100 P 이상부터 사용할 수 있습니다.';
    END IF;
    
    -- 보유 포인트 체크
    SELECT points INTO v_user_points
    FROM profiles
    WHERE id = p_user_id;
    
    IF v_user_points IS NULL OR v_user_points < p_used_points THEN
      RAISE EXCEPTION '보유 포인트가 부족합니다.';
    END IF;
    
    -- 이벤트 포인트 비용 체크 (선택사항)
    SELECT point_cost INTO v_event_cost
    FROM events
    WHERE id = p_event_id;
    
    IF v_event_cost IS NOT NULL AND v_event_cost > 0 THEN
      -- 이벤트 비용보다 많이 사용할 수 없음
      IF p_used_points > v_event_cost THEN
        RAISE EXCEPTION '사용 가능한 포인트는 이벤트 비용(%P)을 초과할 수 없습니다.', v_event_cost;
      END IF;
    END IF;
  END IF;
  
  -- 포인트 차감
  IF p_used_points > 0 THEN
    UPDATE profiles
    SET points = points - p_used_points
    WHERE id = p_user_id;
    
    -- 포인트 사용 트랜잭션 기록
    INSERT INTO point_transactions (user_id, amount, type, description, related_event_id)
    VALUES (
      p_user_id,
      -p_used_points,  -- 음수로 기록 (사용)
      'event_payment',
      '이벤트 신청 포인트 사용',
      p_event_id
    );
  END IF;
  
  -- 이벤트 등록
  INSERT INTO event_registrations (event_id, user_id)
  VALUES (p_event_id, p_user_id)
  ON CONFLICT (event_id, user_id) DO NOTHING
  RETURNING id INTO v_registration_id;
  
  -- 등록 실패 체크 (이미 등록된 경우)
  IF v_registration_id IS NULL THEN
    -- 이미 등록된 경우 포인트 환불
    IF p_used_points > 0 THEN
      UPDATE profiles
      SET points = points + p_used_points
      WHERE id = p_user_id;
      
      -- 환불 트랜잭션 기록
      INSERT INTO point_transactions (user_id, amount, type, description, related_event_id)
      VALUES (
        p_user_id,
        p_used_points,
        'event_refund',
        '이벤트 중복 신청 포인트 환불',
        p_event_id
      );
    END IF;
    
    RAISE EXCEPTION '이미 등록된 이벤트입니다.';
  END IF;
  
  -- 이벤트 참여 보상 지급 (기존 로직 유지)
  PERFORM award_points(
    p_user_id,
    10,
    'event_participation',
    '이벤트 참여 보상',
    p_event_id
  );
  
  RETURN v_registration_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 정책 업데이트: 포인트 거래 내역 조회
-- ============================================
DROP POLICY IF EXISTS "Users can view their own transactions" ON point_transactions;
CREATE POLICY "Users can view their own transactions" ON point_transactions
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "System can insert transactions" ON point_transactions;
CREATE POLICY "System can insert transactions" ON point_transactions
  FOR INSERT WITH CHECK (true);

-- ============================================
-- 테스트 및 확인 쿼리 (주석 해제하여 실행 가능)
-- ============================================
-- 포인트 거래 내역 확인
-- SELECT * FROM point_transactions 
-- WHERE user_id = auth.uid() 
-- ORDER BY created_at DESC 
-- LIMIT 10;

-- 현재 포인트 확인
-- SELECT id, full_name, points, last_login_date 
-- FROM profiles 
-- WHERE id = auth.uid();

