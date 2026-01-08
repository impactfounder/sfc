-- 커뮤니티 삭제 RLS 정책 수정
-- 문제: master 역할이 커뮤니티를 삭제할 수 없음
-- 해결: master 역할도 삭제 가능하도록 정책 수정

-- 1. communities 테이블의 DELETE 정책 수정
-- 기존: 소유자(created_by)만 삭제 가능
-- 수정: 소유자 + master 역할도 삭제 가능
DROP POLICY IF EXISTS "Community owners can delete" ON public.communities;
CREATE POLICY "Community owners and masters can delete"
  ON public.communities
  FOR DELETE
  USING (
    created_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'master'
    )
    OR EXISTS (
      SELECT 1 FROM public.community_members
      WHERE community_members.community_id = communities.id
      AND community_members.user_id = auth.uid()
      AND community_members.role = 'owner'
    )
  );

-- 2. community_members 테이블의 DELETE 정책 수정
-- master 역할도 멤버 삭제 가능하도록 추가
DROP POLICY IF EXISTS "Users can leave or be removed from communities" ON public.community_members;
CREATE POLICY "Users can leave or be removed from communities"
  ON public.community_members
  FOR DELETE
  USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'master'
    )
    OR EXISTS (
      SELECT 1 FROM public.community_members cm
      JOIN public.communities c ON c.id = cm.community_id
      WHERE cm.community_id = community_members.community_id
      AND cm.user_id = auth.uid()
      AND (cm.role IN ('owner', 'admin') OR c.created_by = auth.uid())
    )
  );

-- 3. board_categories 테이블의 DELETE 정책 확인/추가
-- master 및 admin이 삭제 가능하도록
DROP POLICY IF EXISTS "Admins can delete board categories" ON public.board_categories;
CREATE POLICY "Admins can delete board categories"
  ON public.board_categories
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('master', 'admin')
    )
  );

-- 4. posts 테이블의 DELETE 정책에 master 추가 확인
-- (이미 있을 수 있으므로 조건부)
DO $$
BEGIN
  -- posts DELETE 정책이 master를 포함하는지 확인하고 없으면 추가
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'posts'
    AND policyname LIKE '%master%delete%'
  ) THEN
    -- 기존 정책을 유지하면서 master 권한 확인을 위한 로그만 남김
    RAISE NOTICE 'posts 테이블의 DELETE 정책에 master 권한이 필요할 수 있습니다.';
  END IF;
END $$;
