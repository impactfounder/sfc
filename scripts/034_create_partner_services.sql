-- 파트너스 마켓플레이스 테이블 생성
-- 멤버들이 자신의 서비스를 홍보하고 거래할 수 있는 기능

-- partner_services 테이블 생성
CREATE TABLE IF NOT EXISTS public.partner_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  content TEXT,
  category TEXT NOT NULL CHECK (category IN ('development', 'design', 'marketing', 'business', 'consulting', 'other')),
  price_range TEXT,
  contact_link TEXT,
  thumbnail_url TEXT,
  is_verified BOOLEAN DEFAULT false NOT NULL,
  provider_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 인덱스 생성 (성능 최적화)
CREATE INDEX IF NOT EXISTS idx_partner_services_category ON public.partner_services(category);
CREATE INDEX IF NOT EXISTS idx_partner_services_is_verified ON public.partner_services(is_verified);
CREATE INDEX IF NOT EXISTS idx_partner_services_provider_id ON public.partner_services(provider_id);
CREATE INDEX IF NOT EXISTS idx_partner_services_created_at ON public.partner_services(created_at DESC);

-- Row Level Security 활성화
ALTER TABLE public.partner_services ENABLE ROW LEVEL SECURITY;

-- RLS 정책: 모든 사용자가 조회 가능
CREATE POLICY "Partner services are viewable by everyone"
  ON public.partner_services FOR SELECT
  USING (true);

-- RLS 정책: 인증된 사용자만 서비스 등록 가능
CREATE POLICY "Authenticated users can create partner services"
  ON public.partner_services FOR INSERT
  WITH CHECK (auth.uid() = provider_id);

-- RLS 정책: 본인만 수정 가능
CREATE POLICY "Users can update their own partner services"
  ON public.partner_services FOR UPDATE
  USING (auth.uid() = provider_id);

-- RLS 정책: 본인만 삭제 가능
CREATE POLICY "Users can delete their own partner services"
  ON public.partner_services FOR DELETE
  USING (auth.uid() = provider_id);

-- updated_at 자동 업데이트 트리거 함수
CREATE OR REPLACE FUNCTION update_partner_services_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 트리거 생성
CREATE TRIGGER update_partner_services_updated_at
  BEFORE UPDATE ON public.partner_services
  FOR EACH ROW
  EXECUTE FUNCTION update_partner_services_updated_at();


