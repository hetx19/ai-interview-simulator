-- AlterTable
ALTER TABLE "users" ADD COLUMN     "onboarding_completed" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "onboarding_step" VARCHAR(50) NOT NULL DEFAULT 'CONNECT_GITHUB';
