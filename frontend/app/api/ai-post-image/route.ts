import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

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
  const post = body?.post?.toString().trim() || '';

  if (!post && !caption) {
    return NextResponse.json(
      { error: 'Caption or post text is required.' },
      { status: 400 }
    );
  }

  const layoutVariants = [
    'Split layout: left headline + key points, right visual diagram or stat cards.',
    'Centerpiece layout: big headline on top, middle icon cluster, bottom 3 insight cards.',
    'Diagonal layout: angled ribbon headline, staggered insight cards, one bold data badge.',
    'Grid layout: 2x2 insight tiles with icons, headline above, action strip below.',
    'Timeline layout: horizontal 4-step timeline with icons and short labels.',
  ];

  const paletteVariants = [
    'Teal + navy + soft sky gradients.',
    'Indigo + cyan + warm gray accents.',
    'Emerald + slate + pale mint background.',
    'Deep blue + aqua + light sand accents.',
    'Cobalt + ice blue + charcoal text.',
  ];

  const motifVariants = [
    'MSME growth, entrepreneurship, and policy themes.',
    'Finance, credit, and cashflow stability themes.',
    'Manufacturing, supply chain, and export readiness themes.',
    'Digital adoption, tools, and productivity themes.',
    'Women-led MSME and inclusive growth themes.',
  ];

  const pick = (list: string[]) => list[Math.floor(Math.random() * list.length)];
  const layout = pick(layoutVariants);
  const palette = pick(paletteVariants);
  const motif = pick(motifVariants);

  const sourceText = post || caption;
  const keyPoints = sourceText
    .split('.')
    .map((part) => part.trim())
    .filter(Boolean)
    .slice(0, 4)
    .join('. ');

  const prompt = `Create a fresh, premium LinkedIn infographic (not a fixed template).
Goal: each render should feel different in layout and composition while staying clean and business-ready.
Visual style: polished, layered cards, soft shadows, subtle gradients, clean iconography.
Layout direction: ${layout}
Color palette: ${palette}
Creative motif: ${motif}
Use the caption as the headline and derive 3-5 concise insights from the post.
Include one bold data badge if any numbers are present; otherwise add a short "Key Insight" badge.
Add a slim brand footer with: "+91-9971777097", "contactus@aadiswan.com", "www.aadiswan.com".
Keep all content within safe margins (at least 10% padding).
Avoid: cartoonish art, stock photos, messy typography, watermarks.
Headline: ${caption || 'MSME Market Update'}
Key points: ${keyPoints}`;

  const response = await fetch('https://api.openai.com/v1/images/generations', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      ...(process.env.OPENAI_ORG ? { 'OpenAI-Organization': process.env.OPENAI_ORG } : {}),
      ...(process.env.OPENAI_PROJECT ? { 'OpenAI-Project': process.env.OPENAI_PROJECT } : {}),
    },
    body: JSON.stringify({
      model: process.env.OPENAI_IMAGE_MODEL || 'gpt-image-1.5',
      prompt,
      size: '1536x1024',
      quality: 'medium',
    }),
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const requestId = response.headers.get('x-request-id');
    return NextResponse.json(
      { error: 'OpenAI image request failed.', details: payload, request_id: requestId },
      { status: 502 }
    );
  }

  const b64 = payload?.data?.[0]?.b64_json ?? null;
  const url = payload?.data?.[0]?.url ?? null;
  if (!b64 && !url) {
    return NextResponse.json(
      { error: 'No image returned from OpenAI.' },
      { status: 502 }
    );
  }

  if (b64) {
    return NextResponse.json({ image: `data:image/png;base64,${b64}` }, { status: 200 });
  }

  return NextResponse.json({ image: url }, { status: 200 });
}
