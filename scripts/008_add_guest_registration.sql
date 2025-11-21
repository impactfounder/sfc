-- Add guest registration fields to event_registrations table
ALTER TABLE event_registrations 
ADD COLUMN IF NOT EXISTS guest_name TEXT,
ADD COLUMN IF NOT EXISTS guest_contact TEXT;

-- Update constraint to allow NULL user_id for guest registrations
ALTER TABLE event_registrations 
DROP CONSTRAINT IF EXISTS event_registrations_user_id_fkey;

ALTER TABLE event_registrations 
ADD CONSTRAINT event_registrations_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- Update RLS policies to allow guest registrations
DROP POLICY IF EXISTS "Anyone can view registrations" ON event_registrations;
DROP POLICY IF EXISTS "Users can register for events" ON event_registrations;
DROP POLICY IF EXISTS "Users can cancel their registrations" ON event_registrations;

CREATE POLICY "Anyone can view registrations" ON event_registrations
  FOR SELECT USING (true);

CREATE POLICY "Anyone can register for events" ON event_registrations
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can cancel their registrations" ON event_registrations
  FOR DELETE USING (
    auth.uid() = user_id OR user_id IS NULL
  );

-- Add index for guest registrations
CREATE INDEX IF NOT EXISTS idx_event_registrations_guest 
ON event_registrations(event_id) 
WHERE user_id IS NULL;
