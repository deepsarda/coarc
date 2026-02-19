-- =============================================
-- 002: ENHANCEMENTS
-- LeetCode problem cache, attendance settings, cron dedup
-- =============================================

-- LeetCode problem cache (mirrors cf_problems for LC)
CREATE TABLE IF NOT EXISTS lc_problems (
  slug TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  difficulty TEXT,
  topics TEXT[] DEFAULT '{}',
  total_accepted INTEGER,
  total_submitted INTEGER,
  likes INTEGER,
  url TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE lc_problems ENABLE ROW LEVEL SECURITY;
CREATE POLICY "LC problems viewable by everyone" ON lc_problems FOR SELECT USING (true);

CREATE INDEX idx_lc_problems_difficulty ON lc_problems(difficulty);
CREATE INDEX idx_lc_problems_topics ON lc_problems USING GIN(topics);

-- Courses: add weekly class count + semester end date
ALTER TABLE courses
  ADD COLUMN IF NOT EXISTS classes_per_week INTEGER DEFAULT 3,
  ADD COLUMN IF NOT EXISTS semester_end DATE;

-- Cron dedup: tracks last successful run per job
CREATE TABLE IF NOT EXISTS cron_runs (
  job_name TEXT PRIMARY KEY,
  last_run_at TIMESTAMPTZ NOT NULL,
  result JSONB
);

ALTER TABLE cron_runs ENABLE ROW LEVEL SECURITY;
-- No user-facing policy needed; admin client only
