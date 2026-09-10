import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { randomUUID } from "node:crypto";

const TEST_DATABASE_URL = process.env["TEST_DATABASE_URL"];
if (!TEST_DATABASE_URL) {
  throw new Error(
    "TEST_DATABASE_URL is required.\n" +
      "Example: TEST_DATABASE_URL=postgresql://het@localhost:5432/dev_metric_test",
  );
}

const pool = new Pool({ connectionString: TEST_DATABASE_URL });
const adapter = new PrismaPg(pool);
const db = new PrismaClient({ adapter });

beforeAll(async () => {
  await db.$connect();
});

afterAll(async () => {
  await db.$disconnect();
  await pool.end();
});

// helpers
async function createUser(tag = ""): Promise<string> {
  const uid = randomUUID().slice(0, 8);
  const u = await db.user.create({
    data: {
      email: `ctest_${uid}_${tag}@devmetric.test`,
      username: `ctest_${uid}_${tag}`,
      name: "Test",
      targetCompanies: [],
    },
  });
  return u.id;
}

async function deleteUser(id: string) {
  try {
    await db.user.delete({ where: { id } });
  } catch {
    // already cascaded
  }
}

// check constraints on score columns
describe("CHECK constraints — score columns must be 0-100", () => {
  let uid: string;
  beforeAll(async () => {
    uid = await createUser("_score");
  });
  afterAll(async () => {
    await deleteUser(uid);
  });

  // hiring readiness overall score
  it("rejects hiring_readiness_scores.overall_score = 150", async () => {
    await expect(
      db.$executeRaw`INSERT INTO hiring_readiness_scores (user_id, overall_score) VALUES (${uid}::uuid, 150)`,
    ).rejects.toThrow();
  });
  it("rejects hiring_readiness_scores.overall_score = -1", async () => {
    await expect(
      db.$executeRaw`INSERT INTO hiring_readiness_scores (user_id, overall_score) VALUES (${uid}::uuid, -1)`,
    ).rejects.toThrow();
  });
  it("accepts hiring_readiness_scores.overall_score = 0", async () => {
    await expect(
      db.$executeRaw`INSERT INTO hiring_readiness_scores (user_id, overall_score) VALUES (${uid}::uuid, 0) ON CONFLICT (user_id) DO UPDATE SET overall_score = EXCLUDED.overall_score`,
    ).resolves.not.toThrow();
    await db.hiringReadinessScore.deleteMany({ where: { userId: uid } });
  });
  it("accepts hiring_readiness_scores.overall_score = 100", async () => {
    await expect(
      db.$executeRaw`INSERT INTO hiring_readiness_scores (user_id, overall_score) VALUES (${uid}::uuid, 100) ON CONFLICT (user_id) DO UPDATE SET overall_score = EXCLUDED.overall_score`,
    ).resolves.not.toThrow();
    await db.hiringReadinessScore.deleteMany({ where: { userId: uid } });
  });

  // github profile
  it("rejects github_profiles.github_score = 200", async () => {
    await expect(
      db.$executeRaw`INSERT INTO github_profiles (user_id, github_username, github_score) VALUES (${uid}::uuid, 'gh', 200) ON CONFLICT (user_id) DO UPDATE SET github_score = EXCLUDED.github_score`,
    ).rejects.toThrow();
  });
  it("rejects github_profiles.repo_health_score = 101", async () => {
    await expect(
      db.$executeRaw`INSERT INTO github_profiles (user_id, github_username, repo_health_score) VALUES (${uid}::uuid, 'gh', 101) ON CONFLICT (user_id) DO UPDATE SET repo_health_score = EXCLUDED.repo_health_score`,
    ).rejects.toThrow();
  });
  it("rejects github_profiles.open_source_score = -1", async () => {
    await expect(
      db.$executeRaw`INSERT INTO github_profiles (user_id, github_username, open_source_score) VALUES (${uid}::uuid, 'gh', -1) ON CONFLICT (user_id) DO UPDATE SET open_source_score = EXCLUDED.open_source_score`,
    ).rejects.toThrow();
  });

  // leetcode profile
  it("rejects leetcode_profiles.leetcode_score = 101", async () => {
    await expect(
      db.$executeRaw`INSERT INTO leetcode_profiles (user_id, leetcode_username, leetcode_score) VALUES (${uid}::uuid, 'lc', 101) ON CONFLICT (user_id) DO UPDATE SET leetcode_score = EXCLUDED.leetcode_score`,
    ).rejects.toThrow();
  });
  it("rejects leetcode_profiles.leetcode_score = -10", async () => {
    await expect(
      db.$executeRaw`INSERT INTO leetcode_profiles (user_id, leetcode_username, leetcode_score) VALUES (${uid}::uuid, 'lc', -10) ON CONFLICT (user_id) DO UPDATE SET leetcode_score = EXCLUDED.leetcode_score`,
    ).rejects.toThrow();
  });

  // resume
  it("rejects resumes.resume_score = -5", async () => {
    await expect(
      db.$executeRaw`INSERT INTO resumes (user_id, file_url, file_name, file_size_bytes, resume_score) VALUES (${uid}::uuid, 'https://x.com/r.pdf', 'r.pdf', 100, -5)`,
    ).rejects.toThrow();
  });
  it("rejects resumes.ats_score = 150", async () => {
    await expect(
      db.$executeRaw`INSERT INTO resumes (user_id, file_url, file_name, file_size_bytes, ats_score) VALUES (${uid}::uuid, 'https://x.com/r.pdf', 'r.pdf', 100, 150)`,
    ).rejects.toThrow();
  });
  it("rejects resumes.formatting_score = -1", async () => {
    await expect(
      db.$executeRaw`INSERT INTO resumes (user_id, file_url, file_name, file_size_bytes, formatting_score) VALUES (${uid}::uuid, 'https://x.com/r.pdf', 'r.pdf', 100, -1)`,
    ).rejects.toThrow();
  });
  it("rejects resumes.keyword_score = 101", async () => {
    await expect(
      db.$executeRaw`INSERT INTO resumes (user_id, file_url, file_name, file_size_bytes, keyword_score) VALUES (${uid}::uuid, 'https://x.com/r.pdf', 'r.pdf', 100, 101)`,
    ).rejects.toThrow();
  });
  it("rejects resumes.impact_score = 999", async () => {
    await expect(
      db.$executeRaw`INSERT INTO resumes (user_id, file_url, file_name, file_size_bytes, impact_score) VALUES (${uid}::uuid, 'https://x.com/r.pdf', 'r.pdf', 100, 999)`,
    ).rejects.toThrow();
  });

  // interview scores
  it("rejects interview_scores.dsa_score = 101", async () => {
    const s = await db.interviewSession.create({
      data: {
        userId: uid,
        difficulty: "medium",
        language: "javascript",
        voiceEnabled: false,
      },
    });
    await expect(
      db.$executeRaw`INSERT INTO interview_scores (session_id, dsa_score) VALUES (${s.id}::uuid, 101)`,
    ).rejects.toThrow();
    await db.interviewSession.delete({ where: { id: s.id } });
  });
  it("rejects interview_scores.communication_score = -1", async () => {
    const s = await db.interviewSession.create({
      data: {
        userId: uid,
        difficulty: "easy",
        language: "python",
        voiceEnabled: false,
      },
    });
    await expect(
      db.$executeRaw`INSERT INTO interview_scores (session_id, communication_score) VALUES (${s.id}::uuid, -1)`,
    ).rejects.toThrow();
    await db.interviewSession.delete({ where: { id: s.id } });
  });
  it("rejects interview_scores.code_quality_score = 200", async () => {
    const s = await db.interviewSession.create({
      data: {
        userId: uid,
        difficulty: "hard",
        language: "java",
        voiceEnabled: false,
      },
    });
    await expect(
      db.$executeRaw`INSERT INTO interview_scores (session_id, code_quality_score) VALUES (${s.id}::uuid, 200)`,
    ).rejects.toThrow();
    await db.interviewSession.delete({ where: { id: s.id } });
  });
  it("rejects interview_scores.optimization_score = 101", async () => {
    const s = await db.interviewSession.create({
      data: {
        userId: uid,
        difficulty: "medium",
        language: "cpp",
        voiceEnabled: false,
      },
    });
    await expect(
      db.$executeRaw`INSERT INTO interview_scores (session_id, optimization_score) VALUES (${s.id}::uuid, 101)`,
    ).rejects.toThrow();
    await db.interviewSession.delete({ where: { id: s.id } });
  });
  it("rejects interview_scores.overall_score = -5", async () => {
    const s = await db.interviewSession.create({
      data: {
        userId: uid,
        difficulty: "easy",
        language: "typescript",
        voiceEnabled: false,
      },
    });
    await expect(
      db.$executeRaw`INSERT INTO interview_scores (session_id, overall_score) VALUES (${s.id}::uuid, -5)`,
    ).rejects.toThrow();
    await db.interviewSession.delete({ where: { id: s.id } });
  });
});

