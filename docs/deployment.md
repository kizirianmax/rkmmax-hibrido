# 🚀 Deployment Guide - RKMMAX Híbrido

Complete guide for deploying RKMMAX to production on Vercel.

---

## 📋 Table of Contents

- [Prerequisites](#prerequisites)
- [Vercel Deployment](#vercel-deployment)
- [Environment Variables](#environment-variables)
- [CI/CD Configuration](#cicd-configuration)
- [Domain Configuration](#domain-configuration)
- [Monitoring Setup](#monitoring-setup)
- [Performance Optimization](#performance-optimization)
- [Troubleshooting](#troubleshooting)
- [Rollback Procedures](#rollback-procedures)
- [Scaling Considerations](#scaling-considerations)

---

## ✅ Prerequisites

Before deploying, ensure you have:

### Required Accounts
- ✅ [Vercel Account](https://vercel.com/signup) (Hobby or Pro)
- ✅ [Supabase Account](https://supabase.com) (Database)
- ✅ [Stripe Account](https://stripe.com) (Payments)
- ✅ [GitHub Account](https://github.com) (Auth & CI/CD)
- ✅ [Resend Account](https://resend.com) (Email)

### Optional Services
- 🔸 [Sentry Account](https://sentry.io) (Error tracking)
- 🔸 [PostHog Account](https://posthog.com) (Analytics)
- 🔸 OpenAI API Key (AI services)
- 🔸 Google Gemini API Key (AI services)
- 🔸 Anthropic API Key (AI services - optional)

### Development Tools
```bash
# Required
node --version  # v22.x required
npm --version   # v10+ required

# Install Vercel CLI
npm install -g vercel

# Verify installation
vercel --version
```

---

## 🌐 Vercel Deployment

### Option 1: Deploy via Git (Recommended)

**Step 1: Push to GitHub**
```bash
# Initialize git repository (if not already)
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/rkmmax-hibrido.git
git push -u origin main
```

**Step 2: Import to Vercel**

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click **"Add New Project"**
3. Select **"Import Git Repository"**
4. Choose your GitHub repository
5. Configure project:
   - **Framework Preset**: Create React App
   - **Build Command**: `npm run build`
   - **Output Directory**: `build`
   - **Install Command**: `npm install`

6. Click **"Deploy"**

**Step 3: Configure Environment Variables**

After deployment, go to Project Settings → Environment Variables and add all required variables (see [Environment Variables](#environment-variables) section).

---

### Option 2: Deploy via CLI

**Step 1: Login to Vercel**
```bash
vercel login
```

**Step 2: Link Project**
```bash
cd /path/to/rkmmax-hibrido
vercel link
```

**Step 3: Set Environment Variables**
```bash
# Set production environment variables
vercel env add REACT_APP_OPENAI_API_KEY production
vercel env add REACT_APP_GEMINI_API_KEY production
# ... add all required variables
```

**Step 4: Deploy to Production**
```bash
vercel --prod
```

**Step 5: View Deployment**
```bash
vercel inspect
```

---

### Option 3: One-Click Deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/kizirianmax/rkmmax-hibrido)

This will:
1. Clone the repository
2. Create a new Vercel project
3. Prompt for environment variables
4. Deploy automatically

---

## 🔐 Environment Variables

### Required Variables

#### AI Services
```bash
# OpenAI (GPT models)
REACT_APP_OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxxxxxxxxxx

# Google Gemini (Gemini models)
REACT_APP_GEMINI_API_KEY=AIzaSyxxxxxxxxxxxxxxxxxxxxxxx

# Optional: Anthropic Claude
REACT_APP_ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxxxxxxxxxxxxx
```

**How to obtain:**
- OpenAI: https://platform.openai.com/api-keys
- Gemini: https://aistudio.google.com/app/apikey
- Anthropic: https://console.anthropic.com/

---

#### Database (Supabase)
```bash
# Supabase Project
REACT_APP_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
REACT_APP_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Setup Supabase:**

1. Create project at https://supabase.com
2. Go to Settings → API
3. Copy URL and keys
4. Run database migrations:

```sql
-- Create users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  github_id TEXT UNIQUE,
  plan TEXT DEFAULT 'free',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create subscriptions table
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  status TEXT,
  current_period_end TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create usage table
CREATE TABLE usage (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  operation TEXT,
  cost DECIMAL,
  tokens INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create audit_logs table
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  action TEXT,
  resource TEXT,
  details JSONB,
  ip_address TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_usage_user_id ON usage(user_id);
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
```

---

#### Payment (Stripe)
```bash
# Stripe Keys
STRIPE_SECRET_KEY=sk_test_xxxxxxxxxxxxxxxxxxxxx  # Use sk_live for production
STRIPE_PUBLISHABLE_KEY=pk_test_xxxxxxxxxxxxxxxxxxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxxxxxxx

# Product Price IDs
STRIPE_PRICE_ID_PRO=price_xxxxxxxxxxxxxxxxxxxxx
STRIPE_PRICE_ID_ENTERPRISE=price_xxxxxxxxxxxxxxxxxxxxx
```

**Setup Stripe:**

1. Create account at https://stripe.com
2. Go to Developers → API keys
3. Create products and prices:

```bash
# Create products via Stripe CLI
stripe products create \
  --name "Pro Plan" \
  --description "Professional features"

stripe prices create \
  --product prod_xxxxx \
  --unit-amount 2999 \
  --currency usd \
  --recurring[interval]=month
```

4. Setup webhook:
   - URL: `https://your-domain.vercel.app/api/stripe-webhook`
   - Events: `checkout.session.completed`, `customer.subscription.*`, `invoice.*`

---

#### Authentication (GitHub)
```bash
# GitHub OAuth App
GITHUB_CLIENT_ID=Iv1.xxxxxxxxxxxxxxxxxxxxx
GITHUB_CLIENT_SECRET=xxxxxxxxxxxxxxxxxxxxx
GITHUB_REDIRECT_URI=https://your-domain.vercel.app/api/github-oauth

# Optional: GitHub Personal Access Token (for automation)
GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxxx
```

**Setup GitHub OAuth:**

1. Go to GitHub Settings → Developer settings → OAuth Apps
2. Click "New OAuth App"
3. Fill in details:
   - **Application name**: RKMMAX Híbrido
   - **Homepage URL**: https://your-domain.vercel.app
   - **Authorization callback URL**: https://your-domain.vercel.app/api/github-oauth
4. Copy Client ID and Client Secret

---

#### Email (Resend)
```bash
# Resend API Key
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxx

# Email Configuration
EMAIL_FROM=noreply@your-domain.com
```

**Setup Resend:**

1. Create account at https://resend.com
2. Add and verify your domain
3. Go to API Keys → Create API Key
4. Copy the key

---

#### Company Information
```bash
# Company Details (for branding)
REACT_APP_COMPANY_NAME="RKMMAX"
REACT_APP_COMPANY_EMAIL="contato@rkmmax.com.br"
REACT_APP_COMPANY_SITE="https://rkmmax.com.br"
```

---

### Optional Variables

#### Monitoring (Sentry)
```bash
REACT_APP_SENTRY_DSN=https://xxxxxxxxxxxxxxxxxxxxx@sentry.io/xxxxx
SENTRY_AUTH_TOKEN=xxxxxxxxxxxxxxxxxxxxx
SENTRY_ORG=your-org
SENTRY_PROJECT=rkmmax-hibrido
```

#### Analytics (PostHog)
```bash
REACT_APP_POSTHOG_KEY=phc_xxxxxxxxxxxxxxxxxxxxx
REACT_APP_POSTHOG_HOST=https://app.posthog.com
```

#### Feature Flags
```bash
REACT_APP_FEATURE_AUTOMATION=true
REACT_APP_FEATURE_MULTIMODAL=true
REACT_APP_FEATURE_VISION=true
```

---

### Setting Variables in Vercel

**Via Dashboard:**
1. Go to Project Settings
2. Click "Environment Variables"
3. Add each variable:
   - **Key**: Variable name
   - **Value**: Variable value
   - **Environments**: Select Production, Preview, Development

**Via CLI:**
```bash
# Add single variable
vercel env add REACT_APP_OPENAI_API_KEY production

# Add from .env file
vercel env pull .env.production
# Edit .env.production
vercel env push .env.production production

# List all variables
vercel env ls
```

**Via `.env` files:**

Create environment-specific files:
- `.env` - Default values (not committed)
- `.env.local` - Local overrides (not committed)
- `.env.production` - Production values (not committed)
- `.env.example` - Template (committed)

```bash
# Copy example and fill in values
cp .env.example .env
```

---

## ⚙️ CI/CD Configuration

### GitHub Actions Workflows

RKMMAX uses GitHub Actions for continuous integration and deployment.

#### Workflow 1: Test & Coverage

**File:** `.github/workflows/test.yml`

```yaml
name: Test

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    
    strategy:
      matrix:
        node-version: [20.x, 22.x]
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js ${{ matrix.node-version }}
        uses: actions/setup-node@v3
        with:
          node-version: ${{ matrix.node-version }}
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run tests
        run: npm test -- --coverage
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          token: ${{ secrets.CODECOV_TOKEN }}
```

**Features:**
- ✅ Runs on push to main/develop
- ✅ Tests on Node 20.x and 22.x
- ✅ Generates coverage report
- ✅ Uploads to Codecov

---

#### Workflow 2: Deploy to Vercel

**File:** `.github/workflows/deploy.yml`

```yaml
name: Deploy to Vercel

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Install Vercel CLI
        run: npm install --global vercel@latest
      
      - name: Pull Vercel Environment
        run: vercel pull --yes --environment=production --token=${{ secrets.VERCEL_TOKEN }}
      
      - name: Build Project
        run: vercel build --prod --token=${{ secrets.VERCEL_TOKEN }}
      
      - name: Deploy to Vercel
        run: vercel deploy --prebuilt --prod --token=${{ secrets.VERCEL_TOKEN }}
```

**Setup:**
1. Create Vercel token at https://vercel.com/account/tokens
2. Add to GitHub Secrets: `VERCEL_TOKEN`
3. Add to GitHub Secrets: `VERCEL_ORG_ID` and `VERCEL_PROJECT_ID`

---

### Vercel Git Integration (Automatic)

When you connect your repository to Vercel:

**Automatic Deployments:**
- **Production**: Every push to `main` branch
- **Preview**: Every pull request
- **Development**: Every push to other branches

**Deployment Settings:**

```json
{
  "git": {
    "deploymentEnabled": {
      "main": true,
      "develop": true
    },
    "comment": {
      "enabled": true,
      "preview": true
    }
  },
  "github": {
    "enabled": true,
    "autoAlias": true,
    "silent": false
  }
}
```

---

### Deployment Protection

**Branch Protection Rules:**

1. Go to GitHub → Settings → Branches
2. Add rule for `main`:
   - ✅ Require pull request reviews
   - ✅ Require status checks to pass (CI tests)
   - ✅ Require branches to be up to date
   - ✅ Include administrators

**Vercel Deployment Protection:**

1. Go to Vercel Project Settings → Git
2. Enable:
   - ✅ **Password Protection** for preview deployments
   - ✅ **Trusted GitHub users** only
   - ✅ **Deployment comments** on PRs

---

## 🌍 Domain Configuration

### Add Custom Domain

**Step 1: Add Domain in Vercel**
1. Go to Project Settings → Domains
2. Click "Add"
3. Enter your domain (e.g., `app.rkmmax.com`)

**Step 2: Configure DNS**

Add DNS records at your domain provider:

**Option A: CNAME (Subdomain)**
```
Type: CNAME
Name: app
Value: cname.vercel-dns.com
TTL: 3600
```

**Option B: A Record (Root Domain)**
```
Type: A
Name: @
Value: 76.76.21.21
TTL: 3600
```

**Step 3: Wait for Verification**
- DNS propagation: 1-48 hours
- SSL certificate: Auto-provisioned by Vercel
- HTTPS: Automatically enabled

---

### Domain Aliases

Setup multiple domains for same deployment:

```bash
vercel domains add www.rkmmax.com
vercel domains add rkmmax.com
```

**Configure redirects in `vercel.json`:**
```json
{
  "redirects": [
    {
      "source": "https://www.rkmmax.com/:path*",
      "destination": "https://rkmmax.com/:path*",
      "permanent": true
    }
  ]
}
```

---

## 📊 Monitoring Setup

### Vercel Analytics

**Enable Analytics:**
1. Go to Project Settings → Analytics
2. Click "Enable Analytics"
3. No code changes needed

**Metrics Tracked:**
- Page views
- Unique visitors
- Geographic distribution
- Device types
- Performance (Core Web Vitals)

---

### Sentry Error Tracking

**Step 1: Install Sentry**
```bash
npm install @sentry/react @sentry/tracing
```

**Step 2: Initialize Sentry**

File: `src/lib/sentry.js`
```javascript
import * as Sentry from "@sentry/react";
import { BrowserTracing } from "@sentry/tracing";

Sentry.init({
  dsn: process.env.REACT_APP_SENTRY_DSN,
  integrations: [new BrowserTracing()],
  tracesSampleRate: 1.0,
  environment: process.env.NODE_ENV,
});
```

**Step 3: Configure Source Maps**

In `vercel.json`:
```json
{
  "build": {
    "env": {
      "SENTRY_AUTH_TOKEN": "@sentry-auth-token",
      "SENTRY_ORG": "your-org",
      "SENTRY_PROJECT": "rkmmax-hibrido"
    }
  }
}
```

---

### PostHog Analytics

**Setup:**
```javascript
// src/lib/analytics.js
import posthog from 'posthog-js';

posthog.init(process.env.REACT_APP_POSTHOG_KEY, {
  api_host: process.env.REACT_APP_POSTHOG_HOST,
  autocapture: true,
});
```

**Track Events:**
```javascript
posthog.capture('chat_message_sent', {
  model: 'gpt-4',
  tokens: 150,
});
```

---

### Health Check Endpoint

**Endpoint:** `GET /api/health`

**Setup Monitoring:**

1. **Uptime Robot** (Free)
   - URL: https://your-domain.vercel.app/api/health
   - Interval: 5 minutes
   - Alert: Email/SMS on failure

2. **Better Uptime** (Paid)
   - More locations
   - Faster checks (30s)
   - Status page

**Health Check Response:**
```json
{
  "status": "healthy",
  "timestamp": "2026-02-16T18:06:25Z",
  "services": {
    "database": "operational",
    "stripe": "operational",
    "openai": "operational"
  }
}
```

---

## ⚡ Performance Optimization

### Build Optimization

**vercel.json Configuration:**
```json
{
  "buildCommand": "npm run build",
  "framework": "create-react-app",
  "outputDirectory": "build",
  "installCommand": "npm ci",
  "headers": [
    {
      "source": "/static/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=31536000, immutable"
        }
      ]
    },
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        }
      ]
    }
  ]
}
```

---

### Edge Functions

Move heavy API logic to edge for lower latency:

```javascript
// api/edge-chat.js
export const config = {
  runtime: 'edge',
};

export default async function handler(req) {
  // Edge function logic
  // Runs on Vercel Edge Network (globally)
}
```

---

### Caching Strategy

**Static Assets:**
- Cache-Control: 1 year
- Immutable files (hashed filenames)

**API Responses:**
- Cache frequent queries (15min-1hr)
- Use stale-while-revalidate
- Invalidate on updates

**Database Queries:**
- Connection pooling
- Query result caching
- Read replicas for heavy reads

---

## 🔧 Troubleshooting

### Common Issues

#### Issue 1: "Module not found" Errors

**Symptoms:**
- Build fails with missing module errors

**Solutions:**
```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Verify all dependencies
npm list --depth=0
```

---

#### Issue 2: Serverless Function Timeout

**Symptoms:**
- 504 Gateway Timeout
- Functions exceeding 10s limit

**Solutions:**

1. **Enable Circuit Breaker:**
```javascript
const breaker = new CircuitBreaker({
  timeout: 8000, // 8s max
});
```

2. **Optimize AI Calls:**
```javascript
// Use streaming for long responses
const stream = await openai.chat.completions.create({
  model: 'gpt-4',
  messages: messages,
  stream: true,
});
```

3. **Upgrade Plan:**
- Hobby: 10s timeout
- Pro: 60s timeout
- Enterprise: 900s timeout

---

#### Issue 3: Environment Variables Not Working

**Symptoms:**
- API calls failing
- "undefined" values

**Solutions:**

1. **Check variable names:**
```bash
# Must start with REACT_APP_ for frontend
REACT_APP_API_KEY=xxx  # ✅ Works
API_KEY=xxx            # ❌ Doesn't work
```

2. **Redeploy after changes:**
```bash
vercel --prod
```

3. **Check environment:**
```javascript
console.log('API Key:', process.env.REACT_APP_OPENAI_API_KEY);
```

---

#### Issue 4: Database Connection Errors

**Symptoms:**
- "Too many connections"
- "Connection refused"

**Solutions:**

1. **Use connection pooling:**
```javascript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(url, key, {
  db: {
    poolSize: 10,
  },
});
```

2. **Close connections:**
```javascript
// Always close after use
await supabase.rpc('function_name', params);
```

3. **Upgrade Supabase plan** if hitting limits

---

### Debug Mode

**Enable Debug Logging:**

```bash
# In Vercel
vercel env add DEBUG_MODE production
# Value: true
```

**In code:**
```javascript
if (process.env.DEBUG_MODE === 'true') {
  console.log('Debug info:', data);
}
```

---

### Logs and Monitoring

**View Logs:**

1. **Vercel Dashboard:**
   - Project → Deployments → View Function Logs
   - Real-time logs
   - Filter by function, status, time

2. **Vercel CLI:**
```bash
vercel logs [deployment-url] --follow
```

3. **Sentry:**
   - Error grouping
   - Stack traces
   - User context

---

## 🔄 Rollback Procedures

### Instant Rollback

**Via Dashboard:**
1. Go to Deployments
2. Find previous working deployment
3. Click "Promote to Production"
4. Confirm

**Via CLI:**
```bash
# List deployments
vercel ls

# Rollback to specific deployment
vercel rollback [deployment-url]

# Alias previous deployment
vercel alias [deployment-url] production
```

---

### Git-Based Rollback

```bash
# Find last working commit
git log --oneline

# Revert to commit
git revert [commit-hash]
git push origin main

# Or reset (dangerous)
git reset --hard [commit-hash]
git push --force origin main
```

---

### Gradual Rollout

Use Vercel's traffic splitting:

```bash
# Split traffic 50/50 between deployments
vercel alias [new-deployment] 50
vercel alias [old-deployment] 50

# Monitor metrics
# If issues, redirect all traffic back
vercel alias [old-deployment] 100
```

---

## 📈 Scaling Considerations

### Vertical Scaling (Upgrade Plans)

| Metric | Hobby | Pro | Enterprise |
|--------|-------|-----|------------|
| Function Timeout | 10s | 60s | 900s |
| Function Memory | 1024MB | 3008MB | Custom |
| Concurrent Functions | 100 | 1000 | Custom |
| Bandwidth | 100GB | 1TB | Custom |
| Team Members | 1 | Unlimited | Unlimited |
| **Price** | $0 | $20/mo | Custom |

**When to Upgrade:**
- ⚠️ Frequent timeouts → Pro plan
- ⚠️ High traffic → Pro plan
- ⚠️ Team collaboration → Pro plan
- ⚠️ Enterprise SLA → Enterprise plan

---

### Horizontal Scaling

**Auto-scaling features:**
- ✅ Automatic function scaling
- ✅ Global edge network
- ✅ No configuration needed
- ✅ Pay per execution

**Manual optimizations:**
```javascript
// 1. Database connection pooling
const pool = createPool({ max: 10 });

// 2. Caching layer
const cache = new Cache({ ttl: 300 });

// 3. Rate limiting
const limiter = new RateLimiter({ max: 100 });

// 4. Load balancing (automatic with Vercel)
```

---

### Database Scaling

**Supabase Scaling:**

1. **Read Replicas**
   - Distribute read load
   - Available on Pro plan ($25/mo)

2. **Connection Pooling**
   - PgBouncer included
   - Max 100 connections

3. **Compute Upgrade**
   - Small: 1GB RAM, 2 CPU
   - Medium: 2GB RAM, 4 CPU  
   - Large: 4GB RAM, 8 CPU
   - XL: 8GB RAM, 16 CPU

---

## 📋 Pre-deployment Checklist

Before deploying to production:

- [ ] All tests passing (`npm test`)
- [ ] Coverage >24% (`npm test:coverage`)
- [ ] Build succeeds (`npm run build`)
- [ ] Linting passes (`npm run lint`)
- [ ] Environment variables configured
- [ ] Database migrations run
- [ ] Stripe products created
- [ ] GitHub OAuth configured
- [ ] Domain DNS configured
- [ ] Monitoring setup (Sentry, PostHog)
- [ ] Health checks configured
- [ ] Backup procedures documented
- [ ] Team notified

---

## 🆘 Support

**Deployment Issues:**
- Vercel Support: support@vercel.com
- Vercel Status: https://vercel-status.com
- Community: https://github.com/vercel/vercel/discussions

**Application Issues:**
- GitHub Issues: https://github.com/kizirianmax/rkmmax-hibrido/issues
- Email: contato@rkmmax.com.br

---

## 📚 Additional Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Stripe Integration Guide](https://stripe.com/docs)
- [React Deployment](https://create-react-app.dev/docs/deployment)
- [GitHub Actions](https://docs.github.com/en/actions)

---

**Deployment Guide Version:** 1.0.0  
**Last Updated:** 2026-02-16  
**Maintainer:** @kizirianmax
