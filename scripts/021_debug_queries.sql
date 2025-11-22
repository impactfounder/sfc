-- 문제 진단을 위한 디버그 쿼리
-- 각 쿼리를 하나씩 실행하여 문제를 찾으세요

-- ============================================
-- 1단계: 실제 데이터가 있는지 확인
-- ============================================

-- 1-1. 이벤트 총 개수 확인
SELECT COUNT(*) as total_events FROM events;

-- 1-2. 미래 날짜의 이벤트 개수 확인
SELECT COUNT(*) as upcoming_events 
FROM events 
WHERE event_date >= NOW();

-- 1-3. 모든 이벤트 목록 (날짜 포함)
SELECT id, title, event_date, location, created_by
FROM events
ORDER BY event_date DESC
LIMIT 10;

-- 1-4. 게시글 총 개수 확인
SELECT COUNT(*) as total_posts FROM posts;

-- 1-5. board_category_id가 설정된 게시글 개수
SELECT COUNT(*) as posts_with_category 
FROM posts 
WHERE board_category_id IS NOT NULL;

-- 1-6. board_category_id가 NULL인 게시글 개수
SELECT COUNT(*) as posts_without_category 
FROM posts 
WHERE board_category_id IS NULL;

-- ============================================
-- 2단계: 카테고리 연결 확인
-- ============================================

-- 2-1. Board Categories 확인
SELECT id, name, slug, is_active, order_index
FROM board_categories
ORDER BY order_index;

-- 2-2. Posts와 Categories 조인 확인 (전체)
SELECT 
  p.id,
  p.title,
  p.board_category_id,
  bc.id as category_id,
  bc.name as category_name,
  bc.slug as category_slug,
  bc.is_active
FROM posts p
LEFT JOIN board_categories bc ON p.board_category_id = bc.id
LIMIT 10;

-- 2-3. Posts와 Categories 조인 (필터링 조건 적용)
SELECT 
  p.id,
  p.title,
  bc.slug as category_slug,
  bc.is_active
FROM posts p
INNER JOIN board_categories bc ON p.board_category_id = bc.id
WHERE bc.is_active = true
  AND bc.slug IN ('free', 'vangol', 'hightalk', 'free-board', 'bangol', 'announcement')
LIMIT 10;

-- ============================================
-- 3단계: 실제 홈페이지 쿼리와 동일하게 테스트
-- ============================================

-- 3-1. 이벤트 쿼리 테스트 (프로필 조인 포함)
SELECT 
  e.id,
  e.title,
  e.event_date,
  e.location,
  pr.full_name as host_name,
  pr.avatar_url as host_avatar_url
FROM events e
LEFT JOIN profiles pr ON e.created_by = pr.id
WHERE e.event_date >= NOW()
ORDER BY e.event_date ASC
LIMIT 9;

-- 3-2. 게시글 쿼리 테스트 (카테고리와 프로필 조인 포함)
SELECT 
  p.id,
  p.title,
  p.content,
  p.created_at,
  bc.name as category_name,
  bc.slug as category_slug,
  pr.full_name as author_name
FROM posts p
INNER JOIN board_categories bc ON p.board_category_id = bc.id
LEFT JOIN profiles pr ON p.author_id = pr.id
WHERE bc.is_active = true
  AND bc.slug IN ('free', 'vangol', 'hightalk', 'free-board', 'bangol')
  AND bc.slug != 'announcement'
ORDER BY p.created_at DESC
LIMIT 50;

-- ============================================
-- 4단계: RLS 정책 확인
-- ============================================

-- 4-1. SELECT 정책 확인
SELECT 
  tablename,
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('posts', 'events', 'board_categories', 'profiles', 'event_registrations')
AND cmd = 'SELECT'
ORDER BY tablename, policyname;

-- 4-2. RLS 활성화 여부
SELECT 
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('posts', 'events', 'board_categories', 'profiles', 'event_registrations');

-- ============================================
-- 5단계: 익명 사용자 접근 테스트 (중요!)
-- ============================================

-- 이 쿼리들은 Supabase SQL Editor에서 실행하면 
-- 현재 로그인한 사용자의 권한으로 실행됩니다.
-- 익명 사용자로 테스트하려면 앱에서 직접 테스트해야 합니다.

-- 현재 사용자 확인
SELECT auth.uid() as current_user_id, auth.role() as current_role;

