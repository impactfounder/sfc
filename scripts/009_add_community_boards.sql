-- 커뮤니티 게시판 추가 스크립트

-- posts 테이블의 category 체크 제약 제거
ALTER TABLE posts DROP CONSTRAINT IF EXISTS posts_category_check;

-- 자유게시판이 없으면 추가
INSERT INTO board_categories (
  id,
  slug,
  name,
  description,
  order_index,
  is_active,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'free-board',
  '자유게시판',
  '자유롭게 소통하는 게시판',
  2,
  true,
  now(),
  now()
) ON CONFLICT (slug) DO UPDATE SET
  is_active = true,
  updated_at = now();

-- 반골 게시판 추가
INSERT INTO board_categories (
  id,
  slug,
  name,
  description,
  order_index,
  is_active,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'bangol',
  '반골',
  '반골 모임 게시판',
  3,
  true,
  now(),
  now()
) ON CONFLICT (slug) DO UPDATE SET
  is_active = true,
  updated_at = now();

-- 하이토크 게시판 추가
INSERT INTO board_categories (
  id,
  slug,
  name,
  description,
  order_index,
  is_active,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'hightalk',
  '하이토크',
  '하이토크 모임 게시판',
  4,
  true,
  now(),
  now()
) ON CONFLICT (slug) DO UPDATE SET
  is_active = true,
  updated_at = now();

-- 테스트 게시물 추가 (첫 번째 사용자 ID 사용)
DO $$
DECLARE
  first_user_id uuid;
  bangol_exists boolean;
  hightalk_exists boolean;
BEGIN
  -- 첫 번째 사용자 ID 가져오기
  SELECT id INTO first_user_id FROM profiles LIMIT 1;
  
  IF first_user_id IS NOT NULL THEN
    -- 반골 게시판에 테스트 게시물이 있는지 확인
    SELECT EXISTS(
      SELECT 1 FROM posts WHERE category = 'bangol' AND title = 'HELLO WORLD'
    ) INTO bangol_exists;
    
    -- 반골 게시판에 테스트 게시물이 없으면 추가
    IF NOT bangol_exists THEN
      INSERT INTO posts (
        id,
        title,
        content,
        category,
        author_id,
        created_at,
        updated_at,
        likes_count,
        comments_count
      ) VALUES (
        gen_random_uuid(),
        'HELLO WORLD',
        '반골 게시판의 첫 번째 테스트 게시물입니다.',
        'bangol',
        first_user_id,
        now(),
        now(),
        0,
        0
      );
    END IF;
    
    -- 하이토크 게시판에 테스트 게시물이 있는지 확인
    SELECT EXISTS(
      SELECT 1 FROM posts WHERE category = 'hightalk' AND title = 'HELLO WORLD'
    ) INTO hightalk_exists;
    
    -- 하이토크 게시판에 테스트 게시물이 없으면 추가
    IF NOT hightalk_exists THEN
      INSERT INTO posts (
        id,
        title,
        content,
        category,
        author_id,
        created_at,
        updated_at,
        likes_count,
        comments_count
      ) VALUES (
        gen_random_uuid(),
        'HELLO WORLD',
        '하이토크 게시판의 첫 번째 테스트 게시물입니다.',
        'hightalk',
        first_user_id,
        now(),
        now(),
        0,
        0
      );
    END IF;
  END IF;
END $$;
