-- ============================================================
-- USERS
-- ============================================================
CREATE TABLE "users" (
    "id"               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "email"            VARCHAR(255) UNIQUE NOT NULL,
    "name"             VARCHAR(255),
    "username"         VARCHAR(100) UNIQUE NOT NULL,
    "avatar_url"       TEXT,
    "role"             VARCHAR(50) NOT NULL DEFAULT 'user',
    "target_role"      VARCHAR(100),
    "target_companies" TEXT[] NOT NULL DEFAULT '{}',
    "created_at"       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "updated_at"       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "deleted_at"       TIMESTAMPTZ
);

CREATE INDEX "idx_users_email"    ON "users" ("email");
CREATE INDEX "idx_users_username" ON "users" ("username");
-- Partial index for soft-delete queries — only non-deleted users
CREATE INDEX "idx_users_active"   ON "users" ("id") WHERE "deleted_at" IS NULL;

-- ============================================================
-- AUTH ACCOUNTS (NextAuth adapter)
-- ============================================================
CREATE TABLE "accounts" (
    "id"                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "user_id"             UUID NOT NULL REFERENCES "users" ("id") ON DELETE CASCADE,
    "provider"            VARCHAR(50) NOT NULL,
    "provider_account_id" VARCHAR(255) NOT NULL,
    "access_token"        TEXT,
    "refresh_token"       TEXT,
    "token_type"          VARCHAR(50),
    "scope"               TEXT,
    "expires_at"          BIGINT,
    "created_at"          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "updated_at"          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE ("provider", "provider_account_id")
);

CREATE INDEX "idx_accounts_user_id" ON "accounts" ("user_id");

