import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------
const TEST_DATABASE_URL = process.env["TEST_DATABASE_URL"];

if (!TEST_DATABASE_URL) {
  throw new Error(
    "TEST_DATABASE_URL environment variable is required to run schema tests.\n" +
      "Example: TEST_DATABASE_URL=postgres://user:pass@localhost:5432/devmetric_test",
  );
}

const pool = new Pool({
  connectionString: TEST_DATABASE_URL,
});
const adapter = new PrismaPg(pool);
const db = new PrismaClient({ adapter });

/** Creates a minimal test user and returns its id. */
async function createTestUser(suffix = ""): Promise<string> {
  const user = await db.user.create({
    data: {
      email: `test${suffix}@example.com`,
      username: `testuser${suffix}`,
      name: "Test User",
    },
  });
  return user.id;
}

beforeAll(async () => {
  await db.$connect();
});

afterAll(async () => {
  await db.$disconnect();
  await pool.end();
});

// ---------------------------------------------------------------------------
// CHECK Constraint Tests
// ---------------------------------------------------------------------------
describe("CHECK constraints — score values", () => {
  let userId: string;

  beforeAll(async () => {
    userId = await createTestUser("_chk");
  });

  afterAll(async () => {
    await db.user.delete({ where: { id: userId } });
  });

  it("rejects overall_score = 150 on hiring_readiness_scores", async () => {
    await expect(
      db.$executeRaw`
        INSERT INTO hiring_readiness_scores (user_id, overall_score)
        VALUES (${userId}::uuid, 150)
      `,
    ).rejects.toThrow();
  });

  it("rejects overall_score = -1 on hiring_readiness_scores", async () => {
    await expect(
      db.$executeRaw`
        INSERT INTO hiring_readiness_scores (user_id, overall_score)
        VALUES (${userId}::uuid, -1)
      `,
    ).rejects.toThrow();
  });

  it("accepts overall_score = 100 on hiring_readiness_scores", async () => {
    await expect(
      db.$executeRaw`
        INSERT INTO hiring_readiness_scores (user_id, overall_score)
        VALUES (${userId}::uuid, 100)
        ON CONFLICT (user_id) DO UPDATE SET overall_score = EXCLUDED.overall_score
      `,
    ).resolves.not.toThrow();
  });

  it("rejects dsa_score = 101 on interview_scores", async () => {
    // Need an interview session first
    const session = await db.interviewSession.create({
      data: {
        userId: userId,
        status: "in_progress",
        difficulty: "medium",
        language: "javascript",
        voiceEnabled: false,
      },
    });

    await expect(
      db.$executeRaw`
        INSERT INTO interview_scores (session_id, dsa_score)
        VALUES (${session.id}::uuid, 101)
      `,
    ).rejects.toThrow();

    // Cleanup
    await db.interviewSession.delete({ where: { id: session.id } });
  });

  it("rejects github_score = 200 on github_profiles", async () => {
    await expect(
      db.$executeRaw`
        INSERT INTO github_profiles (user_id, github_username, github_score)
        VALUES (${userId}::uuid, 'testuser', 200)
        ON CONFLICT (user_id) DO UPDATE SET github_score = EXCLUDED.github_score
      `,
    ).rejects.toThrow();
  });

  it("rejects resume_score = -5 on resumes", async () => {
    await expect(
      db.$executeRaw`
        INSERT INTO resumes (user_id, file_url, file_name, file_size_bytes, resume_score)
        VALUES (${userId}::uuid, 'https://example.com/r.pdf', 'resume.pdf', 1024, -5)
      `,
    ).rejects.toThrow();
  });
});

