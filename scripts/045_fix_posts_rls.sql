-- 모든 관련 테이블에 대해 익명 사용자 읽기 권한 강제 부여
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.board_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 기존 정책 삭제 (충돌 방지)
DROP POLICY IF EXISTS "Public Read Posts" ON public.posts;
DROP POLICY IF EXISTS "Public Read Categories" ON public.board_categories;
DROP POLICY IF EXISTS "Public Read Profiles" ON public.profiles;

-- 새 정책 생성 (조건 없는 전체 공개)
CREATE POLICY "Public Read Posts" ON public.posts FOR SELECT TO public USING (true);
CREATE POLICY "Public Read Categories" ON public.board_categories FOR SELECT TO public USING (true);
CREATE POLICY "Public Read Profiles" ON public.profiles FOR SELECT TO public USING (true);

