-- 프로필 테이블 컬럼 확인 및 추가 (안전하게)
-- Schema Cache Reload

DO $$ 
BEGIN
  -- linkedin_url
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'linkedin_url') THEN
    ALTER TABLE public.profiles ADD COLUMN linkedin_url TEXT;
  END IF;

  -- instagram_url
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'instagram_url') THEN
    ALTER TABLE public.profiles ADD COLUMN instagram_url TEXT;
  END IF;

  -- threads_url
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'threads_url') THEN
    ALTER TABLE public.profiles ADD COLUMN threads_url TEXT;
  END IF;

  -- website_url
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'website_url') THEN
    ALTER TABLE public.profiles ADD COLUMN website_url TEXT;
  END IF;
END $$;

-- PostgREST 스키마 캐시 리로드 알림
NOTIFY pgrst, 'reload schema';

