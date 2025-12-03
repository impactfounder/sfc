# SUPABASE_SERVICE_ROLE_KEY 설정 가이드

## 문제
뱃지 카테고리 이름 수정 시 다음과 같은 에러가 발생:
```
SUPABASE_SERVICE_ROLE_KEY is not set. Please add it to your environment variables.
```

## 해결 방법

### 1단계: Supabase에서 Service Role Key 확인

**⚠️ 주의: Service Role Key는 관리자 권한을 가진 키입니다. 절대 공개하거나 클라이언트 코드에 포함하지 마세요!**

1. **Supabase Dashboard 접속**
   - https://supabase.com/dashboard
   - 프로젝트 선택

2. **Settings → API 이동**

3. **Service Role Key 복사**
   - "Project API keys" 섹션에서 찾을 수 있습니다
   - **service_role** 키 (anon 키가 아닙니다!)
   - "Reveal" 버튼을 클릭하여 전체 키 확인
   - 매우 긴 JWT 토큰 형태의 문자열입니다
   - **⚠️ 이 키는 한 번만 표시될 수 있으므로 안전하게 복사하세요**

### 2단계: 로컬 환경 변수 파일에 추가

1. **프로젝트 루트 디렉토리의 `.env.local` 파일 열기**
   - 파일이 없다면 생성하세요

2. **다음 줄 추가 (기존 내용 아래에)**
   ```env
   SUPABASE_SERVICE_ROLE_KEY=여기에_복사한_service_role_키_붙여넣기
   ```

   예시:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... (매우 긴 문자열)
   ```

3. **파일 저장**

### 3단계: 개발 서버 재시작

환경 변수 파일을 수정한 후에는 개발 서버를 재시작해야 합니다:

```bash
# 현재 실행 중인 개발 서버 중지 (Ctrl+C)
# 그 다음 다시 시작
npm run dev
```

### 4단계: 확인

1. 개발 서버가 정상적으로 시작되는지 확인
2. 관리자 페이지에서 뱃지 카테고리 이름 수정을 다시 시도
3. 에러가 발생하지 않으면 성공!

## 주의사항

- ✅ **서버 사이드에서만 사용**: Service Role Key는 서버 사이드(Server Actions, API Routes)에서만 사용됩니다
- ✅ **로컬 개발용**: 로컬 개발 환경에서만 사용하고, Git에 커밋하지 마세요
- ✅ **`.env.local` 파일**: 이 파일은 `.gitignore`에 포함되어 있어 Git에 커밋되지 않습니다
- ❌ **절대 공개하지 마세요**: 이 키는 RLS 정책을 우회하여 모든 데이터에 접근할 수 있습니다
- ❌ **클라이언트 코드에 포함 금지**: `NEXT_PUBLIC_` 접두사가 없으므로 클라이언트에 노출되지 않습니다

## 배포 환경 (Vercel) 설정

로컬에서는 `.env.local` 파일에 추가하면 되지만, 배포 환경에서는 Vercel 환경 변수로 설정해야 합니다:

1. **Vercel Dashboard 접속**
   - https://vercel.com/dashboard
   - 프로젝트 선택

2. **Settings → Environment Variables**

3. **새 환경 변수 추가**
   - Key: `SUPABASE_SERVICE_ROLE_KEY`
   - Value: Supabase에서 복사한 service_role 키
   - Environment: ✅ Production, ✅ Preview, ✅ Development 모두 선택 (또는 필요한 환경만)
   - Save 클릭

4. **재배포**
   - 환경 변수 추가 후 자동으로 재배포되거나
   - 수동으로 Deployments → "..." → "Redeploy" 선택

## 관련 파일

- `lib/supabase/admin.ts` - Service Role Key를 사용하는 관리자 클라이언트
- `lib/actions/badge-categories.ts` - 뱃지 카테고리 관리 액션 (관리자 권한 필요)

