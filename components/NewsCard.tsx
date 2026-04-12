'use client';

import { useState } from 'react';
import { NewsArticle } from '@/lib/api';

interface NewsCardProps {
  article: NewsArticle;
  status?: 'approved' | 'rejected';
  showActions?: boolean;
  onApprove?: () => void;
  onReject?: () => void;
  highlight?: boolean;
}

export default function NewsCard({
  article,
  status,
  showActions,
  onApprove,
  onReject,
  highlight,
}: NewsCardProps) {
  const [imageOk, setImageOk] = useState(true);
  const parsedDate = article.publishedAt ? new Date(article.publishedAt) : null;
  const isValidDate = parsedDate ? !Number.isNaN(parsedDate.getTime()) : false;
  const formattedDate = isValidDate
    ? parsedDate!.toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : article.timeAgo || 'Unknown time';

  if (!article.imageUrl || !imageOk) {
    return null;
  }

  return (
    <article
      className={`group relative overflow-hidden rounded-2xl border bg-gradient-to-br from-slate-900/90 via-slate-950 to-black shadow-xl shadow-black/30 transition hover:-translate-y-1 hover:border-cyan-400/40 ${
        highlight
          ? 'border-emerald-400/70 ring-1 ring-emerald-400/40'
          : 'border-slate-800/80'
      }`}
    >
      <div className="absolute inset-0 opacity-0 transition duration-300 group-hover:opacity-100">
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 via-transparent to-blue-500/10" />
      </div>

      <div className="relative w-full h-48 overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={article.imageUrl}
          alt={article.title}
          onError={() => setImageOk(false)}
          className="object-cover w-full h-full transition duration-500 group-hover:scale-105"
        />
      </div>

      <div className="relative p-5 flex flex-col gap-3 h-full">
        <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-cyan-300/80">
          <span className="rounded-full bg-cyan-500/10 px-2 py-1 font-semibold">
            {article.source}
          </span>
          <span className="text-slate-400">{formattedDate}</span>
          {status && (
            <span
              className={`rounded-full px-2 py-1 text-[10px] font-semibold tracking-[0.2em] ${
                status === 'approved'
                  ? 'bg-emerald-500/10 text-emerald-200'
                  : 'bg-red-500/10 text-red-200'
              }`}
            >
              {status === 'approved' ? 'APPROVED' : 'REJECTED'}
            </span>
          )}
        </div>
        <h2 className="text-lg font-semibold leading-snug line-clamp-2">
          {article.title}
        </h2>
        <p className="text-sm text-slate-300/90 line-clamp-3">{article.summary}</p>
        <a
          href={article.url}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-auto inline-flex items-center gap-2 text-sm text-cyan-300 hover:text-cyan-200"
        >
          Read more -&gt;
        </a>
        {showActions && (
          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onApprove}
              className="rounded-full border border-emerald-400/50 px-3 py-1 text-xs text-emerald-200 hover:border-emerald-300"
            >
              Approve
            </button>
            <button
              type="button"
              onClick={onReject}
              className="rounded-full border border-red-400/50 px-3 py-1 text-xs text-red-200 hover:border-red-300"
            >
              Reject
            </button>
          </div>
        )}
      </div>
    </article>
  );
}
