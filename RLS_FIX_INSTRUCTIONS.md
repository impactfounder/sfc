# RLS 정책 복구 가이드

## 🎯 목적

`getLatestReviews` 함수에서 발생하는 RLS 충돌 문제를 해결하여, 익명 사용자(비로그인 상태)도 후기 데이터를 조회할 수 있도록 합니다.

## 📋 문제 원인

`getLatestReviews` 함수는 다음 테이블들을 JOIN합니다:
- `posts` (게시글)
- `board_categories` (카테고리)
- `events` (관련 이벤트)
- `profiles` (작성자 프로필)

익명 사용자가 이 복잡한 JOIN 쿼리를 실행할 때, **하나라도 SELECT 권한이 없으면 전체 쿼리가 실패**합니다.

## ✅ 해결 방법

### 1단계: Supabase Dashboard 접속

1. [Supabase Dashboard](https://supabase.com/dashboard) 접속
2. 프로젝트 선택
3. 좌측 메뉴에서 **SQL Editor** 클릭

### 2단계: RLS 정책 스크립트 실행

1. **New Query** 버튼 클릭
2. 아래 파일의 내용을 복사하여 붙여넣기:
   - `scripts/026_fix_rls_visibility.sql`
3. **Run** 버튼 클릭 (또는 `Ctrl + Enter`)

### 3단계: 정책 확인

스크립트 실행 후, 자동으로 실행되는 확인 쿼리 결과를 확인하세요:

- 모든 테이블에 `✅ Public Access`가 표시되어야 합니다
- `access_type` 컬럼에서 확인 가능합니다

### 4단계: 익명 사용자 접근 테스트 (선택사항)

1. SQL Editor에서 **"Run as"** 드롭다운 선택
2. **"anon"** 선택 (익명 사용자로 실행)
3. 아래 테스트 쿼리 실행:

```sql
-- getLatestReviews와 동일한 쿼리 구조 테스트
SELECT 
  p.id,
  p.title,
  p.content,
  p.created_at,
  profiles:author_id(id, full_name, avatar_url),
  events:related_event_id(id, title, thumbnail_url),
  board_categories!inner(name, slug)
FROM public.posts p
WHERE board_categories.slug = 'reviews'
LIMIT 10;
```

**예상 결과**: 데이터가 정상적으로 반환되어야 합니다.

## 🔍 문제 해결 확인

### 성공 기준

1. ✅ 스크립트 실행 완료 (에러 없음)
2. ✅ 확인 쿼리에서 모든 테이블이 `✅ Public Access` 표시
3. ✅ 익명 사용자 테스트 쿼리에서 데이터 반환
4. ✅ 애플리케이션에서 `/about` 페이지 정상 로드
5. ✅ 홈 페이지에서 "모임 후기" 섹션 정상 표시

### 여전히 문제가 발생하는 경우

1. **RLS가 비활성화되어 있는지 확인**:
   ```sql
   SELECT tablename, rowsecurity 
   FROM pg_tables 
   WHERE schemaname = 'public' 
   AND tablename IN ('events', 'posts', 'profiles', 'event_registrations', 'board_categories', 'comments');
   ```
   - `rowsecurity = true`여야 합니다

2. **정책이 실제로 적용되었는지 확인**:
   ```sql
   SELECT tablename, policyname, cmd, qual
   FROM pg_policies
   WHERE schemaname = 'public'
   AND tablename IN ('events', 'posts', 'profiles', 'event_registrations', 'board_categories', 'comments')
   AND cmd = 'SELECT';
   ```

3. **익명 사용자로 직접 테스트**:
   - SQL Editor에서 "Run as" → "anon" 선택
   - 각 테이블별로 SELECT 쿼리 실행

## 📝 참고사항

- 이 스크립트는 **공개 데이터만** 조회 가능하도록 설정합니다
- 민감한 정보(비밀번호, 개인정보 등)는 이미 다른 방식으로 보호되어 있습니다
- `board_categories`는 `is_active = true`인 경우만 조회 가능합니다 (비활성 카테고리 숨김)

## 🚨 주의사항

- 스크립트 실행 전에 **백업**을 권장합니다
- 프로덕션 환경에서는 실행 전에 **테스트 환경에서 먼저 검증**하세요
- 스크립트는 **기존 정책을 모두 삭제**하고 새로 생성합니다

