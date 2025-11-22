# SQL 마이그레이션 실행 가이드

이 문서는 Supabase에서 실행해야 하는 SQL 마이그레이션 스크립트에 대한 가이드입니다.

## 실행 순서

### 1. 마스터 관리자 권한 설정 (필수)
**파일:** `scripts/015_set_master_admin.sql`

이 스크립트는 `jaewook@mvmt.city` 계정을 'master' 권한으로 설정합니다.

```sql
-- profiles 테이블에 role 컬럼이 없으면 추가
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role text DEFAULT 'member' CHECK (role IN ('member', 'admin', 'master'));

-- jaewook@mvmt.city 이메일을 가진 사용자를 master로 설정
UPDATE profiles
SET role = 'master'
WHERE email = 'jaewook@mvmt.city';
```

**실행 방법:**
1. Supabase 대시보드 → SQL Editor 이동
2. `015_set_master_admin.sql` 파일의 내용 복사
3. SQL Editor에 붙여넣기
4. 실행 버튼 클릭

**확인:**
```sql
SELECT id, email, full_name, role FROM profiles WHERE email = 'jaewook@mvmt.city';
```
결과에서 `role` 컬럼이 'master'로 표시되어야 합니다.

---

### 2. 게시판 관리 권한 정책 (필수)
**파일:** `scripts/016_posts_rls_policy.sql`

이 스크립트는 게시글 수정/삭제 권한 정책을 설정합니다.
- **수정**: 작성자만 가능
- **삭제**: 작성자 또는 마스터 관리자만 가능

**실행 방법:**
1. SQL Editor에서 새 쿼리 창 열기
2. `016_posts_rls_policy.sql` 파일의 내용 복사
3. 붙여넣기 후 실행

**주의:** 이 스크립트는 기존 정책을 삭제하고 새로 생성합니다.

---

### 3. 공개 읽기 정책 확인 및 수정 (필수)
**파일:** `scripts/017_ensure_public_read_policies.sql`

이 스크립트는 **로그인 없이도** 이벤트와 게시글을 볼 수 있도록 공개 읽기 정책을 설정합니다.

**중요:** 이 스크립트를 실행하지 않으면 로그인 없이 데이터가 보이지 않을 수 있습니다.

**실행 방법:**
1. SQL Editor에서 새 쿼리 창 열기
2. `017_ensure_public_read_policies.sql` 파일의 내용 복사
3. 붙여넣기 후 실행

**적용되는 테이블:**
- `posts` - 게시글
- `events` - 이벤트
- `board_categories` - 게시판 카테고리
- `profiles` - 프로필
- `event_registrations` - 이벤트 등록
- `comments` - 댓글

**정책 확인:**
실행 후 아래 쿼리로 정책이 제대로 설정되었는지 확인할 수 있습니다:

```sql
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('posts', 'events', 'board_categories', 'profiles', 'event_registrations', 'comments')
AND cmd = 'SELECT'
ORDER BY tablename, policyname;
```

---

## 전체 마이그레이션 한번에 실행 (권장)

세 가지 스크립트를 순서대로 실행하려면:

1. `015_set_master_admin.sql` 실행
2. `016_posts_rls_policy.sql` 실행
3. `017_ensure_public_read_policies.sql` 실행

---

## 문제 해결

### 정책이 이미 존재한다는 오류가 발생하는 경우
- 스크립트에 `DROP POLICY IF EXISTS` 문이 포함되어 있으므로 안전하게 실행 가능합니다.
- 그래도 오류가 발생하면 각 정책을 수동으로 삭제 후 재실행하세요.

### 마스터 권한이 적용되지 않는 경우
1. 해당 이메일로 가입한 사용자가 존재하는지 확인:
   ```sql
   SELECT id, email, full_name FROM profiles WHERE email = 'jaewook@mvmt.city';
   ```
2. 사용자가 존재한다면 `role` 컬럼이 있는지 확인:
   ```sql
   SELECT column_name, data_type FROM information_schema.columns 
   WHERE table_name = 'profiles' AND column_name = 'role';
   ```

### 로그인 없이 데이터가 보이지 않는 경우
1. `017_ensure_public_read_policies.sql` 실행 여부 확인
2. RLS가 활성화되어 있는지 확인:
   ```sql
   SELECT tablename, rowsecurity FROM pg_tables 
   WHERE schemaname = 'public' 
   AND tablename IN ('posts', 'events', 'board_categories');
   ```
3. 공개 읽기 정책이 존재하는지 확인 (위의 정책 확인 쿼리 사용)

---

## 확인 체크리스트

- [ ] `015_set_master_admin.sql` 실행 완료
- [ ] `016_posts_rls_policy.sql` 실행 완료
- [ ] `017_ensure_public_read_policies.sql` 실행 완료
- [ ] 마스터 권한 확인 완료
- [ ] 로그인 없이 페이지 접속 테스트 완료
- [ ] 로그인 없이 데이터 조회 테스트 완료

---

## 추가 참고사항

- 모든 스크립트는 `IF EXISTS` 또는 `IF NOT EXISTS` 조건을 사용하여 안전하게 재실행 가능합니다.
- 프로덕션 환경에서는 반드시 백업 후 실행하세요.
- 각 스크립트 실행 후 결과를 확인하고 다음 스크립트를 실행하세요.

