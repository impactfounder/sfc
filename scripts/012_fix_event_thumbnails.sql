-- 이벤트 썸네일 이미지를 실제로 작동하는 URL로 업데이트

UPDATE events
SET thumbnail_url = 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=600&h=400&fit=crop'
WHERE title LIKE '%AI 스타트업 창업자 밋업%';

UPDATE events
SET thumbnail_url = 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=600&h=400&fit=crop'
WHERE title LIKE '%VC 투자 유치 전략%';

UPDATE events
SET thumbnail_url = 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=600&h=400&fit=crop'
WHERE title LIKE '%ChatGPT API%' OR title LIKE '%해커톤%';

UPDATE events
SET thumbnail_url = 'https://images.unsplash.com/photo-1531482615713-2afd69097998?w=600&h=400&fit=crop'
WHERE title LIKE '%제로베이스 창업 부트캠프%';

UPDATE events
SET thumbnail_url = 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=600&h=400&fit=crop'
WHERE title LIKE '%LLM 파인튜닝%';

UPDATE events
SET thumbnail_url = 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600&h=400&fit=crop'
WHERE title LIKE '%성공한 창업자%' OR title LIKE '%저녁 식사%';
