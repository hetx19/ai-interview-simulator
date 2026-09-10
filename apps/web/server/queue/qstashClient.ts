import { Client } from '@upstash/qstash';
import { env } from '@/lib/env';

export const qstash = new Client({
  token: env.QSTASH_TOKEN,
});
