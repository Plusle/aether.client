# Aether API Reference

This document describes all HTTP endpoints for the Aether backend, organized by module. Use this as a reference for developing client applications.

**Base URL:** `http://<your-server>:8080`

**Content-Type:** `application/json`

---

## Quick Start

No authentication is required — all endpoints are publicly accessible.

```bash
# 1. Register a weather region
curl -X POST http://localhost:8080/weather/regions \
  -H "Content-Type: application/json" \
  -d '{"location_id": "101010100", "name": "Beijing"}'

# 2. Fetch weather data
curl -X POST http://localhost:8080/weather/update

# 3. Read the records
curl http://localhost:8080/weather/regions/101010100/records?limit=12
```

---

## Table of Contents

- [Weather Module](#weather-module)
- [RSS Module](#rss-module)
- [Calendar Module](#calendar-module)

---

## Weather Module

Weather data management for multiple regions.

### List Regions

Get all registered weather regions.

```
GET /weather/regions
```

**Response:** `200 OK`

```json
[
  {
    "name": "Beijing",
    "location_id": "101010100"
  },
  {
    "name": "Shanghai",
    "location_id": "101020100"
  }
]
```

---

### Register Region

Register a new region for weather tracking.

```
POST /weather/regions
```

**Request Body:**

```json
{
  "location_id": "101010100",
  "name": "Beijing"
}
```

**Response:** `201 Created`

---

### Unregister Region

Remove a region from weather tracking.

```
DELETE /weather/regions/{location_id}
```

**Response:** `204 No Content`

---

### Get Weather Records

Get historical weather records for a region.

```
GET /weather/regions/{location_id}/records?limit=24
```

**Query Parameters:**

- `limit` (optional): Number of records to return (default: 24)

**Response:** `200 OK`

```json
[
  {
    "obs_time": "2024-01-15T10:00:00Z",
    "temp": 5.2,
    "feels_like": 3.1,
    "weather_text": "Sunny",
    "wind_dir": "NW",
    "wind_scale": 3,
    "humidity": 45,
    "precip": 0.0,
    "pressure": 1013.2
  }
]
```

---

### Update Weather Data

Trigger manual update for all registered regions.

```
POST /weather/update
```

**Response:** `200 OK`

---

### Lookup Location

Convert coordinates to location_id.

```
GET /weather/location?lon=116.4&lat=39.9
```

**Query Parameters:**

- `lon`: Longitude (required)
- `lat`: Latitude (required)

**Response:** `200 OK`

```json
{
  "location_id": "101010100"
}
```

---

## RSS Module

RSS feed aggregation and management.

### List Categories

Get all RSS categories.

```
GET /rss/categories
```

**Response:** `200 OK`

```json
[
  {
    "id": 1,
    "name": "Tech News"
  },
  {
    "id": 2,
    "name": "Science"
  }
]
```

---

### Create Category

Create a new RSS category.

```
POST /rss/categories
```

**Request Body:**

```json
{
  "name": "Tech News"
}
```

**Response:** `201 Created`

```json
{
  "id": 1,
  "name": "Tech News"
}
```

---

### Disable Category

Disable all sources in a category (soft delete).

```
POST /rss/categories/{id}
```

**Response:** `200 OK`

---

### List Sources by Category

Get all sources in a specific category.

```
GET /rss/categories/{id}/sources
```

**Response:** `200 OK`

```json
[
  {
    "url": "https://example.com/feed.xml",
    "title": "Example Feed",
    "category_id": 1,
    "activated": true,
    "last_fetched_at": "2024-01-15T10:00:00Z"
  }
]
```

---

### Get Articles by Category

Get articles from all sources in a category with pagination.

```
GET /rss/categories/{id}/articles?start=0&count=10
```

**Query Parameters:**

- `start` (optional): Starting offset (default: 0)
- `count` (optional): Number of articles (default: 10)

**Response:** `200 OK`

```json
[
  {
    "title": "Article Title",
    "link": "https://example.com/article/1",
    "description": "Article description...",
    "published_at": "2024-01-15T10:00:00Z"
  }
]
```

---

### List Sources

Get all active RSS sources.

```
GET /rss/sources
```

**Response:** `200 OK`

```json
[
  {
    "url": "https://example.com/feed.xml",
    "title": "Example Feed",
    "category_id": 1,
    "activated": true,
    "last_fetched_at": "2024-01-15T10:00:00Z"
  }
]
```

---

### Register Source

Register a new RSS source. Re-activates if previously unregistered.

```
POST /rss/sources
```

**Request Body:**

```json
{
  "url": "https://example.com/feed.xml",
  "title": "Example Feed",
  "category_id": 1
}
```

**Validation:**
- URL must be valid HTTP or HTTPS
- Returns `400 Bad Request` for invalid URLs

**Response:** `201 Created`

---

### Unregister Source

Unregister an RSS source (soft delete).

```
DELETE /rss/sources?url={url}&category_id={category_id}
```

**Query Parameters:**

- `url`: Source URL (required)
- `category_id`: Category ID (required)

**Response:** `204 No Content`

---

### Get Articles by Source

Get articles from a specific source with pagination.

```
GET /rss/sources/articles?url={url}&category_id={category_id}&start=0&count=10
```

**Query Parameters:**

- `url`: Source URL (required)
- `category_id`: Category ID (required)
- `start` (optional): Starting offset (default: 0)
- `count` (optional): Number of articles (default: 10)

**Response:** `200 OK`

```json
[
  {
    "title": "Article Title",
    "link": "https://example.com/article/1",
    "description": "Article description...",
    "published_at": "2024-01-15T10:00:00Z"
  }
]
```

---

### Update RSS Feeds

Trigger manual update for all active RSS sources. Returns detailed results.

```
POST /rss/update
```

**Response:** `200 OK`

```json
{
  "sources": [
    {
      "url": "https://example.com/feed.xml",
      "title": "Example Feed",
      "category_id": 1,
      "new_articles": [
        {
          "title": "New Article",
          "link": "https://example.com/article/2"
        }
      ]
    }
  ],
  "errors": [
    {
      "url": "https://broken.com/feed.xml",
      "error": "Failed to fetch feed: Connection timeout"
    }
  ]
}
```

---

## Calendar Module

Event calendar with categories and date range queries.

### List Categories

Get all calendar categories.

```
GET /calendar/categories
```

**Response:** `200 OK`

```json
[
  {
    "id": 1,
    "name": "Work",
    "color": "#FF5733"
  },
  {
    "id": 2,
    "name": "Personal",
    "color": "#33FF57"
  }
]
```

---

### Create Category

Create a new calendar category.

```
POST /calendar/categories
```

**Request Body:**

```json
{
  "name": "Work",
  "color": "#FF5733"
}
```

**Response:** `201 Created`

```json
{
  "id": 1,
  "name": "Work",
  "color": "#FF5733"
}
```

---

### Update Category

Update an existing category.

```
PUT /calendar/categories/{id}
```

**Request Body:**

```json
{
  "name": "Work Updated",
  "color": "#FF5734"
}
```

**Response:** `200 OK`

---

### Delete Category

Delete a category. Events in this category will be moved to the default "unclassified" category (id=0).

```
DELETE /calendar/categories/{id}
```

**Response:** `204 No Content`

---

### List Events

Get events within a date range, optionally filtered by category.

```
GET /calendar/events?start=2024-01-01T00:00:00Z&end=2024-01-31T23:59:59Z&category_id=1
```

**Query Parameters:**

- `start`: Start of date range (required, ISO 8601 format)
- `end`: End of date range (required, ISO 8601 format)
- `category_id` (optional): Filter by category

**Response:** `200 OK`

```json
[
  {
    "id": 1,
    "title": "Team Meeting",
    "description": "Discuss project status",
    "location": "Conference Room A",
    "start_time": "2024-01-15T10:00:00Z",
    "end_time": "2024-01-15T11:00:00Z",
    "status": "scheduled",
    "category_id": 1
  }
]
```

**Event Status Values:**

- `"scheduled"`: Planned event
- `"pending"`: Event occurred but not confirmed
- `"confirmed"`: Confirmed event
- `"cancelled"`: Cancelled event

---

### Create Event

Create a new calendar event.

```
POST /calendar/events
```

**Request Body:**

```json
{
  "title": "Team Meeting",
  "description": "Discuss project status",
  "location": "Conference Room A",
  "start_time": "2024-01-15T10:00:00Z",
  "end_time": "2024-01-15T11:00:00Z",
  "status": "scheduled",
  "category_id": 1
}
```

**Fields:**

- `title` (required): Event title
- `description` (optional): Event description
- `location` (optional): Event location
- `start_time` (required): Start time (ISO 8601)
- `end_time` (optional): End time. If null, event is considered all-day
- `status` (optional): Event status (default: "scheduled")
- `category_id` (optional): Category ID (default: 0 for unclassified)

**Response:** `201 Created`

```json
{
  "id": 1,
  "title": "Team Meeting",
  "description": "Discuss project status",
  "location": "Conference Room A",
  "start_time": "2024-01-15T10:00:00Z",
  "end_time": "2024-01-15T11:00:00Z",
  "status": "scheduled",
  "category_id": 1
}
```

---

### Get Event

Get a specific event by ID.

```
GET /calendar/events/{id}
```

**Response:** `200 OK`

```json
{
  "id": 1,
  "title": "Team Meeting",
  "description": "Discuss project status",
  "location": "Conference Room A",
  "start_time": "2024-01-15T10:00:00Z",
  "end_time": "2024-01-15T11:00:00Z",
  "status": "scheduled",
  "category_id": 1
}
```

---

### Update Event

Update an existing event.

```
PUT /calendar/events/{id}
```

**Request Body:**

```json
{
  "title": "Team Meeting Updated",
  "description": "New description",
  "location": "Room B",
  "start_time": "2024-01-15T10:00:00Z",
  "end_time": "2024-01-15T11:00:00Z",
  "status": "confirmed",
  "category_id": 1
}
```

**Fields:** All fields required (same as create event)

**Response:** `200 OK`

---

### Delete Event

Delete an event.

```
DELETE /calendar/events/{id}
```

**Response:** `204 No Content`

---

## Error Handling

All endpoints return standard HTTP status codes:

- `200 OK`: Success (GET, PUT)
- `201 Created`: Resource created (POST)
- `204 No Content`: Success with no response body (DELETE)
- `400 Bad Request`: Invalid request (e.g., invalid URL format)
- `500 Internal Server Error`: Server error

Error responses may include a plain text error message.

---

## Data Types

### DateTime Format

All datetime fields use ISO 8601 format with timezone:

```
YYYY-MM-DDTHH:MM:SSZ
```

Example: `"2024-01-15T10:00:00Z"`

### Color Format

Calendar category colors use hex color codes:

```
#RRGGBB
```

Example: `"#FF5733"`

### Event Status

Calendar events have the following status values:

- `scheduled`: Event is planned
- `pending`: Event occurred but not confirmed by user
- `confirmed`: Event is confirmed
- `cancelled`: Event is cancelled

---

## Design Notes for Client Development

### Authentication

No authentication is required. All endpoints are publicly accessible. This is intended for local / single-user use.

### Soft Deletes vs Hard Deletes

| Resource | Delete Behavior |
|----------|----------------|
| Weather regions | Soft delete — sets `activated = false`. Re-registering via `POST /weather/regions` re-activates the region. |
| RSS sources | Soft delete — sets `activated = false`. Re-registering via `POST /rss/sources` re-activates the source. |
| RSS categories | `POST /rss/categories/{id}` soft-deletes **all sources** in that category. |
| Calendar events | Hard delete — permanently removed. |
| Calendar categories | Hard delete — events are moved to the default "unclassified" category (`id = 0`). |

### Default "Unclassified" Calendar Category

The system ships with a built-in calendar category:

```json
{ "id": 0, "name": "unclassified", "color": "#808080" }
```

- This category is **not** returned by `GET /calendar/categories`.
- Events created without a `category_id` default to `0`.
- Deleting a category moves its events to this category.

### Weather Regions

- Each region is identified by a `location_id` string (e.g. `"101010100"`). These are QWeather location codes.
- Use `GET /weather/location?lon=...&lat=...` to convert GPS coordinates into a `location_id`.
- `POST /weather/update` fetches current weather from the QWeather API for all registered regions. The client doesn't need to know about the external API — it just triggers the server to do the fetch.

### RSS Update Response

The `POST /rss/update` response is intentionally detailed — it includes both successfully updated sources with their new articles, and any sources that failed with error messages. Your client should handle both `sources` and `errors` arrays in the response.

### All-Day Events

A calendar event with `end_time: null` is treated as an all-day event. The event spans the entire day of `start_time`.