// 2. check constraints on enum and status columns
describe("CHECK constraints — enum / status columns", () => {
  let uid: string;
  beforeAll(async () => {
    uid = await createUser("_enum");
  });
  afterAll(async () => {
    await deleteUser(uid);
  });

  it("rejects resumes.analysis_status = 'invalid'", async () => {
    await expect(
      db.$executeRaw`INSERT INTO resumes (user_id, file_url, file_name, file_size_bytes, analysis_status) VALUES (${uid}::uuid, 'https://x.com/r.pdf', 'r.pdf', 100, 'invalid')`,
    ).rejects.toThrow();
  });
  it("accepts all valid analysis_status values", async () => {
    for (const st of ["pending", "processing", "complete", "failed"]) {
      const r = await db.resume.create({
        data: {
          userId: uid,
          fileUrl: `https://x.com/${st}.pdf`,
          fileName: `${st}.pdf`,
          fileSizeBytes: 100,
          analysisStatus: st,
        },
      });
      expect(r.analysisStatus).toBe(st);
      await db.resume.delete({ where: { id: r.id } });
    }
  });

  it("rejects interview_sessions.status = 'unknown'", async () => {
    await expect(
      db.$executeRaw`INSERT INTO interview_sessions (user_id, status, difficulty, language, voice_enabled) VALUES (${uid}::uuid, 'unknown', 'easy', 'javascript', false)`,
    ).rejects.toThrow();
  });
  it("rejects interview_sessions.difficulty = 'extreme'", async () => {
    await expect(
      db.$executeRaw`INSERT INTO interview_sessions (user_id, status, difficulty, language, voice_enabled) VALUES (${uid}::uuid, 'in_progress', 'extreme', 'javascript', false)`,
    ).rejects.toThrow();
  });

  it("rejects problem_bank.difficulty = 'extreme'", async () => {
    await expect(
      db.$executeRaw`INSERT INTO problem_bank (title, description, examples, test_cases_visible, test_cases_hidden, difficulty, topic) VALUES ('T', 'd', '[]'::jsonb, '[]'::jsonb, '[]'::jsonb, 'extreme', 'arrays')`,
    ).rejects.toThrow();
  });
  it("accepts problem_bank.difficulty = 'hard'", async () => {
    const p = await db.problemBank.create({
      data: {
        title: "T",
        description: "d",
        examples: [],
        testCasesVisible: [],
        testCasesHidden: [],
        difficulty: "hard",
        topic: "graphs",
      },
    });
    expect(p.difficulty).toBe("hard");
    await db.problemBank.delete({ where: { id: p.id } });
  });

  it("rejects voice_transcripts.speaker = 'system'", async () => {
    const s = await db.interviewSession.create({
      data: {
        userId: uid,
        difficulty: "easy",
        language: "javascript",
        voiceEnabled: true,
      },
    });
    await expect(
      db.$executeRaw`INSERT INTO voice_transcripts (session_id, segment_index, speaker, text) VALUES (${s.id}::uuid, 0, 'system', 'hi')`,
    ).rejects.toThrow();
    await db.interviewSession.delete({ where: { id: s.id } });
  });
  it("rejects voice_transcripts.confidence > 1.0", async () => {
    const s = await db.interviewSession.create({
      data: {
        userId: uid,
        difficulty: "easy",
        language: "javascript",
        voiceEnabled: true,
      },
    });
    await expect(
      db.$executeRaw`INSERT INTO voice_transcripts (session_id, segment_index, speaker, text, confidence) VALUES (${s.id}::uuid, 0, 'user', 'hi', 1.50)`,
    ).rejects.toThrow();
    await db.interviewSession.delete({ where: { id: s.id } });
  });
  it("accepts voice_transcripts.confidence = NULL", async () => {
    const s = await db.interviewSession.create({
      data: {
        userId: uid,
        difficulty: "easy",
        language: "javascript",
        voiceEnabled: true,
      },
    });
    const vt = await db.voiceTranscript.create({
      data: {
        sessionId: s.id,
        segmentIndex: 0,
        speaker: "ai",
        text: "hi",
        confidence: null,
      },
    });
    expect(vt.confidence).toBeNull();
    await db.interviewSession.delete({ where: { id: s.id } });
  });

  it("rejects hiring_readiness_scores.level = 'expert'", async () => {
    await expect(
      db.$executeRaw`INSERT INTO hiring_readiness_scores (user_id, level) VALUES (${uid}::uuid, 'expert') ON CONFLICT (user_id) DO UPDATE SET level = EXCLUDED.level`,
    ).rejects.toThrow();
  });
  it("accepts all valid hiring_readiness_scores.level values", async () => {
    for (const lv of [
      "not_ready",
      "building",
      "interview_ready",
      "competitive",
      "faang_ready",
    ]) {
      await expect(
        db.$executeRaw`INSERT INTO hiring_readiness_scores (user_id, level) VALUES (${uid}::uuid, ${lv}) ON CONFLICT (user_id) DO UPDATE SET level = EXCLUDED.level`,
      ).resolves.not.toThrow();
    }
    await db.hiringReadinessScore.deleteMany({ where: { userId: uid } });
  });

  it("rejects user_settings.theme = 'blue'", async () => {
    await expect(
      db.$executeRaw`INSERT INTO user_settings (user_id, theme) VALUES (${uid}::uuid, 'blue') ON CONFLICT (user_id) DO UPDATE SET theme = EXCLUDED.theme`,
    ).rejects.toThrow();
  });
  it("accepts user_settings.theme values: light, dark, system", async () => {
    for (const t of ["light", "dark", "system"]) {
      await expect(
        db.$executeRaw`INSERT INTO user_settings (user_id, theme) VALUES (${uid}::uuid, ${t}) ON CONFLICT (user_id) DO UPDATE SET theme = EXCLUDED.theme`,
      ).resolves.not.toThrow();
    }
    await db.userSettings.deleteMany({ where: { userId: uid } });
  });
});

