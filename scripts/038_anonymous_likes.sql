-- 게시글 좋아요 수 직접 증가 함수 (비회원용)
-- 이 함수는 비로그인 사용자가 좋아요를 누를 때 posts.likes_count를 직접 증가시킵니다.

CREATE OR REPLACE FUNCTION increment_post_likes(post_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE posts
  SET likes_count = COALESCE(likes_count, 0) + 1
  WHERE id = post_id;
END;
$$;

-- 함수에 대한 실행 권한 부여 (익명 사용자도 호출 가능)
GRANT EXECUTE ON FUNCTION increment_post_likes(uuid) TO anon;
GRANT EXECUTE ON FUNCTION increment_post_likes(uuid) TO authenticated;


