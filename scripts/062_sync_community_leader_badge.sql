-- 모든 커뮤니티 리더(community_members.role = 'owner' 또는 'admin')에게
-- '커뮤니티 리더' 뱃지를 자동으로 부여/회수하는 스크립트
-- - 리더가 되면 뱃지 자동 부여 (approved + visible)
-- - 모든 커뮤니티에서 리더 권한이 사라지면 뱃지 자동 삭제

DO $$
DECLARE
  community_leader_badge_id uuid;
BEGIN
  -- 1) 커뮤니티 리더 뱃지 ID 조회 (없으면 생성)
  SELECT id INTO community_leader_badge_id
  FROM badges
  WHERE name = '커뮤니티 리더'
  LIMIT 1;

  IF community_leader_badge_id IS NULL THEN
    INSERT INTO badges (name, icon, category, description)
    VALUES ('커뮤니티 리더', '🛡️', 'community', 'SFC 커뮤니티 운영진 및 리더')
    RETURNING id INTO community_leader_badge_id;
  END IF;

  -- 2) 현재 리더( owner / admin )인 모든 멤버에게 뱃지 부여
  INSERT INTO user_badges (user_id, badge_id, status, is_visible)
  SELECT DISTINCT cm.user_id, community_leader_badge_id, 'approved', true
  FROM community_members cm
  WHERE cm.role IN ('owner', 'admin')
    AND NOT EXISTS (
      SELECT 1 FROM user_badges ub
      WHERE ub.user_id = cm.user_id
        AND ub.badge_id = community_leader_badge_id
    );

  -- 3) 더 이상 어떤 커뮤니티에서도 리더가 아닌 사용자에게서 뱃지 제거
  DELETE FROM user_badges ub
  USING badges b
  WHERE ub.badge_id = b.id
    AND b.name = '커뮤니티 리더'
    AND NOT EXISTS (
      SELECT 1
      FROM community_members cm
      WHERE cm.user_id = ub.user_id
        AND cm.role IN ('owner', 'admin')
    );
END $$;

-- 4) 트리거 함수: community_members 변경 시 뱃지 동기화
CREATE OR REPLACE FUNCTION sync_community_leader_badge()
RETURNS TRIGGER AS $$
DECLARE
  community_leader_badge_id uuid;
  target_user_id uuid;
  leader_count integer;
BEGIN
  -- 뱃지 ID 조회
  SELECT id INTO community_leader_badge_id
  FROM badges
  WHERE name = '커뮤니티 리더'
  LIMIT 1;

  IF community_leader_badge_id IS NULL THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  -- 대상 user_id 결정 (INSERT/UPDATE 시 NEW, DELETE 시 OLD)
  IF TG_OP = 'DELETE' THEN
    target_user_id := OLD.user_id;
  ELSE
    target_user_id := NEW.user_id;
  END IF;

  -- 4-1) INSERT: 새로 리더가 된 경우 뱃지 부여
  IF TG_OP = 'INSERT' THEN
    IF NEW.role IN ('owner', 'admin') THEN
      INSERT INTO user_badges (user_id, badge_id, status, is_visible)
      VALUES (NEW.user_id, community_leader_badge_id, 'approved', true)
      ON CONFLICT (user_id, badge_id) DO NOTHING;
    END IF;

  -- 4-2) UPDATE: role 변경에 따른 추가/삭제 처리
  ELSIF TG_OP = 'UPDATE' THEN
    -- 일반 멤버 -> 리더 로 변경
    IF NEW.role IN ('owner', 'admin') AND (OLD.role IS NULL OR OLD.role NOT IN ('owner', 'admin')) THEN
      INSERT INTO user_badges (user_id, badge_id, status, is_visible)
      VALUES (NEW.user_id, community_leader_badge_id, 'approved', true)
      ON CONFLICT (user_id, badge_id) DO NOTHING;
    END IF;

    -- 리더 -> 일반 멤버 로 변경된 경우, 다른 커뮤니티에서 여전히 리더인지 확인 후 필요 시 제거
    IF OLD.role IN ('owner', 'admin') AND NEW.role NOT IN ('owner', 'admin') THEN
      SELECT COUNT(*) INTO leader_count
      FROM community_members
      WHERE user_id = NEW.user_id
        AND role IN ('owner', 'admin');

      IF leader_count = 0 THEN
        DELETE FROM user_badges
        WHERE user_id = NEW.user_id
          AND badge_id = community_leader_badge_id;
      END IF;
    END IF;

  -- 4-3) DELETE: 커뮤니티에서 탈퇴/제거된 경우
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.role IN ('owner', 'admin') THEN
      SELECT COUNT(*) INTO leader_count
      FROM community_members
      WHERE user_id = OLD.user_id
        AND role IN ('owner', 'admin');

      IF leader_count = 0 THEN
        DELETE FROM user_badges
        WHERE user_id = OLD.user_id
          AND badge_id = community_leader_badge_id;
      END IF;
    END IF;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- 5) 기존 트리거 제거 및 새 트리거 생성
DROP TRIGGER IF EXISTS trigger_auto_grant_community_leader_badge_insert ON community_members;
DROP TRIGGER IF EXISTS trigger_auto_grant_community_leader_badge_update ON community_members;
DROP TRIGGER IF EXISTS trigger_sync_community_leader_badge ON community_members;

CREATE TRIGGER trigger_sync_community_leader_badge
  AFTER INSERT OR UPDATE OR DELETE ON community_members
  FOR EACH ROW
  EXECUTE FUNCTION sync_community_leader_badge();


