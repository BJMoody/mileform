PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE,
  display_name TEXT NOT NULL,
  birth_year INTEGER,
  units TEXT NOT NULL DEFAULT 'mi',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS athlete_profiles (
  user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  experience_years REAL NOT NULL DEFAULT 0,
  recent_weekly_mileage REAL,
  planned_mileage_ceiling REAL,
  training_style TEXT NOT NULL DEFAULT 'standard',
  youth_guardrails INTEGER NOT NULL DEFAULT 1,
  settings_json TEXT NOT NULL DEFAULT '{}'
);

CREATE TABLE IF NOT EXISTS prs (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  event_code TEXT NOT NULL,
  distance_m REAL NOT NULL,
  time_s REAL NOT NULL,
  performance_date TEXT,
  surface TEXT,
  source TEXT DEFAULT 'manual',
  confidence REAL DEFAULT 1.0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_prs_user_date ON prs(user_id, performance_date DESC);

CREATE TABLE IF NOT EXISTS goals (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  event_code TEXT NOT NULL,
  distance_m REAL NOT NULL,
  target_time_s REAL NOT NULL,
  target_date TEXT NOT NULL,
  label TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_goals_user_status ON goals(user_id, status);

CREATE TABLE IF NOT EXISTS races (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  race_date TEXT NOT NULL,
  name TEXT NOT NULL,
  distance_m REAL NOT NULL,
  importance TEXT NOT NULL DEFAULT 'B',
  course_type TEXT,
  notes TEXT
);
CREATE INDEX IF NOT EXISTS idx_races_user_date ON races(user_id, race_date);

CREATE TABLE IF NOT EXISTS science_sources (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  year INTEGER,
  doi TEXT,
  url TEXT NOT NULL,
  evidence_type TEXT NOT NULL,
  summary TEXT,
  reviewed_at TEXT
);

CREATE TABLE IF NOT EXISTS workout_templates (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  purpose TEXT,
  prescription_template TEXT NOT NULL,
  zones_json TEXT NOT NULL DEFAULT '[]',
  tags_json TEXT NOT NULL DEFAULT '[]',
  constraints_json TEXT NOT NULL DEFAULT '{}',
  evidence_grade TEXT,
  version INTEGER NOT NULL DEFAULT 1,
  active INTEGER NOT NULL DEFAULT 1
);
CREATE INDEX IF NOT EXISTS idx_workouts_category ON workout_templates(category);

CREATE TABLE IF NOT EXISTS workout_science (
  workout_id TEXT NOT NULL REFERENCES workout_templates(id) ON DELETE CASCADE,
  source_id TEXT NOT NULL REFERENCES science_sources(id) ON DELETE CASCADE,
  relation TEXT NOT NULL DEFAULT 'supports',
  PRIMARY KEY(workout_id, source_id)
);

CREATE TABLE IF NOT EXISTS programs (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  level TEXT,
  country TEXT,
  website TEXT
);

CREATE TABLE IF NOT EXISTS elite_athletes (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  primary_events TEXT,
  public_slug TEXT UNIQUE
);

CREATE TABLE IF NOT EXISTS workout_source_records (
  id TEXT PRIMARY KEY,
  canonical_workout_id TEXT REFERENCES workout_templates(id),
  program_id TEXT REFERENCES programs(id),
  athlete_id TEXT REFERENCES elite_athletes(id),
  source_url TEXT NOT NULL,
  source_title TEXT,
  source_published_at TEXT,
  workout_date TEXT,
  factual_structure TEXT NOT NULL,
  phase_label TEXT,
  event_group TEXT,
  source_tier INTEGER NOT NULL DEFAULT 3,
  verification_status TEXT NOT NULL DEFAULT 'pending',
  notes TEXT
);
CREATE INDEX IF NOT EXISTS idx_source_program ON workout_source_records(program_id);
CREATE INDEX IF NOT EXISTS idx_source_athlete ON workout_source_records(athlete_id);

CREATE TABLE IF NOT EXISTS plans (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  goal_id TEXT REFERENCES goals(id),
  start_date TEXT NOT NULL,
  end_date TEXT NOT NULL,
  engine_version TEXT NOT NULL,
  ruleset_version TEXT NOT NULL,
  library_version TEXT NOT NULL,
  input_snapshot_json TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  superseded_by TEXT REFERENCES plans(id)
);
CREATE INDEX IF NOT EXISTS idx_plans_user_created ON plans(user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS plan_weeks (
  id TEXT PRIMARY KEY,
  plan_id TEXT NOT NULL REFERENCES plans(id) ON DELETE CASCADE,
  week_index INTEGER NOT NULL,
  start_date TEXT NOT NULL,
  phase TEXT NOT NULL,
  target_mileage REAL NOT NULL,
  intent TEXT,
  UNIQUE(plan_id, week_index)
);

CREATE TABLE IF NOT EXISTS planned_sessions (
  id TEXT PRIMARY KEY,
  week_id TEXT NOT NULL REFERENCES plan_weeks(id) ON DELETE CASCADE,
  session_date TEXT NOT NULL,
  session_slot TEXT,
  workout_template_id TEXT REFERENCES workout_templates(id),
  category TEXT NOT NULL,
  title TEXT NOT NULL,
  target_mileage REAL,
  prescription_json TEXT NOT NULL DEFAULT '{}',
  load_rating INTEGER,
  status TEXT NOT NULL DEFAULT 'planned',
  moved_from_date TEXT,
  notes TEXT
);
CREATE INDEX IF NOT EXISTS idx_sessions_week_date ON planned_sessions(week_id, session_date);

CREATE TABLE IF NOT EXISTS activities (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  r2_key TEXT,
  file_type TEXT,
  started_at TEXT,
  duration_s REAL,
  moving_duration_s REAL,
  distance_m REAL,
  avg_hr REAL,
  max_hr REAL,
  avg_cadence REAL,
  avg_pace_s_per_mile REAL,
  pace_cv REAL,
  summary_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_activities_user_started ON activities(user_id, started_at DESC);

CREATE TABLE IF NOT EXISTS activity_intervals (
  id TEXT PRIMARY KEY,
  activity_id TEXT NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
  interval_index INTEGER NOT NULL,
  duration_s REAL,
  distance_m REAL,
  avg_speed_mps REAL,
  avg_hr REAL,
  recovery_s REAL,
  UNIQUE(activity_id, interval_index)
);

CREATE TABLE IF NOT EXISTS session_matches (
  id TEXT PRIMARY KEY,
  activity_id TEXT NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
  planned_session_id TEXT REFERENCES planned_sessions(id) ON DELETE SET NULL,
  execution_score INTEGER,
  completion_score REAL,
  pace_score REAL,
  structure_score REAL,
  steadiness_score REAL,
  flags_json TEXT NOT NULL DEFAULT '[]',
  engine_version TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS engine_rules (
  id TEXT PRIMARY KEY,
  ruleset_version TEXT NOT NULL,
  rule_group TEXT NOT NULL,
  rule_key TEXT NOT NULL,
  config_json TEXT NOT NULL,
  science_source_id TEXT REFERENCES science_sources(id),
  coaching_basis TEXT,
  active INTEGER NOT NULL DEFAULT 1,
  UNIQUE(ruleset_version, rule_key)
);
