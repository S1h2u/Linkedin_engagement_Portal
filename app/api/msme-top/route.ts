import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

function extractOutputText(payload: any) {
  if (payload?.output_text) return payload.output_text as string;
  const output = payload?.output;
  if (!Array.isArray(output)) return '';
  for (const item of output) {
    const content = item?.content;
    if (!Array.isArray(content)) continue;
    for (const part of content) {
      if (part?.type === 'output_text' || part?.type === 'text') {
        return part?.text ?? '';
      }
    }
  }
  return '';
}

function normalizeIndices(value: any, max: number, limit: number) {
  if (!Array.isArray(value)) return [];
  const indices: number[] = [];
  for (const raw of value) {
    const num = typeof raw === 'number' ? raw : Number(raw);
    if (!Number.isInteger(num)) continue;
    if (num < 0 || num >= max) continue;
    if (indices.includes(num)) continue;
    indices.push(num);
    if (indices.length >= limit) break;
  }
  return indices;
}

export async function POST(request: Request) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: 'Missing OPENAI_API_KEY. Add it to .env.local and restart.' },
      { status: 500 }
    );
  }

  const body = await request.json().catch(() => null);
  const items = Array.isArray(body?.items) ? body.items : [];
  const requestedLimit = Number(body?.limit ?? 5);
  const limit = Number.isFinite(requestedLimit)
    ? Math.min(Math.max(Math.trunc(requestedLimit), 1), 10)
    : 5;

  if (!items.length) {
    return NextResponse.json(
      { error: 'No news items provided to rank.' },
      { status: 400 }
    );
  }

  const model = process.env.OPENAI_MODEL || 'gpt-4o';

  const systemPrompt =
    'You rank news by relevance to MSME (Micro, Small and Medium Enterprises). ' +
    'Return JSON only: {"indices":[...]} with item positions (0-based). ' +
    'Pick items that materially impact MSME: policy, finance, credit, taxes, compliance, ' +
    'manufacturing, exports, supply chain, subsidies, digitization, or sector trends. ' +
    'Ignore items where MSME is mentioned only in passing.';

  const userPrompt = `Return the top ${limit} most MSME-relevant items.
Use only indices from the list, do not invent items.

Items:
${JSON.stringify(items).slice(0, 9000)}`;

  const response = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      ...(process.env.OPENAI_ORG ? { 'OpenAI-Organization': process.env.OPENAI_ORG } : {}),
      ...(process.env.OPENAI_PROJECT ? { 'OpenAI-Project': process.env.OPENAI_PROJECT } : {}),
    },
    body: JSON.stringify({
      model,
      input: [
        {
          role: 'system',
          content: [{ type: 'input_text', text: systemPrompt }],
        },
        {
          role: 'user',
          content: [{ type: 'input_text', text: userPrompt }],
        },
      ],
      temperature: 0.2,
      max_output_tokens: 300,
    }),
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const requestId = response.headers.get('x-request-id');
    return NextResponse.json(
      { error: 'OpenAI request failed.', details: payload, request_id: requestId },
      { status: 502 }
    );
  }

  const text = extractOutputText(payload);
  let indices: number[] = [];
  if (text) {
    try {
      const parsed = JSON.parse(text);
      indices = normalizeIndices(parsed?.indices, items.length, limit);
    } catch {
      indices = [];
    }
  }

  if (!indices.length) {
    const fallback = items.slice(0, limit);
    return NextResponse.json(fallback, { status: 200 });
  }

  const ranked = indices.map((idx) => items[idx]).filter(Boolean);
  return NextResponse.json(ranked, { status: 200 });
}
