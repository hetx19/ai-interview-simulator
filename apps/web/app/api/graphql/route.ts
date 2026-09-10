import { yoga } from '@/server/graphql/yoga';
import { runWithCorrelation, resolveCorrelationId } from '@/server/logging/correlationStore';
import { logRequest } from '@/server/logging/requestLogger';

export const runtime = 'nodejs';

export async function GET(request: Request): Promise<Response> {
  const correlationId = resolveCorrelationId(
    request.headers.get('X-Correlation-ID') || request.headers.get('x-correlation-id'),
  );

  return runWithCorrelation({ correlationId }, async () => {
    const response = await yoga.fetch(request);
    const headers = new Headers(response.headers);
    headers.set('X-Correlation-ID', correlationId);
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers,
    });
  });
}

export async function POST(request: Request): Promise<Response> {
  const correlationId = resolveCorrelationId(
    request.headers.get('X-Correlation-ID') || request.headers.get('x-correlation-id'),
  );

  return runWithCorrelation({ correlationId }, async () => {
    const startTime = Date.now();
    const response = await yoga.fetch(request);
    const durationMs = Date.now() - startTime;

    const headers = new Headers(response.headers);
    headers.set('X-Correlation-ID', correlationId);

    logRequest(request.method, '/api/graphql', response.status, durationMs);

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers,
    });
  });
}
