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

function normalizeIndex(value: any, max: number) {
  const num = typeof value === 'number' ? value : Number(value);
  if (!Number.isInteger(num)) return null;
  if (num < 0 || num >= max) return null;
  return num;
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
  const caption = body?.caption?.toString().trim() || '';
  const items = Array.isArray(body?.items) ? body.items : [];

  if (!caption || !items.length) {
    return NextResponse.json(
      { error: 'Caption and items are required.' },
      { status: 400 }
    );
  }

  const model = process.env.OPENAI_MODEL || 'gpt-4o';

  const systemPrompt =
    'Pick the single news item with the LEAST content similarity to the caption. ' +
    'Return JSON only: {"index": number}.';

  const userPrompt = `Caption:
${caption}

Candidates (0-based):
${JSON.stringify(items).slice(0, 4000)}

Rules:
- Choose the item with the lowest semantic similarity to the caption.
- If multiple are similarly different, choose the one with higher MSME impact.
- Output JSON only.`;

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
      max_output_tokens: 120,
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
  let index: number | null = null;
  try {
    const parsed = JSON.parse(text);
    index = normalizeIndex(parsed?.index, items.length);
  } catch {
    index = null;
  }

  if (index === null) {
    index = 0;
  }

  return NextResponse.json({ index }, { status: 200 });
}
