# Google OAuth 설정 가이드

Seoul Founders Club에서 Google 로그인을 사용하려면 다음 단계를 따르세요.

## 1. Google Cloud Console 설정

1. [Google Cloud Console](https://console.cloud.google.com/) 접속
2. 새 프로젝트 생성 또는 기존 프로젝트 선택
3. **APIs & Services** → **Credentials** 이동
4. **+ CREATE CREDENTIALS** → **OAuth client ID** 선택
5. 동의 화면 구성 (처음인 경우)
   - User Type: **External** 선택
   - 앱 이름, 지원 이메일 입력
   - 저장 및 계속

6. OAuth Client ID 생성
   - Application type: **Web application**
   - Name: Seoul Founders Club (또는 원하는 이름)
   
7. **Authorized JavaScript origins** 추가:
   \`\`\`
   https://your-project-ref.supabase.co
   \`\`\`
   (Supabase Dashboard → Project Settings → API에서 확인)

8. **Authorized redirect URIs** 추가:
   \`\`\`
   https://your-project-ref.supabase.co/auth/v1/callback
   \`\`\`

9. **CREATE** 클릭
10. 생성된 **Client ID**와 **Client Secret** 복사

## 2. Supabase Dashboard 설정

1. [Supabase Dashboard](https://supabase.com/dashboard) 접속
2. 프로젝트 선택
3. **Authentication** → **Providers** 메뉴로 이동
4. 목록에서 **Google** 찾기
5. **Enabled** 토글을 켜기
6. Google Cloud Console에서 복사한 정보 입력:
   - **Client ID**: 복사한 Client ID 붙여넣기
   - **Client Secret**: 복사한 Client Secret 붙여넣기
7. **Save** 버튼 클릭

## 3. 배포 시 추가 설정

v0 프리뷰나 Vercel에 배포한 경우, Google Cloud Console의 **Authorized JavaScript origins**와 **Authorized redirect URIs**에 추가 URL을 등록해야 합니다:

### v0 프리뷰:
\`\`\`
https://your-preview-url.vercel.app
https://your-preview-url.vercel.app/auth/callback
\`\`\`

### 프로덕션 배포:
\`\`\`
https://your-domain.com
https://your-domain.com/auth/callback
\`\`\`

## 4. 테스트

1. 애플리케이션의 로그인 페이지로 이동
2. "Google로 로그인" 버튼 클릭
3. Google 계정 선택
4. 권한 승인
5. 자동으로 메인 페이지로 리다이렉트

## 문제 해결

### "redirect_uri_mismatch" 에러
- Google Cloud Console의 Authorized redirect URIs가 정확히 일치하는지 확인
- Supabase의 정확한 URL을 사용했는지 확인: `https://your-project-ref.supabase.co/auth/v1/callback`

### "Access blocked: This app's request is invalid"
- Google Cloud Console에서 OAuth 동의 화면을 완성했는지 확인
- 앱 게시 상태 확인 (테스트 모드인 경우 테스트 사용자 추가)

### 로그인 후 리다이렉트가 작동하지 않음
- `/auth/callback` 라우트가 존재하는지 확인
- 브라우저 콘솔에서 에러 메시지 확인
