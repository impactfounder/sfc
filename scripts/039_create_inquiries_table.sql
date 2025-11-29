-- inquiries 테이블 생성
-- 고객센터 1:1 문의 및 의견을 저장하는 테이블

CREATE TABLE IF NOT EXISTS public.inquiries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL CHECK (type IN ('service', 'error', 'suggestion', 'other')),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'resolved', 'closed')),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_inquiries_user_id ON public.inquiries(user_id);
CREATE INDEX IF NOT EXISTS idx_inquiries_status ON public.inquiries(status);
CREATE INDEX IF NOT EXISTS idx_inquiries_created_at ON public.inquiries(created_at DESC);

-- Row Level Security 활성화
ALTER TABLE public.inquiries ENABLE ROW LEVEL SECURITY;

-- RLS 정책: 모든 사용자가 자신의 문의를 조회 가능
CREATE POLICY "Users can view their own inquiries"
  ON public.inquiries FOR SELECT
  USING (auth.uid() = user_id OR user_id IS NULL);

-- RLS 정책: 인증된 사용자만 문의 생성 가능 (비로그인 사용자도 가능하도록 user_id가 NULL인 경우 허용)
CREATE POLICY "Anyone can create inquiries"
  ON public.inquiries FOR INSERT
  WITH CHECK (true);

-- RLS 정책: 관리자만 수정/삭제 가능 (추후 구현)
-- CREATE POLICY "Admins can manage inquiries"
--   ON public.inquiries FOR ALL
--   USING (
--     EXISTS (
--       SELECT 1 FROM public.profiles 
--       WHERE profiles.id = auth.uid() 
--       AND profiles.role IN ('admin', 'master')
--     )
--   );

-- updated_at 자동 업데이트 트리거 함수
CREATE OR REPLACE FUNCTION update_inquiries_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 트리거 생성
CREATE TRIGGER update_inquiries_updated_at
  BEFORE UPDATE ON public.inquiries
  FOR EACH ROW
  EXECUTE FUNCTION update_inquiries_updated_at();

