-- Add membership tier column to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS membership_tier TEXT DEFAULT 'basic' CHECK (membership_tier IN ('basic', 'plus', 'pro', 'master'));

-- Create index for membership queries
CREATE INDEX IF NOT EXISTS idx_profiles_membership_tier ON profiles(membership_tier);

-- Set jaewook@mvmt.city as master admin
UPDATE profiles 
SET role = 'master', membership_tier = 'master'
WHERE email = 'jaewook@mvmt.city';

-- Add comment for documentation
COMMENT ON COLUMN profiles.membership_tier IS 'Membership tier: basic (free), plus, pro, master';