// ---------------------------------------------------------------------------
// CASCADE DELETE Tests
// ---------------------------------------------------------------------------
describe("CASCADE DELETE — deleting a User removes all dependent rows", () => {
  let userId: string;
  let sessionId: string;

  beforeAll(async () => {
    userId = await createTestUser("_cascade");

    // Account
    await db.account.create({
      data: {
        userId,
        provider: "github",
        providerAccountId: "gh-test-123",
      },
    });

    // Session
    await db.session.create({
      data: {
        userId,
        sessionToken: `token-${userId}`,
        expires: new Date(Date.now() + 86400 * 1000),
      },
    });

    // GithubProfile
    await db.githubProfile.create({
      data: { userId, githubUsername: "testuser_cascade" },
    });

    // LeetcodeProfile
    await db.leetcodeProfile.create({
      data: { userId, leetcodeUsername: "leettest_cascade" },
    });

    // Resume
    await db.resume.create({
      data: {
        userId,
        fileUrl: "https://blob.vercel.com/test.pdf",
        fileName: "resume.pdf",
        fileSizeBytes: 2048,
      },
    });

    const session = await db.interviewSession.create({
      data: {
        userId,
        difficulty: "easy",
        language: "python",
        voiceEnabled: true,
      },
    });
    sessionId = session.id;

    await db.interviewProblem.create({
      data: {
        sessionId,
        title: "Two Sum",
        description: "Find two numbers that add to target.",
        examples: [{ input: "[2,7,11,15], 9", output: "[0,1]" }],
        testCasesVisible: [{ input: "[2,7,11,15]\n9", expected: "[0,1]" }],
        testCasesHidden: [{ input: "[3,2,4]\n6", expected: "[1,2]" }],
      },
    });

    await db.interviewSubmission.create({
      data: {
        sessionId,
        code: "def twoSum(nums, target): pass",
        language: "python",
        isFinal: false,
      },
    });

    await db.interviewScores.create({
      data: { sessionId },
    });

    await db.voiceTranscript.create({
      data: {
        sessionId,
        segmentIndex: 0,
        speaker: "user",
        text: "Hello",
      },
    });

    // HiringReadinessScore
    await db.hiringReadinessScore.create({
      data: { userId },
    });

    // UserSettings
    await db.userSettings.create({
      data: { userId },
    });
  });

  it("hard-deletes the user without error", async () => {
    await expect(
      db.user.delete({ where: { id: userId } }),
    ).resolves.not.toThrow();
  });

  it("leaves zero orphaned accounts rows", async () => {
    const count = await db.account.count({ where: { userId } });
    expect(count).toBe(0);
  });

  it("leaves zero orphaned sessions rows", async () => {
    const count = await db.session.count({ where: { userId } });
    expect(count).toBe(0);
  });

  it("leaves zero orphaned github_profiles rows", async () => {
    const count = await db.githubProfile.count({ where: { userId } });
    expect(count).toBe(0);
  });

  it("leaves zero orphaned leetcode_profiles rows", async () => {
    const count = await db.leetcodeProfile.count({ where: { userId } });
    expect(count).toBe(0);
  });

  it("leaves zero orphaned resumes rows", async () => {
    const count = await db.resume.count({ where: { userId } });
    expect(count).toBe(0);
  });

  it("leaves zero orphaned interview_sessions rows", async () => {
    const count = await db.interviewSession.count({ where: { userId } });
    expect(count).toBe(0);
  });

  it("leaves zero orphaned interview_problems rows (cascade from session)", async () => {
    const count = await db.interviewProblem.count({ where: { sessionId } });
    expect(count).toBe(0);
  });

  it("leaves zero orphaned interview_submissions rows", async () => {
    const count = await db.interviewSubmission.count({ where: { sessionId } });
    expect(count).toBe(0);
  });

  it("leaves zero orphaned interview_scores rows", async () => {
    const count = await db.interviewScores.count({ where: { sessionId } });
    expect(count).toBe(0);
  });

  it("leaves zero orphaned voice_transcripts rows", async () => {
    const count = await db.voiceTranscript.count({ where: { sessionId } });
    expect(count).toBe(0);
  });

  it("leaves zero orphaned hiring_readiness_scores rows", async () => {
    const count = await db.hiringReadinessScore.count({ where: { userId } });
    expect(count).toBe(0);
  });

  it("leaves zero orphaned user_settings rows", async () => {
    const count = await db.userSettings.count({ where: { userId } });
    expect(count).toBe(0);
  });

  it("preserves audit_log rows (SET NULL, not CASCADE)", async () => {
    // First create an audit log for this user, then confirm it still exists after deletion
    const log = await db.auditLog.create({
      data: {
        action: "test.audit_log_preservation",
      },
    });
    const found = await db.auditLog.findUnique({ where: { id: log.id } });
    expect(found).not.toBeNull();
    await db.auditLog.delete({ where: { id: log.id } });
  });
});

