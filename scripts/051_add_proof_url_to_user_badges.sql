-- user_badges 테이블에 proof_url 컬럼 추가
-- 파일 업로드된 증빙 자료의 URL을 저장

ALTER TABLE public.user_badges
ADD COLUMN IF NOT EXISTS proof_url TEXT;

-- 코멘트 추가
COMMENT ON COLUMN public.user_badges.proof_url IS '증빙 자료 파일 URL (Supabase Storage)';

