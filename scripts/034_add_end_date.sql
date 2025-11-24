-- events 테이블에 end_date 컬럼 추가
-- 이벤트 종료 날짜 및 시간을 저장하기 위한 컬럼

-- 1. events 테이블에 end_date 컬럼 추가
ALTER TABLE public.events 
ADD COLUMN IF NOT EXISTS end_date TIMESTAMPTZ;

-- 2. 주석 추가
COMMENT ON COLUMN public.events.end_date IS '이벤트 종료 날짜 및 시간 (NULL 허용)';