// 3. cascade delete tests
describe("CASCADE DELETE — deleting a User removes all dependent rows", () => {
  let uid: string;
  let sid: string;

  beforeAll(async () => {
    uid = await createUser("_cascade");
    await db.account.create({
      data: { userId: uid, provider: "github", providerAccountId: `gh-${uid}` },
    });
    await db.session.create({
      data: {
        userId: uid,
        sessionToken: `tok-${uid}`,
        expires: new Date(Date.now() + 86_400_000),
      },
    });
    await db.githubProfile.create({
      data: { userId: uid, githubUsername: "cas_gh" },
    });
    await db.leetcodeProfile.create({
      data: { userId: uid, leetcodeUsername: "cas_lc" },
    });
    await db.resume.create({
      data: {
        userId: uid,
        fileUrl: "https://blob/c.pdf",
        fileName: "c.pdf",
        fileSizeBytes: 512,
      },
    });
    const s = await db.interviewSession.create({
      data: {
        userId: uid,
        difficulty: "easy",
        language: "python",
        voiceEnabled: true,
      },
    });
    sid = s.id;
    await db.interviewProblem.create({
      data: {
        sessionId: sid,
        title: "T",
        description: "d",
        examples: [{}],
        testCasesVisible: [{}],
        testCasesHidden: [{}],
      },
    });
    await db.interviewSubmission.create({
      data: {
        sessionId: sid,
        code: "pass",
        language: "python",
        isFinal: false,
      },
    });
    await db.interviewScores.create({ data: { sessionId: sid } });
    await db.voiceTranscript.create({
      data: { sessionId: sid, segmentIndex: 0, speaker: "user", text: "hi" },
    });
    await db.hiringReadinessScore.create({ data: { userId: uid } });
    await db.userSettings.create({ data: { userId: uid } });
  });

  it("hard-deletes the user without error", async () => {
    await expect(db.user.delete({ where: { id: uid } })).resolves.not.toThrow();
  });
  it("zero orphaned accounts rows", async () => {
    expect(await db.account.count({ where: { userId: uid } })).toBe(0);
  });
  it("zero orphaned sessions rows", async () => {
    expect(await db.session.count({ where: { userId: uid } })).toBe(0);
  });
  it("zero orphaned github_profiles rows", async () => {
    expect(await db.githubProfile.count({ where: { userId: uid } })).toBe(0);
  });
  it("zero orphaned leetcode_profiles rows", async () => {
    expect(await db.leetcodeProfile.count({ where: { userId: uid } })).toBe(0);
  });
  it("zero orphaned resumes rows", async () => {
    expect(await db.resume.count({ where: { userId: uid } })).toBe(0);
  });
  it("zero orphaned interview_sessions rows", async () => {
    expect(await db.interviewSession.count({ where: { userId: uid } })).toBe(0);
  });
  it("zero orphaned interview_problems rows (cascade via session)", async () => {
    expect(await db.interviewProblem.count({ where: { sessionId: sid } })).toBe(
      0,
    );
  });
  it("zero orphaned interview_submissions rows", async () => {
    expect(
      await db.interviewSubmission.count({ where: { sessionId: sid } }),
    ).toBe(0);
  });
  it("zero orphaned interview_scores rows", async () => {
    expect(await db.interviewScores.count({ where: { sessionId: sid } })).toBe(
      0,
    );
  });
  it("zero orphaned voice_transcripts rows", async () => {
    expect(await db.voiceTranscript.count({ where: { sessionId: sid } })).toBe(
      0,
    );
  });
  it("zero orphaned hiring_readiness_scores rows", async () => {
    expect(
      await db.hiringReadinessScore.count({ where: { userId: uid } }),
    ).toBe(0);
  });
  it("zero orphaned user_settings rows", async () => {
    expect(await db.userSettings.count({ where: { userId: uid } })).toBe(0);
  });
});

