-- ============================================
-- Phase 1: 커뮤니티 스키마 재구축 및 데이터 초기화
-- 목표: 코드가 데이터를 의심하지 않도록 DB를 완벽한 상태로 초기화
-- ============================================

BEGIN;

-- ============================================
-- Step A: posts 테이블 스키마 정리
-- ============================================

-- 1. visibility 컬럼 추가 (없는 경우)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'posts' AND column_name = 'visibility'
    ) THEN
        ALTER TABLE posts 
        ADD COLUMN visibility TEXT DEFAULT 'public' CHECK (visibility IN ('public', 'group'));
    END IF;
END $$;

-- 2. 기존 FK 제약조건 삭제 (있는 경우)
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'posts_board_category_id_fkey'
    ) THEN
        ALTER TABLE posts DROP CONSTRAINT posts_board_category_id_fkey;
    END IF;
END $$;

-- 3. 새로운 FK 제약조건 추가 (CASCADE DELETE)
ALTER TABLE posts 
ADD CONSTRAINT posts_board_category_id_fkey 
FOREIGN KEY (board_category_id) 
REFERENCES board_categories(id) 
ON DELETE SET NULL;

-- ============================================
-- Step B: board_categories 테이블 초기화 및 표준 데이터 삽입
-- ============================================

-- 기존 데이터 삭제
DELETE FROM board_categories;

-- 표준 슬러그 4개 INSERT
INSERT INTO board_categories (id, name, slug, description, is_active, created_at, updated_at)
VALUES
    (gen_random_uuid(), '공지사항', 'announcement', '중요한 공지사항을 확인하세요.', true, NOW(), NOW()),
    (gen_random_uuid(), '자유게시판', 'free-board', '자유롭게 소통하는 공간입니다.', true, NOW(), NOW()),
    (gen_random_uuid(), '반골', 'vangol', '반골 커뮤니티 게시판입니다.', true, NOW(), NOW()),
    (gen_random_uuid(), '하이토크', 'hightalk', '하이토크 커뮤니티 게시판입니다.', true, NOW(), NOW())
ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    is_active = EXCLUDED.is_active,
    updated_at = NOW();

-- ============================================
-- Step C: posts 테이블의 모든 글을 free-board로 강제 이동
-- ============================================

-- free-board 카테고리 ID 가져오기
DO $$
DECLARE
    free_board_id UUID;
BEGIN
    SELECT id INTO free_board_id 
    FROM board_categories 
    WHERE slug = 'free-board' 
    LIMIT 1;
    
    -- 모든 게시글을 free-board로 이동
    UPDATE posts 
    SET board_category_id = free_board_id 
    WHERE board_category_id IS NULL OR board_category_id NOT IN (
        SELECT id FROM board_categories
    );
    
    -- board_category_id가 NULL인 경우에도 free-board로 설정
    UPDATE posts 
    SET board_category_id = free_board_id 
    WHERE board_category_id IS NULL;
END $$;

-- ============================================
-- Step D: 각 카테고리별 테스트 게시글 생성
-- ============================================

DO $$
DECLARE
    announcement_id UUID;
    free_board_id UUID;
    vangol_id UUID;
    hightalk_id UUID;
    test_user_id UUID;
