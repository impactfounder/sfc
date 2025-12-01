DO $$ 
BEGIN
  -- status 컬럼 추가
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_badges' AND column_name = 'status') THEN
    ALTER TABLE public.user_badges ADD COLUMN status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected'));
  END IF;

  -- evidence 컬럼 추가
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_badges' AND column_name = 'evidence') THEN
    ALTER TABLE public.user_badges ADD COLUMN evidence TEXT;
  END IF;

  -- proof_url 컬럼 추가
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_badges' AND column_name = 'proof_url') THEN
    ALTER TABLE public.user_badges ADD COLUMN proof_url TEXT;
  END IF;
END $$;

-- 기존 데이터 처리: status가 없는 경우 'approved'로 설정 (기존 뱃지는 모두 승인된 것으로 간주)
UPDATE public.user_badges 
SET status = 'approved' 
WHERE status IS NULL;

-- 스키마 캐시 리로드 알림
NOTIFY pgrst, 'reload schema';
