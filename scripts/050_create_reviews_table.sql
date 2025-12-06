-- 후기(Reviews) 시스템 테이블 생성
-- 실행일: 2024-12-06
-- 설명: 가벼운 회고 시스템을 위한 reviews 테이블 및 RLS 정책 생성

-- 1. reviews 테이블 생성
CREATE TABLE IF NOT EXISTS public.reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  event_id uuid REFERENCES public.events(id) ON DELETE CASCADE NOT NULL, -- 필수 필드로 변경
  
  -- 후기 데이터
  rating numeric(2,1) NOT NULL CHECK (rating >= 0.5 AND rating <= 5.0 AND (rating * 10) % 5 = 0),
  keywords text[] NOT NULL DEFAULT '{}',
  one_liner text NOT NULL CHECK (char_length(one_liner) >= 20 AND char_length(one_liner) <= 100),
  detail_content text,
  images text[] DEFAULT '{}',
  
  -- 메타 데이터
  is_best boolean DEFAULT false NOT NULL,
  is_public boolean DEFAULT true NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- 2. 인덱스 생성 (성능 최적화)
CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON public.reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_event_id ON public.reviews(event_id);
CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON public.reviews(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reviews_is_public ON public.reviews(is_public);
CREATE INDEX IF NOT EXISTS idx_reviews_is_best ON public.reviews(is_best) WHERE is_best = true;

-- 3. RLS 활성화
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- 4. RLS 정책 생성

-- 공개된 후기는 누구나 조회 가능
CREATE POLICY "공개 후기는 누구나 조회 가능"
  ON public.reviews FOR SELECT
  USING (is_public = true);

-- 본인 후기는 공개 여부와 관계없이 조회 가능
CREATE POLICY "본인 후기는 항상 조회 가능"
  ON public.reviews FOR SELECT
  USING (auth.uid() = user_id);

-- 인증된 사용자는 후기 작성 가능
CREATE POLICY "인증된 사용자는 후기 작성 가능"
  ON public.reviews FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 본인 후기만 수정 가능
CREATE POLICY "본인 후기만 수정 가능"
  ON public.reviews FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 본인 후기만 삭제 가능
CREATE POLICY "본인 후기만 삭제 가능"
  ON public.reviews FOR DELETE
  USING (auth.uid() = user_id);

-- 5. updated_at 자동 업데이트 트리거
CREATE OR REPLACE FUNCTION update_reviews_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER reviews_updated_at
  BEFORE UPDATE ON public.reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_reviews_updated_at();

-- 6. 코멘트 추가
COMMENT ON TABLE public.reviews IS '이벤트 및 활동 후기 테이블';
COMMENT ON COLUMN public.reviews.rating IS '별점 (0.5 ~ 5.0, 반개 단위)';
COMMENT ON COLUMN public.reviews.keywords IS '선택한 키워드 배열';
COMMENT ON COLUMN public.reviews.one_liner IS '핵심 한 줄 평 (20-100자)';
COMMENT ON COLUMN public.reviews.detail_content IS '상세 후기 (선택)';
COMMENT ON COLUMN public.reviews.images IS '이미지 URL 배열 (선택)';
COMMENT ON COLUMN public.reviews.is_best IS '베스트 후기 여부';
COMMENT ON COLUMN public.reviews.is_public IS '공개 여부';
