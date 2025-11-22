-- 게시판 관리 권한 정책 (RLS)
-- 수정: 작성자만 가능
-- 삭제: 작성자 또는 마스터 관리자만 가능

-- 기존 RLS 정책 삭제 (있다면)
DROP POLICY IF EXISTS "Users can update their own posts" ON posts;
DROP POLICY IF EXISTS "Users can delete their own posts" ON posts;
DROP POLICY IF EXISTS "Master admins can delete any posts" ON posts;

-- RLS 활성화 (이미 되어 있다면 무시)
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

-- 1. 수정(Update) 정책: 작성자만 가능
CREATE POLICY "Users can update their own posts"
ON posts
FOR UPDATE
USING (auth.uid() = author_id)
WITH CHECK (auth.uid() = author_id);

-- 2. 삭제(Delete) 정책: 작성자 또는 마스터 관리자만 가능
-- 작성자가 자신의 게시글 삭제 가능
CREATE POLICY "Users can delete their own posts"
ON posts
FOR DELETE
USING (auth.uid() = author_id);

-- 마스터 관리자가 모든 게시글 삭제 가능
CREATE POLICY "Master admins can delete any posts"
ON posts
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'master'
  )
);

-- 참고: 읽기(Select) 정책은 기존 정책을 유지합니다
-- 만약 읽기 정책이 없다면 아래와 같이 추가할 수 있습니다:
-- CREATE POLICY "Posts are viewable by everyone"
-- ON posts FOR SELECT
-- USING (true);

