# ⚠️ Invalid API Key 에러 해결 방법

## 문제 증상
디버그 페이지(`/debug`)에서 모든 쿼리가 "Invalid API key" 에러 발생

## 즉시 해결 방법

### 1단계: Supabase에서 올바른 API Key 확인

1. **Supabase Dashboard 접속**
   - https://supabase.com/dashboard
   - 프로젝트 선택

2. **Settings → API 이동**

3. **다음 값 복사 (정확히!)**
   - **Project URL** → 예: `https://yzmapsgsxgjxxtaqhelu.supabase.co`
   - **anon public** 키 → 매우 긴 JWT 토큰 형태

### 2단계: Vercel 환경 변수 확인 및 수정

1. **Vercel Dashboard 접속**
   - https://vercel.com/dashboard
   - 프로젝트 선택

2. **Settings → Environment Variables**

3. **기존 환경 변수 삭제 후 재생성**

   **삭제:**
   - `NEXT_PUBLIC_SUPABASE_URL` 삭제 (있다면)
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` 삭제 (있다면)

   **새로 추가:**
   - "Add New" 버튼 클릭
   - **Key**: `NEXT_PUBLIC_SUPABASE_URL`
   - **Value**: Supabase에서 복사한 Project URL (전체)
   - **Environment**: ✅ Production, ✅ Preview, ✅ Development 모두 선택
   - "Save" 클릭
   
   - 다시 "Add New" 버튼 클릭
   - **Key**: `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **Value**: Supabase에서 복사한 **anon public** 키 (전체, 매우 긴 문자열)
   - **Environment**: ✅ Production, ✅ Preview, ✅ Development 모두 선택
   - "Save" 클릭

### 3단계: 재배포

1. **Vercel Dashboard → Deployments**
2. 가장 최근 배포 클릭
3. "..." 메뉴 → **"Redeploy"** 선택
4. 재배포 완료 대기

### 4단계: 확인

1. **배포 완료 후**: https://sfc-ten.vercel.app/debug 접속
2. **환경 변수 섹션** 확인:
   - Supabase URL: ✅ 표시되어야 함
   - Anon Key: ✅ SET 표시되어야 함
3. **모든 쿼리**가 ✅ 성공해야 함

## 주의사항

- ❌ **service_role** 키를 사용하지 마세요 (관리자 키, 보안 위험)
- ✅ **anon public** 키만 사용하세요
- 환경 변수 값 복사 시 **앞뒤 공백 없이** 정확히 복사
- Production, Preview, Development **모두**에 설정
- 환경 변수 수정 후 **반드시 재배포**

## 체크리스트

- [ ] Supabase에서 Project URL 복사
- [ ] Supabase에서 anon public 키 복사 (service_role 아님!)
- [ ] Vercel에서 기존 환경 변수 삭제
- [ ] Vercel에서 `NEXT_PUBLIC_SUPABASE_URL` 새로 추가 (모든 환경 선택)
- [ ] Vercel에서 `NEXT_PUBLIC_SUPABASE_ANON_KEY` 새로 추가 (모든 환경 선택)
- [ ] Vercel에서 재배포 (Redeploy)
- [ ] `/debug` 페이지에서 에러 사라졌는지 확인
