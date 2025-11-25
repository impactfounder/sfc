-- 이벤트 타입 카테고리 추가 스크립트

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'events' AND column_name = 'event_type') THEN
    ALTER TABLE public.events ADD COLUMN event_type text DEFAULT 'networking' NOT NULL;
    ALTER TABLE public.events ADD CONSTRAINT events_event_type_check CHECK (event_type IN ('networking', 'class', 'activity'));
  END IF;
END $$;

-- 기존 데이터 마이그레이션 (예시)
UPDATE public.events SET event_type = 'class' WHERE title LIKE '%워크샵%' OR title LIKE '%강의%' OR title LIKE '%해커톤%' OR title LIKE '%클래스%' OR title LIKE '%세미나%';
UPDATE public.events SET event_type = 'activity' WHERE title LIKE '%등산%' OR title LIKE '%러닝%' OR title LIKE '%요가%' OR title LIKE '%스포츠%' OR title LIKE '%액티비티%';
-- 나머지는 networking 유지

