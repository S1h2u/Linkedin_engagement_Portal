import axios from 'axios';

export interface NewsArticle {
  id: string;
  title: string;
  imageUrl: string;
  source: string;
  publishedAt: string; // ISO date string
  summary: string;
  url: string;
}

// Axios instance with base URL of the backend API
const api = axios.create({
  baseURL: 'http://115.124.97.148:8081',
  timeout: 10000,
});

/**
 * Fetch the list of market pulse news articles.
 * The API is expected to return an array of objects matching NewsArticle.
 */
export const fetchNews = async (): Promise<NewsArticle[]> => {
  const response = await api.get<NewsArticle[]>('/api/market-pulse/');
  return response.data;
};
