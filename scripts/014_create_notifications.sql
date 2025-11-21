-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- 'comment', 'event_registration', 'post_like'
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  related_post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  related_event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  related_comment_id UUID REFERENCES comments(id) ON DELETE CASCADE,
  actor_id UUID REFERENCES profiles(id) ON DELETE CASCADE, -- who triggered the notification
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);

-- Enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own notifications"
  ON notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications"
  ON notifications FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert notifications"
  ON notifications FOR INSERT
  WITH CHECK (true);

-- Create function to send notification on comment
CREATE OR REPLACE FUNCTION notify_on_comment()
RETURNS TRIGGER AS $$
BEGIN
  -- Get post author
  INSERT INTO notifications (user_id, type, title, message, related_post_id, related_comment_id, actor_id)
  SELECT 
    p.author_id,
    'comment',
    '새 댓글',
    (SELECT full_name FROM profiles WHERE id = NEW.author_id) || '님이 회원님의 게시물에 댓글을 남겼습니다.',
    NEW.post_id,
    NEW.id,
    NEW.author_id
  FROM posts p
  WHERE p.id = NEW.post_id
    AND p.author_id != NEW.author_id; -- Don't notify yourself
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for comments
DROP TRIGGER IF EXISTS trigger_notify_on_comment ON comments;
CREATE TRIGGER trigger_notify_on_comment
  AFTER INSERT ON comments
  FOR EACH ROW
  EXECUTE FUNCTION notify_on_comment();

-- Create function to send notification on event registration
CREATE OR REPLACE FUNCTION notify_on_event_registration()
RETURNS TRIGGER AS $$
BEGIN
  -- Get event creator
  INSERT INTO notifications (user_id, type, title, message, related_event_id, actor_id)
  SELECT 
    e.created_by,
    'event_registration',
    '새 참가 신청',
    COALESCE(
      (SELECT full_name FROM profiles WHERE id = NEW.user_id),
      NEW.guest_name
    ) || '님이 회원님의 이벤트에 참가 신청했습니다.',
    NEW.event_id,
    NEW.user_id
  FROM events e
  WHERE e.id = NEW.event_id
    AND e.created_by != NEW.user_id; -- Don't notify yourself
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for event registrations
DROP TRIGGER IF EXISTS trigger_notify_on_event_registration ON event_registrations;
CREATE TRIGGER trigger_notify_on_event_registration
  AFTER INSERT ON event_registrations
  FOR EACH ROW
  EXECUTE FUNCTION notify_on_event_registration();
