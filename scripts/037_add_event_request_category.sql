-- 열어주세요(Event Requests) 카테고리 추가 스크립트

-- event-requests 카테고리 추가
INSERT INTO public.board_categories (name, slug, description, order_index, is_active)
VALUES 
  ('열어주세요', 'event-requests', '여러분의 요청으로 이벤트가 열립니다. 좋아요를 눌러 수요를 보여주세요!', 5, true)
ON CONFLICT (slug) 
DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description, is_active = EXCLUDED.is_active;

