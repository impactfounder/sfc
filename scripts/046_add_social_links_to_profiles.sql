-- 프로필 테이블에 소셜 링크 컬럼 추가
-- LinkedIn, Instagram, Threads, Website 링크를 저장할 수 있도록 함

-- 소셜 링크 컬럼 추가
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS linkedin_url TEXT,
ADD COLUMN IF NOT EXISTS instagram_url TEXT,
ADD COLUMN IF NOT EXISTS threads_url TEXT,
ADD COLUMN IF NOT EXISTS website_url TEXT;

-- 인덱스 추가 (선택사항, 검색 최적화)
CREATE INDEX IF NOT EXISTS idx_profiles_linkedin_url ON public.profiles(linkedin_url) WHERE linkedin_url IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_profiles_instagram_url ON public.profiles(instagram_url) WHERE instagram_url IS NOT NULL;

-- 코멘트 추가 (컬럼 설명)
COMMENT ON COLUMN public.profiles.linkedin_url IS 'LinkedIn 프로필 URL';
COMMENT ON COLUMN public.profiles.instagram_url IS 'Instagram 프로필 URL';
COMMENT ON COLUMN public.profiles.threads_url IS 'Threads 프로필 URL';
COMMENT ON COLUMN public.profiles.website_url IS '개인 웹사이트 URL';

