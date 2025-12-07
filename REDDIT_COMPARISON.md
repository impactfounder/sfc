# Reddit과 비교한 기능 개선 제안서

## 현재 상태 분석

### ✅ 이미 구현된 기능
1. **커뮤니티 시스템** - 서브레딧과 유사한 communities 시스템
2. **기본 댓글 시스템** - 플랫 구조의 댓글
3. **좋아요 시스템** - Upvote만 구현 (Downvote 없음)
4. **알림 시스템** - 기본적인 알림 기능
5. **게시판 분류** - 카테고리별 게시판
6. **사용자 프로필** - 프로필, 뱃지 시스템

---

## 🔴 Reddit에 비해 부족한 핵심 기능

### 1. **투표 시스템 (Upvote/Downvote)** ⭐⭐⭐⭐⭐ (최우선)
**현재 상태:**
- 좋아요만 있음 (upvote만)
- 점수 시스템이 단순함

**Reddit 방식:**
- Upvote/Downvote 모두 가능
- 점수 = Upvote - Downvote
- 사용자별 투표 상태 추적 (upvoted/downvoted/neutral)

**구현 제안:**
```sql
-- post_votes 테이블 생성
CREATE TABLE post_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  vote_type SMALLINT NOT NULL CHECK (vote_type IN (1, -1)), -- 1: upvote, -1: downvote
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(post_id, user_id)
);

-- posts 테이블에 score 컬럼 추가
ALTER TABLE posts ADD COLUMN score INTEGER DEFAULT 0;
```

---

### 2. **중첩 댓글 스레드** ⭐⭐⭐⭐⭐ (최우선)
**현재 상태:**
- 플랫 구조의 댓글만 지원
- 댓글에 답글 불가

**Reddit 방식:**
- 무한 중첩 댓글 스레드
- 각 댓글이 부모 댓글 참조
- 스레드 형태로 표시

**구현 제안:**
```sql
-- comments 테이블에 parent_id 추가
ALTER TABLE comments 
ADD COLUMN parent_id UUID REFERENCES comments(id) ON DELETE CASCADE,
ADD COLUMN depth INTEGER DEFAULT 0,
ADD COLUMN path TEXT; -- materialized path for faster queries

-- 인덱스 추가
CREATE INDEX idx_comments_parent_id ON comments(parent_id);
CREATE INDEX idx_comments_path ON comments(path);
```

---

### 3. **Hot/Top/Rising 정렬 알고리즘** ⭐⭐⭐⭐ (높은 우선순위)
**현재 상태:**
- 최신순 (created_at DESC)만 주로 사용
- 좋아요순 (likes_count DESC) 일부 지원

**Reddit 방식:**
- **Hot**: 시간 가중 점수 알고리즘 (최근 활동에 더 가중치)
- **Top**: 특정 기간 동안의 최고 점수 (Today, Week, Month, All-time)
- **Rising**: 빠르게 상승하는 게시글
- **New**: 최신순
- **Controversial**: 찬반이 극명한 게시글

**구현 제안:**
```sql
-- Hot 알고리즘을 위한 함수
CREATE OR REPLACE FUNCTION calculate_hot_score(
  score INTEGER,
  created_at TIMESTAMPTZ
) RETURNS NUMERIC AS $$
BEGIN
  -- Reddit의 hot 알고리즘 변형
  -- 더 최근에 작성된 게시글이 더 높은 점수
  DECLARE
    time_diff_hours NUMERIC;
    sign INTEGER;
    order_val NUMERIC;
  BEGIN
    time_diff_hours := EXTRACT(EPOCH FROM (NOW() - created_at)) / 3600;
    
    IF score > 0 THEN
      sign := 1;
    ELSIF score < 0 THEN
      sign := -1;
    ELSE
      sign := 0;
    END IF;
    
    order_val := LOG(GREATEST(ABS(score), 1));
    
    RETURN sign * order_val + time_diff_hours / 45000;
  END;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 인덱스 추가 (성능 최적화)
CREATE INDEX idx_posts_hot_score ON posts((calculate_hot_score(score, created_at)) DESC);
```

---

### 4. **검색 기능** ⭐⭐⭐⭐ (높은 우선순위)
**현재 상태:**
- 검색 기능 없음

**Reddit 방식:**
- 게시글 제목/내용 검색
- 서브레딧별 검색
- 작성자 검색
- 고급 필터 (날짜, 점수 범위 등)

**구현 제안:**
- **옵션 1**: PostgreSQL Full-Text Search (간단, 빠른 구현)
- **옵션 2**: Elasticsearch/Meilisearch (고급 검색, 확장 가능)
- **옵션 3**: Supabase Vector Search (AI 기반 유사도 검색 가능)

```sql
-- Full-Text Search를 위한 컬럼 추가
ALTER TABLE posts 
ADD COLUMN search_vector tsvector;

-- 트리거로 자동 업데이트
CREATE OR REPLACE FUNCTION posts_search_trigger() RETURNS trigger AS $$
BEGIN
  NEW.search_vector := 
    setweight(to_tsvector('korean', COALESCE(NEW.title, '')), 'A') ||
    setweight(to_tsvector('korean', COALESCE(NEW.content, '')), 'B');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tsvectorupdate BEFORE INSERT OR UPDATE
ON posts FOR EACH ROW EXECUTE FUNCTION posts_search_trigger();
```

