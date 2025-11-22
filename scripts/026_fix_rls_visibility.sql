-- RLS 가시성 문제 해결 스크립트
-- 로그인 전에는 데이터가 보이지만, 로그인하면 데이터가 사라지는 문제 해결
-- 모든 테이블에 대해 "누구나 조회 가능" 정책을 명시적으로 설정

-- 1. 이벤트 테이블: 기존 조회 정책 초기화 및 "누구나 조회 가능"으로 통일
DROP POLICY IF EXISTS "Events are viewable by everyone" ON public.events;
DROP POLICY IF EXISTS "Users can view their own events" ON public.events;
DROP POLICY IF EXISTS "Authenticated users can view events" ON public.events;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.events;
DROP POLICY IF EXISTS "Anyone can view active categories" ON public.events; -- 오타로 인한 잘못된 정책 제거

CREATE POLICY "Enable read access for all users"
ON public.events FOR SELECT
USING (true);

-- 2. 게시글 테이블: 기존 조회 정책 초기화 및 "누구나 조회 가능"으로 통일
DROP POLICY IF EXISTS "Posts are viewable by everyone" ON public.posts;
DROP POLICY IF EXISTS "Users can view their own posts" ON public.posts;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.posts;
DROP POLICY IF EXISTS "Allow public read access" ON public.posts;

CREATE POLICY "Enable read access for all users"
ON public.posts FOR SELECT
USING (true);

-- 3. 프로필 테이블: 작성자 정보를 띄우기 위해 "누구나 조회 가능"으로 통일
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.profiles;

CREATE POLICY "Enable read access for all users"
ON public.profiles FOR SELECT
USING (true);

-- 4. 이벤트 등록 테이블: 참가자 수 조회를 위해 "누구나 조회 가능"으로 통일
DROP POLICY IF EXISTS "Event registrations are viewable by everyone" ON public.event_registrations;
DROP POLICY IF EXISTS "Anyone can view registrations" ON public.event_registrations;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.event_registrations;

CREATE POLICY "Enable read access for all users"
ON public.event_registrations FOR SELECT
USING (true);

-- 5. 게시판 카테고리 테이블: 필터링을 위해 "누구나 조회 가능"으로 통일
DROP POLICY IF EXISTS "Anyone can view active categories" ON public.board_categories;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.board_categories;

CREATE POLICY "Enable read access for all users"
ON public.board_categories FOR SELECT
USING (is_active = true);

-- 6. 댓글 테이블: 댓글 조회를 위해 "누구나 조회 가능"으로 통일
DROP POLICY IF EXISTS "Comments are viewable by everyone" ON public.comments;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.comments;

CREATE POLICY "Enable read access for all users"
ON public.comments FOR SELECT
USING (true);

-- 정책 적용 확인 쿼리 (주석 해제하여 실행 가능)
-- SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
-- FROM pg_policies
-- WHERE schemaname = 'public'
-- AND tablename IN ('events', 'posts', 'profiles', 'event_registrations', 'board_categories', 'comments')
-- AND cmd = 'SELECT'
-- ORDER BY tablename, policyname;

