-- 커뮤니티 배너 이미지 URL 컬럼 추가
-- Reddit 스타일 상단 배너를 위한 스키마 변경

-- 1. banner_url 컬럼 추가
ALTER TABLE public.communities
ADD COLUMN IF NOT EXISTS banner_url TEXT;

-- 2. 컬럼 설명 추가
COMMENT ON COLUMN public.communities.banner_url IS 'Unsplash 또는 커스텀 배너 이미지 URL (권장 크기: 1200x300px)';

-- 3. 기존 커뮤니티에 기본 배너 이미지 설정 (선택사항)
-- 각 커뮤니티 테마에 맞는 Unsplash 이미지를 기본값으로 설정할 수 있음
-- UPDATE public.communities SET banner_url = 'https://images.unsplash.com/...' WHERE banner_url IS NULL;
