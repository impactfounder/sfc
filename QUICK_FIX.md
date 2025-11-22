# 빠른 문제 해결 가이드

## 가장 가능성 높은 원인

### 1. 실제로 데이터가 없는 경우 (90% 가능성) ⭐
현재 "아직 예정된 이벤트가 없어요", "게시글이 없습니다"가 표시되는 것은:
- ✅ UI는 정상 작동 중
- ❌ 데이터베이스에 실제 데이터가 없는 상태

### 2. 확인 방법

**Supabase SQL Editor에서 실행:**
```sql
-- 이벤트 개수 확인
SELECT COUNT(*) as total, 
       COUNT(*) FILTER (WHERE event_date >= NOW()) as upcoming
FROM events;

-- 게시글 개수 확인
SELECT COUNT(*) as total,
       COUNT(*) FILTER (WHERE board_category_id IS NOT NULL) as with_category
FROM posts;
```

만약 둘 다 0이면 → **데이터가 없는 것이 정상**입니다.

## 해결 방법

### 방법 1: 테스트 데이터 만들기 (추천)

1. **로그인** → 배포 사이트에서 로그인
2. **이벤트 만들기** → "+ 새 이벤트" 버튼 클릭
   - 제목: "테스트 이벤트"
   - 날짜: 내일 날짜 선택
   - 장소: "서울"
3. **게시글 만들기** → "글 작성하기" 버튼 클릭
   - 카테고리 선택 (자유게시판 등)
   - 제목과 내용 작성
4. **로그아웃**
5. **페이지 새로고침**

이렇게 하면 로그인 없이도 데이터가 보여야 합니다.

### 방법 2: SQL로 직접 데이터 추가

Supabase SQL Editor에서 실행:
```sql
-- 테스트 이벤트 추가 (created_by는 실제 사용자 ID로 변경)
INSERT INTO events (title, description, event_date, location, created_by)
SELECT 
  '테스트 이벤트',
  '테스트용 이벤트입니다',
  NOW() + INTERVAL '1 day',
  '서울',
  id
FROM profiles
LIMIT 1;

-- 테스트 게시글 추가 (board_category_id 확인 필요)
INSERT INTO posts (title, content, author_id, board_category_id)
SELECT 
  '테스트 게시글',
  '테스트용 게시글입니다',
  id,
  (SELECT id FROM board_categories WHERE slug = 'free' LIMIT 1)
FROM profiles
LIMIT 1;
```

### 방법 3: RLS 정책 재확인

만약 데이터가 있는데도 안 보이면:
```sql
-- scripts/019_fix_anonymous_access.sql 재실행
```

## 체크리스트

- [ ] 데이터베이스에 실제로 데이터가 있는가?
- [ ] RLS 정책이 제대로 설정되었는가?
- [ ] board_category_id가 NULL이 아닌가?
- [ ] event_date가 미래 날짜인가?
- [ ] 브라우저 콘솔에 에러가 없는가?

## 디버깅

브라우저 개발자 도구 (F12):
1. **Console 탭** → 에러 확인
2. **Network 탭** → API 호출 확인
   - `/rest/v1/events` 요청 확인
   - `/rest/v1/posts` 요청 확인
   - 응답 상태 코드와 데이터 확인

## 최종 확인

배포 사이트에서:
1. 브라우저 캐시 클리어 (Ctrl+Shift+R)
2. 로그아웃 상태 확인
3. 페이지 새로고침
4. 네트워크 탭에서 API 응답 확인

