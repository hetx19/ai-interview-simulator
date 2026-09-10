import { Receiver } from '@upstash/qstash';
import { env } from '@/lib/env';

export class SignatureVerificationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SignatureVerificationError';
  }
}

export function getReceiver(): Receiver {
  return new Receiver({
    currentSigningKey: env.QSTASH_CURRENT_SIGNING_KEY,
    nextSigningKey: env.QSTASH_NEXT_SIGNING_KEY,
  });
}

export async function verifyQStashSignature(
  rawBody: string,
  headers: Headers,
  customReceiver?: Receiver,
): Promise<void> {
  const signature = headers.get('Upstash-Signature') || headers.get('upstash-signature');
  if (!signature) {
    throw new SignatureVerificationError('Missing QStash signature');
  }

  const receiver = customReceiver ?? getReceiver();
  try {
    const isValid = await receiver.verify({
      signature,
      body: rawBody,
    });

    if (!isValid) {
      throw new SignatureVerificationError('Invalid QStash signature');
    }
  } catch (err) {
    if (err instanceof SignatureVerificationError) throw err;
    throw new SignatureVerificationError(
      `QStash signature verification failed: ${(err as Error).message}`,
    );
  }
}
