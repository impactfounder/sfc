# Google Maps API 키 설정 가이드

## 문제 증상

```
Google Maps JavaScript API error: RefererNotAllowedMapError
Your site URL to be authorized: http://localhost:3000/
```

이 에러는 Google Cloud Console에서 API 키의 참조 URL 제한 설정에 현재 사이트가 포함되어 있지 않아서 발생합니다.

## 해결 방법

### 1단계: Google Cloud Console 접속

1. [Google Cloud Console](https://console.cloud.google.com/) 접속
2. 프로젝트 선택 (Seoul Founders Club 프로젝트)

### 2단계: API 키 찾기

1. **APIs & Services** → **Credentials** 메뉴로 이동
2. 사용 중인 Google Maps API 키를 찾습니다
   - Key name이 "Google Maps API Key" 또는 유사한 이름으로 표시됩니다
   - 또는 `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` 환경 변수에 설정된 키를 찾습니다

### 3단계: API 키 편집

1. 찾은 API 키를 클릭하여 상세 페이지로 이동
2. **"Application restrictions"** 섹션 확인

### 4단계: 참조 URL 추가

**옵션 A: HTTP referrers (웹 사이트) 제한 사용 (권장)**

1. **Application restrictions** 섹션에서 **"HTTP referrers (web sites)"** 선택
2. **"Website restrictions"** 섹션에 다음 URL들을 추가:

   ```
   http://localhost:3000/*
   http://localhost:3000
   https://seoulfounders.club/*
   https://seoulfounders.club
   https://*.vercel.app/*
   ```

   각 URL을 한 줄에 하나씩 입력합니다.

3. **"Save"** 버튼 클릭

**옵션 B: 제한 없음 (개발 환경 전용, 권장하지 않음)**

⚠️ **주의**: 보안상 권장되지 않습니다. 프로덕션에서는 사용하지 마세요.

1. **Application restrictions** 섹션에서 **"None"** 선택
2. **"Save"** 버튼 클릭

### 5단계: API 키 제한 확인 (선택 사항)

1. **API restrictions** 섹션 확인
2. 다음 API들이 활성화되어 있는지 확인:
   - ✅ Maps JavaScript API
   - ✅ Places API (자동완성 기능 사용 시)
   - ✅ Geocoding API (주소 변환 사용 시)

### 6단계: 변경 사항 적용 대기

- 변경 사항이 적용되는데 보통 **5분 이내** 소요됩니다
- 브라우저를 새로고침하면 에러가 사라집니다

## 로컬 개발용 참조 URL 목록

로컬 개발 환경에서는 다음을 추가하세요:

```
http://localhost:3000/*
http://localhost:3000
http://127.0.0.1:3000/*
http://127.0.0.1:3000
```

## 프로덕션 배포용 참조 URL 목록

프로덕션 배포 후에는 다음도 추가해야 합니다:

```
https://seoulfounders.club/*
https://seoulfounders.club
https://www.seoulfounders.club/*
https://www.seoulfounders.club
```

Vercel에 배포하는 경우:

```
https://*.vercel.app/*
https://your-project-name.vercel.app/*
```

## 참고사항

1. **와일드카드 사용**: 
   - `/*`로 끝나면 해당 도메인의 모든 경로 허용
   - `*`는 모든 서브도메인 허용

2. **프로토콜 구분**:
   - `http://`와 `https://`는 별도로 등록해야 합니다
   - 로컬 개발: `http://`
   - 프로덕션: `https://`

3. **변경 사항 반영 시간**:
   - 보통 즉시 적용되지만, 최대 5분까지 걸릴 수 있습니다

4. **환경 변수 확인**:
   - `.env.local` 파일에 `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`가 올바르게 설정되어 있는지 확인하세요

## 체크리스트

- [ ] Google Cloud Console에서 API 키 찾기
- [ ] Application restrictions에서 "HTTP referrers (web sites)" 선택
- [ ] `http://localhost:3000/*` 추가
- [ ] 프로덕션 도메인 추가 (필요시)
- [ ] Save 클릭
- [ ] 브라우저 새로고침하여 에러 해결 확인

## 추가 도움말

- [Google Maps Platform 문서](https://developers.google.com/maps/documentation/javascript/get-api-key)
- [API 키 제한 설정 가이드](https://cloud.google.com/docs/authentication/api-keys#restricting_apis)

