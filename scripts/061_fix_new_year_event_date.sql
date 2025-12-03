-- 신년맞이 인왕산 등산 이벤트의 event_date를 1월 1일로 수정
-- 현재 event_date가 2025-12-31T23:00:00.000Z로 되어 있어서 1월 1일로 인식되지 않는 문제 해결

UPDATE events
SET event_date = '2026-01-01T08:00:00.000Z'::timestamptz
WHERE title LIKE '%신년맞이 인왕산 등산%'
  AND event_date::date = '2025-12-31'::date;

-- 확인 쿼리
SELECT 
  id,
  title,
  event_date,
  event_date::date as event_date_only,
  EXTRACT(MONTH FROM event_date) as month,
  EXTRACT(DAY FROM event_date) as day
FROM events
WHERE title LIKE '%신년맞이 인왕산 등산%';

