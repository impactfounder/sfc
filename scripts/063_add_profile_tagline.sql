-- 프로필에 '나를 표현하는 한마디' 컬럼 추가
-- 기존 introduction은 긴 자기소개, tagline은 짧은 한마디 용도

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS tagline text;

COMMENT ON COLUMN public.profiles.tagline IS '나를 표현하는 한마디 (짧은 소개 문구)';


