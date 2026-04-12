'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import { fetchNews, rankMsmeNews, NewsArticle } from '@/lib/api';
import NewsCard from '@/components/NewsCard';
import SearchBar from '@/components/SearchBar';
import LinkedInAutomation from '@/components/LinkedInAutomation';

export default function HomePage() {
  const TOP_LIMIT = 5;
  const TOP_NEWS_LIMIT = 8;
  const NEWS_SECTION_COUNT = 3;
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [filtered, setFiltered] = useState<NewsArticle[]>([]);
  const [newsSection, setNewsSection] = useState<NewsArticle[]>([]);
  const [newsStatus, setNewsStatus] = useState<Record<string, 'approved' | 'rejected'>>(
    {}
  );
  const [actionTargetId, setActionTargetId] = useState<string | null>(null);
  const [actionTargetIndex, setActionTargetIndex] = useState<number | null>(null);
  const [lastUsedIds, setLastUsedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [postResult, setPostResult] = useState<any>(null);
  const [postLoading, setPostLoading] = useState(false);
  const [postError, setPostError] = useState<string | null>(null);
  const [postErrorDetails, setPostErrorDetails] = useState<string | null>(null);
  const [postImage, setPostImage] = useState<string | null>(null);
  const [postImageLoading, setPostImageLoading] = useState(false);
  const [postImageError, setPostImageError] = useState<string | null>(null);
  const [postImageErrorDetails, setPostImageErrorDetails] = useState<string | null>(null);
  const [postStatus, setPostStatus] = useState<'pending' | 'approved' | 'rejected'>(
    'pending'
  );

  useEffect(() => {
    const load = async () => {
      try {
        const data = await fetchNews();
        let ranked = data;
        try {
          ranked = await rankMsmeNews(data, TOP_NEWS_LIMIT);
        } catch (rankError) {
          console.error('MSME ranking failed, showing unranked list.', rankError);
        }
        setArticles(ranked);
        setFiltered(ranked);
        setNewsSection(ranked.slice(0, NEWS_SECTION_COUNT));
        setNewsStatus({});
        setActionTargetId(null);
      } catch (err) {
        const status = axios.isAxiosError(err) ? err.response?.status : undefined;
        if (status === 401) {
          setError('Please sign in to view news.');
        } else {
          setError('Failed to load news. Please try again later.');
        }
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (!query) {
      setFiltered(articles);
      setNewsSection(articles.slice(0, NEWS_SECTION_COUNT));
      setNewsStatus({});
      setActionTargetId(null);
      setActionTargetIndex(null);
      return;
    }
    const lower = query.toLowerCase();
    const filteredList = articles.filter(
      (a) =>
        a.title.toLowerCase().includes(lower) ||
        a.summary.toLowerCase().includes(lower)
    );
    setFiltered(filteredList);
    setNewsSection(filteredList.slice(0, NEWS_SECTION_COUNT));
    setNewsStatus({});
    setActionTargetId(null);
    setActionTargetIndex(null);
  };

  const handleGeneratePost = async () => {
    setPostError(null);
    setPostErrorDetails(null);
    setPostResult(null);
    setPostImage(null);
    setPostImageError(null);
    setPostLoading(true);
    setPostStatus('pending');
    try {
      const seedItems = filtered
        .slice(NEWS_SECTION_COUNT)
        .slice(0, TOP_LIMIT);
      const items = seedItems.map((item) => ({
        title: item.title,
        summary: item.summary,
        source: item.source,
        url: item.url,
        publishedAt: item.publishedAt,
        timeAgo: item.timeAgo,
      }));

      const response = await fetch('/api/ai-post', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items,
          audience: 'MSME founders',
          tone: 'Professional',
          avoidIds: lastUsedIds,
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setPostErrorDetails(
          data?.details ? JSON.stringify(data.details) : JSON.stringify(data)
        );
        throw new Error(data?.error ?? 'Failed to generate post.');
      }
      setPostResult(data);
      const captionText =
        typeof data?.caption === 'string'
          ? data.caption
          : typeof data?.raw === 'string'
            ? data.raw
            : '';
      const usedIndices = Array.isArray(data?.usedIndices) ? data.usedIndices : [];
      const usedIds = usedIndices
        .map((idx: number) => seedItems[idx]?.id)
        .filter(Boolean) as string[];
      if (usedIds.length) {
        setLastUsedIds(usedIds);
      }

      if (usedIds.length) {
        const currentTop3 = newsSection.length
          ? newsSection
          : filtered.slice(0, NEWS_SECTION_COUNT);
        const statusMap: Record<string, 'approved' | 'rejected'> = {};
        for (const item of currentTop3) {
          if (usedIds.includes(item.id)) {
            statusMap[item.id] = 'rejected';
          }
        }
        setNewsStatus(statusMap);
        setActionTargetId(currentTop3[0]?.id ? String(currentTop3[0].id) : null);
      }
      if (!usedIds.length) {
        const currentTop3 = newsSection.length
          ? newsSection
          : filtered.slice(0, NEWS_SECTION_COUNT);
        setActionTargetId(currentTop3[0]?.id ? String(currentTop3[0].id) : null);
      }
      if (captionText) {
        const currentTop3 = newsSection.length
          ? newsSection
          : filtered.slice(0, NEWS_SECTION_COUNT);
        try {
          const pickResponse = await fetch('/api/msme-pick', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              caption: captionText,
              items: currentTop3.map((item) => ({
                id: item.id,
                title: item.title,
                summary: item.summary,
                source: item.source,
                url: item.url,
                publishedAt: item.publishedAt,
              })),
            }),
          });
          const pickData = await pickResponse.json().catch(() => ({}));
          const idx =
            typeof pickData?.index === 'number' && pickData.index >= 0
              ? pickData.index
              : 0;
          const target = currentTop3[idx] ?? currentTop3[0];
          setActionTargetId(target?.id ? String(target.id) : null);
          setActionTargetIndex(idx);
        } catch {
          const fallback = currentTop3[0];
          setActionTargetId(fallback?.id ? String(fallback.id) : null);
          setActionTargetIndex(0);
        }
        await generateImage(captionText, data?.post ?? '');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to generate post.';
      setPostError(message);
    } finally {
      setPostLoading(false);
    }
  };

  const generateImage = async (captionText: string, postText = '') => {
    setPostImageError(null);
    setPostImageErrorDetails(null);
    setPostImageLoading(true);
    try {
      const response = await fetch('/api/ai-post-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          caption: captionText,
          post: postText,
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setPostImageErrorDetails(
          data?.details ? JSON.stringify(data.details) : JSON.stringify(data)
        );
        throw new Error(data?.error ?? 'Failed to generate image.');
      }
      setPostImage(data?.image ?? null);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to generate image.';
      setPostImageError(message);
    } finally {
      setPostImageLoading(false);
    }
  };

  const handleGenerateImage = async () => {
    const captionText = postResult?.caption ?? postResult?.raw ?? '';
    const postText = postResult?.post ?? '';
    if (!captionText && !postText) return;
    await generateImage(captionText, postText);
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#0b0f14] text-slate-100">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.18),_transparent_55%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,_rgba(14,116,144,0.15),_transparent_40%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,_rgba(15,23,42,0.2),_rgba(2,6,23,0.7))]" />
      </div>

      <div className="relative mx-auto max-w-7xl px-6 pb-16 pt-10">
        <nav className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-cyan-300/80">Live Pulse</p>
            <h1 className="font-display text-3xl md:text-4xl">Market Pulse</h1>
          </div>
          <div className="flex items-center gap-3">
            <a
              href="/login"
              className="rounded-full border border-cyan-400/40 px-4 py-2 text-sm text-cyan-200 hover:border-cyan-300 hover:text-cyan-100"
            >
              Sign in
            </a>
          </div>
        </nav>

        <section className="mt-10 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-4">
            <h2 className="font-display text-4xl md:text-5xl leading-tight">
              Track the market with curated, fast-moving news cards.
            </h2>
            <p className="text-slate-300 max-w-2xl">
              Real-time coverage for MSME, finance, and policy updates. Search by keyword or
              explore the latest headlines.
            </p>
            <div className="flex flex-wrap gap-2 text-xs text-slate-300">
              <span className="rounded-full border border-slate-700/60 bg-slate-900/50 px-3 py-1">MSME</span>
              <span className="rounded-full border border-slate-700/60 bg-slate-900/50 px-3 py-1">Banking</span>
              <span className="rounded-full border border-slate-700/60 bg-slate-900/50 px-3 py-1">Policy</span>
              <span className="rounded-full border border-slate-700/60 bg-slate-900/50 px-3 py-1">Manufacturing</span>
            </div>
          </div>
          <div className="rounded-3xl border border-slate-800/80 bg-slate-950/70 p-6 shadow-2xl shadow-black/40">
            <p className="text-sm text-slate-400">Focus today</p>
            <p className="mt-2 text-2xl font-semibold">Your market pulse dashboard</p>
            <p className="mt-3 text-sm text-slate-300">
              Sign in once, then let the feed update automatically as new stories arrive.
            </p>
            <a
              href="/login"
              className="mt-6 inline-flex items-center justify-center rounded-xl bg-cyan-500/90 px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-cyan-400"
            >
              Login to continue
            </a>
          </div>
        </section>

        <div className="mt-10">
          <SearchBar onSearch={handleSearch} />
        </div>

        {loading && (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="h-72 rounded-2xl border border-slate-800/80 bg-slate-900/60 animate-pulse"
              ></div>
            ))}
          </div>
        )}

        {error && (
          <div className="mt-6 rounded-2xl border border-red-500/30 bg-red-500/10 p-6 text-red-200">
            <p className="text-sm uppercase tracking-[0.3em] text-red-300">Access blocked</p>
            <p className="mt-2 text-lg font-semibold">{error}</p>
            {error.includes('sign in') && (
              <a
                href="/login"
                className="mt-4 inline-flex items-center rounded-full border border-red-300/40 px-4 py-2 text-sm text-red-200 hover:text-white"
              >
                Go to login
              </a>
            )}
          </div>
        )}

        {!loading && !error && filtered.length === 0 && (
          <p className="text-slate-400">No results found.</p>
        )}

        {!loading && !error && newsSection.length > 0 && (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {newsSection.map((article, idx) => (
              <NewsCard
                key={article.id}
                article={article}
                status={newsStatus[article.id]}
                showActions
                highlight={actionTargetIndex === idx}
                onApprove={() => setNewsStatus((prev) => ({ ...prev, [article.id]: 'approved' }))}
                onReject={() => setNewsStatus((prev) => ({ ...prev, [article.id]: 'rejected' }))}
              />
            ))}
          </div>
        )}


        <section className="mt-16 grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-3xl border border-slate-800/80 bg-slate-950/70 p-6 shadow-2xl shadow-black/40">
            <p className="text-xs uppercase tracking-[0.35em] text-cyan-300/80">AI Post Studio</p>
            <h2 className="font-display mt-3 text-3xl">Auto-generate MSME caption + image</h2>
            <p className="mt-3 text-sm text-slate-300">
              We scan the latest MSME news already loaded and auto-create a LinkedIn-ready
              caption and visual. You only approve or reject.
            </p>

            <div className="mt-6 space-y-4">
              <button
                type="button"
                onClick={handleGeneratePost}
                disabled={postLoading || filtered.length === 0}
                className="w-full rounded-xl bg-cyan-500/90 py-3 text-sm font-semibold text-slate-900 hover:bg-cyan-400 transition disabled:opacity-60"
              >
                {postLoading ? 'Generating...' : 'Generate caption + image'}
              </button>
              {postError && <p className="text-red-300 text-sm">{postError}</p>}
              {postErrorDetails && (
                <pre className="text-xs text-red-200 whitespace-pre-wrap bg-red-500/10 border border-red-500/30 rounded-xl p-3">
                  {postErrorDetails}
                </pre>
              )}
              {filtered.length === 0 && (
                <p className="text-xs text-slate-400">
                  No recent news found to generate a post.
                </p>
              )}
            </div>
          </div>

          <div className="rounded-3xl border border-slate-800/80 bg-slate-900/70 p-6 shadow-2xl shadow-black/40">
            <p className="text-xs uppercase tracking-[0.35em] text-slate-400">Preview</p>
            {postResult ? (
              <div className="mt-4 space-y-4">
                <div className="rounded-2xl border border-slate-800/80 bg-gradient-to-b from-slate-900 to-slate-950 p-5 space-y-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.25em] text-cyan-300/80">
                      Caption
                    </p>
                    <p className="mt-2 text-sm text-slate-200 whitespace-pre-wrap">
                      {postResult.caption ?? ''}
                    </p>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-800/80 bg-slate-950/70 p-5">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="text-xs uppercase tracking-[0.25em] text-cyan-300/80">
                      Image
                    </p>
                    <button
                      type="button"
                      onClick={handleGenerateImage}
                      disabled={postImageLoading}
                      className="rounded-full border border-cyan-400/40 px-4 py-2 text-xs text-cyan-200 hover:text-cyan-100 disabled:opacity-60"
                    >
                      {postImageLoading ? 'Generating...' : 'Generate image'}
                    </button>
                  </div>
                  {postImageError && (
                    <p className="mt-3 text-xs text-red-300">{postImageError}</p>
                  )}
                  {postImageErrorDetails && (
                    <pre className="mt-3 text-xs text-red-200 whitespace-pre-wrap bg-red-500/10 border border-red-500/30 rounded-xl p-3">
                      {postImageErrorDetails}
                    </pre>
                  )}
                  {postImage ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={postImage}
                      alt="Generated MSME post visual"
                      className="mt-4 w-full rounded-xl border border-slate-800/80"
                    />
                  ) : (
                    <p className="mt-3 text-sm text-slate-400">
                      Generate a visual to pair with the post.
                    </p>
                  )}
                </div>

                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => setPostStatus('approved')}
                    className={`rounded-full border px-4 py-2 text-sm ${
                      postStatus === 'approved'
                        ? 'border-emerald-400/60 text-emerald-200'
                        : 'border-slate-700/70 text-slate-200'
                    }`}
                  >
                    Approve
                  </button>
                  <button
                    type="button"
                    onClick={() => setPostStatus('rejected')}
                    className={`rounded-full border px-4 py-2 text-sm ${
                      postStatus === 'rejected'
                        ? 'border-red-400/60 text-red-200'
                        : 'border-slate-700/70 text-slate-200'
                    }`}
                  >
                    Reject
                  </button>
                  {postStatus === 'approved' && (
                    <span className="text-xs text-emerald-300 self-center">
                      Approved - ready to post.
                    </span>
                  )}
                  {postStatus === 'rejected' && (
                    <span className="text-xs text-red-300 self-center">
                      Rejected - generate again.
                    </span>
                  )}
                </div>
              </div>
            ) : (
              <p className="mt-4 text-sm text-slate-400">
                Generate a post to preview the content here.
              </p>
            )}
          </div>
        </section>

        {/* 🔥 LinkedIn Comment Automation Section */}
        <div className="mt-20 border-t border-slate-800/80 pt-16">
          <LinkedInAutomation />
        </div>
      </div>
    </main>
  );
}
