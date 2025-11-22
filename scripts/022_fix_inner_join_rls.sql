-- Inner Join과 RLS 정책 문제 해결
-- board_categories!inner 조인 시 익명 사용자가 접근할 수 있도록 보장

-- 문제: board_categories!inner 조인을 사용할 때, 
-- 조인된 테이블(board_categories)에 대한 RLS 정책도 필요함

-- 1. Board Categories RLS 정책 강화
DROP POLICY IF EXISTS "Anyone can view active categories" ON board_categories;
CREATE POLICY "Anyone can view active categories"
ON board_categories
FOR SELECT
USING (is_active = true);

-- 2. Profiles RLS 정책 강화 (이미 있을 수 있지만 재확인)
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
CREATE POLICY "Public profiles are viewable by everyone"
ON profiles
FOR SELECT
USING (true);

-- 3. Posts와 Board Categories 조인을 위한 추가 정책 확인
-- Posts 테이블의 SELECT 정책이 이미 "using (true)"로 설정되어 있는지 확인
-- 만약 없으면 아래 정책 추가
DROP POLICY IF EXISTS "Posts are viewable by everyone" ON posts;
CREATE POLICY "Posts are viewable by everyone"
ON posts
FOR SELECT
USING (true);

-- 4. Events 테이블 SELECT 정책 확인
DROP POLICY IF EXISTS "Events are viewable by everyone" ON events;
CREATE POLICY "Events are viewable by everyone"
ON events
FOR SELECT
USING (true);

-- 5. Event Registrations 집계 함수 접근 정책 확인
DROP POLICY IF EXISTS "Event registrations are viewable by everyone" ON event_registrations;
CREATE POLICY "Event registrations are viewable by everyone"
ON event_registrations
FOR SELECT
USING (true);

-- 중요: Inner Join 시 두 테이블 모두에 SELECT 정책이 필요함
-- Posts와 Board Categories를 inner join할 때:
-- - Posts 테이블: SELECT 정책 필요 ✅
-- - Board Categories 테이블: SELECT 정책 필요 ✅
-- - Profiles 테이블: SELECT 정책 필요 (LEFT JOIN이지만) ✅

-- 정책 확인 쿼리
SELECT 
  tablename,
  policyname,
  cmd,
  qual
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('posts', 'events', 'board_categories', 'profiles', 'event_registrations')
AND cmd = 'SELECT'
ORDER BY tablename, policyname;

