-- 반골과 하이토크 커뮤니티 리더에게 자동으로 커뮤니티 리더 뱃지 발급
-- community_members 테이블의 role이 'owner' 또는 'admin'으로 변경될 때 자동으로 뱃지 발급

-- 1. 커뮤니티 리더 뱃지 ID 찾기 (또는 생성)
DO $$
DECLARE
  community_leader_badge_id uuid;
  vangol_community_id uuid;
  hightalk_community_id uuid;
BEGIN
  -- 커뮤니티 리더 뱃지 ID 찾기
  SELECT id INTO community_leader_badge_id
  FROM badges
  WHERE name = '커뮤니티 리더'
  LIMIT 1;

  -- 뱃지가 없으면 생성
  IF community_leader_badge_id IS NULL THEN
    INSERT INTO badges (name, icon, category, description)
    VALUES ('커뮤니티 리더', '🛡️', 'community', 'SFC 커뮤니티 운영진 및 리더')
    RETURNING id INTO community_leader_badge_id;
  END IF;

  -- 반골 커뮤니티 ID 찾기
  SELECT id INTO vangol_community_id
  FROM communities
  WHERE name = '반골' OR slug = 'vangol'
  LIMIT 1;

  -- 하이토크 커뮤니티 ID 찾기
  SELECT id INTO hightalk_community_id
  FROM communities
  WHERE name = '하이토크' OR slug = 'hightalk'
  LIMIT 1;

  -- 반골과 하이토크의 리더들에게 뱃지 자동 발급
  IF vangol_community_id IS NOT NULL THEN
    INSERT INTO user_badges (user_id, badge_id, status, is_visible)
    SELECT DISTINCT cm.user_id, community_leader_badge_id, 'approved', true
    FROM community_members cm
    WHERE cm.community_id = vangol_community_id
      AND cm.role IN ('owner', 'admin')
      AND NOT EXISTS (
        SELECT 1 FROM user_badges ub
        WHERE ub.user_id = cm.user_id
          AND ub.badge_id = community_leader_badge_id
      )
    ON CONFLICT DO NOTHING;
  END IF;

  IF hightalk_community_id IS NOT NULL THEN
    INSERT INTO user_badges (user_id, badge_id, status, is_visible)
    SELECT DISTINCT cm.user_id, community_leader_badge_id, 'approved', true
    FROM community_members cm
    WHERE cm.community_id = hightalk_community_id
      AND cm.role IN ('owner', 'admin')
      AND NOT EXISTS (
        SELECT 1 FROM user_badges ub
        WHERE ub.user_id = cm.user_id
          AND ub.badge_id = community_leader_badge_id
      )
    ON CONFLICT DO NOTHING;
  END IF;

  RAISE NOTICE '커뮤니티 리더 뱃지 자동 발급 완료';
END $$;

-- 2. community_members 테이블 업데이트 시 자동으로 뱃지 발급하는 트리거 함수 생성
CREATE OR REPLACE FUNCTION auto_grant_community_leader_badge()
RETURNS TRIGGER AS $$
DECLARE
  community_leader_badge_id uuid;
  community_name text;
BEGIN
  -- 커뮤니티 리더 뱃지 ID 찾기
  SELECT id INTO community_leader_badge_id
  FROM badges
  WHERE name = '커뮤니티 리더'
  LIMIT 1;

  -- 뱃지가 없으면 종료
  IF community_leader_badge_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- 커뮤니티 이름 확인 (반골 또는 하이토크만)
  SELECT c.name INTO community_name
  FROM communities c
  WHERE c.id = NEW.community_id;

  -- 반골 또는 하이토크가 아니면 종료
  IF community_name NOT IN ('반골', '하이토크') THEN
    RETURN NEW;
  END IF;

  -- role이 'owner' 또는 'admin'이고, 기존에 뱃지가 없으면 발급
  IF NEW.role IN ('owner', 'admin') THEN
    INSERT INTO user_badges (user_id, badge_id, status, is_visible)
    VALUES (NEW.user_id, community_leader_badge_id, 'approved', true)
    ON CONFLICT DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. 트리거 생성 (INSERT 시)
DROP TRIGGER IF EXISTS trigger_auto_grant_community_leader_badge_insert ON community_members;
CREATE TRIGGER trigger_auto_grant_community_leader_badge_insert
  AFTER INSERT ON community_members
  FOR EACH ROW
  WHEN (NEW.role IN ('owner', 'admin'))
  EXECUTE FUNCTION auto_grant_community_leader_badge();

-- 4. 트리거 생성 (UPDATE 시)
DROP TRIGGER IF EXISTS trigger_auto_grant_community_leader_badge_update ON community_members;
CREATE TRIGGER trigger_auto_grant_community_leader_badge_update
  AFTER UPDATE ON community_members
  FOR EACH ROW
  WHEN (NEW.role IN ('owner', 'admin') AND (OLD.role IS NULL OR OLD.role NOT IN ('owner', 'admin')))
  EXECUTE FUNCTION auto_grant_community_leader_badge();

