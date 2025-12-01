-- 커뮤니티 업데이트 정책 수정 및 권한 강화
-- 이 스크립트는 커뮤니티 가이드라인(설명) 수정이 실패하는 문제를 해결합니다.

BEGIN;

-- 1. 기존 업데이트 정책 삭제
DROP POLICY IF EXISTS "Community owners and admins can update" ON public.communities;

-- 2. 더 포괄적이고 확실한 업데이트 정책 생성
-- 소유자(created_by), 커뮤니티 멤버(owner/admin 역할), 또는 전체 시스템 관리자(admin/master)가 수정 가능하도록 설정
CREATE POLICY "Community update policy"
  ON public.communities
  FOR UPDATE
  USING (
    -- 1. 커뮤니티 생성자(소유자)인 경우
    created_by = auth.uid() 
    OR
    -- 2. 커뮤니티 멤버 중 owner 또는 admin 역할을 가진 경우
    EXISTS (
      SELECT 1 FROM public.community_members
      WHERE community_members.community_id = communities.id
      AND community_members.user_id = auth.uid()
      AND community_members.role IN ('owner', 'admin')
    )
    OR
    -- 3. 시스템 관리자인 경우 (profiles 테이블의 role 확인)
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'master')
    )
  );

-- 3. 정책 변경 사항 적용을 위해 스키마 캐시 리로드 알림
NOTIFY pgrst, 'reload schema';

COMMIT;

