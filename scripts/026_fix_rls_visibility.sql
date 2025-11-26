-- RLS 가시성 문제 해결 스크립트 (강화 버전)
-- 로그인 전/후 모두 데이터가 보이도록 보장
-- getLatestReviews 함수에서 사용하는 모든 테이블에 대해 "누구나 조회 가능" 정책을 명시적으로 설정
-- 익명 사용자(비로그인)도 모든 공개 데이터를 조회할 수 있도록 보장

-- ============================================
-- 1단계: RLS 활성화 확인 및 강제 설정
-- ============================================
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.board_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 2단계: 기존 정책 모두 삭제 (중복 방지)
-- ============================================

-- Events 테이블 정책 삭제
DROP POLICY IF EXISTS "Events are viewable by everyone" ON public.events;
DROP POLICY IF EXISTS "Users can view their own events" ON public.events;
DROP POLICY IF EXISTS "Authenticated users can view events" ON public.events;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.events;
DROP POLICY IF EXISTS "Anyone can view active categories" ON public.events;

-- Posts 테이블 정책 삭제
DROP POLICY IF EXISTS "Posts are viewable by everyone" ON public.posts;
DROP POLICY IF EXISTS "Users can view their own posts" ON public.posts;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.posts;
DROP POLICY IF EXISTS "Allow public read access" ON public.posts;

-- Profiles 테이블 정책 삭제
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.profiles;

-- Event Registrations 테이블 정책 삭제
DROP POLICY IF EXISTS "Event registrations are viewable by everyone" ON public.event_registrations;
DROP POLICY IF EXISTS "Anyone can view registrations" ON public.event_registrations;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.event_registrations;

-- Board Categories 테이블 정책 삭제
DROP POLICY IF EXISTS "Anyone can view active categories" ON public.board_categories;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.board_categories;

-- Comments 테이블 정책 삭제
DROP POLICY IF EXISTS "Comments are viewable by everyone" ON public.comments;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.comments;

-- ============================================
-- 3단계: 새로운 정책 생성 (통일된 이름 사용)
-- ============================================

-- 1. 이벤트 테이블: 누구나 조회 가능 (getLatestReviews에서 events 조인 시 필요)
CREATE POLICY "Enable read access for all users"
ON public.events FOR SELECT
TO public
USING (true);

-- 2. 게시글 테이블: 누구나 조회 가능 (getLatestReviews의 메인 테이블)
CREATE POLICY "Enable read access for all users"
ON public.posts FOR SELECT
TO public
USING (true);

-- 3. 프로필 테이블: 누구나 조회 가능 (작성자 정보 표시용)
CREATE POLICY "Enable read access for all users"
ON public.profiles FOR SELECT
TO public
USING (true);

-- 4. 이벤트 등록 테이블: 누구나 조회 가능 (참가자 수 집계용)
CREATE POLICY "Enable read access for all users"
ON public.event_registrations FOR SELECT
TO public
USING (true);

-- 5. 게시판 카테고리 테이블: 활성화된 카테고리만 누구나 조회 가능 (필터링용)
CREATE POLICY "Enable read access for all users"
ON public.board_categories FOR SELECT
TO public
USING (is_active = true);

-- 6. 댓글 테이블: 누구나 조회 가능
CREATE POLICY "Enable read access for all users"
ON public.comments FOR SELECT
TO public
USING (true);

-- ============================================
-- 4단계: 정책 적용 확인 쿼리
-- ============================================
-- 아래 쿼리를 실행하여 모든 정책이 올바르게 설정되었는지 확인하세요

SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  CASE 
    WHEN qual LIKE '%true%' OR qual IS NULL THEN '✅ Public Access'
    ELSE '⚠️ Restricted'
  END as access_type
FROM pg_policies
WHERE schemaname = 'public'
AND tablename IN ('events', 'posts', 'profiles', 'event_registrations', 'board_categories', 'comments')
AND cmd = 'SELECT'
ORDER BY tablename, policyname;

-- ============================================
-- 5단계: 익명 사용자 접근 테스트 쿼리
-- ============================================
-- 아래 쿼리들을 익명 사용자로 실행하여 접근 가능 여부를 확인하세요
-- (Supabase SQL Editor에서 "Run as" → "anon" 선택 후 실행)

-- 테스트 1: Posts 조회
-- SELECT COUNT(*) FROM public.posts;

-- 테스트 2: Board Categories 조회
-- SELECT COUNT(*) FROM public.board_categories WHERE is_active = true;

-- 테스트 3: Events 조회
-- SELECT COUNT(*) FROM public.events;

-- 테스트 4: Profiles 조회
-- SELECT COUNT(*) FROM public.profiles;

-- 테스트 5: getLatestReviews와 동일한 쿼리 구조 테스트
-- SELECT 
--   p.id,
--   p.title,
--   p.content,
--   p.created_at,
--   profiles:author_id(id, full_name, avatar_url),
--   events:related_event_id(id, title, thumbnail_url),
--   board_categories!inner(name, slug)
-- FROM public.posts p
-- WHERE board_categories.slug = 'reviews'
-- LIMIT 10;

