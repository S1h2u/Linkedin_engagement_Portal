'use client';

import { NewsArticle } from '@/lib/api';

interface NewsCardProps {
  article: NewsArticle;
}

export default function NewsCard({ article }: NewsCardProps) {
  const formattedDate = new Date(article.publishedAt).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  return (
    <div className="bg-gray-800 text-white rounded-lg overflow-hidden shadow-lg flex flex-col h-full">
      {article.imageUrl && (
        <div className="relative w-full h-48">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={article.imageUrl}
            alt={article.title}
            className="object-cover w-full h-full"
          />
        </div>
      )}
      <div className="p-4 flex flex-col flex-1">
        <h2 className="text-lg font-semibold mb-2 line-clamp-2">{article.title}</h2>
        <p className="text-sm text-gray-400 mb-2">{article.source} • {formattedDate}</p>
        <p className="text-sm flex-1 line-clamp-3 mb-4">{article.summary}</p>
        <a
          href={article.url}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-auto text-blue-400 hover:underline self-start"
        >
          Read more &rarr;
        </a>
      </div>
    </div>
  );
}