// 4. set null on audit logs
describe("SET NULL — audit_logs.user_id becomes NULL after user deletion", () => {
  it("preserves audit_log row with user_id = NULL", async () => {
    const uid = await createUser("_audit_null");
    const log = await db.auditLog.create({
      data: { userId: uid, action: "test.set_null" },
    });
    await db.user.delete({ where: { id: uid } });
    const found = await db.auditLog.findUnique({ where: { id: log.id } });
    expect(found).not.toBeNull();
    expect(found!.userId).toBeNull();
    await db.auditLog.delete({ where: { id: log.id } });
  });
});

// 5. set null on reviewer delete
describe("SET NULL — problem_bank.reviewed_by is NULL after reviewer user is deleted", () => {
  it("sets reviewed_by to NULL", async () => {
    const adminId = await createUser("_reviewer");
    const prob = await db.problemBank.create({
      data: {
        title: "R",
        description: "d",
        examples: [],
        testCasesVisible: [],
        testCasesHidden: [],
        difficulty: "easy",
        topic: "arrays",
        reviewedById: adminId,
      },
    });
    await db.user.delete({ where: { id: adminId } });
    const found = await db.problemBank.findUnique({ where: { id: prob.id } });
    expect(found!.reviewedById).toBeNull();
    await db.problemBank.delete({ where: { id: prob.id } });
  });
});

