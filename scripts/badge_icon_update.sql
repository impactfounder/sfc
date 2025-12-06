-- ============================================
-- 뱃지 아이콘 디자인 개선
-- ============================================
-- 실행일: 2025-12-06
-- 목적: 뱃지 느낌이 나도록 아이콘 변경
-- 사용자 선택:
--   - 투자규모: 메달 🏅 (최고 티어만 💎)
--   - 기업가치: 로켓 🚀 (유니콘만 🦄)
--   - 인플루언서: 100만+ ⭐, 10만+ 💎

-- [1] 투자 규모 (Investment Tier) - 메달 등급으로 세분화
UPDATE badges SET icon = '🥉' WHERE name = '투자 1억+';        -- 동메달
UPDATE badges SET icon = '🥈' WHERE name = '투자 5억+';        -- 은메달  
UPDATE badges SET icon = '🥈' WHERE name = '투자 10억+';       -- 은메달
UPDATE badges SET icon = '🏅' WHERE name = '투자 30억+';       -- 메달
UPDATE badges SET icon = '🏅' WHERE name = '투자 50억+';       -- 메달
UPDATE badges SET icon = '💎' WHERE name = '투자 100억+';      -- 다이아몬드

-- [1-1] 심사역 뱃지 (투자 카테고리에 존재할 경우 업데이트)
UPDATE badges SET icon = '📋' WHERE name LIKE '%심사역%';      -- 클립보드

-- [2] 기업 매출 (Corporate Revenue / 기업가) - 트로피 계열
UPDATE badges SET icon = '🏆' WHERE name = '매출 10억+';       -- 트로피
UPDATE badges SET icon = '🏆' WHERE name = '매출 50억+';       -- 트로피
UPDATE badges SET icon = '🥇' WHERE name = '매출 100억+';      -- 금메달/금트로피

-- [3] 기업가치 (Valuation Tier) - 로켓 🚀 (유니콘만 🦄)
UPDATE badges SET icon = '🚀' WHERE category = 'valuation' AND name != '유니콘+';

-- [4] 인플루언서 (Influence Tier) - 중복 제거된 새로운 아이콘
UPDATE badges SET icon = '📣' WHERE name = '팔로워 1만+';      -- 확성기 (기존 유지)
UPDATE badges SET icon = '🔥' WHERE name = '팔로워 5만+';      -- 불 (기존 유지)
UPDATE badges SET icon = '💫' WHERE name = '팔로워 10만+';     -- 반짝임 (기존 💎에서 변경)
UPDATE badges SET icon = '✨' WHERE name = '팔로워 20만+';     -- 스파클 (기존 👑에서 변경)
UPDATE badges SET icon = '⭐' WHERE name = '팔로워 50만+';     -- 별 (기존 🚀에서 변경)
UPDATE badges SET icon = '🌟' WHERE name = '팔로워 100만+';    -- 빛나는 별 (기존 🌌에서 변경)

-- ============================================
-- 변경 결과 확인
-- ============================================
SELECT category, name, icon, description 
FROM badges 
WHERE category IN ('investment', 'valuation', 'influence')
ORDER BY 
  CASE category
    WHEN 'investment' THEN 1
    WHEN 'valuation' THEN 2
    WHEN 'influence' THEN 3
  END,
  name;
