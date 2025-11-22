# Vercel 환경 변수 설정 확인 및 해결

## 문제 진단

로컬에서는 데이터가 보이는데 배포 사이트에서는 안 보이는 경우:

**원인:** Vercel에 환경 변수가 제대로 설정되지 않았을 가능성이 높습니다.

## 해결 방법

### 1. Vercel 환경 변수 확인

1. **Vercel 대시보드 접속**
   - https://vercel.com/dashboard
   - 프로젝트 선택

2. **Settings → Environment Variables 이동**

3. **필요한 환경 변수 확인:**
   ```
   NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   ```

4. **환경 변수가 있는지 확인:**
   - 있으면 → 값이 올바른지 확인
   - 없으면 → 추가 필요

### 2. 환경 변수 추가/수정

1. **Supabase 대시보드에서 값 확인**
   - https://supabase.com/dashboard
   - 프로젝트 선택
   - Settings → API 이동
   - **Project URL** 복사 → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** 키 복사 → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

2. **Vercel에 환경 변수 추가**
   - Vercel → Settings → Environment Variables
   - Add New 버튼 클릭
   - Key: `NEXT_PUBLIC_SUPABASE_URL`
   - Value: Supabase Project URL 붙여넣기
   - Environment: Production, Preview, Development 모두 선택
   - Save

   - 다시 Add New 버튼 클릭
   - Key: `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - Value: Supabase anon key 붙여넣기
   - Environment: Production, Preview, Development 모두 선택
   - Save

### 3. 재배포

환경 변수를 추가/수정한 후:

1. **자동 재배포 확인**
   - Vercel이 자동으로 재배포를 시작할 수 있음
   - Deployments 탭에서 확인

2. **수동 재배포 (필요시)**
   - Deployments 탭
   - 가장 최근 배포의 "..." 메뉴 클릭
   - "Redeploy" 선택
   - 또는 GitHub에 새로운 커밋 푸시

### 4. 확인

재배포 완료 후:
1. 배포 사이트 접속 (https://sfc-ten.vercel.app/)
2. 페이지 새로고침 (Ctrl+Shift+R로 캐시 클리어)
3. 로그인 없이 데이터가 보이는지 확인

## 환경 변수 확인 체크리스트

- [ ] `NEXT_PUBLIC_SUPABASE_URL`이 Vercel에 설정되어 있는가?
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`가 Vercel에 설정되어 있는가?
- [ ] 환경 변수 값이 로컬의 `.env.local`과 동일한가?
- [ ] Production, Preview, Development 모든 환경에 설정되어 있는가?
- [ ] 재배포가 완료되었는가?

## 로컬 환경 변수 확인 (참고)

로컬에서 환경 변수가 어떻게 설정되어 있는지 확인:

```bash
# .env.local 파일 확인 (Git에 커밋되지 않음)
cat .env.local

# 또는
type .env.local  # Windows
```

이 값들이 Vercel에도 동일하게 설정되어 있어야 합니다.

## 추가 확인 사항

만약 환경 변수가 제대로 설정되어 있는데도 안 보인다면:

1. **브라우저 개발자 도구 확인**
   - F12 → Console 탭
   - Network 탭에서 API 요청 확인
   - 에러 메시지 확인

2. **Vercel 로그 확인**
   - Vercel Dashboard → Deployments
   - 최근 배포 클릭 → Functions 탭
   - 에러 로그 확인

3. **Supabase RLS 정책 재확인**
   - scripts/017_ensure_public_read_policies.sql 재실행