---

### 5. **게시글 저장/북마크** ⭐⭐⭐ (중간 우선순위)
**현재 상태:**
- 저장 기능 없음

**Reddit 방식:**
- 게시글 저장하여 나중에 다시 볼 수 있음
- 저장된 게시글 모음 페이지

**구현 제안:**
```sql
CREATE TABLE saved_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  saved_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, post_id)
);
```

---

### 6. **사용자 팔로우/구독** ⭐⭐⭐ (중간 우선순위)
**현재 상태:**
- 커뮤니티 가입/탈퇴만 있음
- 다른 사용자 팔로우 기능 없음

**Reddit 방식:**
- 특정 사용자의 활동 피드 구독
- 팔로우한 사용자의 게시글만 보기

**구현 제안:**
```sql
CREATE TABLE user_follows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  following_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(follower_id, following_id),
  CHECK (follower_id != following_id)
);
```

---

### 7. **링크 게시글** ⭐⭐⭐ (중간 우선순위)
**현재 상태:**
- 텍스트/이미지 게시글만 지원
- 외부 링크 공유 불가

**Reddit 방식:**
- 링크 게시글 (외부 URL)
- 텍스트 게시글
- 이미지/비디오 게시글

**구현 제안:**
```sql
ALTER TABLE posts
ADD COLUMN post_type TEXT DEFAULT 'text' CHECK (post_type IN ('text', 'link', 'image', 'video')),
ADD COLUMN link_url TEXT,
ADD COLUMN link_preview JSONB; -- Open Graph 메타데이터 저장
```

---

### 8. **게시글 신고 기능** ⭐⭐⭐ (중간 우선순위)
**현재 상태:**
- 신고 기능 없음

**구현 제안:**
```sql
CREATE TABLE reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  post_id UUID REFERENCES posts(id) ON DELETE SET NULL,
  comment_id UUID REFERENCES comments(id) ON DELETE SET NULL,
  reason TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'resolved', 'dismissed')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

### 9. **실시간 업데이트 강화** ⭐⭐ (낮은 우선순위)
**현재 상태:**
- 알림만 실시간 (Supabase Realtime)
- 게시글/댓글 실시간 업데이트 제한적

**개선 제안:**
- Supabase Realtime으로 댓글/투표 실시간 반영
- 새로운 게시글 실시간 표시
- 온라인 사용자 수 표시

---

## 구현 우선순위

### Phase 1: 핵심 기능 (1-2주)
1. ✅ **Upvote/Downvote 시스템** - Reddit의 핵심
2. ✅ **중첩 댓글 스레드** - 대화의 깊이 제공
3. ✅ **Hot/Top 정렬 알고리즘** - 콘텐츠 발견성 향상

### Phase 2: 검색 & UX (1주)
4. ✅ **검색 기능** (PostgreSQL Full-Text Search로 시작)
5. ✅ **게시글 저장** - 사용자 경험 향상

### Phase 3: 소셜 기능 (1주)
6. ✅ **사용자 팔로우**
7. ✅ **링크 게시글**
8. ✅ **게시글 신고** - 커뮤니티 관리

### Phase 4: 고급 기능 (추후)
9. ✅ **실시간 업데이트 강화**
10. ✅ **Controversial 정렬**
11. ✅ **고급 검색 필터**

---

## 성능 최적화 고려사항

### 1. 인덱싱
- `post_votes` 테이블 복합 인덱스: `(post_id, user_id)`
- `comments` 테이블: `(post_id, path)` 인덱스
- Hot score 계산을 위한 함수 인덱스

### 2. 캐싱 전략
- Hot/Top 정렬 결과 Redis 캐싱 (5분 TTL)
- 인기 게시글 목록 캐싱
- 검색 결과 캐싱

### 3. 배치 처리
- Hot score는 주기적으로 재계산 (cron job)
- 점수 집계는 트리거로 실시간 업데이트

---

## UI/UX 개선 제안

### 1. 투표 UI
- Upvote/Downvote 화살표 버튼
- 현재 투표 상태 시각화
- 점수 표시 (Reddit 스타일)

### 2. 댓글 스레드 UI
- 들여쓰기로 스레드 구조 표시
- "더 보기" 버튼으로 긴 스레드 접기/펼치기
- 특정 댓글에 답글 달기 UI

### 3. 정렬 옵션 UI
- 탭 형태: Hot | Top | New | Rising
- Top 하위 옵션: Today | Week | Month | All-time

---

## 데이터베이스 마이그레이션 예시

전체 마이그레이션 스크립트 예시는 `scripts/reddit_features_migration.sql` 파일에 제공하겠습니다.

---

## 참고 자료

- Reddit 알고리즘: https://github.com/reddit-archive/reddit/blob/master/r2/r2/lib/db/_sorts.pyx
- PostgreSQL Full-Text Search: https://www.postgresql.org/docs/current/textsearch.html
- Supabase Realtime: https://supabase.com/docs/guides/realtime

