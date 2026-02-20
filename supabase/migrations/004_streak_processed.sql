-- =============================================
-- 004: STREAK PROCESSING AND RESET
-- Adds last_streak_processed and fixes streaks
-- =============================================

-- Add last_streak_processed column used by streak processing dedup
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS last_streak_processed DATE;

-- Reset all current_streak above 1 to 2
UPDATE profiles 
SET current_streak = 2 
WHERE current_streak > 1;
