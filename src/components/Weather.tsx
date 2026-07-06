import { useState, useEffect, useCallback } from 'react';
import { getRegions, getRecords, updateWeather } from '../services/weatherApi';
import type { Region, WeatherRecord } from '../services/weatherApi';

function Weather() {
  const [regions, setRegions] = useState<Region[]>([]);
  const [selectedId, setSelectedId] = useState<string>('');
  const [record, setRecord] = useState<WeatherRecord | null>(null);
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const queryRecord = useCallback(async (locationId: string) => {
    if (!locationId) return;
    setLoading(true);
    setError(null);
    try {
      const records = await getRecords(locationId, 1);
      setRecord(records.length > 0 ? records[0] : null);
      if (records.length === 0) {
        setError('No data available. Try "Fresh Update" first.');
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Query failed');
      setRecord(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load: fetch regions, then auto-query first region
  useEffect(() => {
    getRegions()
      .then((data) => {
        setRegions(data);
        if (data.length > 0) {
          setSelectedId(data[0].location_id);
          queryRecord(data[0].location_id);
        }
      })
      .catch((e) => {
        setError(e instanceof Error ? e.message : 'Failed to load regions');
      });
  }, [queryRecord]);

  const handleRegionChange = (locationId: string) => {
    setSelectedId(locationId);
    queryRecord(locationId);
  };

  const handleQuery = () => {
    queryRecord(selectedId);
  };

  const handleFreshUpdate = async () => {
    setUpdating(true);
    setError(null);
    try {
      await updateWeather();
      await queryRecord(selectedId);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Update failed');
    } finally {
      setUpdating(false);
    }
  };

  const selectedRegion = regions.find((r) => r.location_id === selectedId);

  return (
    <div style={{ padding: '16px' }}>
      {/* Region selector + buttons */}
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap' }}>
        <select
          value={selectedId}
          onChange={(e) => handleRegionChange(e.target.value)}
          style={{
            padding: '6px 10px',
            borderRadius: '6px',
            border: '1px solid var(--border)',
            background: 'var(--bg)',
            color: 'var(--text-h)',
            fontSize: '14px',
            cursor: 'pointer',
          }}
        >
          {regions.map((r) => (
            <option key={r.location_id} value={r.location_id}>
              {r.name}
            </option>
          ))}
        </select>
        <button
          onClick={handleQuery}
          disabled={loading || !selectedId}
          style={{
            padding: '6px 14px',
            borderRadius: '6px',
            border: '1px solid var(--border)',
            background: 'var(--bg)',
            color: 'var(--text-h)',
            fontSize: '13px',
            cursor: loading ? 'wait' : 'pointer',
            opacity: loading ? 0.6 : 1,
          }}
        >
          {loading ? 'Querying...' : 'Query'}
        </button>
        <button
          onClick={handleFreshUpdate}
          disabled={updating || !selectedId}
          style={{
            padding: '6px 14px',
            borderRadius: '6px',
            border: '1px solid var(--accent-border)',
            background: 'var(--accent-bg)',
            color: 'var(--accent)',
            fontSize: '13px',
            fontWeight: 600,
            cursor: updating ? 'wait' : 'pointer',
            opacity: updating ? 0.6 : 1,
          }}
        >
          {updating ? 'Updating...' : 'Force Update'}
        </button>
      </div>

      {/* Error display */}
      {error && (
        <div style={{ color: '#e53e3e', fontSize: '13px', marginBottom: '12px' }}>
          {error}
        </div>
      )}

      {/* Weather data display */}
      {record ? (
        <div>
          {/* Location name */}
          <div style={{ color: 'var(--text)', fontSize: '14px', marginBottom: '4px' }}>
            {selectedRegion?.name ?? selectedId}
          </div>

          {/* Temperature - large */}
          <div style={{ fontSize: '42px', fontWeight: 'bold', color: 'var(--text-h)', lineHeight: 1.1 }}>
            {record.temp}°C
          </div>

          {/* Condition text */}
          <div style={{ color: 'var(--text)', fontSize: '16px', marginTop: '4px' }}>
            {record.weather_text}
          </div>

          {/* Details grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '8px 16px',
            marginTop: '16px',
            fontSize: '13px',
          }}>
            <Detail label="Feels like" value={`${record.feels_like}°C`} />
            <Detail label="Humidity" value={`${record.humidity}%`} />
            <Detail label="Wind" value={`${record.wind_dir} scale ${record.wind_scale}`} />
            <Detail label="Precipitation" value={`${record.precip} mm`} />
            <Detail label="Pressure" value={`${record.pressure} hPa`} />
            <Detail label="Updated" value={formatTime(record.obs_time)} />
          </div>
        </div>
      ) : !loading && !error ? (
        <div style={{ color: 'var(--text)', fontSize: '14px' }}>
          Select a region and click "Query" to load weather data.
        </div>
      ) : null}
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span style={{ color: 'var(--text)', fontSize: '12px' }}>{label}</span>
      <div style={{ color: 'var(--text-h)', fontWeight: 500 }}>{value}</div>
    </div>
  );
}

function formatTime(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleString();
  } catch {
    return iso;
  }
}

export default Weather;
