-- 스키마 캐시 갱신을 위한 SQL
-- PostgREST에게 스키마를 다시 로드하도록 알림
NOTIFY pgrst, 'reload schema';

-- 혹시 모를 컬럼 누락 방지를 위해 다시 한 번 컬럼 추가 시도 (IF NOT EXISTS)
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS linkedin_url TEXT,
ADD COLUMN IF NOT EXISTS instagram_url TEXT,
ADD COLUMN IF NOT EXISTS threads_url TEXT,
ADD COLUMN IF NOT EXISTS website_url TEXT;

