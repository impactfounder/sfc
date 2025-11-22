# 문제 해결 가이드: 로그인 없이 데이터가 보이지 않는 경우

## 가능한 원인들

### 1. 실제로 데이터가 없는 경우 ⭐ (가장 가능성 높음)
- 데이터베이스에 이벤트나 게시글이 실제로 없는 경우
- 해결: 로그인해서 데이터를 하나 만들고 다시 확인

### 2. RLS 정책 문제
- 조인된 테이블(profiles, board_categories)에 대한 RLS 정책이 없을 수 있음
- 해결: `scripts/019_fix_anonymous_access.sql` 실행

### 3. board_category_id가 NULL인 게시글들
- `board_categories!inner` 조인을 사용하면 board_category_id가 NULL인 게시글은 결과에서 제외됨
- 해결: 게시글의 board_category_id가 제대로 설정되었는지 확인

### 4. 이벤트 날짜 필터 문제
- `event_date >= NOW()` 조건 때문에 과거 이벤트는 안 나옴 (이건 정상)

### 5. 조인 쿼리에서 RLS 정책 충돌
- inner join을 사용할 때 조인된 테이블에도 읽기 권한이 필요함

## 단계별 문제 해결

### Step 1: 데이터 존재 확인
Supabase SQL Editor에서 실행:
```sql
-- 이벤트 개수 확인
SELECT COUNT(*) FROM events WHERE event_date >= NOW();

-- 게시글 개수 확인  
SELECT COUNT(*) FROM posts WHERE board_category_id IS NOT NULL;

-- 카테고리 확인
SELECT * FROM board_categories WHERE is_active = true;
```

### Step 2: RLS 정책 확인
`scripts/019_fix_anonymous_access.sql` 실행 (이미 실행했다면 스킵)

### Step 3: 디버그 쿼리 실행
`scripts/021_debug_queries.sql` 실행하여 각 단계별로 문제 확인

### Step 4: 실제 데이터로 테스트
1. 로그인
2. 이벤트 1개 생성
3. 게시글 1개 생성 (카테고리 지정 필수)
4. 로그아웃
5. 페이지 새로고침

## 즉시 확인할 것

1. **브라우저 개발자 도구 확인**
   - Network 탭에서 API 호출 확인
   - Console 탭에서 에러 확인

2. **Supabase 로그 확인**
   - Supabase Dashboard → Logs → API Logs
   - 에러가 있는지 확인

3. **데이터 직접 확인**
   - Supabase Dashboard → Table Editor
   - events 테이블과 posts 테이블에 데이터가 있는지 확인

## 가장 빠른 해결 방법

만약 데이터가 없는 것이 원인이라면:

1. 로그인
2. 이벤트 만들기
3. 게시글 만들기
4. 로그아웃 후 확인

이렇게 해도 안 나오면 `scripts/021_debug_queries.sql`를 실행해서 어디서 문제가 발생하는지 확인하세요.

