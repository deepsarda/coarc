-- =============================================
-- 003: CLASS DAYS & ATTENDANCE REMINDER
-- Per-course schedule (day → slot count), opt-in 6pm reminder
-- =============================================

-- Courses: schedule maps day-of-week (0=Sun…6=Sat) to slot count
-- e.g. {"1":2,"3":1,"5":2} = Mon 2 slots, Wed 1 slot, Fri 2 slots
ALTER TABLE courses
  ADD COLUMN IF NOT EXISTS schedule JSONB DEFAULT '{"1":1,"2":1,"3":1,"4":1,"5":1}';

-- Profiles: opt-in for 6pm attendance reminder push notification
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS attendance_reminder BOOLEAN DEFAULT false;
