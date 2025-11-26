-- 후기 시스템 스키마 확장
-- 실행일: 2024

-- 1. posts 테이블에 이벤트 연결 고리 추가 (외래키)
ALTER TABLE public.posts 
ADD COLUMN IF NOT EXISTS related_event_id uuid REFERENCES public.events(id) ON DELETE SET NULL;

-- index 추가 (조인 성능 향상)
CREATE INDEX IF NOT EXISTS idx_posts_related_event_id ON public.posts(related_event_id);

-- 2. 후기 전용 카테고리 추가
INSERT INTO public.board_categories (name, slug, description, order_index, is_active)
VALUES ('모임 후기', 'reviews', '생생한 모임 현장과 후기를 공유합니다.', 99, true)
ON CONFLICT (slug) DO NOTHING;

