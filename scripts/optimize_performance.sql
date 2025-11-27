-- 성능 최적화: 데이터베이스 인덱스 추가
-- 자주 조회되는 컬럼들에 인덱스를 추가하여 검색 속도를 획기적으로 향상시킵니다.

-- ============================================
-- 1. posts 테이블 인덱스
-- ============================================

-- created_at 인덱스 (날짜순 정렬 최적화)
CREATE INDEX IF NOT EXISTS idx_posts_created_at 
ON posts(created_at DESC);

-- board_category_id 인덱스 (카테고리별 필터링 최적화)
CREATE INDEX IF NOT EXISTS idx_posts_board_category_id 
ON posts(board_category_id)
WHERE board_category_id IS NOT NULL;

-- author_id 인덱스 (작성자별 조회 최적화)
CREATE INDEX IF NOT EXISTS idx_posts_author_id 
ON posts(author_id);

-- visibility 인덱스 (공개/비공개 필터링 최적화)
CREATE INDEX IF NOT EXISTS idx_posts_visibility 
ON posts(visibility)
WHERE visibility IS NOT NULL;

-- 복합 인덱스: 카테고리 + 날짜 (자주 함께 사용되는 쿼리 최적화)
CREATE INDEX IF NOT EXISTS idx_posts_category_created_at 
ON posts(board_category_id, created_at DESC)
WHERE board_category_id IS NOT NULL;

-- ============================================
-- 2. events 테이블 인덱스
-- ============================================

-- event_date 인덱스 (날짜순 정렬 및 필터링 최적화)
CREATE INDEX IF NOT EXISTS idx_events_event_date 
ON events(event_date);

-- created_by 인덱스 (이벤트 개설자별 조회 최적화)
CREATE INDEX IF NOT EXISTS idx_events_created_by 
ON events(created_by);

-- 복합 인덱스: 날짜 + 상태 (예정된 이벤트 조회 최적화)
CREATE INDEX IF NOT EXISTS idx_events_date_status 
ON events(event_date, status)
WHERE status = 'upcoming';

-- ============================================
-- 3. event_registrations 테이블 인덱스
-- ============================================

-- event_id 인덱스 (이벤트별 등록자 조회 최적화)
CREATE INDEX IF NOT EXISTS idx_event_registrations_event_id 
ON event_registrations(event_id);

-- user_id 인덱스 (사용자별 등록 이벤트 조회 최적화)
CREATE INDEX IF NOT EXISTS idx_event_registrations_user_id 
ON event_registrations(user_id)
WHERE user_id IS NOT NULL;

-- 복합 인덱스: event_id + user_id (중복 체크 최적화)
-- UNIQUE 제약조건이 이미 있지만, 조회 성능 향상을 위해 추가
CREATE INDEX IF NOT EXISTS idx_event_registrations_event_user 
ON event_registrations(event_id, user_id)
WHERE user_id IS NOT NULL;

-- ============================================
-- 4. board_categories 테이블 인덱스
-- ============================================

-- slug 인덱스 (슬러그로 카테고리 조회 최적화)
-- UNIQUE 제약조건이 이미 있지만, 명시적으로 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_board_categories_slug 
ON board_categories(slug);

-- is_active + order_index 복합 인덱스 (활성 카테고리 정렬 최적화)
CREATE INDEX IF NOT EXISTS idx_board_categories_active_order 
ON board_categories(is_active, order_index)
WHERE is_active = true;

-- ============================================
-- 5. 추가 성능 최적화 인덱스
-- ============================================

-- comments 테이블: post_id 인덱스 (게시글별 댓글 조회 최적화)
CREATE INDEX IF NOT EXISTS idx_comments_post_id 
ON comments(post_id);

-- comments 테이블: created_at 인덱스 (최신 댓글 조회 최적화)
CREATE INDEX IF NOT EXISTS idx_comments_created_at 
ON comments(created_at DESC);

-- post_likes 테이블: post_id 인덱스 (게시글별 좋아요 조회 최적화)
CREATE INDEX IF NOT EXISTS idx_post_likes_post_id 
ON post_likes(post_id);

-- post_likes 테이블: user_id 인덱스 (사용자별 좋아요 조회 최적화)
CREATE INDEX IF NOT EXISTS idx_post_likes_user_id 
ON post_likes(user_id);

-- 복합 인덱스: post_id + user_id (좋아요 중복 체크 최적화)
CREATE INDEX IF NOT EXISTS idx_post_likes_post_user 
ON post_likes(post_id, user_id);

-- ============================================
-- 6. user_badges 테이블 인덱스
-- ============================================

-- user_id 인덱스 (사용자별 뱃지 조회 최적화)
CREATE INDEX IF NOT EXISTS idx_user_badges_user_id 
ON user_badges(user_id);

-- is_visible 인덱스 (노출 뱃지 필터링 최적화)
CREATE INDEX IF NOT EXISTS idx_user_badges_is_visible 
ON user_badges(is_visible)
WHERE is_visible = true;

-- 복합 인덱스: user_id + is_visible (사용자별 노출 뱃지 조회 최적화)
CREATE INDEX IF NOT EXISTS idx_user_badges_user_visible 
ON user_badges(user_id, is_visible)
WHERE is_visible = true;

-- ============================================
-- 7. 인덱스 생성 확인 쿼리 (참고용)
-- ============================================

-- 생성된 인덱스 목록 확인
SELECT 
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename IN ('posts', 'events', 'event_registrations', 'board_categories', 'comments', 'post_likes', 'user_badges')
ORDER BY tablename, indexname;



