# 🏗️ System Architecture

Complete architectural overview of Betinho - RKMMAX Hybrid Intelligence System

## Overview

Betinho is built on a **4-layer architecture** designed for serverless deployment with a focus on reliability, performance, and scalability.

## 4-Layer Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Layer 1: Presentation                     │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  React UI    │  │  Chat Page   │  │  Components  │      │
│  │  • Routing   │  │  • Messages  │  │  • Buttons   │      │
│  │  • State     │  │  • Input     │  │  • Cards     │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└──────────────────────────┬──────────────────────────────────┘
                           │
┌──────────────────────────┴──────────────────────────────────┐
│                    Layer 2: API Gateway                      │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ /api/chat    │  │ chat-stream  │  │ /api/health  │      │
│  │ Standard     │  │ SSE Stream   │  │ Monitoring   │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└──────────────────────────┬──────────────────────────────────┘
                           │
┌──────────────────────────┴──────────────────────────────────┐
│                Layer 3: Intelligence Layer                   │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Orchestrator │  │ Circuit      │  │ Smart Cache  │      │
│  │ • Racing     │  │ Breakers     │  │ • LRU        │      │
│  │ • Fallback   │  │ • Timeouts   │  │ • TTL 5min   │      │
│  │ • Parallel   │  │ • Recovery   │  │ • Hit Rate   │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐                         │
│  │ Metrics      │  │ Env Validate │                         │
│  │ • Tracking   │  │ • Keys       │                         │
│  │ • Stats      │  │ • Health     │                         │
│  └──────────────┘  └──────────────┘                         │
└──────────────────────────┬──────────────────────────────────┘
                           │
┌──────────────────────────┴──────────────────────────────────┐
│                    Layer 4: AI Engines                       │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Gemini 2.5   │  │ Groq Llama   │  │ Gemini Flash │      │
│  │ Pro          │  │ 70B          │  │ 2.0          │      │
│  │ KIZI Pro     │  │ KIZI Speed   │  │ KIZI Flash   │      │
│  │ Complex      │  │ Fast         │  │ Simple       │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
```

## Layer 1: Presentation Layer

### Technology Stack
- **React 18.3**: Modern React with hooks
- **React Router 6**: Client-side routing
- **CSS Modules**: Component-scoped styling
- **Sentry**: Error tracking
- **PostHog**: Analytics

### Key Components

#### Chat Interface
- Real-time message display
- Markdown rendering
- Code syntax highlighting
- File upload support
- Voice input (future)

#### State Management
- React hooks (useState, useEffect, useContext)
- Local storage for persistence
- Session management with Supabase

### Performance Optimizations
- Code splitting with React.lazy
- Memoization with useMemo/useCallback
- Virtual scrolling for long conversations
- Image optimization with lazy loading

---

## Layer 2: API Gateway Layer

### Serverless Functions (Vercel)

All API endpoints are deployed as serverless functions with:
- **12-second timeout** (Vercel limit)
- **1024 MB memory**
- **Node.js 22.x runtime**

### Endpoints

#### `/api/chat` - Standard Chat
- Receives messages array
- Returns complete response
- Uses engine orchestrator
- Supports caching

#### `/api/chat-stream` - SSE Streaming
- Returns Server-Sent Events
- Streams response chunks
- < 500ms first byte
- Graceful timeout handling

#### `/api/health` - Health Check
- System status
- Engine availability
- Performance metrics
- Circuit breaker states

#### `/api/specialists` - Specialist List
- Available specialists
- Categories
- Capabilities

### Request Flow

```
Client Request
    ↓
API Endpoint
    ↓
Validate Input
    ↓
Check Cache ←─────┐
    ↓ Miss         │ Hit
Orchestrator       │
    ↓             │
Response ─────────┘
    ↓
Cache Store
    ↓
