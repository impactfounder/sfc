-- 공개 읽기 정책 확인 및 수정
-- 로그인 없이도 이벤트와 게시글을 볼 수 있도록 보장

-- 1. Posts 테이블 읽기 정책 확인 및 추가
DROP POLICY IF EXISTS "Posts are viewable by everyone" ON posts;
CREATE POLICY "Posts are viewable by everyone"
ON posts
FOR SELECT
USING (true);

-- 2. Events 테이블 읽기 정책 확인 및 추가
DROP POLICY IF EXISTS "Events are viewable by everyone" ON events;
CREATE POLICY "Events are viewable by everyone"
ON events
FOR SELECT
USING (true);

-- 3. Board Categories 테이블 읽기 정책 확인 및 추가
DROP POLICY IF EXISTS "Anyone can view active categories" ON board_categories;
CREATE POLICY "Anyone can view active categories"
ON board_categories
FOR SELECT
USING (is_active = true);

-- 4. Profiles 테이블 읽기 정책 확인 및 추가
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
CREATE POLICY "Public profiles are viewable by everyone"
ON profiles
FOR SELECT
USING (true);

-- 5. Event Registrations 테이블 읽기 정책 확인 및 추가
DROP POLICY IF EXISTS "Event registrations are viewable by everyone" ON event_registrations;
CREATE POLICY "Event registrations are viewable by everyone"
ON event_registrations
FOR SELECT
USING (true);

-- 6. Comments 테이블 읽기 정책 확인 및 추가
DROP POLICY IF EXISTS "Comments are viewable by everyone" ON comments;
CREATE POLICY "Comments are viewable by everyone"
ON comments
FOR SELECT
USING (true);

-- 정책 확인 쿼리 (실행 후 확인용)
-- SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
-- FROM pg_policies 
-- WHERE schemaname = 'public' 
-- AND tablename IN ('posts', 'events', 'board_categories', 'profiles', 'event_registrations', 'comments')
-- AND cmd = 'SELECT'
-- ORDER BY tablename, policyname;

