-- 1. '인사이트' 카테고리 추가
INSERT INTO board_categories (name, slug, description, order_index, is_active)
VALUES ('인사이트', 'insights', '창업과 성장에 필요한 깊이 있는 칼럼과 팁을 공유합니다.', 1, true)
ON CONFLICT (slug) DO UPDATE SET 
  name = EXCLUDED.name, 
  description = EXCLUDED.description, 
  is_active = true;

-- 2. posts 테이블에 썸네일 URL 컬럼 추가
ALTER TABLE posts ADD COLUMN IF NOT EXISTS thumbnail_url text;

