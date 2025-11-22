-- 마스터 관리자 권한 설정
-- jaewook@mvmt.city 계정을 'master' 권한으로 설정

-- profiles 테이블에 role 컬럼이 없으면 추가
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role text DEFAULT 'member' CHECK (role IN ('member', 'admin', 'master'));

-- jaewook@mvmt.city 이메일을 가진 사용자를 master로 설정
UPDATE profiles
SET role = 'master'
WHERE email = 'jaewook@mvmt.city';

-- 결과 확인을 위한 쿼리 (주석 처리)
-- SELECT id, email, full_name, role FROM profiles WHERE email = 'jaewook@mvmt.city';

