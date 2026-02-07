import { proxyRequest, runtime } from '@/app/api/_proxy';

export { runtime };

export async function GET(req: Request) {
  return proxyRequest(req, '/api/action-plan');
}

export async function POST(req: Request) {
  return proxyRequest(req, '/api/action-plan');
}

export async function PUT(req: Request) {
  return proxyRequest(req, '/api/action-plan');
}

export async function DELETE(req: Request) {
  return proxyRequest(req, '/api/action-plan');
}

