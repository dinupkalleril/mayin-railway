import { proxyRequest, runtime } from '@/app/api/_proxy';

export { runtime };

export async function GET(req: Request) {
  return proxyRequest(req, '/api/model-config/providers');
}

