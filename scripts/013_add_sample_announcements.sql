-- Add sample announcement posts

INSERT INTO posts (
  title,
  content,
  category,
  author_id,
  created_at
) VALUES
(
  'Seoul Founders Club 커뮤니티 오픈 안내',
  '안녕하세요! Seoul Founders Club 커뮤니티가 정식으로 오픈하였습니다. 사업가, 투자자, 인플루언서가 함께 성장하고 활동하는 공간으로 발전시켜 나가겠습니다. 많은 관심과 참여 부탁드립니다!',
  'announcement',
  (SELECT id FROM profiles LIMIT 1),
  NOW() - INTERVAL '2 days'
),
(
  '커뮤니티 이용 규칙 및 매너 안내',
  'SFC는 서로의 감상과 생각을 존중하는 공간입니다. 함께 매너 있게 대화하며 즐거운 커뮤니티를 만들어가요. 욕설, 비방, 스팸 게시물은 삭제될 수 있으며, 반복될 경우 제재 조치가 취해질 수 있습니다.',
  'announcement',
  (SELECT id FROM profiles LIMIT 1),
  NOW() - INTERVAL '1 day'
);
