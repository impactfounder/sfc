-- 이벤트 관리자 권한 정책 업데이트
-- 관리자(admin, master)가 모든 이벤트를 관리할 수 있도록 정책 수정
-- 이벤트 개설자가 event_registrations에 게스트를 등록할 수 있도록 정책 추가

-- 1. 이벤트 테이블 UPDATE 정책: 관리자도 수정 가능
DROP POLICY IF EXISTS "Admins can update any events" ON events;
CREATE POLICY "Admins can update any events" ON events
  FOR UPDATE
  USING (
    auth.uid() = created_by OR
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'master')
    )
  );

-- 2. 이벤트 테이블 DELETE 정책: 관리자도 삭제 가능
DROP POLICY IF EXISTS "Admins can delete any events" ON events;
CREATE POLICY "Admins can delete any events" ON events
  FOR DELETE
  USING (
    auth.uid() = created_by OR
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'master')
    )
  );

-- 3. 이벤트 등록 테이블 INSERT 정책: 이벤트 개설자가 게스트를 등록할 수 있도록 추가
-- 기존 정책은 유지하고, 이벤트 개설자가 게스트를 등록할 수 있는 정책 추가
DROP POLICY IF EXISTS "Event creators can add guest registrations" ON event_registrations;
CREATE POLICY "Event creators can add guest registrations" ON event_registrations
  FOR INSERT
  WITH CHECK (
    -- 기존: 인증된 사용자가 자신을 등록
    (auth.uid() = user_id) OR
    -- 새로 추가: 이벤트 개설자가 게스트(user_id가 null)를 등록
    (
      user_id IS NULL AND
      EXISTS (
        SELECT 1 FROM events 
        WHERE events.id = event_registrations.event_id 
        AND events.created_by = auth.uid()
      )
    )
  );

-- 4. 이벤트 등록 테이블 DELETE 정책: 이벤트 개설자가 게스트 등록을 삭제할 수 있도록 추가
DROP POLICY IF EXISTS "Event creators can delete guest registrations" ON event_registrations;
CREATE POLICY "Event creators can delete guest registrations" ON event_registrations
  FOR DELETE
  USING (
    -- 기존: 사용자가 자신의 등록을 취소
    auth.uid() = user_id OR
    -- 새로 추가: 이벤트 개설자가 게스트 등록을 삭제
    (
      user_id IS NULL AND
      EXISTS (
        SELECT 1 FROM events 
        WHERE events.id = event_registrations.event_id 
        AND events.created_by = auth.uid()
      )
    )
  );

-- 정책 적용 확인 쿼리
-- SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
-- FROM pg_policies
-- WHERE schemaname = 'public'
-- AND tablename IN ('events', 'event_registrations')
-- AND cmd IN ('UPDATE', 'DELETE', 'INSERT')
-- ORDER BY tablename, policyname;

