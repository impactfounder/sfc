-- Realtime 기능 비활성화 (선택사항)
-- WebSocket 에러가 발생하는 경우 Realtime을 비활성화할 수 있습니다

-- Realtime은 게시판에서 실시간 업데이트를 위한 기능입니다
-- 만약 실시간 기능이 필요하지 않다면 비활성화 가능

-- 참고: Realtime은 publication을 통해 활성화됩니다
-- 아래 쿼리로 현재 publication 상태 확인:
-- SELECT * FROM pg_publication_tables;

-- Realtime 비활성화는 Supabase Dashboard에서:
-- Database → Replication → 테이블별로 토글

-- 또는 특정 테이블만 Realtime 비활성화:
-- ALTER PUBLICATION supabase_realtime REMOVE TABLE posts;
-- ALTER PUBLICATION supabase_realtime REMOVE TABLE events;

-- 참고: 이 스크립트는 정보 제공용이며, 
-- 실제로는 Supabase Dashboard에서 Realtime 설정을 변경하는 것이 더 안전합니다.

