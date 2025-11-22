# 배포 환경 디버깅 가이드

## 현재 상황
- 로컬에서는 데이터가 정상적으로 보임
- 배포 사이트(https://sfc-ten.vercel.app/)에서는 데이터가 안 보임
- 환경 변수는 제대로 설정되어 있음

## 즉시 확인할 것

### 1. 브라우저 개발자 도구 확인 (가장 중요!)

배포 사이트(https://sfc-ten.vercel.app/)에서:
1. **F12** 또는 **우클릭 → 검사** 클릭
2. **Console 탭** 확인
   - 에러 메시지가 있는지 확인
   - 빨간색 에러 메시지 확인
3. **Network 탭** 확인
   - 필터에서 "Fetch/XHR" 선택
   - 페이지 새로고침 (F5)
   - `/rest/v1/events` 요청 찾기
   - `/rest/v1/posts` 요청 찾기
   - 각 요청 클릭 → **Response** 탭 확인
     - 데이터가 있는지?
     - 에러 메시지가 있는지?
   - **Status** 코드 확인
     - 200: 정상
     - 401: 인증 오류
     - 403: 권한 오류
     - 500: 서버 오류

### 2. Vercel 로그 확인

1. **Vercel Dashboard** 접속
2. 프로젝트 선택
3. **Deployments** 탭
4. 가장 최근 배포 클릭
5. **Functions** 탭 또는 **Logs** 탭 확인
6. 에러 메시지 확인

### 3. Supabase 로그 확인

1. **Supabase Dashboard** 접속
2. 프로젝트 선택
3. **Logs** → **API Logs** 이동
4. 최근 요청 확인
5. 에러가 있는지 확인

## 가능한 원인 및 해결

### 원인 1: 다른 Supabase 프로젝트를 사용 중

**확인 방법:**
- 로컬 `.env.local` 파일의 `NEXT_PUBLIC_SUPABASE_URL` 확인
- Vercel 환경 변수의 `NEXT_PUBLIC_SUPABASE_URL` 확인
- 두 값이 **동일한지** 확인

**해결:**
- Vercel 환경 변수를 로컬과 동일하게 수정

### 원인 2: RLS 정책이 배포 환경에서 제대로 적용되지 않음

**확인 방법:**
Supabase SQL Editor에서 실행:
```sql
-- RLS 정책 확인
SELECT 
  tablename,
  policyname,
  cmd,
  qual
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('posts', 'events', 'board_categories', 'profiles')
AND cmd = 'SELECT'
ORDER BY tablename, policyname;
```

**해결:**
- `scripts/017_ensure_public_read_policies.sql` 재실행
- `scripts/022_fix_inner_join_rls.sql` 실행

### 원인 3: 쿼리 에러가 조용히 발생

**확인 방법:**
- 브라우저 Console에서 에러 확인
- Vercel 로그에서 에러 확인
- 코드에 추가한 `console.error` 확인

**해결:**
- `app/page.tsx`에 에러 로깅 추가됨 (이미 완료)
- Vercel Functions 로그에서 확인

### 원인 4: 시간대 문제

배포 환경과 로컬의 시간대가 다를 수 있음

**확인:**
- `event_date >= NOW()` 조건 확인
- 배포 환경에서 `NOW()` 값 확인

## 디버깅 단계

### Step 1: 브라우저에서 직접 확인
배포 사이트에서 F12 → Network 탭 → API 요청 확인

### Step 2: Vercel 로그 확인
Vercel Dashboard → Deployments → 최근 배포 → Logs

### Step 3: Supabase 로그 확인
Supabase Dashboard → Logs → API Logs

### Step 4: SQL 스크립트 재실행
- `scripts/017_ensure_public_read_policies.sql` 재실행
- `scripts/022_fix_inner_join_rls.sql` 실행

### Step 5: 실제 쿼리 테스트
Supabase SQL Editor에서 `scripts/020_test_anonymous_queries.sql` 실행

## 추가 확인

배포 사이트에서 직접 API 호출 테스트:

브라우저 Console에서 실행:
```javascript
// 이벤트 조회 테스트
fetch('https://YOUR_SUPABASE_URL/rest/v1/events?event_date=gte.' + new Date().toISOString() + '&select=*&order=event_date.asc&limit=9', {
  headers: {
    'apikey': 'YOUR_ANON_KEY',
    'Authorization': 'Bearer YOUR_ANON_KEY'
  }
})
.then(r => r.json())
.then(console.log)
.catch(console.error)

// 게시글 조회 테스트
fetch('https://YOUR_SUPABASE_URL/rest/v1/posts?select=*&limit=10', {
  headers: {
    'apikey': 'YOUR_ANON_KEY',
    'Authorization': 'Bearer YOUR_ANON_KEY'
  }
})
.then(r => r.json())
.then(console.log)
.catch(console.error)
```

이것으로 익명 사용자로 API 호출이 되는지 직접 확인할 수 있습니다.

