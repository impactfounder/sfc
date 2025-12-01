DO $$ 
BEGIN
  -- linkedin_url
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'linkedin_url') THEN
    ALTER TABLE public.profiles ADD COLUMN linkedin_url text;
  END IF;

  -- instagram_url
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'instagram_url') THEN
    ALTER TABLE public.profiles ADD COLUMN instagram_url text;
  END IF;

  -- threads_url
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'threads_url') THEN
    ALTER TABLE public.profiles ADD COLUMN threads_url text;
  END IF;

  -- website_url
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'website_url') THEN
    ALTER TABLE public.profiles ADD COLUMN website_url text;
  END IF;
END $$;

-- 스키마 캐시 리로드 알림 (중요)
NOTIFY pgrst, 'reload schema';

