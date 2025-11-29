-- posts 테이블에 category_id 컬럼 추가
-- categories 테이블의 id를 참조하는 Foreign Key 추가

-- Step 1: category_id 컬럼 추가 (nullable, 인사이트/파트너스 게시판에만 필요)
ALTER TABLE public.posts 
ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL;

-- Step 2: 인덱스 추가 (성능 최적화)
CREATE INDEX IF NOT EXISTS idx_posts_category_id ON public.posts(category_id) WHERE category_id IS NOT NULL;

-- Step 3: 복합 인덱스 (board_category_id와 category_id 함께 사용하는 쿼리 최적화)
CREATE INDEX IF NOT EXISTS idx_posts_board_category_category ON public.posts(board_category_id, category_id) 
WHERE category_id IS NOT NULL;

-- 코멘트 추가
COMMENT ON COLUMN public.posts.category_id IS '카테고리 ID (insight 또는 partner 타입의 categories 테이블 참조)';

