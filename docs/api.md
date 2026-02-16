# 📡 API Reference - RKMMAX Híbrido

Complete API documentation for all endpoints in the RKMMAX system.

---

## 📋 Table of Contents

- [Authentication](#authentication)
- [Core Endpoints](#core-endpoints)
  - [Chat API](#1-chat-api)
  - [Hybrid Agent](#2-hybrid-agent)
  - [Specialist Chat](#3-specialist-chat)
  - [AI Service](#4-ai-service)
- [Media Processing](#media-processing)
  - [Multimodal](#5-multimodal)
  - [Transcribe](#6-transcribe)
  - [Vision](#7-vision)
- [Automation](#automation)
  - [Automation Engine](#8-automation-engine)
  - [Security Validator](#9-security-validator)
- [Payment & Billing](#payment--billing)
  - [Checkout](#10-checkout)
  - [Stripe Webhook](#11-stripe-webhook)
  - [Prices](#12-prices)
  - [User Plan](#13-user-plan)
  - [Credit Calculator](#14-credit-calculator)
- [Integration](#integration)
  - [GitHub OAuth](#15-github-oauth)
  - [Send Email](#16-send-email)
  - [Audit Log](#17-audit-log)
- [System](#system)
  - [Health Check](#18-health-check)
- [Error Handling](#error-handling)
- [Rate Limits](#rate-limits)
- [OpenAPI Specification](#openapi-specification)

---

## 🔐 Authentication

Most endpoints require authentication via one of these methods:

### Bearer Token (Supabase Auth)
```bash
Authorization: Bearer YOUR_SUPABASE_JWT_TOKEN
```

### API Key (for service-to-service)
```bash
X-API-Key: YOUR_API_KEY
```

### GitHub OAuth
For GitHub integration endpoints, use GitHub OAuth tokens obtained via `/api/github-oauth`.

---

## 🎯 Core Endpoints

### 1. Chat API

Main chat interface for interacting with AI agents.

**Endpoint:** `POST /api/chat`

**Request:**
```json
{
  "message": "Explain quantum computing in simple terms",
  "model": "gemini-2.0-flash-exp",
  "temperature": 0.7,
  "maxTokens": 2000,
  "context": {
    "previousMessages": []
  }
}
```

**Response:**
```json
{
  "success": true,
  "response": "Quantum computing is a revolutionary approach...",
  "model": "gemini-2.0-flash-exp",
  "tokensUsed": 156,
  "cost": 0.0012,
  "timestamp": "2026-02-16T18:06:25.000Z"
}
```

**cURL Example:**
```bash
curl -X POST https://your-domain.vercel.app/api/chat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "message": "What is the weather like?",
    "model": "gemini-2.0-flash-exp"
  }'
```

**Error Responses:**
- `400` - Invalid request parameters
- `401` - Unauthorized (missing or invalid token)
- `429` - Rate limit exceeded
- `500` - Internal server error

---

### 2. Hybrid Agent

Orchestrates complex tasks using multiple specialist agents.

**Endpoint:** `POST /api/hybrid`

**Request:**
```json
{
  "task": "Build a complete user authentication system",
  "requirements": {
    "security": "high",
    "scalability": "medium",
    "timeline": "2 weeks"
  },
  "specialists": ["fullstack", "security", "devops"]
}
```

**Response:**
```json
{
  "success": true,
  "taskId": "task_abc123",
  "orchestration": {
    "coordinator": "serginho",
    "specialists": [
      {
        "name": "fullstack",
        "role": "Implementation",
        "status": "assigned"
      },
      {
        "name": "security",
        "role": "Security Review",
        "status": "assigned"
      },
      {
        "name": "devops",
        "role": "Deployment Setup",
        "status": "assigned"
      }
    ]
  },
  "estimate": {
    "duration": "2 weeks",
    "cost": 45.50
  }
}
```

**cURL Example:**
```bash
curl -X POST https://your-domain.vercel.app/api/hybrid \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "task": "Implement CI/CD pipeline",
    "requirements": {"platform": "GitHub Actions"}
  }'
```

---

### 3. Specialist Chat

Direct communication with a specific specialist agent.

**Endpoint:** `POST /api/specialist-chat`

**Request:**
```json
{
  "specialist": "security",
  "message": "Review this code for security vulnerabilities",
  "code": "const query = 'SELECT * FROM users WHERE id = ' + userId;",
  "language": "javascript"
}
```

**Response:**
```json
{
  "success": true,
  "specialist": "security",
  "analysis": {
    "vulnerabilities": [
      {
        "type": "SQL Injection",
        "severity": "critical",
        "line": 1,
        "recommendation": "Use parameterized queries"
      }
    ],
    "securityScore": 2.5,
    "recommendations": [
      "Use prepared statements",
      "Implement input validation",
      "Add rate limiting"
    ]
  }
}
```

**Available Specialists:**
- `uiux` - UI/UX Designer
- `fullstack` - Full Stack Developer
- `qa` - QA Tester
- `devops` - DevOps Engineer
- `data` - Data Analyst
- `security` - Security Expert
- `mobile` - Mobile Developer
- `cloud` - Cloud Architect
- `aiml` - AI/ML Engineer
- `product` - Product Manager
- `technical_writer` - Technical Writer
- `architect` - System Architect

---

### 4. AI Service

Abstract AI service layer with automatic provider selection.

**Endpoint:** `POST /api/ai`

**Request:**
```json
{
  "prompt": "Generate a business plan for a SaaS startup",
  "options": {
    "complexity": "high",
    "maxCost": 0.50,
    "preferredProvider": "openai"
  }
}
```

**Response:**
```json
{
  "success": true,
  "provider": "openai",
  "model": "gpt-4-turbo",
  "response": "Executive Summary:\n\nOur SaaS startup...",
  "metadata": {
    "tokensUsed": 1250,
    "cost": 0.0375,
    "latency": 2.4
  }
}
```

---

## 🎬 Media Processing

### 5. Multimodal

Process multiple types of media (text, images, audio) in a single request.

**Endpoint:** `POST /api/multimodal`

**Request (multipart/form-data):**
```bash
--boundary
Content-Disposition: form-data; name="text"

Analyze this image and describe what you see

--boundary
Content-Disposition: form-data; name="image"; filename="photo.jpg"
Content-Type: image/jpeg

[binary image data]
--boundary--
```

**Response:**
```json
{
  "success": true,
  "analysis": {
    "text": "Your request has been processed",
    "image": {
      "description": "A sunset over mountains",
      "objects": ["mountains", "sky", "sun"],
      "colors": ["orange", "purple", "blue"],
      "mood": "serene"
    }
  }
}
```

**cURL Example:**
```bash
curl -X POST https://your-domain.vercel.app/api/multimodal \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "text=Describe this image" \
  -F "image=@photo.jpg"
```

---

### 6. Transcribe

Convert audio to text using AI transcription.

**Endpoint:** `POST /api/transcribe`

**Request (multipart/form-data):**
```bash
--boundary
Content-Disposition: form-data; name="audio"; filename="recording.mp3"
Content-Type: audio/mpeg

[binary audio data]
--boundary
Content-Disposition: form-data; name="language"

en
--boundary--
```

**Response:**
```json
{
  "success": true,
  "transcription": {
    "text": "Hello, this is a test recording.",
    "language": "en",
    "duration": 3.5,
    "confidence": 0.98,
    "words": [
      {"word": "Hello", "start": 0.0, "end": 0.5},
      {"word": "this", "start": 0.6, "end": 0.8}
    ]
  }
}
```

**Supported Audio Formats:**
- MP3
- WAV
- M4A
- FLAC
- OGG

---

### 7. Vision

Analyze images using AI vision models.

**Endpoint:** `POST /api/vision`

**Request (multipart/form-data):**
```bash
curl -X POST https://your-domain.vercel.app/api/vision \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "image=@screenshot.png" \
  -F "task=detect_objects"
```

**Response:**
```json
{
  "success": true,
  "vision": {
    "task": "detect_objects",
    "objects": [
      {"label": "person", "confidence": 0.95, "bbox": [10, 20, 100, 200]},
      {"label": "laptop", "confidence": 0.89, "bbox": [150, 100, 300, 250]}
    ],
    "scene": "office environment",
    "colors": ["gray", "white", "blue"]
  }
}
```

**Available Tasks:**
- `detect_objects` - Object detection
- `ocr` - Text extraction
- `classify` - Image classification
- `describe` - General description

---

## 🤖 Automation

### 8. Automation Engine

Execute automated tasks on GitHub repositories.

**Endpoint:** `POST /api/automation`

**Request:**
```json
{
  "action": "analyze_repository",
  "repository": "github.com/user/repo",
  "tasks": [
    "code_review",
    "security_scan",
    "test_coverage"
  ]
}
```

**Response:**
```json
{
  "success": true,
  "taskId": "auto_xyz789",
  "results": {
    "code_review": {
      "status": "completed",
      "issues": 3,
      "suggestions": 12
    },
    "security_scan": {
      "status": "completed",
      "vulnerabilities": 1,
      "severity": "medium"
    },
    "test_coverage": {
      "status": "completed",
      "coverage": 85.5
    }
  }
}
```

---

### 9. Security Validator

Validate and sanitize user input for security.

**Endpoint:** `POST /api/security-validator`

**Request:**
```json
{
  "input": "SELECT * FROM users WHERE id = 1",
  "type": "sql",
  "mode": "strict"
}
```

**Response:**
```json
{
  "success": true,
  "validation": {
    "safe": false,
    "threats": ["sql_injection"],
    "sanitized": null,
    "recommendation": "Use parameterized queries"
  }
}
```

---

## 💳 Payment & Billing

### 10. Checkout

Create a Stripe checkout session for subscriptions.

**Endpoint:** `POST /api/checkout`

**Request:**
```json
{
  "priceId": "price_1234567890",
  "plan": "pro",
  "successUrl": "https://your-app.com/success",
  "cancelUrl": "https://your-app.com/cancel"
}
```

**Response:**
```json
{
  "success": true,
  "sessionId": "cs_test_1234567890",
  "url": "https://checkout.stripe.com/pay/cs_test_1234567890"
}
```

**cURL Example:**
```bash
curl -X POST https://your-domain.vercel.app/api/checkout \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "priceId": "price_pro_monthly",
    "plan": "pro"
  }'
```

---

### 11. Stripe Webhook

Handle Stripe webhook events (internal use).

**Endpoint:** `POST /api/stripe-webhook`

**Headers:**
```
Stripe-Signature: t=1234567890,v1=abc123...
```

**Events Handled:**
- `checkout.session.completed`
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.paid`
- `invoice.payment_failed`

---

### 12. Prices

Get available subscription pricing plans.

**Endpoint:** `GET /api/prices`

**Response:**
```json
{
  "success": true,
  "plans": [
    {
      "id": "free",
      "name": "Free",
      "price": 0,
      "features": ["100 requests/month", "Basic support"],
      "limits": {
        "requests": 100,
        "tokens": 10000
      }
    },
    {
      "id": "pro",
      "name": "Pro",
      "price": 29.99,
      "priceId": "price_pro_monthly",
      "features": ["Unlimited requests", "Priority support", "Advanced features"],
      "limits": {
        "requests": -1,
        "tokens": -1
      }
    },
    {
      "id": "enterprise",
      "name": "Enterprise",
      "price": 299.99,
      "priceId": "price_enterprise_monthly",
      "features": ["Everything in Pro", "Dedicated support", "Custom integrations"],
      "limits": {
        "requests": -1,
        "tokens": -1
      }
    }
  ]
}
```

---

### 13. User Plan

Get current user's subscription status.

**Endpoint:** `GET /api/me-plan`

**Response:**
```json
{
  "success": true,
  "user": {
    "id": "user_123",
    "email": "user@example.com"
  },
  "plan": {
    "id": "pro",
    "name": "Pro",
    "status": "active",
    "currentPeriodEnd": "2026-03-16T18:06:25.000Z",
    "cancelAtPeriodEnd": false
  },
  "usage": {
    "requests": 1500,
    "tokens": 150000,
    "cost": 12.50
  },
  "limits": {
    "requests": -1,
    "tokens": -1
  }
}
```

---

### 14. Credit Calculator

Calculate usage costs for AI operations.

**Endpoint:** `POST /api/credit-calculator`

**Request:**
```json
{
  "operations": [
    {
      "type": "chat",
      "model": "gpt-4-turbo",
      "tokens": 1000
    },
    {
      "type": "transcribe",
      "duration": 120
    },
    {
      "type": "vision",
      "images": 5
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "calculation": {
    "operations": [
      {"type": "chat", "cost": 0.03},
      {"type": "transcribe", "cost": 0.24},
      {"type": "vision", "cost": 0.05}
    ],
    "totalCost": 0.32,
    "credits": 32
  }
}
```

---

## 🔗 Integration

### 15. GitHub OAuth

GitHub OAuth callback handler.

**Endpoint:** `GET /api/github-oauth?code=OAUTH_CODE`

**Response:**
Redirects to frontend with token in URL hash or cookie.

---

### 16. Send Email

Send transactional emails via Resend.

**Endpoint:** `POST /api/send-email`

**Request:**
```json
{
  "to": "user@example.com",
  "subject": "Welcome to RKMMAX",
  "template": "welcome",
  "data": {
    "name": "John Doe",
    "verificationUrl": "https://app.com/verify?token=abc123"
  }
}
```

**Response:**
```json
{
  "success": true,
  "messageId": "msg_1234567890",
  "status": "sent"
}
```

**Available Templates:**
- `welcome` - Welcome email
- `verification` - Email verification
- `password_reset` - Password reset
- `subscription_confirm` - Subscription confirmation
- `invoice` - Invoice notification

---

### 17. Audit Log

Log user activities for compliance and security.

**Endpoint:** `POST /api/audit-log`

**Request:**
```json
{
  "userId": "user_123",
  "action": "login",
  "resource": "authentication",
  "details": {
    "ip": "192.168.1.1",
    "userAgent": "Mozilla/5.0...",
    "success": true
  }
}
```

**Response:**
```json
{
  "success": true,
  "logId": "log_abc123",
  "timestamp": "2026-02-16T18:06:25.000Z"
}
```

---

## 🏥 System

### 18. Health Check

Check system health and status.

**Endpoint:** `GET /api/health`

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2026-02-16T18:06:25.000Z",
  "services": {
    "database": "operational",
    "stripe": "operational",
    "openai": "operational",
    "gemini": "operational",
    "supabase": "operational"
  },
  "metrics": {
    "uptime": 99.98,
    "avgResponseTime": 234,
    "requestsPerMinute": 45
  }
}
```

---

## ⚠️ Error Handling

All endpoints return standardized error responses:

```json
{
  "success": false,
  "error": {
    "code": "INVALID_REQUEST",
    "message": "Missing required parameter: message",
    "details": {
      "field": "message",
      "type": "string",
      "required": true
    }
  },
  "timestamp": "2026-02-16T18:06:25.000Z"
}
```

### Common Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `INVALID_REQUEST` | 400 | Invalid request parameters |
| `UNAUTHORIZED` | 401 | Missing or invalid authentication |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `NOT_FOUND` | 404 | Resource not found |
| `RATE_LIMIT_EXCEEDED` | 429 | Too many requests |
| `INTERNAL_ERROR` | 500 | Internal server error |
| `SERVICE_UNAVAILABLE` | 503 | Service temporarily unavailable |
| `CIRCUIT_OPEN` | 503 | Circuit breaker is open |

### Error Response Fields

- `success`: Always `false` for errors
- `error.code`: Machine-readable error code
- `error.message`: Human-readable error message
- `error.details`: Additional error context (optional)
- `timestamp`: ISO 8601 timestamp

---

## ⏱️ Rate Limits

Default rate limits per plan:

| Plan | Requests/Minute | Requests/Hour | Requests/Day |
|------|-----------------|---------------|--------------|
| Free | 10 | 100 | 1,000 |
| Pro | 100 | 5,000 | 50,000 |
| Enterprise | 1,000 | 50,000 | Unlimited |

**Rate Limit Headers:**
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1708099585
```

**Rate Limit Exceeded Response:**
```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Rate limit exceeded. Try again in 60 seconds.",
    "retryAfter": 60
  }
}
```

---

## 📜 OpenAPI Specification

A complete OpenAPI 3.0 specification is available at:

```
GET /api/openapi.json
```

You can import this into tools like:
- **Postman** - API testing
- **Swagger UI** - Interactive documentation
- **Insomnia** - REST client
- **OpenAPI Generator** - Generate client SDKs

### Example OpenAPI Import:

```bash
# Download spec
curl https://your-domain.vercel.app/api/openapi.json > api-spec.json

# Generate TypeScript client
npx openapi-generator-cli generate \
  -i api-spec.json \
  -g typescript-fetch \
  -o ./generated-client
```

---

## 🔗 SDK Libraries

Official SDK libraries coming soon:

- JavaScript/TypeScript SDK
- Python SDK
- Go SDK
- Ruby SDK

---

## 📞 Support

For API support:
- **Documentation Issues**: Open an issue on GitHub
- **Technical Support**: Contact via [RKMMAX Support](mailto:support@rkmmax.com)
- **Enterprise Support**: Available on Enterprise plans

---

**API Version:** v1.0.0  
**Last Updated:** 2026-02-16  
**Base URL:** `https://your-domain.vercel.app`
