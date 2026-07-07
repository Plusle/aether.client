import { apiGet, apiPost, apiPut, apiDelete } from './api';

export interface CalendarCategory {
  id: number;
  name: string;
  color: string;
}

export interface CalendarEvent {
  id: number;
  title: string;
  description?: string;
  location?: string;
  start_time: string;
  end_time: string | null;
  status: string;
  category_id: number;
}

export interface CreateEventPayload {
  title: string;
  description?: string;
  location?: string;
  start_time: string;
  end_time?: string | null;
  status?: string;
  category_id?: number;
}

// Categories
export function listCategories(): Promise<CalendarCategory[]> {
  return apiGet<CalendarCategory[]>('/calendar/categories');
}

export function createCategory(name: string, color: string): Promise<CalendarCategory> {
  return apiPost<CalendarCategory>('/calendar/categories', { name, color });
}

export function updateCategory(id: number, name: string, color: string): Promise<void> {
  return apiPut<void>(`/calendar/categories/${id}`, { name, color });
}

export function deleteCategory(id: number): Promise<void> {
  return apiDelete(`/calendar/categories/${id}`);
}

// Events
export function listEvents(start: string, end: string, categoryId?: number): Promise<CalendarEvent[]> {
  const params = new URLSearchParams({ start, end });
  if (categoryId !== undefined) params.set('category_id', String(categoryId));
  return apiGet<CalendarEvent[]>(`/calendar/events?${params}`);
}

export function createEvent(payload: CreateEventPayload): Promise<CalendarEvent> {
  return apiPost<CalendarEvent>('/calendar/events', payload);
}

export function deleteEvent(id: number): Promise<void> {
  return apiDelete(`/calendar/events/${id}`);
}

export type UpdateEventPayload = Partial<CreateEventPayload>

export function updateEvent(id: number, payload: UpdateEventPayload): Promise<CalendarEvent> {
  return apiPut<CalendarEvent>(`/calendar/events/${id}`, payload)
}
