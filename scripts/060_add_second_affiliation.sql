DO $$ 
BEGIN
  -- company_2
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'company_2') THEN
    ALTER TABLE public.profiles ADD COLUMN company_2 text;
  END IF;

  -- position_2
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'position_2') THEN
    ALTER TABLE public.profiles ADD COLUMN position_2 text;
  END IF;
END $$;

-- 스키마 캐시 리로드 알림
NOTIFY pgrst, 'reload schema';

