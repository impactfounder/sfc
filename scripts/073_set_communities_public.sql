-- ============================================
-- 반골, 하이토크 커뮤니티 공개 설정
-- ============================================

-- vangol, hightalk 커뮤니티를 공개로 변경
UPDATE public.communities
SET is_private = false
WHERE slug IN ('vangol', 'hightalk');

-- 확인
SELECT id, name, slug, is_private
FROM public.communities
WHERE slug IN ('vangol', 'hightalk');
