-- =============================================
-- co.arc
-- Full Database Setup
-- Run this once in a fresh Supabase project
-- =============================================

-- Helper: updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- PROFILES
-- =============================================
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  roll_number INTEGER NOT NULL UNIQUE CHECK (roll_number BETWEEN 1 AND 70),
  display_name TEXT NOT NULL,
  cf_handle TEXT,
  lc_handle TEXT,
  is_admin BOOLEAN DEFAULT FALSE,
  xp INTEGER DEFAULT 0,
  level INTEGER DEFAULT 1,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  streak_shields INTEGER DEFAULT 0,
  last_solve_date DATE,
  push_subscription JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public profiles are viewable by everyone"
  ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- =============================================
-- CODEFORCES DATA
-- =============================================
CREATE TABLE cf_ratings (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL,
  contest_id INTEGER,
  contest_name TEXT,
  rank INTEGER,
  old_rating INTEGER,
  new_rating INTEGER,
  timestamp TIMESTAMPTZ NOT NULL,
  UNIQUE(user_id, contest_id)
);

CREATE TABLE cf_submissions (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  cf_submission_id BIGINT UNIQUE NOT NULL,
  problem_id TEXT NOT NULL,
  problem_name TEXT NOT NULL,
  problem_rating INTEGER,
  tags TEXT[] DEFAULT '{}',
  verdict TEXT NOT NULL,
  language TEXT,
  submitted_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE cf_problems (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  rating INTEGER,
  tags TEXT[] DEFAULT '{}',
  solved_count INTEGER,
  contest_id INTEGER,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE cf_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE cf_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE cf_problems ENABLE ROW LEVEL SECURITY;

CREATE POLICY "CF ratings viewable by authenticated" ON cf_ratings FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "CF submissions viewable by authenticated" ON cf_submissions FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "CF problems viewable by everyone" ON cf_problems FOR SELECT USING (true);

CREATE INDEX idx_cf_ratings_user ON cf_ratings(user_id);
CREATE INDEX idx_cf_submissions_user ON cf_submissions(user_id);
CREATE INDEX idx_cf_submissions_problem ON cf_submissions(problem_id);
CREATE INDEX idx_cf_submissions_date ON cf_submissions(submitted_at);
CREATE INDEX idx_cf_problems_rating ON cf_problems(rating);
CREATE INDEX idx_cf_problems_tags ON cf_problems USING GIN(tags);

-- =============================================
-- LEETCODE DATA
-- =============================================
CREATE TABLE lc_stats (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  easy_solved INTEGER DEFAULT 0,
  medium_solved INTEGER DEFAULT 0,
  hard_solved INTEGER DEFAULT 0,
  total_solved INTEGER DEFAULT 0,
  contest_rating REAL,
  contest_ranking INTEGER,
  submission_calendar JSONB,
  synced_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

CREATE TABLE lc_submissions (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  problem_slug TEXT NOT NULL,
  problem_title TEXT NOT NULL,
  difficulty TEXT NOT NULL,
  submitted_at TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL,
  UNIQUE(user_id, problem_slug, submitted_at)
);

ALTER TABLE lc_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE lc_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "LC stats viewable by authenticated" ON lc_stats FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "LC submissions viewable by authenticated" ON lc_submissions FOR SELECT USING (auth.role() = 'authenticated');

CREATE INDEX idx_lc_stats_user ON lc_stats(user_id);
CREATE INDEX idx_lc_submissions_user ON lc_submissions(user_id);
CREATE INDEX idx_lc_submissions_date ON lc_submissions(submitted_at);

-- =============================================
-- GAMIFICATION (XP, Badges, Quests)
-- =============================================
CREATE TABLE xp_log (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  reason TEXT NOT NULL,
  reference_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE badges (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL,
  category TEXT NOT NULL,
  condition_type TEXT NOT NULL,
  condition_value JSONB
);

CREATE TABLE user_badges (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  badge_id TEXT REFERENCES badges(id),
  earned_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, badge_id)
);

CREATE TABLE quests (
  id BIGSERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  quest_type TEXT NOT NULL,
  condition JSONB NOT NULL,
  xp_reward INTEGER NOT NULL,
  week_start DATE NOT NULL,
  is_admin_curated BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE user_quests (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  quest_id BIGINT REFERENCES quests(id),
  progress INTEGER DEFAULT 0,
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  UNIQUE(user_id, quest_id)
);

ALTER TABLE xp_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE quests ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_quests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "XP log viewable by own user" ON xp_log FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Badges viewable by everyone" ON badges FOR SELECT USING (true);
CREATE POLICY "User badges viewable by authenticated" ON user_badges FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Quests viewable by authenticated" ON quests FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "User quests viewable by own user" ON user_quests FOR SELECT USING (auth.uid() = user_id);

CREATE INDEX idx_xp_log_user ON xp_log(user_id);
CREATE INDEX idx_xp_log_created ON xp_log(created_at);
CREATE INDEX idx_user_badges_user ON user_badges(user_id);
CREATE INDEX idx_user_quests_user ON user_quests(user_id);
CREATE INDEX idx_quests_week ON quests(week_start);

-- =============================================
-- DUELS
-- =============================================
CREATE TABLE duels (
  id BIGSERIAL PRIMARY KEY,
  challenger_id UUID REFERENCES profiles(id),
  challenged_id UUID REFERENCES profiles(id),
  problem_id TEXT REFERENCES cf_problems(id),
  time_limit_minutes INTEGER NOT NULL DEFAULT 30,
  status TEXT NOT NULL DEFAULT 'pending',
  winner_id UUID REFERENCES profiles(id),
  challenger_solve_time INTEGER,
  challenged_solve_time INTEGER,
  started_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE duels ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Duels viewable by authenticated" ON duels FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Users can create duels" ON duels FOR INSERT WITH CHECK (auth.uid() = challenger_id);
CREATE POLICY "Duel participants can update" ON duels FOR UPDATE USING (auth.uid() = challenger_id OR auth.uid() = challenged_id);

CREATE INDEX idx_duels_challenger ON duels(challenger_id);
CREATE INDEX idx_duels_challenged ON duels(challenged_id);
CREATE INDEX idx_duels_status ON duels(status);

-- =============================================
-- BOSS BATTLES
-- =============================================
CREATE TABLE boss_battles (
  id BIGSERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  problem_url TEXT NOT NULL,
  problem_id TEXT,
  difficulty_label TEXT,
  xp_first INTEGER DEFAULT 500,
  xp_top5 INTEGER DEFAULT 300,
  xp_others INTEGER DEFAULT 150,
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ NOT NULL,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE boss_battle_solves (
  id BIGSERIAL PRIMARY KEY,
  boss_id BIGINT REFERENCES boss_battles(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id),
  solved_at TIMESTAMPTZ DEFAULT NOW(),
  solve_rank INTEGER,
  xp_awarded INTEGER,
  UNIQUE(boss_id, user_id)
);

ALTER TABLE boss_battles ENABLE ROW LEVEL SECURITY;
ALTER TABLE boss_battle_solves ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Boss battles viewable by authenticated" ON boss_battles FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Boss solves viewable by authenticated" ON boss_battle_solves FOR SELECT USING (auth.role() = 'authenticated');

CREATE INDEX idx_boss_dates ON boss_battles(starts_at, ends_at);
CREATE INDEX idx_boss_solves_boss ON boss_battle_solves(boss_id);
CREATE INDEX idx_boss_solves_user ON boss_battle_solves(user_id);

-- =============================================
-- PROBLEMS (Feed, Reactions, Bookmarks, Daily)
-- =============================================
CREATE TABLE shared_problems (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES profiles(id),
  platform TEXT NOT NULL,
  problem_id TEXT,
  problem_url TEXT NOT NULL,
  problem_title TEXT NOT NULL,
  difficulty TEXT,
  tags TEXT[] DEFAULT '{}',
  note TEXT,
  source TEXT DEFAULT 'manual',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE problem_reactions (
  id BIGSERIAL PRIMARY KEY,
  problem_id BIGINT REFERENCES shared_problems(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id),
  reaction TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(problem_id, user_id)
);

CREATE TABLE problem_bookmarks (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  problem_id BIGINT REFERENCES shared_problems(id) ON DELETE CASCADE,
  list_type TEXT DEFAULT 'want_to_solve',
  solved BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, problem_id)
);

CREATE TABLE daily_problems (
  id BIGSERIAL PRIMARY KEY,
  date DATE UNIQUE NOT NULL,
  problem_id TEXT NOT NULL,
  problem_name TEXT NOT NULL,
  problem_rating INTEGER,
  problem_url TEXT NOT NULL,
  tags TEXT[] DEFAULT '{}',
  is_admin_curated BOOLEAN DEFAULT FALSE,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE daily_problem_solves (
  id BIGSERIAL PRIMARY KEY,
  daily_id BIGINT REFERENCES daily_problems(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id),
  solved_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(daily_id, user_id)
);

ALTER TABLE shared_problems ENABLE ROW LEVEL SECURITY;
ALTER TABLE problem_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE problem_bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_problems ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_problem_solves ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Shared problems viewable by authenticated" ON shared_problems FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Users can share problems" ON shared_problems FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Reactions viewable by authenticated" ON problem_reactions FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Users can react" ON problem_reactions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can remove own reaction" ON problem_reactions FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Bookmarks viewable by own user" ON problem_bookmarks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can bookmark" ON problem_bookmarks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can remove bookmark" ON problem_bookmarks FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Daily problems viewable by authenticated" ON daily_problems FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Daily solves viewable by authenticated" ON daily_problem_solves FOR SELECT USING (auth.role() = 'authenticated');

CREATE INDEX idx_shared_problems_user ON shared_problems(user_id);
CREATE INDEX idx_shared_problems_platform ON shared_problems(platform);
CREATE INDEX idx_shared_problems_created ON shared_problems(created_at);
CREATE INDEX idx_problem_reactions_problem ON problem_reactions(problem_id);
CREATE INDEX idx_bookmarks_user ON problem_bookmarks(user_id);
CREATE INDEX idx_daily_date ON daily_problems(date);
CREATE INDEX idx_daily_solves_daily ON daily_problem_solves(daily_id);

-- =============================================
-- NOTIFICATIONS
-- =============================================
CREATE TABLE notifications (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  data JSONB,
  read BOOLEAN DEFAULT FALSE,
  push_sent BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications" ON notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own notifications" ON notifications FOR UPDATE USING (auth.uid() = user_id);

CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(user_id, read);
CREATE INDEX idx_notifications_created ON notifications(created_at);

-- =============================================
-- ATTENDANCE
-- =============================================
CREATE TABLE courses (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT,
  color TEXT DEFAULT '#00f0ff',
  is_active BOOLEAN DEFAULT TRUE,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE attendance_records (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  course_id BIGINT REFERENCES courses(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  slot INTEGER DEFAULT 1,
  status TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, course_id, date, slot)
);

ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Courses viewable by authenticated" ON courses FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Attendance viewable by own user" ON attendance_records FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can mark attendance" ON attendance_records FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own attendance" ON attendance_records FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own attendance" ON attendance_records FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX idx_attendance_user ON attendance_records(user_id);
CREATE INDEX idx_attendance_course ON attendance_records(course_id);
CREATE INDEX idx_attendance_date ON attendance_records(date);

-- =============================================
-- FLASHCARDS
-- =============================================
CREATE TABLE flashcard_decks (
  id BIGSERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  tags TEXT[] DEFAULT '{}',
  card_count INTEGER DEFAULT 0,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE flashcards (
  id BIGSERIAL PRIMARY KEY,
  deck_id BIGINT REFERENCES flashcard_decks(id) ON DELETE CASCADE,
  front TEXT NOT NULL,
  back TEXT NOT NULL,
  position INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE flashcard_progress (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  card_id BIGINT REFERENCES flashcards(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'unseen',
  last_reviewed_at TIMESTAMPTZ,
  UNIQUE(user_id, card_id)
);

ALTER TABLE flashcard_decks ENABLE ROW LEVEL SECURITY;
ALTER TABLE flashcards ENABLE ROW LEVEL SECURITY;
ALTER TABLE flashcard_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Decks viewable by authenticated" ON flashcard_decks FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Cards viewable by authenticated" ON flashcards FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Progress viewable by own user" ON flashcard_progress FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can track progress" ON flashcard_progress FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update progress" ON flashcard_progress FOR UPDATE USING (auth.uid() = user_id);

CREATE INDEX idx_flashcards_deck ON flashcards(deck_id);
CREATE INDEX idx_flashcard_progress_user ON flashcard_progress(user_id);

-- =============================================
-- RESOURCES
-- =============================================
CREATE TABLE resources (
  id BIGSERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  description TEXT,
  topic TEXT NOT NULL,
  submitted_by UUID REFERENCES profiles(id),
  approved_by UUID REFERENCES profiles(id),
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE resources ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Approved resources viewable by authenticated" ON resources FOR SELECT USING (
  auth.role() = 'authenticated' AND (status = 'approved' OR submitted_by = auth.uid())
);
CREATE POLICY "Users can submit resources" ON resources FOR INSERT WITH CHECK (auth.uid() = submitted_by);

CREATE INDEX idx_resources_topic ON resources(topic);
CREATE INDEX idx_resources_status ON resources(status);

-- =============================================
-- ANNOUNCEMENTS & DIGESTS
-- =============================================
CREATE TABLE announcements (
  id BIGSERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  priority TEXT DEFAULT 'normal',
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE weekly_digests (
  id BIGSERIAL PRIMARY KEY,
  week_start DATE NOT NULL,
  content JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE weekly_digests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Announcements viewable by authenticated" ON announcements FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Digests viewable by authenticated" ON weekly_digests FOR SELECT USING (auth.role() = 'authenticated');

CREATE INDEX idx_announcements_created ON announcements(created_at);

-- =============================================
-- HALL OF FAME
-- =============================================
CREATE TABLE hall_of_fame (
  id BIGSERIAL PRIMARY KEY,
  category TEXT NOT NULL,
  user_id UUID REFERENCES profiles(id),
  title TEXT NOT NULL,
  value TEXT,
  period TEXT,
  achieved_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE hall_of_fame ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Hall of fame viewable by authenticated" ON hall_of_fame FOR SELECT USING (auth.role() = 'authenticated');

CREATE INDEX idx_hof_category ON hall_of_fame(category);
CREATE INDEX idx_hof_user ON hall_of_fame(user_id);

-- =============================================
-- SEED BADGES
-- =============================================
INSERT INTO badges (id, name, description, icon, category, condition_type, condition_value) VALUES
  -- Solve badges
  ('first_blood',      'First Blood',         'Solve your first problem',                    '🩸', 'solve',   'auto', '{"type": "total_solves", "count": 1}'),
  ('ten_down',         'Ten Down',            'Solve 10 problems',                           '🔟', 'solve',   'auto', '{"type": "total_solves", "count": 10}'),
  ('century',          'Century',             'Solve 100 problems',                          '💯', 'solve',   'auto', '{"type": "total_solves", "count": 100}'),
  ('five_hundo',       'Five Hundo',          'Solve 500 problems',                          '🏅', 'solve',   'auto', '{"type": "total_solves", "count": 500}'),
  ('thousand_club',    'Thousand Club',       'Solve 1000 problems',                         '👑', 'solve',   'auto', '{"type": "total_solves", "count": 1000}'),
  ('daily_devotee',    'Daily Devotee',       'Solve 10 daily problems',                     '📅', 'solve',   'auto', '{"type": "daily_solves", "count": 10}'),
  ('problem_connoisseur', 'Problem Connoisseur', 'Solve problems in 10+ different topics',   '🎯', 'solve',   'auto', '{"type": "unique_topics", "count": 10}'),
  -- Streak badges
  ('on_fire_3',        'Warming Up',          '3-day solve streak',                          '🔥', 'streak',  'auto', '{"type": "streak", "days": 3}'),
  ('on_fire_7',        'On Fire',             '7-day solve streak',                          '🔥', 'streak',  'auto', '{"type": "streak", "days": 7}'),
  ('on_fire_14',       'Blazing',             '14-day solve streak',                         '🌋', 'streak',  'auto', '{"type": "streak", "days": 14}'),
  ('on_fire_30',       'Inferno',             '30-day solve streak',                         '☄️', 'streak',  'auto', '{"type": "streak", "days": 30}'),
  ('on_fire_60',       'Supernova',           '60-day solve streak',                         '💫', 'streak',  'auto', '{"type": "streak", "days": 60}'),
  -- Social badges
  ('sharer',           'Sharer',              'Share your first problem',                    '📤', 'social',  'auto', '{"type": "problems_shared", "count": 1}'),
  ('curator',          'Curator',             'Share 10 problems',                           '📚', 'social',  'auto', '{"type": "problems_shared", "count": 10}'),
  ('resource_guru',    'Resource Guru',       'Get 3 resources approved',                    '🧑‍🏫', 'social',  'auto', '{"type": "resources_approved", "count": 3}'),
  -- Contest badges
  ('duel_initiate',    'Duel Initiate',       'Win your first duel',                         '⚔️', 'contest', 'auto', '{"type": "duels_won", "count": 1}'),
  ('duel_master',      'Duel Master',         'Win 10 duels',                                '🗡️', 'contest', 'auto', '{"type": "duels_won", "count": 10}'),
  ('boss_slayer',      'Boss Slayer',         'Defeat your first boss',                      '💀', 'contest', 'auto', '{"type": "bosses_defeated", "count": 1}'),
  ('boss_hunter',      'Boss Hunter',         'Defeat 5 bosses',                             '🏹', 'contest', 'auto', '{"type": "bosses_defeated", "count": 5}'),
  ('speed_demon',      'Speed Demon',         'First solve in a boss battle',                '⚡', 'contest', 'auto', '{"type": "boss_first_solves", "count": 1}'),
  ('quest_completer',  'Quest Completer',     'Complete all quests in a week',                '✅', 'contest', 'auto', '{"type": "all_quests_week", "count": 1}'),
  -- Special badges
  ('genesis',          'Genesis',             'One of the first to join co.arc',              '🌱', 'special', 'manual', NULL),
  ('dark_horse',       'Dark Horse',          'Climb 10+ ranks in one sync cycle',            '🐴', 'special', 'auto', '{"type": "rank_climb", "positions": 10}'),
  ('night_owl',        'Night Owl',           'Solve a problem between 2-5 AM',               '🦉', 'special', 'auto', '{"type": "solve_hour_range", "start": 2, "end": 5}'),
  ('early_bird',       'Early Bird',          'Solve a problem between 5-7 AM',               '🐦', 'special', 'auto', '{"type": "solve_hour_range", "start": 5, "end": 7}'),
  ('comeback_kid',     'Comeback Kid',        'Restart a streak after losing a 7+ day streak','🔄', 'special', 'auto', '{"type": "streak_restart_after", "min_lost": 7}')
ON CONFLICT (id) DO NOTHING;
