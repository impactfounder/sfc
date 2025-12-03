-- member_type을 배열 타입으로 변경 (2개까지 선택 가능)
-- 기존 단일 값 컬럼을 배열로 변경

-- 1. 기존 제약 조건 제거 (타입 변경 전에 제거)
ALTER TABLE public.profiles 
DROP CONSTRAINT IF EXISTS profiles_member_type_check;

-- 2. 컬럼 타입을 text[]로 변경 (이미 배열이면 스킵)
DO $$
DECLARE
  col_udt_name text;
BEGIN
  -- 컬럼의 UDT 타입 확인
  SELECT udt_name INTO col_udt_name
  FROM information_schema.columns 
  WHERE table_schema = 'public' 
  AND table_name = 'profiles' 
  AND column_name = 'member_type';
  
  -- 배열 타입이 아니면 변환
  IF col_udt_name IS NOT NULL AND col_udt_name != '_text' THEN
    ALTER TABLE public.profiles 
    ALTER COLUMN member_type TYPE text[] USING 
      CASE 
        WHEN member_type IS NULL THEN NULL::text[]
        WHEN member_type::text LIKE '{%' THEN string_to_array(trim(both '{}' from member_type::text), ',')
        ELSE ARRAY[member_type::text]
      END;
  END IF;
END $$;

-- 3. CHECK 제약 조건 추가 (사업가, 투자자, 크리에이터만 허용, 최대 2개)
ALTER TABLE public.profiles 
DROP CONSTRAINT IF EXISTS profiles_member_type_check;

ALTER TABLE public.profiles 
ADD CONSTRAINT profiles_member_type_check 
CHECK (
  member_type IS NULL 
  OR (
    array_length(member_type, 1) <= 2 
    AND (member_type <@ ARRAY['사업가', '투자자', '크리에이터']::text[])
  )
);

COMMENT ON COLUMN public.profiles.member_type IS '멤버 타입 배열: 사업가, 투자자, 크리에이터 중 최대 2개 선택 가능';

