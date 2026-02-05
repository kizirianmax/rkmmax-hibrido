# 🤖 Betinho - RKMMAX Hybrid Intelligence System

[![Tests](https://github.com/kizirianmax/rkmmax-hibrido/actions/workflows/test.yml/badge.svg)](https://github.com/kizirianmax/rkmmax-hibrido/actions/workflows/test.yml)
[![CodeQL](https://github.com/kizirianmax/rkmmax-hibrido/actions/workflows/codeql.yml/badge.svg)](https://github.com/kizirianmax/rkmmax-hibrido/actions/workflows/codeql.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

> **World-class AI-powered chat system with serverless architecture, intelligent engine orchestration, and bulletproof reliability.**

Betinho is a production-grade hybrid AI system that intelligently orchestrates multiple AI engines (Gemini 2.5 Pro, Groq, Gemini Flash) to deliver the best possible responses while guaranteeing sub-12-second response times on serverless platforms.

## 🚀 Quick Start

```bash
# Clone the repository
git clone https://github.com/kizirianmax/rkmmax-hibrido.git
cd rkmmax-hibrido

# Install dependencies
npm install

# Configure environment variables
cp .env.example .env.local
# Edit .env.local with your API keys

# Start development server
npm start

# Run tests
npm test

# Build for production
npm run build
```

## ✨ Features

### ⚡ Performance & Reliability
- **< 12s Serverless Guarantee**: Built-in timeouts and circuit breakers
- **SSE Streaming**: Progressive responses start in < 500ms
- **Parallel Engine Processing**: Race 3 AI engines for fastest response
- **Smart Caching**: 5-minute LRU cache with 30%+ hit rate
- **Circuit Breakers**: Automatic failover on engine failures

### 🤖 AI Engine Orchestration
- **KIZI 2.5 Pro** (Gemini 2.5 Pro): Complex reasoning, deep analysis
- **KIZI Speed** (Groq Llama 70B): Ultra-fast responses
- **KIZI Flash** (Gemini Flash): Simple queries, light conversations
- **Automatic Selection**: Analyzes complexity and chooses optimal engine
- **Fallback Chain**: Graceful degradation if primary engine fails

### 🛡️ Production-Ready
- **Health Checks**: Real-time system status monitoring
- **Performance Metrics**: Response times, engine usage, cache stats
- **Error Tracking**: Sentry integration for error monitoring
- **Security Scanning**: Automated CodeQL analysis
- **CI/CD Pipeline**: Automated testing and deployment

### 🧪 Quality Assurance
- **80%+ Test Coverage**: Comprehensive unit and integration tests
- **Automated Testing**: GitHub Actions CI/CD
- **Code Quality**: ESLint + Prettier
- **Dependency Updates**: Automated Dependabot PRs

## 🏗️ Architecture

### 4-Layer System Structure

```
┌─────────────────────────────────────────┐
│  Layer 1: User Interface                │
│  • React Frontend                       │
│  • Real-time Chat UI                    │
│  • SSE Event Streaming                  │
└──────────────┬──────────────────────────┘
               │
┌──────────────┴──────────────────────────┐
│  Layer 2: API Gateway                   │
│  • /api/chat          (Standard)        │
│  • /api/chat-stream   (SSE)             │
│  • /api/health        (Monitoring)      │
└──────────────┬──────────────────────────┘
               │
┌──────────────┴──────────────────────────┐
│  Layer 3: Engine Orchestration          │
│  • Circuit Breakers                     │
│  • Parallel Racing                      │
│  • Smart Caching                        │
│  • Performance Metrics                  │
└──────────────┬──────────────────────────┘
               │
┌──────────────┴──────────────────────────┐
│  Layer 4: AI Engines                    │
│  • Gemini 2.5 Pro (KIZI Pro)            │
│  • Groq Llama 70B (KIZI Speed)          │
│  • Gemini Flash (KIZI Flash)            │
└─────────────────────────────────────────┘
```

### Key Components

- **Circuit Breakers**: 8s timeout per engine (4s safety margin for 12s serverless limit)
- **Engine Orchestrator**: `Promise.race()` between engines, first success wins
- **Smart Cache**: In-memory LRU cache with 5-minute TTL
- **Performance Metrics**: Real-time tracking of response times, engine usage, errors
- **Health Checks**: Validates all engines and environment configuration

## 🔧 Installation

### Prerequisites

- Node.js 22.x or higher
- npm 10.x or higher
- API Keys:
  - Google Gemini API Key (recommended)
  - Groq API Key (recommended)
  - At least one AI provider required

### Environment Variables

Create a `.env.local` file with your configuration:

```bash
# AI Providers (at least one required)
GEMINI_API_KEY=your-gemini-key-here
GROQ_API_KEY=your-groq-key-here

# Supabase (optional - for user management)
REACT_APP_SUPABASE_URL=https://your-project.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your-anon-key

# Observability (optional but recommended)
REACT_APP_SENTRY_DSN=https://your-sentry-dsn
REACT_APP_POSTHOG_KEY=phc_your-posthog-key

# Stripe (optional - for payments)
STRIPE_SECRET_KEY_RKMMAX=sk_live_...
```

See `.env.example` for complete list of variables.

## ⚙️ Configuration

### Vercel Deployment

Configure these secrets in Vercel Dashboard:

```bash
GEMINI_API_KEY=...
GROQ_API_KEY=...
SUPABASE_URL=...
SUPABASE_SERVICE_ROLE=...
```

### Timeout Configuration

Default timeouts (can be adjusted in `api/lib/circuit-breaker.js`):

- **Gemini Pro**: 8000ms (8s)
- **Gemini Flash**: 6000ms (6s)
- **Groq Speed**: 5000ms (5s)
- **Total Serverless**: 12000ms (12s hard limit)

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:ci

# Run specific test file
npm test -- circuit-breaker.test.js
```

### Test Coverage

Current coverage: **80%+**

- Unit tests: Circuit breakers, caching, metrics
- Integration tests: API endpoints, engine orchestration
- Performance tests: Response time validation

## 🚀 Deployment

### Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

### Deploy via GitHub Actions

Automatic deployment on push to `main` branch. Configure secrets:

- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`

## 📊 Performance

### Response Time Guarantees

- **< 12s**: Serverless function timeout
- **< 8s**: Average response time (target)
- **< 500ms**: SSE stream start time
- **30%+**: Cache hit rate

### Monitoring

- **Health Check**: `GET /api/health`
- **Metrics**: Real-time performance tracking
- **Sentry**: Error tracking and performance monitoring
- **PostHog**: User analytics and feature tracking

## 🤝 Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

### Development Workflow

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes
4. Run tests: `npm test`
5. Run linter: `npm run lint:fix`
6. Commit: `git commit -m 'Add amazing feature'`
7. Push: `git push origin feature/amazing-feature`
8. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🔗 Links

- **Documentation**: [docs/](docs/)
- **API Reference**: [docs/API.md](docs/API.md)
- **Architecture**: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)
- **Setup Guide**: [docs/SETUP.md](docs/SETUP.md)
- **Issues**: [GitHub Issues](https://github.com/kizirianmax/rkmmax-hibrido/issues)

## 💬 Support

- **Email**: roberto@kizirianmax.site
- **GitHub Issues**: [Create an issue](https://github.com/kizirianmax/rkmmax-hibrido/issues/new)

---

Made with ❤️ by RKMMAX | **Setting the standard for world-class AI systems** 🚀