-- ============================================================
-- SESSIONS (NextAuth database strategy)
-- ============================================================
CREATE TABLE "sessions" (
    "id"            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "user_id"       UUID NOT NULL REFERENCES "users" ("id") ON DELETE CASCADE,
    "session_token" VARCHAR(500) UNIQUE NOT NULL,
    "expires"       TIMESTAMPTZ NOT NULL,
    "created_at"    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX "idx_sessions_token"   ON "sessions" ("session_token");
CREATE INDEX "idx_sessions_user_id" ON "sessions" ("user_id");

-- ============================================================
-- GITHUB PROFILES
-- ============================================================
CREATE TABLE "github_profiles" (
    "id"                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "user_id"               UUID UNIQUE NOT NULL REFERENCES "users" ("id") ON DELETE CASCADE,
    "github_username"       VARCHAR(100) NOT NULL,
    "github_score"          SMALLINT,
    "repo_health_score"     SMALLINT,
    "open_source_score"     SMALLINT,
    "total_repos"           INTEGER NOT NULL DEFAULT 0,
    "total_stars"           INTEGER NOT NULL DEFAULT 0,
    "total_forks"           INTEGER NOT NULL DEFAULT 0,
    "total_commits_year"    INTEGER NOT NULL DEFAULT 0,
    "language_distribution" JSONB,
    "contribution_calendar" JSONB,
    "top_repos"             JSONB,
    "recommendations"       TEXT[] NOT NULL DEFAULT '{}',
    "last_synced_at"        TIMESTAMPTZ,
    "created_at"            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "updated_at"            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE "github_profiles"
    ADD CONSTRAINT "chk_github_score"
        CHECK ("github_score" BETWEEN 0 AND 100),
    ADD CONSTRAINT "chk_github_repo_health_score"
        CHECK ("repo_health_score" BETWEEN 0 AND 100),
    ADD CONSTRAINT "chk_github_open_source_score"
        CHECK ("open_source_score" BETWEEN 0 AND 100);

-- ============================================================
-- LEETCODE PROFILES
-- ============================================================
CREATE TABLE "leetcode_profiles" (
    "id"               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "user_id"          UUID UNIQUE NOT NULL REFERENCES "users" ("id") ON DELETE CASCADE,
    "leetcode_username" VARCHAR(100) NOT NULL,
    "leetcode_score"   SMALLINT,
    "total_solved"     INTEGER NOT NULL DEFAULT 0,
    "easy_solved"      INTEGER NOT NULL DEFAULT 0,
    "medium_solved"    INTEGER NOT NULL DEFAULT 0,
    "hard_solved"      INTEGER NOT NULL DEFAULT 0,
    "contest_rating"   INTEGER,
    "contest_ranking"  INTEGER,
    "streak_days"      INTEGER NOT NULL DEFAULT 0,
    "topic_performance" JSONB,
    "weak_topics"      TEXT[] NOT NULL DEFAULT '{}',
    "recommendations"  JSONB,
    "contest_history"  JSONB,
    "last_synced_at"   TIMESTAMPTZ,
    "created_at"       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "updated_at"       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE "leetcode_profiles"
    ADD CONSTRAINT "chk_leetcode_score"
        CHECK ("leetcode_score" BETWEEN 0 AND 100);

-- ============================================================
-- RESUMES
-- ============================================================
CREATE TABLE "resumes" (
    "id"              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "user_id"         UUID NOT NULL REFERENCES "users" ("id") ON DELETE CASCADE,
    "file_url"        TEXT NOT NULL,
    "file_name"       VARCHAR(255) NOT NULL,
    "file_size_bytes" INTEGER NOT NULL,
    "is_active"       BOOLEAN NOT NULL DEFAULT TRUE,
    "resume_score"    SMALLINT,
    "ats_score"       SMALLINT,
    "formatting_score" SMALLINT,
    "keyword_score"   SMALLINT,
    "impact_score"    SMALLINT,
    "missing_keywords" TEXT[] NOT NULL DEFAULT '{}',
    "weak_bullets"    JSONB,
    "section_feedback" JSONB,
    "analysis_status" VARCHAR(50) NOT NULL DEFAULT 'pending',
    "analyzed_at"     TIMESTAMPTZ,
    "created_at"      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "updated_at"      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE "resumes"
    ADD CONSTRAINT "chk_resume_score"
        CHECK ("resume_score" BETWEEN 0 AND 100),
    ADD CONSTRAINT "chk_resume_ats_score"
        CHECK ("ats_score" BETWEEN 0 AND 100),
    ADD CONSTRAINT "chk_resume_formatting_score"
        CHECK ("formatting_score" BETWEEN 0 AND 100),
    ADD CONSTRAINT "chk_resume_keyword_score"
        CHECK ("keyword_score" BETWEEN 0 AND 100),
    ADD CONSTRAINT "chk_resume_impact_score"
        CHECK ("impact_score" BETWEEN 0 AND 100),
    ADD CONSTRAINT "chk_resume_analysis_status"
        CHECK ("analysis_status" IN ('pending', 'processing', 'complete', 'failed'));

CREATE INDEX "idx_resumes_user_id" ON "resumes" ("user_id");
-- Partial index: used by "get active resume" query — smaller, faster
CREATE INDEX "idx_resumes_user_active" ON "resumes" ("user_id") WHERE "is_active" = TRUE;

-- ============================================================
-- PROBLEM BANK
-- Curated problem library; interview_problems FK references this.
-- ============================================================
CREATE TABLE "problem_bank" (
    "id"                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "title"                    VARCHAR(255) NOT NULL,
    "description"              TEXT NOT NULL,
    "examples"                 JSONB NOT NULL,
    "constraints"              TEXT[] NOT NULL DEFAULT '{}',
    "test_cases_visible"       JSONB NOT NULL,
    "test_cases_hidden"        JSONB NOT NULL,
    "difficulty"               VARCHAR(20) NOT NULL,
    "topic"                    VARCHAR(100) NOT NULL,
    "optimal_time_complexity"  VARCHAR(50),
    "optimal_space_complexity" VARCHAR(50),
    "hints"                    JSONB,
    "tags"                     TEXT[] NOT NULL DEFAULT '{}',
    "is_active"                BOOLEAN NOT NULL DEFAULT TRUE,
    "reviewed_by"              UUID REFERENCES "users" ("id") ON DELETE SET NULL,
    "created_at"               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "updated_at"               TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE "problem_bank"
    ADD CONSTRAINT "chk_problem_bank_difficulty"
        CHECK ("difficulty" IN ('easy', 'medium', 'hard'));

-- Composite index: supports "pick an active problem by difficulty and topic"
CREATE INDEX "idx_problem_bank_difficulty_topic_active"
    ON "problem_bank" ("difficulty", "topic", "is_active");

-- ============================================================
-- INTERVIEW SESSIONS
-- ============================================================
CREATE TABLE "interview_sessions" (
    "id"               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "user_id"          UUID NOT NULL REFERENCES "users" ("id") ON DELETE CASCADE,
    "status"           VARCHAR(50) NOT NULL DEFAULT 'in_progress',
    "difficulty"       VARCHAR(20) NOT NULL,
    "topic"            VARCHAR(100),
    "voice_enabled"    BOOLEAN NOT NULL DEFAULT TRUE,
    "language"         VARCHAR(50) NOT NULL DEFAULT 'javascript',
    "duration_seconds" INTEGER,
    "started_at"       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "completed_at"     TIMESTAMPTZ,
    "created_at"       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE "interview_sessions"
    ADD CONSTRAINT "chk_interview_session_status"
        CHECK ("status" IN ('in_progress', 'completed', 'abandoned')),
    ADD CONSTRAINT "chk_interview_session_difficulty"
        CHECK ("difficulty" IN ('easy', 'medium', 'hard'));

CREATE INDEX "idx_interview_sessions_user_id" ON "interview_sessions" ("user_id");
CREATE INDEX "idx_interview_sessions_status"  ON "interview_sessions" ("status");
-- Composite partial index: used by interview history query (user's completed sessions, newest first)
CREATE INDEX "idx_interview_sessions_user_completed"
    ON "interview_sessions" ("user_id", "completed_at" DESC)
    WHERE "status" = 'completed';

-- ============================================================
-- INTERVIEW PROBLEMS
-- ============================================================
CREATE TABLE "interview_problems" (
    "id"                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "session_id"               UUID UNIQUE NOT NULL REFERENCES "interview_sessions" ("id") ON DELETE CASCADE,
    -- Nullable FK: populated when drawn from problem_bank; NULL for AI-generated
    "problem_bank_id"          UUID REFERENCES "problem_bank" ("id") ON DELETE SET NULL,
    -- Snapshot columns (copied from problem_bank at session creation, or AI-generated)
    "title"                    VARCHAR(255) NOT NULL,
    "description"              TEXT NOT NULL,
    "examples"                 JSONB NOT NULL,
    "constraints"              TEXT[] NOT NULL DEFAULT '{}',
    "test_cases_visible"       JSONB NOT NULL,
    "test_cases_hidden"        JSONB NOT NULL,
    "optimal_time_complexity"  VARCHAR(50),
    "optimal_space_complexity" VARCHAR(50),
    "hints"                    JSONB,
    "tags"                     TEXT[] NOT NULL DEFAULT '{}',
    "created_at"               TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX "idx_interview_problems_bank_id" ON "interview_problems" ("problem_bank_id");

-- ============================================================
-- INTERVIEW SUBMISSIONS
-- ============================================================
CREATE TABLE "interview_submissions" (
    "id"               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "session_id"       UUID NOT NULL REFERENCES "interview_sessions" ("id") ON DELETE CASCADE,
    "code"             TEXT NOT NULL,
    "language"         VARCHAR(50) NOT NULL,
    "is_final"         BOOLEAN NOT NULL DEFAULT FALSE,
    "judge0_token"     VARCHAR(100),
    "execution_result" JSONB,
    "submitted_at"     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX "idx_submissions_session_id" ON "interview_submissions" ("session_id");
-- Partial index: used to fetch the single final submission per session
CREATE INDEX "idx_submissions_final"
    ON "interview_submissions" ("session_id") WHERE "is_final" = TRUE;

-- ============================================================
-- INTERVIEW SCORES
-- ============================================================
CREATE TABLE "interview_scores" (
    "id"                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "session_id"             UUID UNIQUE NOT NULL REFERENCES "interview_sessions" ("id") ON DELETE CASCADE,
    "communication_score"    SMALLINT,
    "dsa_score"              SMALLINT,
    "code_quality_score"     SMALLINT,
    "optimization_score"     SMALLINT,
    "overall_score"          SMALLINT,
    "feedback"               JSONB,
    "improvements"           TEXT[] NOT NULL DEFAULT '{}',
    "code_analysis"          JSONB,
    "communication_analysis" JSONB,
    "edge_case_report"       JSONB,
    "created_at"             TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE "interview_scores"
    ADD CONSTRAINT "chk_interview_communication_score"
        CHECK ("communication_score" BETWEEN 0 AND 100),
    ADD CONSTRAINT "chk_interview_dsa_score"
        CHECK ("dsa_score" BETWEEN 0 AND 100),
    ADD CONSTRAINT "chk_interview_code_quality_score"
        CHECK ("code_quality_score" BETWEEN 0 AND 100),
    ADD CONSTRAINT "chk_interview_optimization_score"
        CHECK ("optimization_score" BETWEEN 0 AND 100),
    ADD CONSTRAINT "chk_interview_overall_score"
        CHECK ("overall_score" BETWEEN 0 AND 100);

-- ============================================================
-- VOICE TRANSCRIPTS
-- ============================================================
CREATE TABLE "voice_transcripts" (
    "id"            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "session_id"    UUID NOT NULL REFERENCES "interview_sessions" ("id") ON DELETE CASCADE,
    "segment_index" INTEGER NOT NULL,
    "speaker"       VARCHAR(20) NOT NULL,
    "text"          TEXT NOT NULL,
    "timestamp_ms"  INTEGER,
    "confidence"    DECIMAL(3, 2),
    "created_at"    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE "voice_transcripts"
    ADD CONSTRAINT "chk_voice_transcript_speaker"
        CHECK ("speaker" IN ('user', 'ai')),
    ADD CONSTRAINT "chk_voice_transcript_confidence"
        CHECK ("confidence" IS NULL OR "confidence" BETWEEN 0 AND 1);

CREATE INDEX "idx_transcripts_session_id" ON "voice_transcripts" ("session_id");

-- ============================================================
-- HIRING READINESS SCORES
-- ============================================================
CREATE TABLE "hiring_readiness_scores" (
    "id"                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "user_id"             UUID UNIQUE NOT NULL REFERENCES "users" ("id") ON DELETE CASCADE,
    "overall_score"       SMALLINT,
    "level"               VARCHAR(50),
    "github_component"    SMALLINT,
    "leetcode_component"  SMALLINT,
    "resume_component"    SMALLINT,
    "interview_component" SMALLINT,
    "roadmap"             JSONB,
    "improvement_queue"   JSONB,
    "computed_at"         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "created_at"          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "updated_at"          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE "hiring_readiness_scores"
    ADD CONSTRAINT "chk_hiring_overall_score"
        CHECK ("overall_score" BETWEEN 0 AND 100),
    ADD CONSTRAINT "chk_hiring_level"
        CHECK ("level" IN ('not_ready', 'building', 'interview_ready', 'competitive', 'faang_ready'));

-- ============================================================
-- USER SETTINGS
-- ============================================================
CREATE TABLE "user_settings" (
    "id"                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "user_id"             UUID UNIQUE NOT NULL REFERENCES "users" ("id") ON DELETE CASCADE,
    "profile_public"      BOOLEAN NOT NULL DEFAULT TRUE,
    "show_github_score"   BOOLEAN NOT NULL DEFAULT TRUE,
    "show_leetcode_score" BOOLEAN NOT NULL DEFAULT TRUE,
    "show_interview_score" BOOLEAN NOT NULL DEFAULT TRUE,
    "show_resume_score"   BOOLEAN NOT NULL DEFAULT FALSE,
    "email_weekly_digest" BOOLEAN NOT NULL DEFAULT TRUE,
    "email_score_updates" BOOLEAN NOT NULL DEFAULT TRUE,
    "preferred_language"  VARCHAR(50) NOT NULL DEFAULT 'javascript',
    "preferred_voice_lang" VARCHAR(10) NOT NULL DEFAULT 'en-US',
    "theme"               VARCHAR(20) NOT NULL DEFAULT 'system',
    "created_at"          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "updated_at"          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE "user_settings"
    ADD CONSTRAINT "chk_user_settings_theme"
        CHECK ("theme" IN ('light', 'dark', 'system'));

-- ============================================================
-- AUDIT LOGS
-- ============================================================
CREATE TABLE "audit_logs" (
    "id"          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "user_id"     UUID REFERENCES "users" ("id") ON DELETE SET NULL,
    "action"      VARCHAR(100) NOT NULL,
    "entity_type" VARCHAR(100),
    "entity_id"   UUID,
    "metadata"    JSONB,
    "ip_address"  TEXT,
    "user_agent"  TEXT,
    "created_at"  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX "idx_audit_logs_user_id"    ON "audit_logs" ("user_id");
CREATE INDEX "idx_audit_logs_created_at" ON "audit_logs" ("created_at" DESC);
