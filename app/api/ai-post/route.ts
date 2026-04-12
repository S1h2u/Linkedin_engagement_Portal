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

function stripCodeFences(text: string) {
  const trimmed = text.trim();
  if (trimmed.startsWith('```')) {
    const withoutFirst = trimmed.replace(/^```[a-zA-Z]*\n?/, '');
    const withoutLast = withoutFirst.replace(/```$/, '');
    return withoutLast.trim();
  }
  return trimmed;
}

function extractCaptionFromText(text: string) {
  const cleaned = stripCodeFences(text);
  if (!cleaned) return '';
  if (cleaned.startsWith('{') && cleaned.endsWith('}')) {
    try {
      const parsed = JSON.parse(cleaned);
      if (typeof parsed?.caption === 'string') return parsed.caption.trim();
    } catch {
      return cleaned;
    }
  }
  return cleaned;
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
  const audience = body?.audience?.toString().trim() || 'MSME founders';
  const tone = body?.tone?.toString().trim() || 'Professional';
  const avoidIds = Array.isArray(body?.avoidIds) ? body.avoidIds : [];

  if (!items.length) {
    return NextResponse.json(
      { error: 'No news items provided to build the post.' },
      { status: 400 }
    );
  }

  const model = process.env.OPENAI_MODEL || 'gpt-4o';

  const selectSystem =
    'Select the top 3 MSME-relevant items. Return JSON only: {"indices":[...]}.';
  const selectUser = `Pick 3 indices (0-based) from the list.
Focus on relevance and diversity; avoid near-duplicates.
If possible, avoid items whose id is in this list: ${JSON.stringify(avoidIds)}.

Items:
${JSON.stringify(items).slice(0, 6000)}`;

  const selectResponse = await fetch('https://api.openai.com/v1/responses', {
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
          content: [{ type: 'input_text', text: selectSystem }],
        },
        {
          role: 'user',
          content: [{ type: 'input_text', text: selectUser }],
        },
      ],
      temperature: 0.2,
      max_output_tokens: 120,
    }),
  });

  const selectPayload = await selectResponse.json().catch(() => ({}));
  let usedIndices: number[] = [];
  if (selectResponse.ok) {
    const selectText = extractOutputText(selectPayload);
    try {
      const parsed = JSON.parse(selectText);
      usedIndices = normalizeIndices(parsed?.indices, items.length, 3);
    } catch {
      usedIndices = [];
    }
  }
  if (!usedIndices.length) {
    usedIndices = items.slice(0, 3).map((_, idx) => idx);
  }

  const selectedItems = usedIndices.map((idx) => items[idx]).filter(Boolean);

  const systemPrompt =
    'You create LinkedIn-ready MSME captions from live news. Output plain text only. ' +
    'Keep it factual, coherent, and flowing as a single narrative.';

  const userPrompt = `Audience: ${audience}
Tone: ${tone}

Use the following MSME news items to craft one detailed LinkedIn caption.
Weave them into one cohesive flow and start the caption 

News items:
${JSON.stringify(selectedItems).slice(0, 4000)}

Rules:
- caption: 3-5 lines, detailed yet crisp, business tone, no emojis.
- Make it feel like one connected story, not three separate bullets.
- Use linking phrases to connect the developments (e.g., "At the same time", "In parallel", "Meanwhile").
- Use only provided news, do not invent facts.
- Output plain text only, no JSON, no bullets, no labels.`;

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
      temperature: 0.7,
      max_output_tokens: 200,
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
  if (!text) {
    return NextResponse.json(
      { error: 'No text returned from OpenAI.' },
      { status: 502 }
    );
  }

  const caption = extractCaptionFromText(text);
  return NextResponse.json({ caption, usedIndices }, { status: 200 });
}
