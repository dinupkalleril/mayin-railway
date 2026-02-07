import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function proxyRequest(req: Request, path: string) {
  try {
    const backendBase = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_BACKEND_URL;
    if (!backendBase) {
      return NextResponse.json(
        { error: 'Backend URL not configured' },
        { status: 500 }
      );
    }

    const url = new URL(req.url);
    const targetUrl = `${backendBase}${path}${url.search}`;

    const controller = new AbortController();
    // Increase timeout for long-running endpoints like action-plan
    const longRunning = path.startsWith('/api/action-plan');
    const timeoutMs = longRunning ? 120000 : 30000;
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    let body: BodyInit | undefined = undefined;
    const method = req.method.toUpperCase();
    if (method !== 'GET' && method !== 'HEAD') {
      // Pass through the raw body so we don't couple to JSON only
      const text = await req.text();
      body = text.length ? text : undefined;
    }

    const headers: Record<string, string> = {};
    const contentType = req.headers.get('content-type');
    if (body && contentType) {
      headers['Content-Type'] = contentType;
    }

    const upstream = await fetch(targetUrl, {
      method,
      headers,
      body,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const upstreamType = upstream.headers.get('content-type') || '';
    let data: any = undefined;
    let rawText: string | undefined = undefined;

    try {
      if (upstreamType.includes('application/json')) {
        data = await upstream.json();
      } else {
        rawText = await upstream.text();
      }
    } catch (_) {
      try { rawText = await upstream.text(); } catch (_) { /* ignore */ }
    }

    if (!upstream.ok) {
      const message = (data && (data.error || data.message)) || rawText || 'Upstream request failed';
      return NextResponse.json({ error: message }, { status: upstream.status });
    }

    if (data !== undefined) {
      return NextResponse.json(data, { status: upstream.status });
    }

    return NextResponse.json({ data: rawText ?? null }, { status: upstream.status });
  } catch (err: any) {
    if (err?.name === 'AbortError') {
      return NextResponse.json({ error: 'Upstream request timed out' }, { status: 504 });
    }
    return NextResponse.json({ error: err?.message || 'Unexpected error' }, { status: 500 });
  }
}
