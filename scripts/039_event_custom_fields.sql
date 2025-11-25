-- 이벤트 커스텀 신청서 필드 및 응답 테이블 생성/업데이트

-- event_registration_fields 테이블이 이미 존재하는지 확인하고 업데이트
-- 기존 테이블이 있다면 컬럼명을 사용자 요청에 맞게 변경
DO $$
BEGIN
  -- 기존 테이블이 있는지 확인
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'event_registration_fields') THEN
    -- 기존 컬럼명을 새로운 컬럼명으로 변경 (필요시)
    -- field_name -> label (별칭으로 처리하거나 새 컬럼 추가)
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'event_registration_fields' AND column_name = 'label') THEN
      ALTER TABLE event_registration_fields ADD COLUMN label TEXT;
      -- 기존 field_name 값을 label로 복사
      UPDATE event_registration_fields SET label = field_name;
      -- label을 NOT NULL로 변경
      ALTER TABLE event_registration_fields ALTER COLUMN label SET NOT NULL;
    END IF;
    
    -- field_type -> type (별칭으로 처리하거나 새 컬럼 추가)
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'event_registration_fields' AND column_name = 'type') THEN
      ALTER TABLE event_registration_fields ADD COLUMN type TEXT;
      -- 기존 field_type 값을 type으로 복사
      UPDATE event_registration_fields SET type = field_type;
      -- type을 NOT NULL로 변경
      ALTER TABLE event_registration_fields ALTER COLUMN type SET NOT NULL;
    END IF;
    
    -- field_options -> options (JSONB는 그대로 유지)
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'event_registration_fields' AND column_name = 'options') THEN
      ALTER TABLE event_registration_fields ADD COLUMN options JSONB;
      -- 기존 field_options 값을 options로 복사
      UPDATE event_registration_fields SET options = field_options;
    END IF;
    
    -- is_required -> required
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'event_registration_fields' AND column_name = 'required') THEN
      ALTER TABLE event_registration_fields ADD COLUMN required BOOLEAN DEFAULT false;
      -- 기존 is_required 값을 required로 복사
      UPDATE event_registration_fields SET required = is_required;
    END IF;
  ELSE
    -- 테이블이 없으면 새로 생성
    CREATE TABLE event_registration_fields (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
      label TEXT NOT NULL,
      type TEXT NOT NULL CHECK (type IN ('text', 'select')),
      options JSONB, -- select 타입일 때 선택지 배열
      required BOOLEAN DEFAULT false,
      order_index INTEGER DEFAULT 0,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  END IF;
END $$;

-- event_registration_responses 테이블 업데이트
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'event_registration_responses') THEN
    -- response_value -> value
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'event_registration_responses' AND column_name = 'value') THEN
      ALTER TABLE event_registration_responses ADD COLUMN value TEXT;
      -- 기존 response_value 값을 value로 복사
      UPDATE event_registration_responses SET value = response_value;
    END IF;
  ELSE
    -- 테이블이 없으면 새로 생성
    CREATE TABLE event_registration_responses (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      registration_id UUID NOT NULL REFERENCES event_registrations(id) ON DELETE CASCADE,
      field_id UUID NOT NULL REFERENCES event_registration_fields(id) ON DELETE CASCADE,
      value TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      UNIQUE(registration_id, field_id)
    );
  END IF;
END $$;

-- RLS 정책 설정
ALTER TABLE event_registration_fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_registration_responses ENABLE ROW LEVEL SECURITY;

-- 기존 정책 삭제 (재생성을 위해)
DROP POLICY IF EXISTS "Anyone can view event registration fields" ON event_registration_fields;
DROP POLICY IF EXISTS "Event creators can manage fields" ON event_registration_fields;
DROP POLICY IF EXISTS "Users can view their own responses" ON event_registration_responses;
DROP POLICY IF EXISTS "Event creators can view all responses" ON event_registration_responses;
DROP POLICY IF EXISTS "Registered users can submit responses" ON event_registration_responses;

-- event_registration_fields 정책
-- 누구나 조회 가능
CREATE POLICY "Anyone can view event registration fields" ON event_registration_fields
  FOR SELECT USING (true);

-- 호스트만 생성/수정/삭제 가능
CREATE POLICY "Event creators can manage fields" ON event_registration_fields
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM events 
      WHERE events.id = event_registration_fields.event_id 
      AND events.created_by = auth.uid()
    )
  );

-- event_registration_responses 정책
-- 본인과 호스트만 조회 가능
CREATE POLICY "Users can view their own responses" ON event_registration_responses
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM event_registrations 
      WHERE event_registrations.id = event_registration_responses.registration_id 
      AND event_registrations.user_id = auth.uid()
    )
  );

CREATE POLICY "Event creators can view all responses" ON event_registration_responses
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM event_registrations
      JOIN events ON events.id = event_registrations.event_id
      WHERE event_registrations.id = event_registration_responses.registration_id 
      AND events.created_by = auth.uid()
    )
  );

-- 등록된 사용자는 자신의 응답을 제출할 수 있음
CREATE POLICY "Registered users can submit responses" ON event_registration_responses
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM event_registrations 
      WHERE event_registrations.id = event_registration_responses.registration_id 
      AND event_registrations.user_id = auth.uid()
    )
  );

-- 인덱스 추가 (성능 최적화)
CREATE INDEX IF NOT EXISTS idx_event_registration_fields_event_id 
ON event_registration_fields(event_id);

CREATE INDEX IF NOT EXISTS idx_event_registration_responses_registration_id 
ON event_registration_responses(registration_id);

CREATE INDEX IF NOT EXISTS idx_event_registration_responses_field_id 
ON event_registration_responses(field_id);

