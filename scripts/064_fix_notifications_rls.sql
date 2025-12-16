-- notifications 테이블 RLS 정책 수정
-- 기존 정책 삭제 후 재생성

-- 기존 정책 삭제
DROP POLICY IF EXISTS "Users can view their own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON notifications;
DROP POLICY IF EXISTS "System can insert notifications" ON notifications;

-- RLS 활성화 확인
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- 인증된 사용자가 자신의 알림을 볼 수 있는 정책
CREATE POLICY "Users can view their own notifications"
  ON notifications FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- 인증된 사용자가 자신의 알림을 업데이트할 수 있는 정책
CREATE POLICY "Users can update their own notifications"
  ON notifications FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- 시스템이 알림을 삽입할 수 있는 정책 (service role 또는 트리거 용)
CREATE POLICY "System can insert notifications"
  ON notifications FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- service_role을 위한 전체 접근 정책 (트리거에서 사용)
CREATE POLICY "Service role full access"
  ON notifications
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
