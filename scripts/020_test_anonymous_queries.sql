-- 익명 사용자 권한으로 쿼리 테스트
-- 이 쿼리들을 실행하여 익명 사용자로 접근 가능한지 확인

-- 현재 사용자 확인 (익명 사용자는 NULL)
SELECT auth.uid() as current_user_id;

-- 1. 이벤트 조회 테스트
SELECT 
  id,
  title,
  event_date,
  location
FROM events
WHERE event_date >= NOW()
ORDER BY event_date ASC
LIMIT 5;

-- 2. 게시글과 카테고리 조인 테스트
SELECT 
  p.id,
  p.title,
  bc.name as category_name,
  bc.slug as category_slug
FROM posts p
INNER JOIN board_categories bc ON p.board_category_id = bc.id
WHERE bc.is_active = true
  AND bc.slug IN ('free', 'vangol', 'hightalk', 'free-board', 'bangol')
  AND bc.slug != 'announcement'
ORDER BY p.created_at DESC
LIMIT 5;

-- 3. 프로필 조회 테스트
SELECT 
  id,
  full_name,
  email
FROM profiles
LIMIT 5;

-- 4. 이벤트 등록 집계 테스트
SELECT 
  event_id,
  COUNT(*) as registration_count
FROM event_registrations
GROUP BY event_id
LIMIT 5;

-- 5. 전체 쿼리 테스트 (app/page.tsx와 동일한 구조)
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
LIMIT 10;

