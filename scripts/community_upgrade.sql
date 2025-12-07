-- Phase 1: community + comments upgrade
-- 중첩 댓글과 게시글-이벤트 연결을 강화합니다.

-- 1) comments 테이블: parent_id, depth 추가 및 인덱스
ALTER TABLE public.comments
ADD COLUMN IF NOT EXISTS parent_id uuid REFERENCES public.comments(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS depth integer DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_comments_post_id_parent_id ON public.comments(post_id, parent_id);
CREATE INDEX IF NOT EXISTS idx_comments_path_parent ON public.comments(parent_id);

-- 2) posts 테이블: 이벤트 연계 메타데이터
-- related_event_id가 이미 있다면 유지, 없으면 추가
ALTER TABLE public.posts
ADD COLUMN IF NOT EXISTS related_event_id uuid REFERENCES public.events(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS is_announcement boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS is_event boolean DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_posts_related_event ON public.posts(related_event_id);

