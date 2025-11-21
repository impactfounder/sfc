-- Posts 테이블과 Board Categories 테이블을 올바르게 연결하는 마이그레이션
-- 기존 데이터를 보존하면서 아키텍처를 개선합니다.

-- Step 1: board_categories에 기존 카테고리 추가
INSERT INTO board_categories (name, slug, description, is_active, order_index)
VALUES
  ('공지사항', 'announcement', '커뮤니티 공지사항', true, 1),
  ('자유게시판', 'free-board', '자유롭게 의견을 나누는 공간', true, 2)
ON CONFLICT (slug) DO UPDATE
SET is_active = true, order_index = EXCLUDED.order_index;

-- Step 2: 커뮤니티 카테고리 추가 (반골, 하이토크)
INSERT INTO board_categories (name, slug, description, is_active, order_index)
VALUES
  ('반골', 'bangol', '반골 모임 게시판', true, 3),
  ('하이토크', 'hightalk', '하이토크 모임 게시판', true, 4)
ON CONFLICT (slug) DO UPDATE
SET is_active = true, order_index = EXCLUDED.order_index;

-- Step 3: posts 테이블에 board_category_id 컬럼 추가
ALTER TABLE posts ADD COLUMN IF NOT EXISTS board_category_id uuid REFERENCES board_categories(id);

-- Step 4: 기존 posts의 category 값을 board_category_id로 마이그레이션
UPDATE posts p
SET board_category_id = bc.id
FROM board_categories bc
WHERE p.category = 'announcement' AND bc.slug = 'announcement';

UPDATE posts p
SET board_category_id = bc.id
FROM board_categories bc
WHERE p.category = 'discussion' AND bc.slug = 'free-board';

-- Step 5: CHECK 제약 제거
ALTER TABLE posts DROP CONSTRAINT IF EXISTS posts_category_check;

-- Step 6: category 컬럼을 nullable로 변경 (향후 제거 예정)
ALTER TABLE posts ALTER COLUMN category DROP NOT NULL;

-- Step 7: board_category_id를 NOT NULL로 설정 (기존 데이터 마이그레이션 후)
-- 모든 posts가 board_category_id를 가지고 있는지 확인
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM posts WHERE board_category_id IS NULL) THEN
    ALTER TABLE posts ALTER COLUMN board_category_id SET NOT NULL;
  END IF;
END $$;

-- Step 8: 인덱스 추가 (성능 최적화)
CREATE INDEX IF NOT EXISTS idx_posts_board_category_id ON posts(board_category_id);

-- Step 9: 테스트 게시물 추가
INSERT INTO posts (title, content, board_category_id, author_id)
SELECT
  'HELLO WORLD',
  '반골 모임 첫 게시글입니다. 환영합니다!',
  bc.id,
  (SELECT id FROM profiles ORDER BY created_at ASC LIMIT 1)
FROM board_categories bc
WHERE bc.slug = 'bangol';

INSERT INTO posts (title, content, board_category_id, author_id)
SELECT
  'HELLO WORLD',
  '하이토크 모임 첫 게시글입니다. 환영합니다!',
  bc.id,
  (SELECT id FROM profiles ORDER BY created_at ASC LIMIT 1)
FROM board_categories bc
WHERE bc.slug = 'hightalk';

-- Step 10: 기존 자유게시판 샘플 게시물 추가 (없는 경우)
INSERT INTO posts (title, content, board_category_id, author_id)
SELECT
  '자유게시판에 오신 것을 환영합니다',
  '자유롭게 의견을 나누고 소통하는 공간입니다. 창업, 기술, 투자 등 다양한 주제로 이야기를 나눠보세요!',
  bc.id,
  (SELECT id FROM profiles ORDER BY created_at ASC LIMIT 1)
FROM board_categories bc
WHERE bc.slug = 'free-board'
AND NOT EXISTS (
  SELECT 1 FROM posts p2
  WHERE p2.board_category_id = bc.id
);

-- 마이그레이션 완료 확인 쿼리
SELECT
  bc.name as category_name,
  bc.slug,
  COUNT(p.id) as post_count
FROM board_categories bc
LEFT JOIN posts p ON p.board_category_id = bc.id
WHERE bc.is_active = true
GROUP BY bc.id, bc.name, bc.slug, bc.order_index
ORDER BY bc.order_index;
