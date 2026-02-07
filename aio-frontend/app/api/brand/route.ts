import { proxyRequest, runtime } from '@/app/api/_proxy';

export { runtime };

export async function GET(req: Request) {
  return proxyRequest(req, '/api/brand');
}

export async function POST(req: Request) {
  return proxyRequest(req, '/api/brand');
}

export async function PUT(req: Request) {
  return proxyRequest(req, '/api/brand');
}

export async function DELETE(req: Request) {
  return proxyRequest(req, '/api/brand');
}

