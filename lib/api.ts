import axios from 'axios';

export interface NewsArticle {
  id: string;
  title: string;
  imageUrl: string;
  source: string;
  publishedAt: string; // ISO date string
  summary: string;
  url: string;
  timeAgo?: string;
}

// Axios instance for same-origin API routes
const api = axios.create({
  baseURL: '',
  timeout: 10000,
});

/**
 * Fetch the list of market pulse news articles.
 * The API is expected to return an array of objects matching NewsArticle.
 */
export const fetchNews = async (): Promise<NewsArticle[]> => {
  let authHeader: string | undefined;
  if (typeof window !== 'undefined') {
    const token = window.localStorage.getItem('mp_access');
    const scheme = window.localStorage.getItem('mp_scheme') ?? 'Token';
    if (token) {
      authHeader = `${scheme} ${token}`;
    }
  }

  const response = await api.get<NewsArticle[]>('/api/market-pulse', {
    headers: authHeader ? { Authorization: authHeader } : undefined,
  });
  return response.data;
};

export const rankMsmeNews = async (
  items: NewsArticle[],
  limit = 5
): Promise<NewsArticle[]> => {
  if (!items.length) return [];
  const response = await api.post<NewsArticle[]>('/api/msme-top', {
    items,
    limit,
  });
  return response.data;
};
