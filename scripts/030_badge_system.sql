-- 뱃지 시스템 테이블 생성 및 데이터 시딩
-- 회원의 신뢰도를 나타내는 인증 뱃지 시스템

-- 뱃지 테이블 생성
CREATE TABLE IF NOT EXISTS badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  icon TEXT NOT NULL, -- 이모지 또는 아이콘 이름
  category TEXT NOT NULL, -- asset, revenue, influence, achievement, community
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 사용자 뱃지 테이블 생성
CREATE TABLE IF NOT EXISTS user_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  badge_id UUID NOT NULL REFERENCES badges(id) ON DELETE CASCADE,
  is_visible BOOLEAN DEFAULT true, -- 외부 노출 여부
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, badge_id)
);

-- RLS 정책 설정
ALTER TABLE badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;

-- 뱃지 테이블: 모든 사용자가 조회 가능
DROP POLICY IF EXISTS "Badges are viewable by everyone" ON badges;
CREATE POLICY "Badges are viewable by everyone" ON badges
  FOR SELECT
  USING (true);

-- 사용자 뱃지 테이블: 모든 사용자가 조회 가능 (노출된 뱃지만)
DROP POLICY IF EXISTS "User badges are viewable by everyone" ON user_badges;
CREATE POLICY "User badges are viewable by everyone" ON user_badges
  FOR SELECT
  USING (is_visible = true OR auth.uid() = user_id);

-- 사용자는 자신의 뱃지 노출 여부를 수정할 수 있음
DROP POLICY IF EXISTS "Users can update their own badge visibility" ON user_badges;
CREATE POLICY "Users can update their own badge visibility" ON user_badges
  FOR UPDATE
  USING (auth.uid() = user_id);

-- 관리자는 모든 사용자의 뱃지를 부여/삭제할 수 있음
DROP POLICY IF EXISTS "Admins can manage user badges" ON user_badges;
CREATE POLICY "Admins can manage user badges" ON user_badges
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'master')
    )
  );

-- 뱃지 데이터 초기화 (기존 데이터 삭제 후 다시 삽입)
DELETE FROM user_badges;
DELETE FROM badges;

INSERT INTO badges (name, icon, category, description) VALUES
-- 1. 자산 (Asset)
('자산 10억+', '💰', 'asset', '순자산 10억 원 이상 인증 회원'),
('자산 50억+', '💎', 'asset', '순자산 50억 원 이상 인증 회원'),

-- 2. 매출 (Revenue)
('매출 10억+', '📈', 'revenue', '연 매출 10억 원 이상 기업 대표'),
('매출 50억+', '🚀', 'revenue', '연 매출 50억 원 이상 기업 대표'),
('매출 100억+', '🏢', 'revenue', '연 매출 100억 원 이상 기업 대표'),

-- 3. SNS 영향력 (Influence)
('팔로워 1만+', '📣', 'influence', 'SNS 팔로워 1만 명 이상 보유'),
('팔로워 5만+', '🔥', 'influence', 'SNS 팔로워 5만 명 이상 보유'),
('팔로워 10만+', '🌟', 'influence', 'SNS 팔로워 10만 명 이상 보유'),
('팔로워 20만+', '👑', 'influence', 'SNS 팔로워 20만 명 이상 보유'),

-- 4. 기타 성과 (Achievement)
('EXIT 경험', '🚪', 'achievement', 'M&A 또는 IPO 엑싯 경험 보유'),
('연쇄 창업가', '🔄', 'achievement', '2회 이상 창업 경험 보유'),
('연애프로그램', '📺', 'achievement', 'TV/OTT 연애 리얼리티 프로그램 출연'),

-- 5. 커뮤니티 (Community)
('커뮤니티 리더', '🛡️', 'community', 'SFC 커뮤니티 운영진 및 리더');

-- 인덱스 생성 (성능 최적화)
CREATE INDEX IF NOT EXISTS idx_user_badges_user_id ON user_badges(user_id);
CREATE INDEX IF NOT EXISTS idx_user_badges_badge_id ON user_badges(badge_id);
CREATE INDEX IF NOT EXISTS idx_user_badges_visible ON user_badges(user_id, is_visible) WHERE is_visible = true;

-- 확인 쿼리
-- SELECT * FROM badges ORDER BY category, name;
-- SELECT ub.*, b.name, b.icon, b.category FROM user_badges ub JOIN badges b ON ub.badge_id = b.id WHERE ub.user_id = auth.uid();

