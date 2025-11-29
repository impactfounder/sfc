-- 테스트용 뱃지 더미 데이터 추가
-- 기존 데이터가 없을 경우를 대비한 테스트 데이터

-- 기존 뱃지가 없는 경우에만 테스트 데이터 추가
DO $$
DECLARE
  badge_count INTEGER;
BEGIN
  -- 현재 뱃지 개수 확인
  SELECT COUNT(*) INTO badge_count FROM badges;
  
  -- 뱃지가 없으면 테스트 데이터 추가
  IF badge_count = 0 THEN
    INSERT INTO badges (name, icon, category, description, is_active) VALUES
    ('자산 10억+', '💎', 'personal_asset', '순자산 10억 원 이상 인증', true),
    ('매출 50억+', '📈', 'corporate_revenue', '연 매출 50억 원 이상 인증', true),
    ('투자 10억+', '💰', 'investment', '누적 투자 집행액 10억 원 이상', true),
    ('기업가치 100억+', '🏙️', 'valuation', '최근 투자 유치 기준 기업가치 100억 원 이상', false),
    ('변호사', '⚖️', 'professional', '대한민국 변호사 자격 인증', true);
    
    RAISE NOTICE '테스트 뱃지 데이터 5개가 추가되었습니다.';
  ELSE
    RAISE NOTICE '기존 뱃지 데이터가 있습니다. (현재 %개)', badge_count;
  END IF;
END $$;

