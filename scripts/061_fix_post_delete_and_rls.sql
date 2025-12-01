-- 삭제 정책을 가장 강력하고 단순한 형태로 재설정
-- 기존 삭제 관련 정책 모두 제거
DROP POLICY IF EXISTS "Users can delete their own posts" ON public.posts;
DROP POLICY IF EXISTS "Master admins can delete any posts" ON public.posts;
DROP POLICY IF EXISTS "Admins can delete any posts" ON public.posts;

-- 새로운 통합 삭제 정책
-- 1. 본인 글 삭제 가능
-- 2. admin 또는 master 권한이 있는 경우 모든 글 삭제 가능
CREATE POLICY "Users and admins can delete posts"
ON public.posts
FOR DELETE
USING (
  auth.uid() = author_id OR
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'master')
  )
);

-- 외래키 제약 조건 확인 및 수정 (댓글, 좋아요 등이 있을 때 삭제가 막히지 않도록)
-- 기존 제약 조건 삭제 후 CASCADE 옵션으로 다시 추가
ALTER TABLE public.comments
DROP CONSTRAINT IF EXISTS comments_post_id_fkey,
ADD CONSTRAINT comments_post_id_fkey
  FOREIGN KEY (post_id)
  REFERENCES public.posts(id)
  ON DELETE CASCADE;

ALTER TABLE public.post_likes
DROP CONSTRAINT IF EXISTS post_likes_post_id_fkey,
ADD CONSTRAINT post_likes_post_id_fkey
  FOREIGN KEY (post_id)
  REFERENCES public.posts(id)
  ON DELETE CASCADE;

-- 스키마 캐시 리로드 알림
NOTIFY pgrst, 'reload schema';