// 6. set null on bank problem delete
describe("SET NULL — interview_problems.problem_bank_id is NULL after bank problem deleted", () => {
  let sessionUserId: string;
  beforeAll(async () => {
    sessionUserId = await createUser("_bank_null");
  });
  afterAll(async () => {
    await deleteUser(sessionUserId);
  });

  it("interview_problem survives with NULL problem_bank_id", async () => {
    const bp = await db.problemBank.create({
      data: {
        title: "Eph",
        description: "d",
        examples: [],
        testCasesVisible: [],
        testCasesHidden: [],
        difficulty: "medium",
        topic: "graphs",
      },
    });
    const s = await db.interviewSession.create({
      data: {
        userId: sessionUserId,
        difficulty: "medium",
        language: "python",
        voiceEnabled: false,
      },
    });
    const ip = await db.interviewProblem.create({
      data: {
        sessionId: s.id,
        problemBankId: bp.id,
        title: "Eph",
        description: "d",
        examples: [],
        testCasesVisible: [],
        testCasesHidden: [],
      },
    });
    await db.problemBank.delete({ where: { id: bp.id } });
    const surviving = await db.interviewProblem.findUnique({
      where: { id: ip.id },
    });
    expect(surviving).not.toBeNull();
    expect(surviving!.problemBankId).toBeNull();
    await db.interviewSession.delete({ where: { id: s.id } });
  });
});

