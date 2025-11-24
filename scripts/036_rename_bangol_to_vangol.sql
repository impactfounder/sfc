-- 'bangol' 슬러그를 'vangol'로 일괄 변경하는 마이그레이션
-- 커뮤니티 카테고리 슬러그 통일 작업

-- 1. board_categories 테이블에서 slug 업데이트
UPDATE public.board_categories
SET slug = 'vangol'
WHERE slug = 'bangol';

-- 2. posts 테이블의 category 컬럼 업데이트 (만약 있다면)
-- 주의: category 컬럼이 deprecated되었을 수 있지만, 안전을 위해 업데이트
UPDATE public.posts
SET category = 'vangol'
WHERE category = 'bangol';

-- 3. communities 테이블에서 slug나 name 필드에 'bangol'이 포함된 경우 확인 및 업데이트
-- (communities 테이블에 slug 컬럼이 있다면)
-- UPDATE public.communities
-- SET slug = 'vangol'
-- WHERE slug = 'bangol';

-- 4. 변경 사항 확인 쿼리 (실행 후 확인용)
-- SELECT slug, name, description 
-- FROM public.board_categories 
-- WHERE slug IN ('bangol', 'vangol');

-- 5. 게시글과의 연결 확인 (실행 후 확인용)
-- SELECT COUNT(*) as post_count
-- FROM public.posts p
-- INNER JOIN public.board_categories bc ON p.board_category_id = bc.id
-- WHERE bc.slug = 'vangol';

