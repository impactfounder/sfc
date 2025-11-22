-- 최종 RLS 정책 확인 및 강제 적용
-- 이 스크립트는 모든 공개 읽기 정책을 확실하게 설정합니다

-- 모든 기존 SELECT 정책 삭제 (중복 방지)
DROP POLICY IF EXISTS "Posts are viewable by everyone" ON posts;
DROP POLICY IF EXISTS "Events are viewable by everyone" ON events;
DROP POLICY IF EXISTS "Anyone can view active categories" ON board_categories;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
DROP POLICY IF EXISTS "Event registrations are viewable by everyone" ON event_registrations;
DROP POLICY IF EXISTS "Comments are viewable by everyone" ON comments;

-- 1. Posts - 모든 사람이 읽기 가능
CREATE POLICY "Posts are viewable by everyone"
ON posts
FOR SELECT
TO public
USING (true);

-- 2. Events - 모든 사람이 읽기 가능
CREATE POLICY "Events are viewable by everyone"
ON events
FOR SELECT
TO public
USING (true);

-- 3. Board Categories - 활성화된 카테고리는 모든 사람이 읽기 가능
CREATE POLICY "Anyone can view active categories"
ON board_categories
FOR SELECT
TO public
USING (is_active = true);

-- 4. Profiles - 모든 사람이 읽기 가능
CREATE POLICY "Public profiles are viewable by everyone"
ON profiles
FOR SELECT
TO public
USING (true);

-- 5. Event Registrations - 모든 사람이 읽기 가능 (집계 함수를 위해 필요)
CREATE POLICY "Event registrations are viewable by everyone"
ON event_registrations
FOR SELECT
TO public
USING (true);

-- 6. Comments - 모든 사람이 읽기 가능
CREATE POLICY "Comments are viewable by everyone"
ON comments
FOR SELECT
TO public
USING (true);

-- RLS 활성화 확인 및 강제 설정
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE board_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- 정책 확인
SELECT 
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('posts', 'events', 'board_categories', 'profiles', 'event_registrations', 'comments')
AND cmd = 'SELECT'
ORDER BY tablename, policyname;

