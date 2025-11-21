-- 포인트 및 관리자 기능 추가

-- profiles 테이블에 포인트 및 관리자 관련 컬럼 추가
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS points INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'member',
ADD COLUMN IF NOT EXISTS last_login_date DATE;

-- 포인트 거래 내역 테이블 생성
CREATE TABLE IF NOT EXISTS point_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  type TEXT NOT NULL, -- 'daily_login', 'event_participation', 'event_completion', 'event_payment'
  description TEXT,
  related_event_id UUID REFERENCES events(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 이벤트 참여자 추가 정보 테이블 (커스텀 필드)
CREATE TABLE IF NOT EXISTS event_registration_fields (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  field_name TEXT NOT NULL,
  field_type TEXT NOT NULL, -- 'text', 'email', 'phone', 'select', 'checkbox'
  field_options JSONB, -- select/checkbox 옵션
  is_required BOOLEAN DEFAULT false,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 이벤트 참여자 응답 테이블
CREATE TABLE IF NOT EXISTS event_registration_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  registration_id UUID NOT NULL REFERENCES event_registrations(id) ON DELETE CASCADE,
  field_id UUID NOT NULL REFERENCES event_registration_fields(id) ON DELETE CASCADE,
  response_value TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(registration_id, field_id)
);

-- 게시판 카테고리 테이블
CREATE TABLE IF NOT EXISTS board_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  order_index INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- events 테이블에 상태 및 포인트 컬럼 추가
ALTER TABLE events
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'upcoming', -- 'upcoming', 'completed', 'cancelled'
ADD COLUMN IF NOT EXISTS point_cost INTEGER DEFAULT 0;

-- RLS 정책 설정
ALTER TABLE point_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_registration_fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_registration_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE board_categories ENABLE ROW LEVEL SECURITY;

-- point_transactions 정책
CREATE POLICY "Users can view their own transactions" ON point_transactions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can insert transactions" ON point_transactions
  FOR INSERT WITH CHECK (true);

-- event_registration_fields 정책
CREATE POLICY "Anyone can view event registration fields" ON event_registration_fields
  FOR SELECT USING (true);

CREATE POLICY "Event creators can manage fields" ON event_registration_fields
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM events WHERE events.id = event_registration_fields.event_id AND events.created_by = auth.uid()
    )
  );

-- event_registration_responses 정책
CREATE POLICY "Users can view their own responses" ON event_registration_responses
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM event_registrations WHERE event_registrations.id = event_registration_responses.registration_id AND event_registrations.user_id = auth.uid()
    )
  );

CREATE POLICY "Event creators can view all responses" ON event_registration_responses
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM event_registrations 
      JOIN events ON events.id = event_registrations.event_id 
      WHERE event_registrations.id = event_registration_responses.registration_id 
      AND events.created_by = auth.uid()
    )
  );

CREATE POLICY "Registered users can submit responses" ON event_registration_responses
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM event_registrations WHERE event_registrations.id = event_registration_responses.registration_id AND event_registrations.user_id = auth.uid()
    )
  );

-- board_categories 정책
CREATE POLICY "Anyone can view active categories" ON board_categories
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage categories" ON board_categories
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'master')
    )
  );

-- 기본 카테고리 추가
INSERT INTO board_categories (name, slug, description, order_index)
VALUES 
  ('공지사항', 'announcements', '중요한 공지사항을 확인하세요', 1),
  ('자유게시판', 'free', '자유롭게 소통하는 공간입니다', 2)
ON CONFLICT (slug) DO NOTHING;

-- MASTER 관리자 설정 함수
CREATE OR REPLACE FUNCTION set_master_admin()
RETURNS void AS $$
BEGIN
  UPDATE profiles 
  SET role = 'master'
  WHERE email = 'jaewook@mvmt.city';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 포인트 지급 함수
CREATE OR REPLACE FUNCTION award_points(
  p_user_id UUID,
  p_amount INTEGER,
  p_type TEXT,
  p_description TEXT,
  p_event_id UUID DEFAULT NULL
)
RETURNS void AS $$
BEGIN
  -- 포인트 업데이트
  UPDATE profiles 
  SET points = points + p_amount
  WHERE id = p_user_id;
  
  -- 거래 내역 기록
  INSERT INTO point_transactions (user_id, amount, type, description, related_event_id)
  VALUES (p_user_id, p_amount, p_type, p_description, p_event_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 일일 로그인 포인트 지급 함수
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
  
  -- 오늘 첫 로그인이면 포인트 지급
  IF last_login IS NULL OR last_login < CURRENT_DATE THEN
    PERFORM award_points(
      current_user_id,
      5,
      'daily_login',
      '일일 로그인 보상'
    );
    
    UPDATE profiles
    SET last_login_date = CURRENT_DATE
    WHERE id = current_user_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
