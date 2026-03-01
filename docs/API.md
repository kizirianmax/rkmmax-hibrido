# 📚 API Documentation

Complete API reference for Betinho - RKMMAX Hybrid Intelligence System

## Base URL

- **Production**: `https://your-domain.vercel.app`
- **Development**: `http://localhost:3000`

## Authentication

Currently, no authentication is required for the API endpoints. However, rate limiting is applied per IP address.

---

## Endpoints

### 1. Chat (Standard)

**POST** `/api/chat`

Standard chat endpoint that returns complete responses.

#### Request Body

```json
{
  "type": "genius",
  "messages": [
    {
      "role": "user",
      "content": "What is the capital of France?"
    }
  ],
  "agentType": "serginho",
  "forceModel": "speed"
}
```text

#### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `type` | string | No | Type of chat: `genius`, `specialist`, `chat` (default: `genius`) |
| `messages` | array | Yes | Array of message objects with `role` and `content` |
| `agentType` | string | No | Agent personality: `serginho`, `technical`, etc. |
| `specialistId` | string | No | Required when `type=specialist` |
| `forceModel` | string | No | Force specific model: `pro`, `speed`, `flash` |

#### Response

```json
{
  "response": "The capital of France is Paris.",
  "model": "groq-speed",
  "provider": "kizi",
  "tier": "speed",
  "type": "serginho",
  "success": true,
  "cached": false,
  "optimized": true,
  "stats": {
    "originalTokens": 150,
    "optimizedTokens": 120
  }
}
```text

#### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `response` | string | The AI-generated response |
| `model` | string | Model used: `gemini-pro`, `groq-speed`, `gemini-flash` |
| `provider` | string | Provider: `kizi` |
| `tier` | string | Complexity tier: `pro`, `speed`, `flash` |
| `cached` | boolean | Whether response was served from cache |
| `success` | boolean | Whether request was successful |

---

### 2. Chat Stream (SSE)

**POST** `/api/chat-stream`

Server-Sent Events endpoint for streaming responses.

#### Request Body

Same as `/api/chat`

#### Response Format

Server-Sent Events stream with the following event types:

##### Event: `start`

```text
event: start
data: {"status":"processing","timestamp":1234567890}
```text

##### Event: `chunk`

```text
event: chunk
data: {"text":"The capital of France"}
```text

##### Event: `complete`

```text
event: complete
data: {"model":"groq-speed","cached":false,"duration":1234,"success":true}
```text

##### Event: `error`

```text
event: error
data: {"error":"Engine timeout","duration":8000}
```text

##### Event: `timeout`

```text
event: timeout
data: {"error":"Request timeout","duration":11000}
```text

#### Client Example

```javascript
const response = await fetch('/api/chat-stream', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    messages: [{ role: 'user', content: 'Hello!' }]
  })
});

const reader = response.body.getReader();
const decoder = new TextDecoder();

while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  
  const chunk = decoder.decode(value);
  const lines = chunk.split('\n');
  
  for (const line of lines) {
    if (line.startsWith('event:')) {
      const event = line.replace('event: ', '');
      console.log('Event:', event);
    } else if (line.startsWith('data:')) {
      const data = JSON.parse(line.replace('data: ', ''));
      console.log('Data:', data);
    }
  }
}
```text

---

### 3. Health Check

**GET** `/api/health`

Returns system health status and metrics.

#### Response

```json
{
  "status": "healthy",
  "timestamp": "2024-02-04T23:20:00.532Z",
  "version": "1.0.0",
  "uptime": 123456,
  "checkDuration": "234ms",
  "engines": {
    "gemini": {
      "available": true,
      "models": ["gemini-2.5-pro", "gemini-2.0-flash"],
      "status": "OK"
    },
    "groq": {
      "available": true,
      "models": ["llama-3.3-70b-versatile"],
      "status": "OK"
    }
  },
  "environment": {
    "GEMINI_API_KEY": true,
    "GROQ_API_KEY": true,
    "SUPABASE_URL": true
  },
  "performance": {
    "requests": {
      "total": 1234,
      "successful": 1200,
      "failed": 34,
      "successRate": "97.24%"
    },
    "performance": {
      "avgResponseTime": "2340ms",
      "minResponseTime": "567ms",
      "maxResponseTime": "7890ms",
      "p95ResponseTime": "5600ms",
      "p99ResponseTime": "6800ms",
      "timeouts": 2
    },
    "engines": {
      "gemini-pro": 450,
      "groq-speed": 650,
      "gemini-flash": 134
    },
    "cache": {
      "hits": 456,
      "misses": 778,
      "hitRate": "36.95%"
    }
  },
  "circuitBreakers": {
    "gemini-pro": {
      "name": "gemini-pro",
      "state": "CLOSED",
      "failures": 0,
      "successCount": 450,
      "totalCalls": 450,
      "successRate": "100.00%"
    }
  }
}
```text

#### Status Codes

- **200**: System is healthy, all engines available
- **503**: System is degraded, some engines unavailable
- **500**: System is unhealthy, error occurred

---

### 4. Specialists List

**GET** `/api/specialists`

Returns list of available specialist agents.

#### Response

```json
{
  "specialists": [
    {
      "id": "code-expert",
      "name": "Code Expert",
      "description": "Expert in code review and architecture",
      "category": "development",
      "avatar": "🧑‍💻"
    }
  ]
}
```text

---

## Error Codes

| Status Code | Description |
|-------------|-------------|
| 200 | Success |
| 400 | Bad Request - Invalid parameters |
| 405 | Method Not Allowed |
| 429 | Too Many Requests - Rate limit exceeded |
| 500 | Internal Server Error |
| 503 | Service Unavailable - All engines failed |

---

## Error Response Format

```json
{
  "error": "Error message",
  "message": "Detailed error description",
  "hint": "Suggestion to fix the issue"
}
```text

---

## Rate Limiting

- **100 requests per minute** per IP address
- **1000 requests per hour** per user (when authenticated)

Rate limit headers:

```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 87
X-RateLimit-Reset: 1234567890
```text

---

## Caching

Responses are cached for:
- **5 minutes** for standard queries
- **Cache-Control**: `private, max-age=300`

Cache headers:

```http
X-Cache-Status: HIT | MISS
X-Cache-Key: [hash]
```text

---

## Timeouts

- **Standard endpoint**: 12s maximum (serverless limit)
- **Streaming endpoint**: 11s timeout with graceful close
- **Per-engine timeout**: 5-8s depending on engine

---

## Best Practices

### 1. Use Streaming for Long Responses

```javascript
// Good - streaming
POST /api/chat-stream

// Avoid for complex queries
POST /api/chat
```text

### 2. Handle Timeouts Gracefully

```javascript
try {
  const response = await fetch('/api/chat', {
    signal: AbortSignal.timeout(12000)
  });
} catch (error) {
  if (error.name === 'TimeoutError') {
    // Retry with streaming or simpler query
  }
}
```text

### 3. Cache Similar Queries

The system automatically caches responses, but consider:
- Deduplicating similar queries
- Using consistent message formatting
- Avoiding timestamp-dependent content

---

## Support

- **Issues**: [GitHub Issues](https://github.com/kizirianmax/rkmmax-hibrido/issues)
- **Email**: roberto@kizirianmax.site