BEGIN
    -- 카테고리 ID 가져오기
    SELECT id INTO announcement_id FROM board_categories WHERE slug = 'announcement' LIMIT 1;
    SELECT id INTO free_board_id FROM board_categories WHERE slug = 'free-board' LIMIT 1;
    SELECT id INTO vangol_id FROM board_categories WHERE slug = 'vangol' LIMIT 1;
    SELECT id INTO hightalk_id FROM board_categories WHERE slug = 'hightalk' LIMIT 1;
    
    -- 테스트 사용자 ID 가져오기 (없으면 첫 번째 사용자)
    SELECT id INTO test_user_id FROM profiles LIMIT 1;
    
    -- 테스트 사용자가 없으면 기본 UUID 사용
    IF test_user_id IS NULL THEN
        test_user_id := '00000000-0000-0000-0000-000000000000'::UUID;
    END IF;
    
    -- 각 카테고리별로 테스트 게시글 1개씩 생성 (없는 경우에만)
    INSERT INTO posts (id, title, content, author_id, board_category_id, visibility, created_at, updated_at)
    SELECT 
        gen_random_uuid(),
        '공지사항 테스트 글',
        '<p>이것은 공지사항 게시판의 테스트 게시글입니다.</p>',
        test_user_id,
        announcement_id,
        'public',
        NOW(),
        NOW()
    WHERE NOT EXISTS (
        SELECT 1 FROM posts WHERE board_category_id = announcement_id
    );
    
    INSERT INTO posts (id, title, content, author_id, board_category_id, visibility, created_at, updated_at)
    SELECT 
        gen_random_uuid(),
        '자유게시판 테스트 글',
        '<p>이것은 자유게시판의 테스트 게시글입니다.</p>',
        test_user_id,
        free_board_id,
        'public',
        NOW(),
        NOW()
    WHERE NOT EXISTS (
        SELECT 1 FROM posts WHERE board_category_id = free_board_id
    );
    
    INSERT INTO posts (id, title, content, author_id, board_category_id, visibility, created_at, updated_at)
    SELECT 
        gen_random_uuid(),
        '반골 테스트 글',
        '<p>이것은 반골 커뮤니티 게시판의 테스트 게시글입니다.</p>',
        test_user_id,
        vangol_id,
        'public',
        NOW(),
        NOW()
    WHERE NOT EXISTS (
        SELECT 1 FROM posts WHERE board_category_id = vangol_id
    );
    
    INSERT INTO posts (id, title, content, author_id, board_category_id, visibility, created_at, updated_at)
    SELECT 
        gen_random_uuid(),
        '하이토크 테스트 글',
        '<p>이것은 하이토크 커뮤니티 게시판의 테스트 게시글입니다.</p>',
        test_user_id,
        hightalk_id,
        'public',
        NOW(),
        NOW()
    WHERE NOT EXISTS (
        SELECT 1 FROM posts WHERE board_category_id = hightalk_id
    );
END $$;

-- ============================================
-- Step E: RLS 정책 초기화 (개발 단계 접근성 확보)
-- ============================================

-- 기존 RLS 정책 삭제
DROP POLICY IF EXISTS "posts_select_public" ON posts;
DROP POLICY IF EXISTS "board_categories_select_public" ON board_categories;
DROP POLICY IF EXISTS "profiles_select_public" ON profiles;

-- posts 테이블: SELECT 권한을 public에게 조건 없이 허용
CREATE POLICY "posts_select_public" ON posts
    FOR SELECT
    TO public
    USING (true);

-- board_categories 테이블: SELECT 권한을 public에게 조건 없이 허용
CREATE POLICY "board_categories_select_public" ON board_categories
    FOR SELECT
    TO public
    USING (true);

-- profiles 테이블: SELECT 권한을 public에게 조건 없이 허용
CREATE POLICY "profiles_select_public" ON profiles
    FOR SELECT
    TO public
    USING (true);

-- ============================================
-- 검증 쿼리
-- ============================================

-- 카테고리 확인
SELECT '카테고리 개수:' as check_type, COUNT(*) as count FROM board_categories;

-- 각 카테고리별 게시글 개수 확인
SELECT 
    bc.name as category_name,
    bc.slug,
    COUNT(p.id) as post_count
FROM board_categories bc
LEFT JOIN posts p ON p.board_category_id = bc.id
GROUP BY bc.id, bc.name, bc.slug
ORDER BY bc.slug;

COMMIT;

-- ============================================
-- 완료 메시지
-- ============================================
DO $$
BEGIN
    RAISE NOTICE '✅ 커뮤니티 스키마 재구축 완료!';
    RAISE NOTICE '📋 다음 단계: Phase 2 - 쿼리 로직 안정화';
END $$;

