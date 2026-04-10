'use client';

import { useEffect, useState } from 'react';
import { fetchNews, NewsArticle } from '@/lib/api';
import NewsCard from '@/components/NewsCard';
import SearchBar from '@/components/SearchBar';

export default function HomePage() {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [filtered, setFiltered] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');

  useEffect(() => {
    const load = async () => {
      try {
        const data = await fetchNews();
        setArticles(data);
        setFiltered(data);
      } catch (err) {
        setError('Failed to load news. Please try again later.');
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
      return;
    }
    const lower = query.toLowerCase();
    const filteredList = articles.filter(
      (a) =>
        a.title.toLowerCase().includes(lower) ||
        a.summary.toLowerCase().includes(lower)
    );
    setFiltered(filteredList);
  };

  return (
    <main className="min-h-screen bg-gray-900 text-white p-4 md:p-8">
      {/* Navbar */}
      <nav className="flex items-center justify-between mb-8">
        <div className="text-2xl font-bold">Market Pulse</div>
        {/* Placeholder for future menu */}
        <div></div>
      </nav>

      <SearchBar onSearch={handleSearch} />

      {loading && (
        <div className="flex flex-wrap gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="bg-gray-800 rounded-lg animate-pulse w-full md:w-1/2 lg:w-1/3 h-64"
            ></div>
          ))}
        </div>
      )}

      {error && <p className="text-red-400">{error}</p>}

      {!loading && !error && filtered.length === 0 && (
        <p className="text-gray-400">No results found.</p>
      )}

      {!loading && !error && filtered.length > 0 && (
        <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((article) => (
            <NewsCard key={article.id} article={article} />
          ))}
        </div>
      )}
    </main>
  );
}
