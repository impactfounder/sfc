-- event-requests 게시판 비활성화
UPDATE public.board_categories
SET is_active = false
WHERE slug = 'event-requests';
