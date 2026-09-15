export const runtime = 'nodejs';

import { auth } from '@/auth';
import { LeetcodeService } from '@/server/services/LeetcodeService';
import { enqueueJob } from '@/server/queue/enqueueJob';
import { JobType } from '@/server/queue/jobTypes';
import { AppError } from '@/server/graphql/errors';
import { NextResponse } from 'next/server';

export async function POST(request: Request): Promise<NextResponse> {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { error: 'UNAUTHORIZED', message: 'Authentication required.' },
      { status: 401 },
    );
  }

  const userId = session.user.id;
  const leetcodeService = new LeetcodeService(userId);

  // Read optional username from body
  let username: string | undefined;
  try {
    const body = await request.json().catch(() => ({}));
    if (body?.username && typeof body.username === 'string') {
      username = body.username.trim();
    }
  } catch {
    // Body parse fallback
  }

  if (!username) {
    const existing = await leetcodeService.getProfile();
    username = existing?.leetcodeUsername;
  }

  if (!username) {
    return NextResponse.json(
      {
        error: 'VALIDATION_ERROR',
        message: 'LeetCode username is required. Please provide a username to synchronize.',
      },
      { status: 400 },
    );
  }

  try {
    await leetcodeService.assertSyncAllowed();
  } catch (err) {
    if (err instanceof AppError && err.code === 'RATE_LIMITED') {
      const match = err.message.match(/Retry after (\d+) seconds/);
      const retryAfterSeconds = match && match[1] ? parseInt(match[1], 10) : 86400;

      return NextResponse.json(
        {
          error: 'RATE_LIMITED',
          message: err.message,
          retryAfterSeconds,
        },
        {
          status: 429,
          headers: {
            'Retry-After': String(retryAfterSeconds),
          },
        },
      );
    }
    throw err;
  }

  const result = await enqueueJob(JobType.LEETCODE_SYNC, {
    userId,
    leetcodeUsername: username,
  });

  return NextResponse.json(
    {
      jobId: result.messageId,
      status: 'queued',
      message: `LeetCode sync initiated for ${username}.`,
      estimatedSeconds: 15,
    },
    { status: 202 },
  );
}
