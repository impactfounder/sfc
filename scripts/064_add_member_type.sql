-- 멤버 타입 컬럼 추가 (사업가, 투자자, 크리에이터)
-- profiles 테이블에 member_type 컬럼 추가

ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS member_type text CHECK (member_type IN ('사업가', '투자자', '크리에이터') OR member_type IS NULL);

COMMENT ON COLUMN public.profiles.member_type IS '멤버 타입: 사업가, 투자자, 크리에이터 중 선택';

