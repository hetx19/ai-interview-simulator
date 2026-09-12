export const runtime = 'nodejs';

import { auth } from '@/auth';
import { GithubService } from '@/server/services/GithubService';
import { enqueueJob } from '@/server/queue/enqueueJob';
import { JobType } from '@/server/queue/jobTypes';
import { AppError } from '@/server/graphql/errors';
import { NextResponse } from 'next/server';

export async function POST(): Promise<NextResponse> {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { error: 'UNAUTHORIZED', message: 'Authentication required.' },
      { status: 401 },
    );
  }

  const userId = session.user.id;
  const githubService = new GithubService(userId);

  try {
    await githubService.assertSyncAllowed();
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

  const result = await enqueueJob(JobType.GITHUB_SYNC, {
    userId,
  });

  return NextResponse.json(
    {
      jobId: result.messageId,
      status: 'queued',
      message: `GitHub sync initiated. Check /api/v1/github/sync/${result.messageId} for status.`,
      estimatedSeconds: 30,
    },
    { status: 202 },
  );
}
