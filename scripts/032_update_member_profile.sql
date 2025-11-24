-- 멤버 프로필 및 커뮤니티 테이블 업데이트
-- 프로필 편집 기능 및 멤버 페이지 개편을 위한 스키마 변경

-- 1. profiles 테이블에 추가 컬럼
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS company text,
ADD COLUMN IF NOT EXISTS position text,
ADD COLUMN IF NOT EXISTS roles text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS is_profile_public boolean DEFAULT false NOT NULL,
ADD COLUMN IF NOT EXISTS introduction text;

-- 2. communities 테이블에 추가 컬럼
ALTER TABLE public.communities 
ADD COLUMN IF NOT EXISTS instagram_url text,
ADD COLUMN IF NOT EXISTS website_url text;

-- 3. 인덱스 추가 (성능 최적화)
CREATE INDEX IF NOT EXISTS idx_profiles_is_profile_public ON public.profiles(is_profile_public) WHERE is_profile_public = true;
CREATE INDEX IF NOT EXISTS idx_profiles_roles ON public.profiles USING GIN(roles);

-- 4. 주석 추가
COMMENT ON COLUMN public.profiles.company IS '소속 회사/조직';
COMMENT ON COLUMN public.profiles.position IS '직책';
COMMENT ON COLUMN public.profiles.roles IS '역할 배열 (사업가, 투자자, 인플루언서 등)';
COMMENT ON COLUMN public.profiles.is_profile_public IS '멤버 페이지 공개 여부';
COMMENT ON COLUMN public.profiles.introduction IS '한줄 자기소개';
COMMENT ON COLUMN public.communities.instagram_url IS '인스타그램 URL';
COMMENT ON COLUMN public.communities.website_url IS '웹사이트 URL (쓰레드 등 외부 링크)';

