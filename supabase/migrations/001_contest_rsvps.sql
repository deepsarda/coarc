-- Contest RSVPs table for "I'm In" feature
CREATE TABLE IF NOT EXISTS contest_rsvps (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  contest_id INTEGER NOT NULL,
  contest_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, contest_id)
);

ALTER TABLE contest_rsvps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "RSVPs viewable by authenticated" ON contest_rsvps
  FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Users can RSVP" ON contest_rsvps
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can un-RSVP" ON contest_rsvps
  FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX idx_contest_rsvps_contest ON contest_rsvps(contest_id);
CREATE INDEX idx_contest_rsvps_user ON contest_rsvps(user_id);
