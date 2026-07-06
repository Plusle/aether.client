import { apiGet, apiPost } from './api';

export interface Region {
  name: string;
  location_id: string;
}

export interface WeatherRecord {
  obs_time: string;
  temp: number;
  feels_like: number;
  weather_text: string;
  wind_dir: string;
  wind_scale: number;
  humidity: number;
  precip: number;
  pressure: number;
}

export function getRegions(): Promise<Region[]> {
  return apiGet<Region[]>('/weather/regions');
}

export function getRecords(locationId: string, limit = 1): Promise<WeatherRecord[]> {
  return apiGet<WeatherRecord[]>(`/weather/regions/${locationId}/records?limit=${limit}`);
}

export function updateWeather(): Promise<void> {
  return apiPost<void>('/weather/update');
}
