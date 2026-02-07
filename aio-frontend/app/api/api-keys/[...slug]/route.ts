import { proxyRequest, runtime } from '@/app/api/_proxy';

export { runtime };

export async function GET(req: Request, { params }: { params: { slug: string[] } }) {
  const path = `/api/api-keys/${(params.slug || []).join('/')}`;
  return proxyRequest(req, path);
}

export async function POST(req: Request, { params }: { params: { slug: string[] } }) {
  const path = `/api/api-keys/${(params.slug || []).join('/')}`;
  return proxyRequest(req, path);
}

export async function PUT(req: Request, { params }: { params: { slug: string[] } }) {
  const path = `/api/api-keys/${(params.slug || []).join('/')}`;
  return proxyRequest(req, path);
}

export async function DELETE(req: Request, { params }: { params: { slug: string[] } }) {
  const path = `/api/api-keys/${(params.slug || []).join('/')}`;
  return proxyRequest(req, path);
}