// 7. partial and composite indexes
describe("Partial / composite indexes — confirmed in pg_indexes", () => {
  async function has(table: string, idx: string): Promise<boolean> {
    const rows = await db.$queryRaw<Array<{ indexname: string }>>`
      SELECT indexname FROM pg_indexes
      WHERE tablename = ${table} AND indexname = ${idx} AND schemaname = 'public'
    `;
    return rows.length === 1;
  }

  it("idx_interview_sessions_user_completed (partial WHERE status='completed')", async () => {
    expect(
      await has("interview_sessions", "idx_interview_sessions_user_completed"),
    ).toBe(true);
  });
  it("idx_resumes_user_active (partial WHERE is_active=TRUE)", async () => {
    expect(await has("resumes", "idx_resumes_user_active")).toBe(true);
  });
  it("idx_submissions_final (partial WHERE is_final=TRUE)", async () => {
    expect(await has("interview_submissions", "idx_submissions_final")).toBe(
      true,
    );
  });
  it("idx_users_active (partial WHERE deleted_at IS NULL)", async () => {
    expect(await has("users", "idx_users_active")).toBe(true);
  });
  it("idx_problem_bank_difficulty_topic_active (composite B-tree)", async () => {
    expect(
      await has("problem_bank", "idx_problem_bank_difficulty_topic_active"),
    ).toBe(true);
  });
  it("FK index on interview_submissions.session_id exists", async () => {
    const rows = await db.$queryRaw<Array<{ indexname: string }>>`
      SELECT indexname FROM pg_indexes
      WHERE tablename = 'interview_submissions' AND schemaname = 'public'
        AND indexname IN ('idx_submissions_session_id', 'interview_submissions_session_id_idx')
    `;
    expect(rows.length).toBeGreaterThanOrEqual(1);
  });
  it("FK index on interview_problems.problem_bank_id exists", async () => {
    const rows = await db.$queryRaw<Array<{ indexname: string }>>`
      SELECT indexname FROM pg_indexes
      WHERE tablename = 'interview_problems' AND schemaname = 'public'
        AND indexname IN ('idx_interview_problems_bank_id', 'interview_problems_problem_bank_id_idx')
    `;
    expect(rows.length).toBeGreaterThanOrEqual(1);
  });
  it("DESC index on audit_logs.created_at exists", async () => {
    const rows = await db.$queryRaw<Array<{ indexname: string }>>`
      SELECT indexname FROM pg_indexes
      WHERE tablename = 'audit_logs' AND schemaname = 'public'
        AND indexname IN ('idx_audit_logs_created_at', 'audit_logs_created_at_idx')
    `;
    expect(rows.length).toBeGreaterThanOrEqual(1);
  });
});

// 8. problem bank fk linkage
describe("ProblemBank FK — interview_problems.problem_bank_id linkage", () => {
  let adminId: string;
  let sessionUserId: string;
  let probId: string;
  let sessId: string;

  beforeAll(async () => {
    adminId = await createUser("_bank_admin");
    sessionUserId = await createUser("_bank_user");
    const p = await db.problemBank.create({
      data: {
        title: "Two Sum",
        description: "Find two numbers summing to target.",
        examples: [{ input: "[2,7,11,15], 9", output: "[0,1]" }],
        testCasesVisible: [{ input: "[2,7,11,15]\n9", expected: "[0,1]" }],
        testCasesHidden: [{ input: "[3,2,4]\n6", expected: "[1,2]" }],
        difficulty: "easy",
        topic: "arrays",
        optimalTimeComplexity: "O(n)",
        optimalSpaceComplexity: "O(n)",
        tags: ["hash-map", "two-pointer"],
        reviewedById: adminId,
      },
    });
    probId = p.id;
    const s = await db.interviewSession.create({
      data: {
        userId: sessionUserId,
        difficulty: "easy",
        language: "javascript",
        voiceEnabled: false,
      },
    });
    sessId = s.id;
  });

  afterAll(async () => {
    await deleteUser(sessionUserId);
    try {
      await db.problemBank.delete({ where: { id: probId } });
    } catch {
      // already deleted
    }
    await deleteUser(adminId);
  });

  it("can create interview_problem linked to problem_bank", async () => {
    const ip = await db.interviewProblem.create({
      data: {
        sessionId: sessId,
        problemBankId: probId,
        title: "Two Sum",
        description: "Find two numbers.",
        examples: [{ input: "[2,7], 9", output: "[0,1]" }],
        testCasesVisible: [{ input: "[2,7]\n9", expected: "[0,1]" }],
        testCasesHidden: [{ input: "[3,2,4]\n6", expected: "[1,2]" }],
        optimalTimeComplexity: "O(n)",
        tags: ["hash-map"],
      },
    });
    expect(ip.problemBankId).toBe(probId);
  });

  it("problem_bank stores correct difficulty, topic, complexity, and is_active=true", async () => {
    const found = await db.problemBank.findUnique({ where: { id: probId } });
    expect(found!.difficulty).toBe("easy");
    expect(found!.topic).toBe("arrays");
    expect(found!.optimalTimeComplexity).toBe("O(n)");
    expect(found!.optimalSpaceComplexity).toBe("O(n)");
    expect(found!.isActive).toBe(true);
    expect(found!.reviewedById).toBe(adminId);
  });
});
