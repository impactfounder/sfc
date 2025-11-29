-- 파트너스 마켓플레이스 초기 데이터
-- AI 기반 MVP 5일 완성 개발 서비스

-- 주의: provider_id는 실제 사용자의 UUID로 변경해야 합니다.
-- 예시로 '00000000-0000-0000-0000-000000000000'을 사용했으니, 실제 사용자 ID로 교체하세요.

INSERT INTO public.partner_services (
  title,
  description,
  content,
  category,
  price_range,
  contact_link,
  thumbnail_url,
  is_verified,
  provider_id
) VALUES (
  'AI 기반 MVP 5일 완성 개발 서비스',
  '기획부터 배포까지 One-Stop으로 제공하는 합리적인 가격의 MVP 개발 서비스입니다.',
  '## 서비스 소개

AI 기반 MVP 5일 완성 개발 서비스는 창업가들이 빠르게 아이디어를 검증할 수 있도록 도와주는 원스톱 개발 솔루션입니다.

### 주요 특징

- **5일 완성**: 기획부터 배포까지 단 5일 만에 완성
- **AI 기반 개발**: 최신 AI 도구를 활용한 효율적인 개발 프로세스
- **합리적인 가격**: 대행사 대비 50% 이상 저렴한 가격
- **One-Stop 서비스**: 기획, 디자인, 개발, 배포까지 모든 과정을 담당

### 제공 범위

1. **기획 단계**
   - 사용자 스토리 작성
   - 기능 명세서 작성
   - 데이터베이스 설계

2. **디자인 단계**
   - UI/UX 디자인
   - 프로토타입 제작
   - 디자인 시스템 구축

3. **개발 단계**
   - 프론트엔드 개발 (React/Next.js)
   - 백엔드 개발 (Node.js/Supabase)
   - AI 기능 통합

4. **배포 단계**
   - 클라우드 배포
   - 도메인 연결
   - 모니터링 설정

### 기술 스택

- **Frontend**: Next.js, React, TypeScript, Tailwind CSS
- **Backend**: Supabase, Node.js
- **AI**: OpenAI API, Anthropic Claude
- **Deployment**: Vercel, AWS

### 가격 정보

- **기본 패키지**: 100만원 (5일 완성)
- **프리미엄 패키지**: 150만원 (7일 완성 + 추가 기능)
- **커스텀 패키지**: 문의

### 진행 프로세스

1. **1일차**: 기획 및 디자인 컨셉 확정
2. **2-3일차**: 핵심 기능 개발
3. **4일차**: AI 기능 통합 및 테스트
4. **5일차**: 배포 및 최종 점검

### 문의 방법

오픈카톡 링크를 통해 문의해주시면 빠르게 답변드리겠습니다.',
  'development',
  '100만원~',
  'https://open.kakao.com/o/example',
  '/placeholder.svg?height=400&width=600',
  true,
  (SELECT id FROM public.profiles LIMIT 1) -- 첫 번째 프로필 사용 (실제로는 본인의 UUID로 변경)
);



