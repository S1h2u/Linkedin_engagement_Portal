import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

type RawArticle = Record<string, any>;

function toAbsoluteUrl(value: string | null | undefined, baseUrl: string) {
  if (!value) return '';
  if (value.startsWith('http://') || value.startsWith('https://')) return value;
  if (value.startsWith('//')) return `https:${value}`;
  if (value.startsWith('/')) return new URL(value, baseUrl).toString();
  return value;
}

function normalizePublishedAt(raw: any) {
  if (!raw) return '';
  if (typeof raw === 'number') {
    const ms = raw > 1_000_000_000_000 ? raw : raw * 1000;
    return new Date(ms).toISOString();
  }
  if (typeof raw === 'string') {
    const trimmed = raw.trim();
    if (!trimmed) return '';
    if (trimmed.toLowerCase().includes('ago')) return '';
    const asNumber = Number(trimmed);
    if (!Number.isNaN(asNumber) && trimmed.length >= 10) {
      const ms = asNumber > 1_000_000_000_000 ? asNumber : asNumber * 1000;
      return new Date(ms).toISOString();
    }
    const parsed = Date.parse(trimmed);
    if (!Number.isNaN(parsed)) return new Date(parsed).toISOString();
    return trimmed;
  }
  return '';
}

function parseRelativeAgo(raw: string) {
  const lower = raw.toLowerCase().trim();
  const match = lower.match(/(\d+)\s*(minute|minutes|min|hour|hours|hr|hrs|day|days|week|weeks|month|months|year|years)\s*ago/);
  if (!match) return null;
  const value = Number(match[1]);
  const unit = match[2];
  if (Number.isNaN(value)) return null;
  const minutes =
    unit.startsWith('min') ? value :
    unit.startsWith('hour') || unit.startsWith('hr') ? value * 60 :
    unit.startsWith('day') ? value * 60 * 24 :
    unit.startsWith('week') ? value * 60 * 24 * 7 :
    unit.startsWith('month') ? value * 60 * 24 * 30 :
    unit.startsWith('year') ? value * 60 * 24 * 365 :
    null;
  if (minutes === null) return null;
  return Date.now() - minutes * 60 * 1000;
}

function getArticleTimeMs(article: RawArticle) {
  const publishedAt = article.publishedAt ?? article.published_at;
  const createdAt = article.created_at;
  if (typeof publishedAt === 'string' && publishedAt.toLowerCase().includes('ago')) {
    const ms = parseRelativeAgo(publishedAt);
    if (ms) return ms;
  }
  const candidate =
    normalizePublishedAt(
      publishedAt ??
        article.pub_date ??
        createdAt ??
        article.time ??
        article.date ??
        article.timestamp
    );
  if (candidate) {
    const parsed = Date.parse(candidate);
    if (!Number.isNaN(parsed)) return parsed;
  }
  if (typeof createdAt === 'string') {
    const parsed = Date.parse(createdAt);
    if (!Number.isNaN(parsed)) return parsed;
  }
  return null;
}

function normalizeArticle(article: RawArticle, index: number, baseUrl: string) {
  const image =
    article.imageUrl ??
    article.image_url ??
    article.image ??
    article.thumbnail ??
    article.thumb ??
    article.banner ??
    article.banner_image ??
    article.news_image ??
    article?.media?.[0]?.url ??
    '';

  const publishedAt = normalizePublishedAt(
    article.publishedAt ??
      article.published_at ??
      article.pub_date ??
      article.created_at ??
      article.time ??
      article.date ??
      article.timestamp
  );

  const publishedLabel =
    article.time_ago ??
    article.timeAgo ??
    article.published_time ??
    (typeof article.published_at === 'string' &&
    article.published_at.toLowerCase().includes('ago')
      ? article.published_at
      : '');

  return {
    id:
      article.id ??
      article._id ??
      article.news_id ??
      article.slug ??
      `${index}`,
    title: article.title ?? article.headline ?? article.news_title ?? '',
    imageUrl: toAbsoluteUrl(image, baseUrl),
    source: article.source ?? article.publisher ?? article.news_source ?? article.agency ?? '',
    publishedAt,
    summary:
      article.summary ??
      article.description ??
      article.content ??
      article.short_description ??
      '',
    url: article.url ?? article.link ?? article.news_url ?? article.source_url ?? '',
    timeAgo: publishedLabel,
  };
}

export async function GET(request: Request) {
  const baseUrl =
    process.env.MARKET_PULSE_BASE_URL ?? 'http://115.124.97.148:8081';
  const endpoint = new URL('/api/market-pulse/', baseUrl).toString();

  const headers: HeadersInit = {
    Accept: 'application/json',
  };

  const authHeader = process.env.MARKET_PULSE_AUTH;
  const token = process.env.MARKET_PULSE_TOKEN;
  const scheme = process.env.MARKET_PULSE_AUTH_SCHEME ?? 'Token';
  const incomingAuth = request.headers.get('authorization');
  const cookieToken = cookies().get('mp_access')?.value;
  const cookieScheme = cookies().get('mp_scheme')?.value;

  if (incomingAuth) {
    headers.Authorization = incomingAuth;
  } else if (authHeader) {
    headers.Authorization = authHeader;
  } else if (token) {
    const looksLikeJwt =
      typeof token === 'string' && token.split('.').length === 3;
    const resolvedScheme = scheme || (looksLikeJwt ? 'Bearer' : 'Token');
    headers.Authorization = `${resolvedScheme} ${token}`;
  } else if (cookieToken) {
    const looksLikeJwt =
      typeof cookieToken === 'string' && cookieToken.split('.').length === 3;
    const resolvedScheme =
      cookieScheme ?? scheme ?? (looksLikeJwt ? 'Bearer' : 'Token');
    headers.Authorization = `${resolvedScheme} ${cookieToken}`;
  }

  const upstream = await fetch(endpoint, {
    headers,
    cache: 'no-store',
  });

  const text = await upstream.text();

  if (!upstream.ok) {
    return NextResponse.json(
      {
        error: 'Upstream error',
        status: upstream.status,
        body: text,
      },
      { status: upstream.status }
    );
  }

  try {
    const data = JSON.parse(text);
    const list = Array.isArray(data)
      ? data
      : Array.isArray(data?.results)
        ? data.results
        : Array.isArray(data?.data)
          ? data.data
          : Array.isArray(data?.articles)
            ? data.articles
            : [];

    const normalized = list
      .filter((item: RawArticle) => {
        const ms = getArticleTimeMs(item);
        if (!ms) return false;
        return Date.now() - ms <= 24 * 60 * 60 * 1000;
      })
      .map((item: RawArticle, index: number) =>
        normalizeArticle(item, index, baseUrl)
      )
      .filter((item) => Boolean(item.imageUrl));

    return NextResponse.json(normalized, { status: 200 });
  } catch {
    return new NextResponse(text, {
      status: 200,
      headers: {
        'Content-Type': upstream.headers.get('content-type') ?? 'application/json',
      },
    });
  }
}
