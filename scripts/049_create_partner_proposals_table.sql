-- 파트너스 제안(신청) 테이블 생성
-- 파트너사가 SFC에 제휴를 제안할 때 사용하는 테이블

CREATE TABLE IF NOT EXISTS public.partner_proposals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_name TEXT NOT NULL, -- 담당자 성함
  contact_email TEXT NOT NULL, -- 연락처 (이메일)
  company_name TEXT NOT NULL, -- 회사명
  service_name TEXT NOT NULL, -- 서비스명
  website_url TEXT, -- 웹사이트 URL
  benefit_proposal TEXT NOT NULL, -- 제안할 혜택 내용
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewing', 'approved', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_partner_proposals_status ON public.partner_proposals(status);
CREATE INDEX IF NOT EXISTS idx_partner_proposals_created_at ON public.partner_proposals(created_at);

-- RLS 활성화
ALTER TABLE public.partner_proposals ENABLE ROW LEVEL SECURITY;

-- 정책 설정
CREATE POLICY "Anyone can create partner proposals" 
  ON public.partner_proposals FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "Admins can view all partner proposals" 
  ON public.partner_proposals FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND (role = 'admin' OR role = 'master')
    )
  );

CREATE POLICY "Admins can update partner proposals" 
  ON public.partner_proposals FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND (role = 'admin' OR role = 'master')
    )
  );

-- updated_at 자동 업데이트 트리거
CREATE OR REPLACE FUNCTION update_partner_proposals_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_partner_proposals_updated_at
  BEFORE UPDATE ON public.partner_proposals
  FOR EACH ROW
  EXECUTE FUNCTION update_partner_proposals_updated_at();

-- 코멘트 추가
COMMENT ON TABLE public.partner_proposals IS '파트너스 제안(신청) 테이블';
COMMENT ON COLUMN public.partner_proposals.status IS '상태: pending(대기), reviewing(검토중), approved(승인), rejected(거절)';

