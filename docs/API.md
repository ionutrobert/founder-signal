# Founder Signal API

## Overview

The Founder Signal API allows you to programmatically validate startup ideas and retrieve structured analysis reports.

## Authentication

All API requests require authentication via API key. Configure your key in `.env.local`:

```
FOUNDER_SIGNAL_API_KEY=fs_your_secret_key_here
```

### Providing the API Key

Include your API key in one of three ways:

1. **Authorization Header** (recommended)
   ```
   Authorization: Bearer fs_your_secret_key_here
   ```

2. **X-API-Key Header**
   ```
   X-API-Key: fs_your_secret_key_here
   ```

3. **Query Parameter** (less secure)
   ```
   ?api_key=fs_your_secret_key_here
   ```

### Key Format

- Must start with `fs_`
- Minimum 16 alphanumeric characters after the prefix
- Example: `fs_abc123def456ghi789`

## Rate Limiting

- **Default**: 10 requests per minute
- Headers included in responses:
  - `X-RateLimit-Limit`: Maximum requests per window
  - `X-RateLimit-Remaining`: Remaining requests in current window
  - `X-RateLimit-Reset`: Unix timestamp when the window resets

## Endpoints

### POST /api/v1/analyze

Validate a startup idea and receive a structured analysis report.

**Request Body:**
```json
{
  "idea": "A SaaS tool that helps founders validate startup ideas using AI",
  "async": false,
  "callback_url": "https://your-server.com/webhook" // optional
}
```

**Parameters:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `idea` | string | Yes | Startup idea to validate (10-10000 characters) |
| `async` | boolean | No | Set to `true` for async processing with callback |
| `callback_url` | string | No | URL to receive POST callback when async is true |

**Response (sync):**
```json
{
  "success": true,
  "data": {
    "score": 75,
    "verdict": "needs-work",
    "ideaSummary": { ... },
    "problemClarity": { ... },
    "targetAudience": { ... },
    "marketInsight": { ... },
    "competition": { ... },
    "positioning": { ... },
    "mvpScope": { ... },
    "monetization": { ... },
    "risks": { ... }
  },
  "resultId": "uuid-here"
}
```

**Response (async):**
```json
{
  "success": true,
  "data": {
    "resultId": "uuid-here",
    "status": "processing",
    "message": "Analysis started. Result will be sent to callback_url."
  }
}
```

### GET /api/v1/status

Check API status or retrieve a stored result.

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `result_id` | string | No | ID of a previous analysis to retrieve |

**Response (status):**
```json
{
  "success": true,
  "data": {
    "status": "operational",
    "version": "1.0.0",
    "storage": {
      "cached_results": 5,
      "max_age": "1 hour"
    }
  }
}
```

**Response (result):**
```json
{
  "success": true,
  "data": {
    "score": 75,
    "verdict": "needs-work",
    ...
  }
}
```

## Error Responses

All errors follow this format:
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": []
  }
}
```

### Error Codes

| Code | Status | Description |
|------|--------|-------------|
| `MISSING_API_KEY` | 401 | No API key provided |
| `INVALID_API_KEY` | 403 | API key is invalid |
| `INVALID_KEY_FORMAT` | 403 | API key format is incorrect |
| `RATE_LIMIT_EXCEEDED` | 429 | Too many requests |
| `INVALID_JSON` | 400 | Request body is not valid JSON |
| `MISSING_IDEA` | 400 | Required field "idea" missing |
| `IDEA_TOO_SHORT` | 400 | Idea is less than 10 characters |
| `IDEA_TOO_LONG` | 400 | Idea exceeds 10000 characters |
| `NOT_FOUND` | 404 | Result not found or expired |
| `ANALYSIS_ERROR` | 500 | Analysis failed |

## Example Usage

### cURL
```bash
curl -X POST https://your-domain.com/api/v1/analyze \
  -H "Authorization: Bearer fs_your_key_here" \
  -H "Content-Type: application/json" \
  -d '{"idea": "A platform that connects freelance developers with startups"}'
```

### JavaScript
```javascript
const response = await fetch('https://your-domain.com/api/v1/analyze', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer fs_your_key_here',
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    idea: 'A platform that connects freelance developers with startups'
  })
});

const result = await response.json();
console.log(result.data.score);
```

### Python
```python
import requests

response = requests.post(
    'https://your-domain.com/api/v1/analyze',
    headers={
        'Authorization': 'Bearer fs_your_key_here',
        'Content-Type': 'application/json'
    },
    json={
        'idea': 'A platform that connects freelance developers with startups'
    }
)

result = response.json()
print(result['data']['score'])
```

## Credits System (Future)

The API is designed to support a credits-based pricing model:
- 1 credit = 1 analysis report
- Rate limiting enforces fair usage
- Callback support for async processing at scale
