-- 관리자(admin)도 게시글을 삭제할 수 있도록 RLS 정책 업데이트
-- 기존에는 작성자(author)와 마스터(master)만 삭제 가능했음

-- 기존 삭제 정책 제거
DROP POLICY IF EXISTS "Master admins can delete any posts" ON public.posts;

-- 새로운 삭제 정책 생성 (마스터 및 관리자 허용)
CREATE POLICY "Admins can delete any posts"
ON public.posts
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('master', 'admin')
  )
);