Send to Client
```

---

## Layer 3: Intelligence Layer

### Engine Orchestrator

**Purpose**: Intelligent routing and failover between AI engines

**Strategy**:
1. **Complexity Analysis**: Analyze query complexity
2. **Engine Selection**: Choose optimal engine(s)
3. **Parallel Racing**: Launch multiple engines
4. **First Success**: Return first successful response
5. **Fallback Chain**: Try alternatives on failure

**Code Location**: `api/lib/engine-orchestrator.js`

```javascript
// Example flow
const result = await orchestrateEngines(messages, systemPrompt, {
  geminiKey: process.env.GEMINI_API_KEY,
  groqKey: process.env.GROQ_API_KEY,
  complexity: 'speed',
  useParallel: true
});
```

### Circuit Breakers

**Purpose**: Prevent cascading failures and enable fast recovery

**Pattern**: CLOSED → OPEN → HALF_OPEN → CLOSED

**Configuration**:
- **Timeout**: 5-8s per engine
- **Threshold**: 3 failures to open
- **Reset**: 30s before retry

**States**:
- **CLOSED**: Normal operation
- **OPEN**: Failing, use fallback
- **HALF_OPEN**: Testing recovery

**Code Location**: `api/lib/circuit-breaker.js`

### Smart Cache

**Purpose**: Reduce latency and API costs

**Strategy**:
- **In-Memory**: Fast access, no external deps
- **LRU Eviction**: Remove least recently used
- **TTL**: 5-minute expiration
- **MD5 Keys**: Content-based hashing

**Metrics**:
- Hit rate: 30%+ target
- Size: 100 entries max
- Cleanup: Every 5 minutes

**Code Location**: `api/lib/cache.js`

### Performance Metrics

**Purpose**: Track system health and performance

**Tracked Metrics**:
- Response times (avg, min, max, p95, p99)
- Engine usage distribution
- Cache hit/miss rates
- Error rates and types
- Timeout incidents

**Export**:
- Sentry context
- Console logs
- Health endpoint

**Code Location**: `api/lib/metrics.js`

---

## Layer 4: AI Engines Layer

### Engine Selection Logic

```javascript
function analyzeComplexity(messages) {
  // Complex indicators
  if (hasCode || hasAnalysis || hasDeepQuestion) {
    return 'pro'; // Use Gemini 2.5 Pro
  }
  
  // Simple indicators
  if (isGreeting || isShortQuery) {
    return 'flash'; // Use Gemini Flash
  }
  
  // Default
  return 'speed'; // Use Groq Speed
}
```

### Gemini 2.5 Pro (KIZI Pro)

**Use Cases**:
- Complex reasoning
- Code analysis
- Deep research
- Long-form content

**Configuration**:
- Model: `gemini-2.5-pro`
- Temperature: 1.0
- Max Tokens: 16,000
- Timeout: 8s

### Groq Llama 70B (KIZI Speed)

**Use Cases**:
- Fast responses
- General queries
- Conversational
- Standard tasks

**Configuration**:
- Model: `llama-3.3-70b-versatile`
- Temperature: 0.7
- Max Tokens: 4,000
- Timeout: 5s

### Gemini Flash (KIZI Flash)

**Use Cases**:
- Simple queries
- Greetings
- Quick facts
- Light conversation

**Configuration**:
- Model: `gemini-2.0-flash`
- Temperature: 0.7
- Max Tokens: 4,000
- Timeout: 6s

---

## Performance Optimization

### Timeout Strategy

```
Total Time Budget: 12s
├─ Engine Call: 8s max
├─ Cache Lookup: < 10ms
├─ Processing: < 100ms
└─ Safety Margin: 4s
```

### Parallel Processing

```javascript
// Race 3 engines simultaneously
Promise.all([
  callGeminiPro(),
  callGroqSpeed(),
  callGeminiFlash()
]);

// Return first successful response
// Cancel other pending requests
```

### Caching Strategy

```
Request Flow:
1. Generate cache key (MD5 of messages)
2. Check cache (< 10ms)
3. If HIT: Return cached (total < 20ms)
4. If MISS: Call engines, cache result
```

---

## Security Considerations

### API Key Management
- Environment variables only
- Never exposed to client
- Validated on startup
- Separate keys per environment

### Input Validation
- Message array validation
- Content length limits
- XSS prevention
- SQL injection prevention (N/A - no DB queries)

### Rate Limiting
- 100 requests/minute per IP
- 1000 requests/hour per user
- Sliding window algorithm

### Error Handling
- Never expose API keys in errors
- Sanitize error messages
- Log securely to Sentry
- Graceful degradation

---

## Monitoring & Observability

### Health Checks
- **Endpoint**: `GET /api/health`
- **Frequency**: Every 5 minutes
- **Alerts**: On degraded/unhealthy status

### Performance Monitoring
- Response times
- Engine success rates
- Cache efficiency
- Error rates

### Error Tracking
- **Sentry**: Production errors
- **Console**: Development logs
- **Context**: Request/response data

### Analytics
- **PostHog**: User behavior
- **Feature flags**: A/B testing
- **Funnels**: Conversion tracking

---

## Scalability

### Horizontal Scaling
- Serverless auto-scales
- No state on servers
- Shared cache (in-memory per instance)

### Vertical Scaling
- Increase memory allocation
- Adjust timeout values
- Optimize code paths

### Cost Optimization
- Cache reduces API calls by 30%+
- Engine selection minimizes costs
- Automatic failover prevents waste

---

## Deployment Architecture

### Vercel Deployment

```
Git Push (main branch)
    ↓
GitHub Actions
    ↓
Run Tests
    ↓
Build React App
    ↓
Deploy to Vercel
    ↓
Health Check
    ↓
Production Live
```

### Environment Variables

**Required**:
- `GEMINI_API_KEY` or `GROQ_API_KEY`

**Recommended**:
- `REACT_APP_SENTRY_DSN`
- `REACT_APP_POSTHOG_KEY`
- `SUPABASE_URL`

---

## Future Enhancements

### Planned Features
- [ ] Redis cache for multi-instance sharing
- [ ] WebSocket support for real-time
- [ ] Voice input/output
- [ ] Multi-language support
- [ ] Advanced analytics dashboard

### Scalability Improvements
- [ ] CDN for static assets
- [ ] Edge functions for geo-routing
- [ ] Database for conversation history
- [ ] Queue system for async processing

---

## Conclusion

Betinho's architecture is designed for:
- **Reliability**: Circuit breakers, fallbacks, monitoring
- **Performance**: Caching, parallel processing, timeouts
- **Scalability**: Serverless, stateless, auto-scaling
- **Maintainability**: Clean separation, comprehensive tests

This makes it a **world-class production system** ready for enterprise use.
