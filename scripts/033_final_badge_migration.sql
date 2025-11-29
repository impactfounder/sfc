-- ============================================
-- 뱃지 데이터 최종 마이그레이션 스크립트
-- ============================================
-- 이 스크립트는 About 페이지에 하드코딩되어 있던 뱃지 데이터를
-- Supabase badges 테이블에 삽입/업데이트합니다.
--
-- 실행 방법:
-- 1. Supabase 대시보드 접속
-- 2. SQL Editor 클릭
-- 3. 이 스크립트를 붙여넣기
-- 4. Run 버튼 클릭
-- ============================================

-- 기존 데이터와 중복되지 않도록 ON CONFLICT 처리
-- name 컬럼이 unique인 경우를 가정

-- [1] 개인 자산 (Personal Asset) - 3 tiers
INSERT INTO badges (name, icon, category, description)
VALUES
  ('자산 5억+', '💰', 'personal_asset', '순자산 5억 원 이상 인증'),
  ('자산 10억+', '💎', 'personal_asset', '순자산 10억 원 이상 인증'),
  ('자산 50억+', '💎', 'personal_asset', '순자산 50억 원 이상 인증')
ON CONFLICT (name) DO UPDATE SET
  icon = EXCLUDED.icon,
  category = EXCLUDED.category,
  description = EXCLUDED.description;

-- [2] 기업 매출 (Corporate Revenue) - 3 tiers
INSERT INTO badges (name, icon, category, description)
VALUES
  ('매출 10억+', '📈', 'corporate_revenue', '연 매출 10억 원 이상 인증'),
  ('매출 50억+', '📈', 'corporate_revenue', '연 매출 50억 원 이상 인증'),
  ('매출 100억+', '📈', 'corporate_revenue', '연 매출 100억 원 이상 인증')
ON CONFLICT (name) DO UPDATE SET
  icon = EXCLUDED.icon,
  category = EXCLUDED.category,
  description = EXCLUDED.description;

-- [3] 투자 규모 (Investment Tier) - 6 tiers
INSERT INTO badges (name, icon, category, description)
VALUES
  ('투자 1억+', '💰', 'investment', '누적 투자 집행액 1억 원 이상'),
  ('투자 5억+', '💰', 'investment', '누적 투자 집행액 5억 원 이상'),
  ('투자 10억+', '💰', 'investment', '누적 투자 집행액 10억 원 이상'),
  ('투자 30억+', '💰', 'investment', '누적 투자 집행액 30억 원 이상'),
  ('투자 50억+', '💰', 'investment', '누적 투자 집행액 50억 원 이상'),
  ('투자 100억+', '💰', 'investment', '누적 투자 집행액 100억 원 이상')
ON CONFLICT (name) DO UPDATE SET
  icon = EXCLUDED.icon,
  category = EXCLUDED.category,
  description = EXCLUDED.description;

-- [4] 기업가치 (Valuation Tier) - 6 tiers
INSERT INTO badges (name, icon, category, description)
VALUES
  ('기업가치 30억+', '🏙️', 'valuation', '최근 투자 유치 기준 기업가치 30억 원 이상'),
  ('기업가치 50억+', '🏙️', 'valuation', '최근 투자 유치 기준 기업가치 50억 원 이상'),
  ('기업가치 100억+', '🏙️', 'valuation', '최근 투자 유치 기준 기업가치 100억 원 이상'),
  ('기업가치 300억+', '🏙️', 'valuation', '최근 투자 유치 기준 기업가치 300억 원 이상'),
  ('기업가치 1000억+', '🏙️', 'valuation', '최근 투자 유치 기준 기업가치 1000억 원 이상'),
  ('유니콘+', '🦄', 'valuation', '기업가치 1조 원 이상 (유니콘)')
ON CONFLICT (name) DO UPDATE SET
  icon = EXCLUDED.icon,
  category = EXCLUDED.category,
  description = EXCLUDED.description;

-- [5] 인플루언서 (Influence Tier) - 6 tiers
INSERT INTO badges (name, icon, category, description)
VALUES
  ('팔로워 1만+', '📣', 'influence', 'SNS 팔로워 1만 명 이상'),
  ('팔로워 5만+', '🔥', 'influence', 'SNS 팔로워 5만 명 이상'),
  ('팔로워 10만+', '⭐', 'influence', 'SNS 팔로워 10만 명 이상'),
  ('팔로워 20만+', '👑', 'influence', 'SNS 팔로워 20만 명 이상'),
  ('팔로워 50만+', '🚀', 'influence', 'SNS 팔로워 50만 명 이상'),
  ('팔로워 100만+', '🌌', 'influence', 'SNS 팔로워 100만 명 이상')
ON CONFLICT (name) DO UPDATE SET
  icon = EXCLUDED.icon,
  category = EXCLUDED.category,
  description = EXCLUDED.description;

-- [6] 전문직 (Professional License) - 9 tiers
INSERT INTO badges (name, icon, category, description)
VALUES
  ('변호사', '⚖️', 'professional', '대한민국 변호사 자격 인증'),
  ('공인회계사', '📘', 'professional', '대한민국 공인회계사 자격 인증'),
  ('세무사', '🧾', 'professional', '대한민국 세무사 자격 인증'),
  ('변리사', '💡', 'professional', '대한민국 변리사 자격 인증'),
  ('노무사', '🤝', 'professional', '대한민국 공인노무사 자격 인증'),
  ('의사', '🩺', 'professional', '대한민국 의사 면허 인증'),
  ('한의사', '🌿', 'professional', '대한민국 한의사 면허 인증'),
  ('수의사', '🐾', 'professional', '대한민국 수의사 면허 인증'),
  ('약사', '💊', 'professional', '대한민국 약사 면허 인증')
ON CONFLICT (name) DO UPDATE SET
  icon = EXCLUDED.icon,
  category = EXCLUDED.category,
  description = EXCLUDED.description;

-- [7] 커뮤니티 (Community) - 3 tiers
INSERT INTO badges (name, icon, category, description)
VALUES
  ('선착순 100인', '👑', 'community', 'SFC 초기 가입 멤버 (로열티)'),
  ('커뮤니티 리더', '🛡️', 'community', 'SFC 커뮤니티 운영진 및 리더'),
  ('우수활동 회원', '🌟', 'community', '커뮤니티 내 활동 지수 상위 1% 회원')
ON CONFLICT (name) DO UPDATE SET
  icon = EXCLUDED.icon,
  category = EXCLUDED.category,
  description = EXCLUDED.description;

-- ============================================
-- 마이그레이션 완료 확인 쿼리
-- ============================================
-- 아래 쿼리를 실행하여 데이터가 제대로 들어갔는지 확인하세요:
-- SELECT category, COUNT(*) as count FROM badges GROUP BY category ORDER BY category;


