-- 게시글 이미지 테이블 생성
-- 게시글에 여러 이미지를 첨부할 수 있도록 지원

CREATE TABLE IF NOT EXISTS public.post_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0 NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_post_images_post ON public.post_images(post_id);
CREATE INDEX IF NOT EXISTS idx_post_images_sort ON public.post_images(post_id, sort_order);

-- RLS 활성화
ALTER TABLE public.post_images ENABLE ROW LEVEL SECURITY;

-- 정책 설정
CREATE POLICY "Post images are viewable by everyone" 
  ON public.post_images FOR SELECT 
  USING (true);

CREATE POLICY "Authenticated users can manage their post images" 
  ON public.post_images FOR ALL 
  USING (
    auth.uid() IN (
      SELECT author_id FROM public.posts 
      WHERE id = post_images.post_id
    )
  );

-- 코멘트 추가
COMMENT ON TABLE public.post_images IS '게시글 첨부 이미지 테이블';
COMMENT ON COLUMN public.post_images.sort_order IS '이미지 표시 순서 (작을수록 먼저 표시)';
