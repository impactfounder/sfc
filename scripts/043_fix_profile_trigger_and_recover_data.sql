-- ============================================
-- 프로필 자동 생성 트리거 개선 및 데이터 복구
-- ============================================

-- Step 1: 개선된 트리거 함수 생성
-- (role 필드 추가, 더 완전한 메타데이터 처리)

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (
    id, 
    email, 
    full_name, 
    avatar_url, 
    role
  )
  values (
    new.id,
    new.email,
    coalesce(
      new.raw_user_meta_data->>'full_name',
      new.raw_user_meta_data->>'name',
      split_part(new.email, '@', 1)
    ),
    coalesce(
      new.raw_user_meta_data->>'avatar_url',
      new.raw_user_meta_data->>'picture',
      null
    ),
    coalesce(
      new.raw_user_meta_data->>'role',
      'member'
    )
  )
  on conflict (id) do update
  set
    full_name = coalesce(excluded.full_name, profiles.full_name),
    avatar_url = coalesce(excluded.avatar_url, profiles.avatar_url),
    role = coalesce(excluded.role, profiles.role),
    email = coalesce(excluded.email, profiles.email);
  
  return new;
end;
$$;

-- Step 2: 트리거 재생성 (기존 트리거가 있으면 삭제 후 생성)
drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

-- ============================================
-- Step 3: 기존 NULL 데이터 복구
-- ============================================

-- full_name이 NULL인 프로필을 auth.users의 메타데이터에서 복구
UPDATE public.profiles
SET
  full_name = coalesce(
    (SELECT raw_user_meta_data->>'full_name' FROM auth.users WHERE auth.users.id = profiles.id),
    (SELECT raw_user_meta_data->>'name' FROM auth.users WHERE auth.users.id = profiles.id),
    split_part((SELECT email FROM auth.users WHERE auth.users.id = profiles.id), '@', 1)
  ),
  avatar_url = coalesce(
    profiles.avatar_url, -- 기존 값이 있으면 유지
    (SELECT raw_user_meta_data->>'avatar_url' FROM auth.users WHERE auth.users.id = profiles.id),
    (SELECT raw_user_meta_data->>'picture' FROM auth.users WHERE auth.users.id = profiles.id)
  ),
  role = coalesce(
    profiles.role, -- 기존 값이 있으면 유지
    (SELECT raw_user_meta_data->>'role' FROM auth.users WHERE auth.users.id = profiles.id),
    'member' -- 기본값
  ),
  email = coalesce(
    profiles.email, -- 기존 값이 있으면 유지
    (SELECT email FROM auth.users WHERE auth.users.id = profiles.id)
  )
WHERE 
  profiles.id IN (SELECT id FROM auth.users)
  AND (
    profiles.full_name IS NULL 
    OR profiles.avatar_url IS NULL 
    OR profiles.role IS NULL
    OR profiles.email IS NULL
  );

-- ============================================
-- 확인 쿼리 (실행 후 확인용)
-- ============================================

-- NULL이 남아있는지 확인
-- SELECT 
--   id,
--   email,
--   full_name,
--   avatar_url,
--   role
-- FROM public.profiles
-- WHERE 
--   full_name IS NULL 
--   OR email IS NULL
--   OR role IS NULL;

