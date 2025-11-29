-- categories 테이블 생성
-- 인사이트와 파트너스 카테고리를 관리하기 위한 테이블

CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('insight', 'partner')),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_categories_type ON public.categories(type);
CREATE INDEX IF NOT EXISTS idx_categories_name ON public.categories(name);

-- Row Level Security 활성화
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- RLS 정책: 모든 사용자가 조회 가능
CREATE POLICY "Categories are viewable by everyone"
  ON public.categories FOR SELECT
  USING (true);

-- RLS 정책: 관리자만 생성/수정/삭제 가능 (auth.uid()가 profiles 테이블에서 role='admin' 또는 master_admin인 경우)
-- 실제 구현에서는 서버 사이드에서 관리자 권한을 체크하므로, 여기서는 인증된 사용자만 허용
CREATE POLICY "Authenticated users can manage categories"
  ON public.categories FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- 초기 데이터 삽입
-- 'insight' 타입
INSERT INTO public.categories (name, type) VALUES
  ('트렌드', 'insight'),
  ('기술', 'insight'),
  ('경영', 'insight')
ON CONFLICT DO NOTHING;

-- 'partner' 타입
INSERT INTO public.categories (name, type) VALUES
  ('법률', 'partner'),
  ('회계', 'partner'),
  ('개발', 'partner')
ON CONFLICT DO NOTHING;

