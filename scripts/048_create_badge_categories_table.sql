-- 뱃지 카테고리 순서 관리 테이블 생성
-- badges 테이블의 category 값들을 관리하고 순서를 저장

CREATE TABLE IF NOT EXISTS public.badge_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_value TEXT NOT NULL UNIQUE, -- badges.category 값 (예: 'personal_asset', 'investment')
  category_label TEXT NOT NULL, -- 표시용 이름 (예: '개인 자산', '투자 규모')
  sort_order INTEGER DEFAULT 0 NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_badge_categories_sort_order ON public.badge_categories(sort_order);
CREATE INDEX IF NOT EXISTS idx_badge_categories_category_value ON public.badge_categories(category_value);

-- RLS 활성화
ALTER TABLE public.badge_categories ENABLE ROW LEVEL SECURITY;

-- 정책 설정
CREATE POLICY "Badge categories are viewable by everyone" 
  ON public.badge_categories FOR SELECT 
  USING (true);

CREATE POLICY "Authenticated users can manage badge categories" 
  ON public.badge_categories FOR ALL 
  USING (auth.role() = 'authenticated') 
  WITH CHECK (auth.role() = 'authenticated');

-- 초기 데이터 삽입 (기존 카테고리들)
INSERT INTO public.badge_categories (category_value, category_label, sort_order) VALUES
  ('personal_asset', '개인 자산', 0),
  ('corporate_revenue', '기업 매출', 1),
  ('investment', '투자 규모', 2),
  ('valuation', '기업가치', 3),
  ('influence', '인플루언서', 4),
  ('professional', '전문직', 5),
  ('community', '커뮤니티', 6)
ON CONFLICT (category_value) DO UPDATE
SET category_label = EXCLUDED.category_label;

-- 코멘트 추가
COMMENT ON TABLE public.badge_categories IS '뱃지 카테고리 순서 관리 테이블';
COMMENT ON COLUMN public.badge_categories.category_value IS 'badges 테이블의 category 값';
COMMENT ON COLUMN public.badge_categories.category_label IS '표시용 카테고리 이름';
COMMENT ON COLUMN public.badge_categories.sort_order IS '카테고리 표시 순서 (작을수록 먼저 표시)';

