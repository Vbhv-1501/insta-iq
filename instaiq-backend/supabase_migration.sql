-- ════════════════════════════════════════════════════════════
-- InstaIQ — Supabase Migration v1
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- ════════════════════════════════════════════════════════════

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";  -- for username search


-- ── USERS ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email          TEXT UNIQUE NOT NULL,
  hashed_password TEXT,
  full_name      TEXT,
  plan           TEXT NOT NULL DEFAULT 'free' CHECK (plan IN ('free','pro','enterprise')),
  is_active      BOOLEAN NOT NULL DEFAULT TRUE,
  is_verified    BOOLEAN NOT NULL DEFAULT FALSE,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX ix_users_email ON users (email);


-- ── INSTAGRAM PROFILES ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS instagram_profiles (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  username          TEXT UNIQUE NOT NULL,
  full_name         TEXT,
  bio               TEXT,
  followers_count   INTEGER DEFAULT 0,
  following_count   INTEGER DEFAULT 0,
  post_count        INTEGER DEFAULT 0,
  is_verified       BOOLEAN DEFAULT FALSE,
  is_private        BOOLEAN DEFAULT FALSE,
  profile_pic_url   TEXT,
  external_url      TEXT,
  category          TEXT,
  raw_data          JSONB,
  fetched_at        TIMESTAMPTZ DEFAULT NOW(),
  cache_expires_at  TIMESTAMPTZ
);

CREATE INDEX ix_profiles_username ON instagram_profiles (username);
CREATE INDEX ix_profiles_username_trgm ON instagram_profiles USING gin (username gin_trgm_ops);


-- ── FOLLOWERS ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS followers (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  source_username     TEXT NOT NULL,
  follower_username   TEXT NOT NULL,
  follower_bio        TEXT,
  follower_full_name  TEXT,
  is_verified         BOOLEAN DEFAULT FALSE,
  is_private          BOOLEAN DEFAULT FALSE,
  followers_count     INTEGER DEFAULT 0,
  following_count     INTEGER DEFAULT 0,
  post_count          INTEGER DEFAULT 0,
  detected_language   TEXT,
  detected_country    TEXT,
  country_confidence  REAL DEFAULT 0,
  bot_score           REAL DEFAULT 0,
  sampled_at          TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (source_username, follower_username)
);

CREATE INDEX ix_followers_source      ON followers (source_username);
CREATE INDEX ix_followers_country     ON followers (detected_country);
CREATE INDEX ix_followers_bot_score   ON followers (bot_score);


-- ── ANALYSIS REPORTS ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS analysis_reports (
  id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id                 UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  username                TEXT NOT NULL,
  status                  TEXT NOT NULL DEFAULT 'pending'
                            CHECK (status IN ('pending','processing','complete','failed')),
  sample_size             INTEGER DEFAULT 0,
  quality_score           REAL,
  engagement_score        REAL,
  bot_probability         REAL,
  inactive_pct            REAL,
  verified_pct            REAL,
  country_distribution    JSONB,
  language_distribution   JSONB,
  bio_keywords            JSONB,
  follower_growth         JSONB,
  bot_breakdown           JSONB,
  engagement_trend        JSONB,
  ai_summary              TEXT,
  ai_insights             JSONB,
  error_message           TEXT,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at            TIMESTAMPTZ
);

CREATE INDEX ix_reports_user_id   ON analysis_reports (user_id);
CREATE INDEX ix_reports_username  ON analysis_reports (username);
CREATE INDEX ix_reports_status    ON analysis_reports (status);
CREATE INDEX ix_reports_created   ON analysis_reports (created_at DESC);


-- ── USAGE RECORDS ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS usage_records (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date            DATE NOT NULL,
  analyses_count  INTEGER DEFAULT 0,
  UNIQUE (user_id, date)
);

CREATE INDEX ix_usage_user_date ON usage_records (user_id, date);


-- ════════════════════════════════════════════════════════════
-- ROW LEVEL SECURITY
-- ════════════════════════════════════════════════════════════

ALTER TABLE users              ENABLE ROW LEVEL SECURITY;
ALTER TABLE analysis_reports   ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_records      ENABLE ROW LEVEL SECURITY;

-- Users can only read/write their own rows
CREATE POLICY "users_self" ON users
  FOR ALL USING (auth.uid()::text = id::text);

-- Reports are private to the owning user
CREATE POLICY "reports_owner" ON analysis_reports
  FOR ALL USING (auth.uid()::text = user_id::text);

-- Usage records are private to the owning user
CREATE POLICY "usage_owner" ON usage_records
  FOR ALL USING (auth.uid()::text = user_id::text);

-- Profiles and followers are readable by all authenticated users (shared cache)
CREATE POLICY "profiles_authenticated_read" ON instagram_profiles
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "followers_authenticated_read" ON followers
  FOR SELECT USING (auth.role() = 'authenticated');


-- ════════════════════════════════════════════════════════════
-- HELPER FUNCTIONS
-- ════════════════════════════════════════════════════════════

-- Auto-update updated_at on users table
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();


-- Cleanup expired profile cache entries (call from a cron job)
CREATE OR REPLACE FUNCTION purge_expired_profiles()
RETURNS INTEGER AS $$
DECLARE deleted INTEGER;
BEGIN
  DELETE FROM instagram_profiles
  WHERE cache_expires_at < NOW();
  GET DIAGNOSTICS deleted = ROW_COUNT;
  RETURN deleted;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- Get follower count sampled for a username
CREATE OR REPLACE FUNCTION get_follower_sample_count(p_username TEXT)
RETURNS INTEGER AS $$
  SELECT COUNT(*)::INTEGER FROM followers WHERE source_username = p_username;
$$ LANGUAGE sql STABLE;
