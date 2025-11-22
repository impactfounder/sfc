-- 데이터 존재 여부 및 RLS 정책 확인 스크립트
-- 이 스크립트를 실행하여 문제를 진단하세요

-- 1. 이벤트 데이터 확인
SELECT 
  COUNT(*) as total_events,
  COUNT(*) FILTER (WHERE event_date >= NOW()) as upcoming_events
FROM events;

-- 2. 게시글 데이터 확인
SELECT 
  COUNT(*) as total_posts,
  COUNT(*) FILTER (WHERE board_category_id IS NOT NULL) as posts_with_category
FROM posts;

-- 3. Board Categories 확인
SELECT id, name, slug, is_active 
FROM board_categories 
WHERE slug IN ('free', 'vangol', 'hightalk', 'free-board', 'bangol', 'announcement')
ORDER BY order_index;

-- 4. Posts with Categories 조인 확인
SELECT 
  p.id,
  p.title,
  bc.name as category_name,
  bc.slug as category_slug,
  bc.is_active
FROM posts p
LEFT JOIN board_categories bc ON p.board_category_id = bc.id
LIMIT 10;

-- 5. RLS 정책 확인
SELECT 
  schemaname,
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

-- 6. RLS 활성화 여부 확인
SELECT 
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('posts', 'events', 'board_categories', 'profiles', 'event_registrations', 'comments')
ORDER BY tablename;

-- 7. Profiles 확인 (author_id 연결 확인용)
SELECT COUNT(*) as total_profiles FROM profiles;

-- 8. Event Registrations 확인
SELECT COUNT(*) as total_registrations FROM event_registrations;

