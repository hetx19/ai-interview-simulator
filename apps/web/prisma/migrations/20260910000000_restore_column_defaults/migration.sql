-- Restore primary key defaults
ALTER TABLE "users" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();
ALTER TABLE "accounts" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();
ALTER TABLE "sessions" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();
ALTER TABLE "github_profiles" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();
ALTER TABLE "leetcode_profiles" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();
ALTER TABLE "resumes" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();
ALTER TABLE "problem_bank" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();
ALTER TABLE "interview_sessions" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();
ALTER TABLE "interview_problems" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();
ALTER TABLE "interview_submissions" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();
ALTER TABLE "interview_scores" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();
ALTER TABLE "voice_transcripts" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();
ALTER TABLE "hiring_readiness_scores" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();
ALTER TABLE "user_settings" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();
ALTER TABLE "audit_logs" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();

-- Restore array column defaults
ALTER TABLE "users" ALTER COLUMN "target_companies" SET DEFAULT '{}';
ALTER TABLE "github_profiles" ALTER COLUMN "recommendations" SET DEFAULT '{}';
ALTER TABLE "leetcode_profiles" ALTER COLUMN "weak_topics" SET DEFAULT '{}';
ALTER TABLE "resumes" ALTER COLUMN "missing_keywords" SET DEFAULT '{}';
ALTER TABLE "problem_bank" ALTER COLUMN "constraints" SET DEFAULT '{}';
ALTER TABLE "problem_bank" ALTER COLUMN "tags" SET DEFAULT '{}';
ALTER TABLE "interview_problems" ALTER COLUMN "constraints" SET DEFAULT '{}';
ALTER TABLE "interview_problems" ALTER COLUMN "tags" SET DEFAULT '{}';
ALTER TABLE "interview_scores" ALTER COLUMN "improvements" SET DEFAULT '{}';

-- Restore updated_at column defaults
ALTER TABLE "users" ALTER COLUMN "updated_at" SET DEFAULT now();
ALTER TABLE "accounts" ALTER COLUMN "updated_at" SET DEFAULT now();
ALTER TABLE "github_profiles" ALTER COLUMN "updated_at" SET DEFAULT now();
ALTER TABLE "leetcode_profiles" ALTER COLUMN "updated_at" SET DEFAULT now();
ALTER TABLE "resumes" ALTER COLUMN "updated_at" SET DEFAULT now();
ALTER TABLE "problem_bank" ALTER COLUMN "updated_at" SET DEFAULT now();
ALTER TABLE "hiring_readiness_scores" ALTER COLUMN "updated_at" SET DEFAULT now();
ALTER TABLE "user_settings" ALTER COLUMN "updated_at" SET DEFAULT now();
