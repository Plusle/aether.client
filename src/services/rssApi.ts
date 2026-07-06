import { apiGet, apiPost } from './api';

export interface Category {
  id: number;
  name: string;
}

export interface Source {
  url: string;
  title: string;
  category_id: number;
  activated: boolean;
  last_fetched_at: string;
}

export interface Article {
  title: string;
  link: string;
  description: string;
  published_at: string;
}

export interface UpdateResult {
  sources: { url: string; title: string; category_id: number; new_articles: { title: string; link: string }[] }[];
  errors: { url: string; error: string }[];
}

export function listCategories(): Promise<Category[]> {
  return apiGet<Category[]>('/rss/categories');
}

export function createCategory(name: string): Promise<Category> {
  return apiPost<Category>('/rss/categories', { name });
}

export function registerSource(url: string, title: string, categoryId: number): Promise<void> {
  return apiPost<void>('/rss/sources', { url, title, category_id: categoryId });
}

export function listSources(): Promise<Source[]> {
  return apiGet<Source[]>('/rss/sources');
}

export function getArticles(url: string, categoryId: number, start = 0, count = 20): Promise<Article[]> {
  const params = new URLSearchParams({
    url,
    category_id: String(categoryId),
    start: String(start),
    count: String(count),
  });
  return apiGet<Article[]>(`/rss/sources/articles?${params}`);
}

export function updateFeeds(): Promise<UpdateResult> {
  return apiPost<UpdateResult>('/rss/update');
}