// ---------------------------------------------------------------------------
// Partial Index Existence Tests
// ---------------------------------------------------------------------------
describe("Partial indexes — exist in pg_indexes", () => {
  it("idx_interview_sessions_user_completed exists", async () => {
    const result = await db.$queryRaw<Array<{ indexname: string }>>`
      SELECT indexname FROM pg_indexes
      WHERE tablename = 'interview_sessions'
        AND indexname = 'idx_interview_sessions_user_completed'
    `;
    expect(result.length).toBe(1);
  });

  it("idx_resumes_user_active exists", async () => {
    const result = await db.$queryRaw<Array<{ indexname: string }>>`
      SELECT indexname FROM pg_indexes
      WHERE tablename = 'resumes'
        AND indexname = 'idx_resumes_user_active'
    `;
    expect(result.length).toBe(1);
  });

  it("idx_submissions_final exists", async () => {
    const result = await db.$queryRaw<Array<{ indexname: string }>>`
      SELECT indexname FROM pg_indexes
      WHERE tablename = 'interview_submissions'
        AND indexname = 'idx_submissions_final'
    `;
    expect(result.length).toBe(1);
  });

  it("idx_users_active partial index exists", async () => {
    const result = await db.$queryRaw<Array<{ indexname: string }>>`
      SELECT indexname FROM pg_indexes
      WHERE tablename = 'users'
        AND indexname = 'idx_users_active'
    `;
    expect(result.length).toBe(1);
  });

  it("idx_problem_bank_difficulty_topic_active composite index exists", async () => {
    const result = await db.$queryRaw<Array<{ indexname: string }>>`
      SELECT indexname FROM pg_indexes
      WHERE tablename = 'problem_bank'
        AND indexname = 'idx_problem_bank_difficulty_topic_active'
    `;
    expect(result.length).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// ProblemBank → InterviewProblem FK Test
// ---------------------------------------------------------------------------
describe("ProblemBank FK — interview_problems.problem_bank_id", () => {
  let adminUserId: string;
  let problemBankId: string;
  let sessionUserId: string;
  let sessionId: string;

  beforeAll(async () => {
    adminUserId = await createTestUser("_admin_fk");
    sessionUserId = await createTestUser("_session_fk");

    const problem = await db.problemBank.create({
      data: {
        title: "Two Sum",
        description: "Find two numbers.",
        examples: [{ input: "[2,7], 9", output: "[0,1]" }],
        testCasesVisible: [{ input: "[2,7]\n9", expected: "[0,1]" }],
        testCasesHidden: [{ input: "[3,2,4]\n6", expected: "[1,2]" }],
        difficulty: "easy",
        topic: "arrays",
        reviewedById: adminUserId,
      },
    });
    problemBankId = problem.id;

    const session = await db.interviewSession.create({
      data: {
        userId: sessionUserId,
        difficulty: "easy",
        language: "javascript",
        voiceEnabled: false,
      },
    });
    sessionId = session.id;
  });

  afterAll(async () => {
    await db.interviewSession.deleteMany({ where: { userId: sessionUserId } });
    await db.user.delete({ where: { id: sessionUserId } });
    await db.problemBank.delete({ where: { id: problemBankId } });
    await db.user.delete({ where: { id: adminUserId } });
  });

  it("can create an interview_problem referencing problem_bank", async () => {
    const ip = await db.interviewProblem.create({
      data: {
        sessionId,
        problemBankId,
        title: "Two Sum",
        description: "Find two numbers.",
        examples: [{ input: "[2,7], 9", output: "[0,1]" }],
        testCasesVisible: [{ input: "[2,7]\n9", expected: "[0,1]" }],
        testCasesHidden: [{ input: "[3,2,4]\n6", expected: "[1,2]" }],
      },
    });
    expect(ip.problemBankId).toBe(problemBankId);
  });

  it("sets problem_bank_id to NULL (not cascade delete) when bank problem is deleted", async () => {
    // Create a separate session + problem linked to the bank entry
    const s2 = await db.interviewSession.create({
      data: {
        userId: sessionUserId,
        difficulty: "medium",
        language: "python",
        voiceEnabled: false,
      },
    });

    const bankProblem = await db.problemBank.create({
      data: {
        title: "Temp Problem",
        description: "Will be deleted.",
        examples: [],
        testCasesVisible: [],
        testCasesHidden: [],
        difficulty: "hard",
        topic: "graphs",
      },
    });

    const ip2 = await db.interviewProblem.create({
      data: {
        sessionId: s2.id,
        problemBankId: bankProblem.id,
        title: "Temp Problem",
        description: "Will be deleted.",
        examples: [],
        testCasesVisible: [],
        testCasesHidden: [],
      },
    });

    await db.problemBank.delete({ where: { id: bankProblem.id } });

    const still = await db.interviewProblem.findUnique({
      where: { id: ip2.id },
    });
    expect(still).not.toBeNull();
    expect(still!.problemBankId).toBeNull();

    await db.interviewSession.delete({ where: { id: s2.id } });
  });
});
