-- Migration: Re-add composite index on problem_bank that was accidentally
-- dropped by migration 20260715165610_init without being re-created.
--
-- This index is required by the architecture specification:
--   Index: idx_problem_bank_difficulty_topic_active
--   Type:  Composite B-tree on (difficulty, topic, is_active)
--   Purpose: "Pick an active problem by difficulty and topic" — used by
--            InterviewService.startInterview() in Stage 7.

CREATE INDEX IF NOT EXISTS "idx_problem_bank_difficulty_topic_active"
    ON "problem_bank" ("difficulty", "topic", "is_active");
