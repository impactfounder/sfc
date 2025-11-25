-- 런칭 대비용 '리얼한' 더미 데이터 생성 스크립트
-- 전략: demo_user_id를 사용하여 모든 더미 데이터를 연결
-- 런칭 시 이 유저만 삭제하면 Cascade로 모든 더미 데이터가 사라집니다.

DO $$
DECLARE
  demo_user_id uuid;
  free_board_id uuid;
  request_board_id uuid;
  vangol_board_id uuid;
  hightalk_board_id uuid;
  announcement_board_id uuid;
  created_post_id uuid;
BEGIN
  -- 데모 유저 ID 설정 (기존 마스터 계정 또는 첫 번째 유저)
  -- 실제 런칭 전 삭제할 때는 이 ID를 가진 row를 profiles에서 삭제하면 됩니다.
  SELECT id INTO demo_user_id FROM profiles ORDER BY created_at LIMIT 1;
  
  -- 유저가 없으면 스크립트 종료
  IF demo_user_id IS NULL THEN
    RAISE NOTICE '⚠️ 데모 유저를 찾을 수 없습니다. 먼저 사용자를 생성해주세요.';
    RETURN;
  END IF;

  -- 카테고리 ID 가져오기
  SELECT id INTO free_board_id FROM board_categories WHERE slug = 'free-board';
  SELECT id INTO request_board_id FROM board_categories WHERE slug = 'event-requests';
  SELECT id INTO vangol_board_id FROM board_categories WHERE slug = 'vangol';
  SELECT id INTO hightalk_board_id FROM board_categories WHERE slug = 'hightalk';
  SELECT id INTO announcement_board_id FROM board_categories WHERE slug = 'announcement';

  -- ==========================================
  -- 2. [열어주세요] 더미 데이터 (수요 파악용)
  -- ==========================================
  INSERT INTO posts (title, content, author_id, board_category_id, visibility, likes_count, comments_count, created_at)
  VALUES
  (
    '강남역 근처 초기 창업팀 커피챗 원해요!',
    '강남역 공유오피스 입주해 있는데, 점심시간에 가볍게 만나서 고민 나눌 초기 창업팀 있나요? 개발자 채용이나 마케팅 이야기 나누고 싶습니다.',
    demo_user_id,
    request_board_id,
    'public',
    12, -- 좋아요 수 조작 (인기 있어 보이게)
    3,
    NOW() - INTERVAL '2 hours'
  ),
  (
    'SaaS B2B 세일즈 노하우 공유회 요청합니다',
    'B2B 세일즈 맨땅에 헤딩 중인데, 선배님들의 노하우가 절실합니다. 콜드메일 작성법부터 클로징까지 실전 팁 공유해주실 분 계신가요?',
    demo_user_id,
    request_board_id,
    'public',
    28,
    5,
    NOW() - INTERVAL '1 day'
  ),
  (
    '주말 북한산 등산 모임 (뒷풀이 백숙 필수)',
    '날씨 좋은데 주말에 등산 가실 분? 창업 이야기하면서 땀 흘리고 내려와서 백숙 먹어요. 4명 정도 소규모로 모집 희망합니다.',
    demo_user_id,
    request_board_id,
    'public',
    8,
    2,
    NOW() - INTERVAL '3 days'
  )
  ON CONFLICT DO NOTHING;

  -- ==========================================
  -- 3. [자유게시판/커뮤니티] 더미 데이터 (활성화 느낌)
  -- ==========================================
  INSERT INTO posts (title, content, author_id, board_category_id, visibility, likes_count, comments_count, created_at)
  VALUES
  (
    '투자 혹한기, 다들 어떻게 버티고 계신가요?',
    '최근 VC 미팅 다녀왔는데 분위기가 많이 얼어붙었네요. 런웨이 관리랑 피보팅 고민 중인데 다른 대표님들 상황은 어떠신지 궁금합니다.',
    demo_user_id,
    free_board_id,
    'public',
    15,
    8,
    NOW() - INTERVAL '5 hours'
  ),
  (
    '[후기] 지난주 네트워킹 파티 다녀왔습니다',
    '생각보다 다양한 분야의 대표님들을 만날 수 있어서 좋았습니다. 특히 AI 쪽 인사이트 얻은 게 큰 도움이 됐네요. 다음 모임도 기대됩니다!',
    demo_user_id,
    vangol_board_id,
    'group', -- 그룹 공개 예시
    22,
    4,
    NOW() - INTERVAL '2 days'
  ),
  (
    '프로덕트-마켓 핏 찾는 중인데 조언 부탁드립니다',
    'MVP 런칭 후 초기 유저 반응이 미묘합니다. 피봇을 고려해야 할지, 아니면 마케팅에 더 집중해야 할지 고민이에요. 비슷한 경험 있으신 분 계신가요?',
    demo_user_id,
    free_board_id,
    'public',
    9,
    3,
    NOW() - INTERVAL '1 day'
  ),
  (
    'B2B SaaS 초기 고객 확보 전략 공유',
    '콜드 아웃리치로 첫 10개 고객을 확보한 경험을 공유합니다. 이메일 템플릿부터 피칭 노하우까지 실전 팁을 정리했어요.',
    demo_user_id,
    hightalk_board_id,
    'public',
    31,
    12,
    NOW() - INTERVAL '4 days'
  )
  ON CONFLICT DO NOTHING;

  -- ==========================================
  -- 4. 더미 댓글 생성 (티키타카 느낌)
  -- ==========================================
  -- 가장 최근 게시글에 댓글 달기
  SELECT id INTO created_post_id 
  FROM posts 
  WHERE board_category_id = request_board_id 
  ORDER BY created_at DESC 
  LIMIT 1;

  IF created_post_id IS NOT NULL THEN
    INSERT INTO comments (post_id, author_id, content, created_at)
    VALUES
    (created_post_id, demo_user_id, '저도 참여하고 싶습니다! 지역이 어디인가요?', NOW() - INTERVAL '10 minutes'),
    (created_post_id, demo_user_id, '좋은 의견 감사합니다. DM 드릴게요.', NOW() - INTERVAL '5 minutes')
    ON CONFLICT DO NOTHING;
  END IF;

  -- 자유게시판 게시글에 댓글 달기
  SELECT id INTO created_post_id 
  FROM posts 
  WHERE board_category_id = free_board_id 
  ORDER BY created_at DESC 
  LIMIT 1;

  IF created_post_id IS NOT NULL THEN
    INSERT INTO comments (post_id, author_id, content, created_at)
    VALUES
    (created_post_id, demo_user_id, '저도 비슷한 고민이 있었는데, 피봇 전에 유저 인터뷰를 더 많이 해보시는 걸 추천드려요.', NOW() - INTERVAL '3 hours'),
    (created_post_id, demo_user_id, '좋은 글 감사합니다. 저도 같은 상황이라 공감이 가네요.', NOW() - INTERVAL '1 hour')
    ON CONFLICT DO NOTHING;
  END IF;

  RAISE NOTICE '✅ 더미 데이터 시딩 완료 (User ID: %)', demo_user_id;
  RAISE NOTICE '💡 런칭 전 삭제: DELETE FROM profiles WHERE id = ''%'';', demo_user_id;
END $$;

