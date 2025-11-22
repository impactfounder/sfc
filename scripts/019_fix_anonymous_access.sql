-- 익명 사용자 접근 문제 해결
-- 게시글 조회 시 board_categories와 profiles 조인 문제 해결

-- 1. Posts와 Board Categories 조인 시 익명 사용자도 접근 가능하도록 보장
-- 이미 "Posts are viewable by everyone" 정책이 있지만, 조인된 board_categories 접근 확인

-- 2. Profiles 접근 확인 (이미 설정되어 있지만 재확인)
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
CREATE POLICY "Public profiles are viewable by everyone"
ON profiles
FOR SELECT
USING (true);

-- 3. Event Registrations 집계 함수 접근 확인
-- 집계 함수를 사용할 때도 개별 행에 대한 SELECT 정책이 필요함
DROP POLICY IF EXISTS "Event registrations are viewable by everyone" ON event_registrations;
CREATE POLICY "Event registrations are viewable by everyone"
ON event_registrations
FOR SELECT
USING (true);

-- 4. Posts의 board_category_id가 NULL인 경우도 확인
-- 만약 board_category_id가 NULL이면 inner join에서 제외됨
-- 이를 확인하기 위한 쿼리 (실행 후 확인)
-- SELECT COUNT(*) as posts_without_category FROM posts WHERE board_category_id IS NULL;

-- 5. Board Categories RLS 정책 재확인
DROP POLICY IF EXISTS "Anyone can view active categories" ON board_categories;
CREATE POLICY "Anyone can view active categories"
ON board_categories
FOR SELECT
USING (is_active = true);

-- 6. 모든 정책이 제대로 설정되었는지 확인
-- 이 쿼리를 실행하여 확인
SELECT 
  schemaname,
  tablename,
  policyname,
  cmd,
  CASE 
    WHEN qual LIKE '%true%' OR qual IS NULL THEN 'Public Access'
    ELSE 'Restricted'
  END as access_type
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('posts', 'events', 'board_categories', 'profiles', 'event_registrations', 'comments')
AND cmd = 'SELECT'
ORDER BY tablename, policyname;

