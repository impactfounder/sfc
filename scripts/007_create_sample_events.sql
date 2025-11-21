-- Seoul Founders Club 샘플 이벤트 생성
-- 이 스크립트는 현재 데이터베이스에 있는 첫 번째 사용자를 찾아서 
-- 그 사용자의 이름으로 샘플 이벤트를 생성합니다.

DO $$
DECLARE
  first_user_id uuid;
BEGIN
  -- 첫 번째 사용자 ID 찾기
  SELECT id INTO first_user_id FROM profiles LIMIT 1;
  
  -- 사용자가 없으면 종료
  IF first_user_id IS NULL THEN
    RAISE NOTICE '프로필이 없습니다. 먼저 구글 로그인을 해주세요.';
    RETURN;
  END IF;
  
  RAISE NOTICE '사용자 ID: %', first_user_id;
  
  -- 기존 샘플 이벤트 삭제 (중복 방지)
  DELETE FROM events WHERE title LIKE '%AI 스타트업 창업자 밋업%' 
    OR title LIKE '%VC 투자 유치 전략%'
    OR title LIKE '%ChatGPT API%'
    OR title LIKE '%제로베이스 창업%'
    OR title LIKE '%LLM 파인튜닝%'
    OR title LIKE '%성공한 창업자%';
  
  -- 날짜를 2025년 12월 ~ 2026년 2월로 수정하여 미래 이벤트로 변경
  -- 샘플 이벤트 생성
  INSERT INTO events (title, description, event_date, location, thumbnail_url, max_participants, created_by)
  VALUES
    (
      'AI 스타트업 창업자 밋업 Vol.12',
      'AI 기술을 활용한 스타트업 창업자들이 모여 네트워킹하고 인사이트를 공유하는 모임입니다. 각자의 프로젝트를 소개하고, AI 트렌드에 대해 토론합니다.

주요 아젠다:
• AI 최신 트렌드 공유
• 스타트업 피칭 (5분씩)
• 네트워킹 시간
• Q&A 세션

참석 대상:
AI 관련 창업을 준비 중이거나 이미 운영 중인 분들을 환영합니다!',
      '2025-12-05 19:00:00+09',
      '강남역 스타트업 허브 5층',
      '/placeholder.svg?height=400&width=600',
      30,
      first_user_id
    ),
    (
      '초기 스타트업을 위한 VC 투자 유치 전략',
      '벤처캐피탈 투자 유치의 A to Z를 배우는 실전 워크샵입니다. 현직 VC가 직접 알려주는 투자 유치 전략과 피칭 노하우를 공유합니다.

워크샵 내용:
• VC의 의사결정 프로세스 이해하기
• 효과적인 피치덱 작성법
• 투자 계약서 핵심 포인트
• 1:1 피드백 세션

준비물:
자신의 피치덱이나 사업계획서 (선택사항)',
      '2025-12-12 14:00:00+09',
      '역삼 maru180 세미나실',
      '/placeholder.svg?height=400&width=600',
      50,
      first_user_id
    ),
    (
      'ChatGPT API를 활용한 서비스 개발 해커톤',
      '2박 3일간 진행되는 AI 해커톤! ChatGPT API를 활용하여 혁신적인 서비스를 만들어보세요.

해커톤 상세:
• 기간: 2025년 12월 20일(금) 저녁 - 12월 22일(일) 오후
• 팀 구성: 3-5명 (현장에서도 팀 빌딩 가능)
• 상금: 1등 300만원, 2등 150만원, 3등 50만원
• 제공: 식사, 간식, 개발 공간

심사 기준:
창의성, 기술력, 완성도, 시장성',
      '2025-12-20 18:00:00+09',
      '판교 테크노밸리 이노베이션 센터',
      '/placeholder.svg?height=400&width=600',
      100,
      first_user_id
    ),
    (
      '제로베이스 창업 부트캠프 (6주 과정)',
      '아이디어만 있다면 OK! 초기 창업자를 위한 6주 집중 부트캠프입니다. 매주 토요일 오후에 진행되며, 멘토링과 실전 과제를 통해 창업 역량을 키웁니다.

커리큘럼:
Week 1: 문제 정의 & 고객 인터뷰
Week 2: 비즈니스 모델 설계
Week 3: MVP 개발 전략
Week 4: 마케팅 & 그로스해킹
Week 5: 투자 유치 준비
Week 6: 최종 피칭 & 데모데이

혜택:
• 현업 멘토 1:1 매칭
• 협업 공간 무료 제공
• 투자자 네트워킹 기회',
      '2026-01-11 14:00:00+09',
      '서울창업허브 (을지로)',
      '/placeholder.svg?height=400&width=600',
      25,
      first_user_id
    ),
    (
      'LLM 파인튜닝 실전 워크샵',
      '대규모 언어 모델(LLM)을 내 서비스에 맞게 파인튜닝하는 방법을 배우는 핸즈온 워크샵입니다.

학습 내용:
• LLM 기초 이론
• 파인튜닝 vs 프롬프트 엔지니어링
• Hugging Face Transformers 실습
• 자체 데이터셋으로 모델 학습하기
• 실전 배포 전략

대상:
Python 기초 지식이 있는 개발자 또는 AI에 관심 있는 기술 창업자

준비물:
노트북 (GPU 불필요, 클라우드 환경 제공)',
      '2026-01-25 10:00:00+09',
      '선릉역 AI 연구소',
      '/placeholder.svg?height=400&width=600',
      40,
      first_user_id
    ),
    (
      '성공한 창업자들과의 저녁 식사',
      '엑싯 경험이 있거나 Series B 이상 투자를 유치한 선배 창업자들과 함께하는 프라이빗 디너 모임입니다.

초청 게스트:
• AI 에듀테크 스타트업 대표 (Series C, 500억 밸류)
• B2B SaaS 스타트업 대표 (M&A 엑싯 경험)
• 핀테크 유니콘 공동창업자

형식:
소규모 테이블 디스커션 형태로 진행되며, 자유로운 질의응답과 네트워킹 시간이 있습니다.

참가비:
5만원 (식사 제공)',
      '2026-02-08 18:30:00+09',
      '강남 프리미엄 레스토랑',
      '/placeholder.svg?height=400&width=600',
      20,
      first_user_id
    );

  -- 공지사항 게시글 샘플 생성 (기존 삭제)
  DELETE FROM posts WHERE title LIKE '%Seoul Founders Club%' OR title LIKE '%주요 이벤트 안내%';
  
  INSERT INTO posts (title, content, category, author_id)
  VALUES
    (
      'Seoul Founders Club에 오신 것을 환영합니다!',
      '안녕하세요, SFC 운영팀입니다.

서울 파운더스 클럽은 창업가들이 모여 서로의 경험을 나누고, 함께 성장하는 커뮤니티입니다.

**커뮤니티 가이드라인**

1. 서로 존중하고 배려하는 문화를 만들어주세요
2. 스팸성 홍보 글은 자제해주세요
3. 궁금한 점은 자유롭게 질문하세요
4. 좋은 정보는 적극적으로 공유해주세요

**활동 방법**

• 공지사항: 중요한 안내사항을 확인하세요
• 자유게시판: 자유롭게 의견을 나누세요
• 이벤트: 다양한 모임과 행사에 참여하세요

함께 성장하는 커뮤니티를 만들어갑시다!',
      'announcement',
      first_user_id
    ),
    (
      '2025년 12월 - 2026년 2월 주요 이벤트 안내',
      '새해를 맞아 다양한 이벤트를 준비했습니다!

**12월 일정**
• 12/5 (목) - AI 스타트업 창업자 밋업
• 12/12 (목) - VC 투자 유치 전략 워크샵
• 12/20-22 - ChatGPT 해커톤

**2026년 1월 일정**
• 1/11 (토) - 제로베이스 창업 부트캠프 시작
• 1/25 (토) - LLM 파인튜닝 워크샵

**2월 일정**
• 2/8 (일) - 성공한 창업자들과의 저녁 식사

자세한 내용은 이벤트 페이지를 참고해주세요!',
      'announcement',
      first_user_id
    );
    
  RAISE NOTICE '샘플 이벤트 6개와 공지사항 2개가 생성되었습니다!';
END $$;
