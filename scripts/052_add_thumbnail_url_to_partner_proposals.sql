-- partner_proposals 테이블에 thumbnail_url 컬럼 추가
-- 웹사이트 URL에서 자동으로 추출한 썸네일 이미지 URL을 저장

ALTER TABLE public.partner_proposals
ADD COLUMN IF NOT EXISTS thumbnail_url TEXT;

-- 코멘트 추가
COMMENT ON COLUMN public.partner_proposals.thumbnail_url IS '웹사이트 썸네일 이미지 URL (og:image 메타 태그에서 추출)';

