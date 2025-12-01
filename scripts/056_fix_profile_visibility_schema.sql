-- 프로필 공개 설정 문제를 해결하기 위한 스키마 복구 스크립트
-- is_profile_public 컬럼이 확실히 존재하고, 캐시가 갱신되도록 함

DO $$ 
BEGIN
  -- is_profile_public
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'is_profile_public') THEN
    ALTER TABLE public.profiles ADD COLUMN is_profile_public boolean DEFAULT false NOT NULL;
  END IF;

  -- company
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'company') THEN
    ALTER TABLE public.profiles ADD COLUMN company text;
  END IF;

  -- position
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'position') THEN
    ALTER TABLE public.profiles ADD COLUMN position text;
  END IF;

  -- introduction
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'introduction') THEN
    ALTER TABLE public.profiles ADD COLUMN introduction text;
  END IF;

  -- roles
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'roles') THEN
    ALTER TABLE public.profiles ADD COLUMN roles text[] DEFAULT '{}';
  END IF;
END $$;

-- 인덱스 재생성 (존재하지 않을 경우)
CREATE INDEX IF NOT EXISTS idx_profiles_is_profile_public ON public.profiles(is_profile_public) WHERE is_profile_public = true;

-- PostgREST 스키마 캐시 리로드 알림
NOTIFY pgrst, 'reload schema';

