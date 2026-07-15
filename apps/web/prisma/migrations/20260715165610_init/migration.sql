-- DropForeignKey
ALTER TABLE "accounts" DROP CONSTRAINT "accounts_user_id_fkey";

-- DropForeignKey
ALTER TABLE "audit_logs" DROP CONSTRAINT "audit_logs_user_id_fkey";

-- DropForeignKey
ALTER TABLE "github_profiles" DROP CONSTRAINT "github_profiles_user_id_fkey";

-- DropForeignKey
ALTER TABLE "hiring_readiness_scores" DROP CONSTRAINT "hiring_readiness_scores_user_id_fkey";

-- DropForeignKey
ALTER TABLE "interview_problems" DROP CONSTRAINT "interview_problems_problem_bank_id_fkey";

-- DropForeignKey
ALTER TABLE "interview_problems" DROP CONSTRAINT "interview_problems_session_id_fkey";

-- DropForeignKey
ALTER TABLE "interview_scores" DROP CONSTRAINT "interview_scores_session_id_fkey";

-- DropForeignKey
ALTER TABLE "interview_sessions" DROP CONSTRAINT "interview_sessions_user_id_fkey";

-- DropForeignKey
ALTER TABLE "interview_submissions" DROP CONSTRAINT "interview_submissions_session_id_fkey";

-- DropForeignKey
ALTER TABLE "leetcode_profiles" DROP CONSTRAINT "leetcode_profiles_user_id_fkey";

-- DropForeignKey
ALTER TABLE "problem_bank" DROP CONSTRAINT "problem_bank_reviewed_by_fkey";

-- DropForeignKey
ALTER TABLE "resumes" DROP CONSTRAINT "resumes_user_id_fkey";

-- DropForeignKey
ALTER TABLE "sessions" DROP CONSTRAINT "sessions_user_id_fkey";

-- DropForeignKey
ALTER TABLE "user_settings" DROP CONSTRAINT "user_settings_user_id_fkey";

-- DropForeignKey
ALTER TABLE "voice_transcripts" DROP CONSTRAINT "voice_transcripts_session_id_fkey";

-- DropIndex
DROP INDEX "idx_problem_bank_difficulty_topic_active";

-- AlterTable
ALTER TABLE "accounts" ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "updated_at" DROP DEFAULT;

-- AlterTable
ALTER TABLE "audit_logs" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "github_profiles" ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "recommendations" DROP DEFAULT,
ALTER COLUMN "updated_at" DROP DEFAULT;

-- AlterTable
ALTER TABLE "hiring_readiness_scores" ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "updated_at" DROP DEFAULT;

-- AlterTable
ALTER TABLE "interview_problems" ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "constraints" DROP DEFAULT,
ALTER COLUMN "tags" DROP DEFAULT;

-- AlterTable
ALTER TABLE "interview_scores" ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "improvements" DROP DEFAULT;

-- AlterTable
ALTER TABLE "interview_sessions" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "interview_submissions" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "leetcode_profiles" ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "weak_topics" DROP DEFAULT,
ALTER COLUMN "updated_at" DROP DEFAULT;

-- AlterTable
ALTER TABLE "problem_bank" ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "constraints" DROP DEFAULT,
ALTER COLUMN "tags" DROP DEFAULT,
ALTER COLUMN "updated_at" DROP DEFAULT;

-- AlterTable
ALTER TABLE "resumes" ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "missing_keywords" DROP DEFAULT,
ALTER COLUMN "updated_at" DROP DEFAULT;

-- AlterTable
ALTER TABLE "sessions" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "user_settings" ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "updated_at" DROP DEFAULT;

-- AlterTable
ALTER TABLE "users" ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "target_companies" DROP DEFAULT,
ALTER COLUMN "updated_at" DROP DEFAULT;

-- AlterTable
ALTER TABLE "voice_transcripts" ALTER COLUMN "id" DROP DEFAULT;

-- AddForeignKey
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "github_profiles" ADD CONSTRAINT "github_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leetcode_profiles" ADD CONSTRAINT "leetcode_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "resumes" ADD CONSTRAINT "resumes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "problem_bank" ADD CONSTRAINT "problem_bank_reviewed_by_fkey" FOREIGN KEY ("reviewed_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "interview_sessions" ADD CONSTRAINT "interview_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "interview_problems" ADD CONSTRAINT "interview_problems_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "interview_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "interview_problems" ADD CONSTRAINT "interview_problems_problem_bank_id_fkey" FOREIGN KEY ("problem_bank_id") REFERENCES "problem_bank"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "interview_submissions" ADD CONSTRAINT "interview_submissions_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "interview_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "interview_scores" ADD CONSTRAINT "interview_scores_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "interview_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "voice_transcripts" ADD CONSTRAINT "voice_transcripts_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "interview_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hiring_readiness_scores" ADD CONSTRAINT "hiring_readiness_scores_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_settings" ADD CONSTRAINT "user_settings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- RenameIndex
ALTER INDEX "idx_accounts_user_id" RENAME TO "accounts_user_id_idx";

-- RenameIndex
ALTER INDEX "idx_audit_logs_created_at" RENAME TO "audit_logs_created_at_idx";

-- RenameIndex
ALTER INDEX "idx_audit_logs_user_id" RENAME TO "audit_logs_user_id_idx";

-- RenameIndex
ALTER INDEX "idx_interview_problems_bank_id" RENAME TO "interview_problems_problem_bank_id_idx";

-- RenameIndex
ALTER INDEX "idx_interview_sessions_status" RENAME TO "interview_sessions_status_idx";

-- RenameIndex
ALTER INDEX "idx_interview_sessions_user_id" RENAME TO "interview_sessions_user_id_idx";

-- RenameIndex
ALTER INDEX "idx_sessions_token" RENAME TO "sessions_session_token_idx";

-- RenameIndex
ALTER INDEX "idx_sessions_user_id" RENAME TO "sessions_user_id_idx";

-- RenameIndex
ALTER INDEX "idx_users_email" RENAME TO "users_email_idx";

-- RenameIndex
ALTER INDEX "idx_users_username" RENAME TO "users_username_idx";

-- RenameIndex
ALTER INDEX "idx_transcripts_session_id" RENAME TO "voice_transcripts_session_id_idx";
