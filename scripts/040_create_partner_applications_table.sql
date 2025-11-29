-- partner_applications 테이블 생성
-- 파트너스 서비스 신청을 관리하는 테이블

CREATE TABLE IF NOT EXISTS public.partner_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  partner_id UUID, -- partners 테이블이 있을 경우 참조 (nullable)
  partner_name TEXT NOT NULL, -- 신청한 파트너 이름
  company_name TEXT,
  current_usage TEXT, -- 현재 이용 여부
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_partner_applications_user_id ON public.partner_applications(user_id);
CREATE INDEX IF NOT EXISTS idx_partner_applications_status ON public.partner_applications(status);
CREATE INDEX IF NOT EXISTS idx_partner_applications_created_at ON public.partner_applications(created_at DESC);

-- Row Level Security 활성화
ALTER TABLE public.partner_applications ENABLE ROW LEVEL SECURITY;

-- RLS 정책: 사용자는 자신의 신청을 조회 가능
CREATE POLICY "Users can view their own applications"
  ON public.partner_applications FOR SELECT
  USING (auth.uid() = user_id);

-- RLS 정책: 인증된 사용자는 신청 생성 가능
CREATE POLICY "Authenticated users can create applications"
  ON public.partner_applications FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- RLS 정책: 관리자는 모든 신청 조회 및 수정 가능
CREATE POLICY "Admins can manage all applications"
  ON public.partner_applications FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'master')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'master')
    )
  );

-- updated_at 자동 업데이트 트리거 함수
CREATE OR REPLACE FUNCTION update_partner_applications_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 트리거 생성
CREATE TRIGGER update_partner_applications_updated_at
  BEFORE UPDATE ON public.partner_applications
  FOR EACH ROW
  EXECUTE FUNCTION update_partner_applications_updated_at();

