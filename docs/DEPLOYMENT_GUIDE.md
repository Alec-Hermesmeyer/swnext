# Deployment Guide - SPARC Next.js Application

## Overview

This comprehensive deployment guide covers the deployment of the S&W Foundation Contractors Next.js application following SPARC methodology principles for systematic deployment processes.

## Table of Contents

1. [Pre-Deployment Requirements](#pre-deployment-requirements)
2. [Environment Configuration](#environment-configuration)
3. [Build Process](#build-process)
4. [Deployment Strategies](#deployment-strategies)
5. [Post-Deployment Validation](#post-deployment-validation)
6. [Monitoring and Maintenance](#monitoring-and-maintenance)
7. [Rollback Procedures](#rollback-procedures)

## Pre-Deployment Requirements

### SPARC Phase Validation

Before deployment, ensure all SPARC phases are complete:

#### Specification Compliance
```bash
# Validate specification documentation exists
test -f docs/specs/feature-requirements.md
test -f docs/specs/user-stories.md
test -f docs/specs/acceptance-criteria.md

# Check requirements traceability
grep -r "REQ-" src/ tests/ # Ensure requirements are traced in code
```

#### Architecture Validation
```bash
# Validate architecture documentation
test -f docs/architecture/SYSTEM_ARCHITECTURE.md
test -f docs/architecture/component-design.md

# Validate integration points
curl -f https://api.example.com/health # External API health check
```

#### Refinement Quality Gates
```bash
# Run comprehensive test suite
npm test -- --coverage --watchAll=false

# Check coverage thresholds
npx nyc check-coverage --lines 80 --functions 80 --branches 80

# Security scan
npm audit --audit-level moderate

# Performance validation
npm run test:performance
```

#### Completion Readiness
```bash
# End-to-end test validation
npm run test:e2e

# Accessibility compliance
npm run test:a11y

# Documentation completeness check
find docs/ -name "*.md" -exec grep -l "TODO\|FIXME" {} \; | wc -l | grep -q "^0$"
```

### System Requirements

#### Local Development
- Node.js 18.x or higher
- npm 9.x or higher
- Git 2.x or higher

#### Production Environment
- Vercel account with appropriate permissions
- Supabase project configured
- Environment variables properly set

### Dependencies Audit

```bash
# Security audit
npm audit --audit-level high

# Dependency vulnerability check
npx audit-ci --high

# License compliance check
npx license-checker --onlyAllow "MIT;BSD;ISC;Apache-2.0"

# Bundle size analysis
npm run analyze
```

## Environment Configuration

### Environment Variables

#### Required Variables
```bash
# Application Configuration
NEXT_PUBLIC_APP_NAME=S&W Foundation Contractors
NEXT_PUBLIC_APP_VERSION=2.0.0
NEXT_PUBLIC_ENVIRONMENT=production

# Database & Storage
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Email Service
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=noreply@swfoundation.com
SMTP_PASS=your_smtp_password

# Analytics & Monitoring
NEXT_PUBLIC_GA_ID=GA_MEASUREMENT_ID
VERCEL_ANALYTICS_ID=your_analytics_id
SENTRY_DSN=https://your-sentry-dsn

# Security
NEXTAUTH_URL=https://swfoundation.com
NEXTAUTH_SECRET=your_nextauth_secret
```

#### Environment-Specific Configuration

**Development (.env.local)**
```bash
NODE_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3001
LOG_LEVEL=debug
ENABLE_MOCK_DATA=true
```

**Staging (.env.staging)**
```bash
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://staging.swfoundation.com
LOG_LEVEL=info
ENABLE_MOCK_DATA=false
```

**Production (.env.production)**
```bash
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://swfoundation.com
LOG_LEVEL=warn
ENABLE_MOCK_DATA=false
```

### Configuration Validation

```javascript
// config/environment.js
const requiredEnvVars = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'SMTP_HOST',
  'SMTP_USER',
  'SMTP_PASS'
];

export function validateEnvironment() {
  const missingVars = requiredEnvVars.filter(
    (varName) => !process.env[varName]
  );

  if (missingVars.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missingVars.join(', ')}`
    );
  }

  console.log('✅ Environment validation passed');
}

// Call during build process
validateEnvironment();
```

## Build Process

### Build Configuration

#### next.config.js Optimization
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  
  // Performance optimizations
  swcMinify: true,
  compress: true,
  poweredByHeader: false,
  
  // Image optimization
  images: {
    loader: 'custom',
    loaderFile: './supabase-image-loader.js',
    domains: ['edycymyofrowahspzzpg.supabase.co'],
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 31536000, // 1 year
  },
  
  // Bundle optimization
  webpack: (config, { dev, isServer }) => {
    if (!dev && !isServer) {
      config.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            chunks: 'all',
          },
        },
      };
    }
    return config;
  },
  
  // Headers for security and caching
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
        ],
      },
      {
        source: '/static/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
  
  // Redirects and rewrites
  async redirects() {
    return [
      {
        source: '/home',
        destination: '/',
        permanent: true,
      },
    ];
  },
};

module.exports = nextConfig;
```

### Build Scripts

#### package.json Scripts
```json
{
  "scripts": {
    "dev": "next dev -p 3001",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "lint:fix": "next lint --fix",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:e2e": "playwright test",
    "test:performance": "lighthouse-ci",
    "test:a11y": "axe-playwright",
    "analyze": "cross-env ANALYZE=true next build",
    "type-check": "tsc --noEmit",
    "build:staging": "cross-env NODE_ENV=production ENVIRONMENT=staging next build",
    "build:production": "cross-env NODE_ENV=production ENVIRONMENT=production next build",
    "export": "next export",
    "deploy:staging": "vercel --prod=false",
    "deploy:production": "vercel --prod"
  }
}
```

### Pre-Build Validation

```bash
#!/bin/bash
# scripts/pre-build.sh

echo "🔍 Pre-build validation starting..."

# Environment validation
echo "Validating environment variables..."
node -e "require('./config/environment').validateEnvironment()"

# Dependency check
echo "Checking dependencies..."
npm audit --audit-level high

# Type checking
echo "Running TypeScript checks..."
npm run type-check

# Linting
echo "Running ESLint..."
npm run lint

# Unit tests
echo "Running unit tests..."
npm run test

# Security scan
echo "Running security scan..."
npx audit-ci --high

echo "✅ Pre-build validation completed successfully!"
```

### Build Process

```bash
#!/bin/bash
# scripts/build.sh

set -e # Exit on any error

echo "🏗️  Starting SPARC-compliant build process..."

# Step 1: Pre-build validation
./scripts/pre-build.sh

# Step 2: Clean previous build
echo "Cleaning previous build..."
rm -rf .next out

# Step 3: Install dependencies
echo "Installing dependencies..."
npm ci --only=production

# Step 4: Build application
echo "Building Next.js application..."
npm run build

# Step 5: Generate static export if needed
if [ "$STATIC_EXPORT" = "true" ]; then
  echo "Generating static export..."
  npm run export
fi

# Step 6: Post-build validation
echo "Validating build output..."
test -d .next
test -f .next/BUILD_ID

# Step 7: Bundle analysis
if [ "$ANALYZE_BUNDLE" = "true" ]; then
  echo "Analyzing bundle size..."
  npm run analyze
fi

echo "✅ Build completed successfully!"
```

## Deployment Strategies

### Vercel Deployment (Recommended)

#### Automatic Deployment Setup

```yaml
# .github/workflows/deploy.yml
name: Deploy to Vercel

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run SPARC validation
        run: |
          npm run lint
          npm run type-check
          npm run test -- --coverage
          npm run test:e2e
      
      - name: Build application
        run: npm run build
      
      - name: Upload coverage to Codecov
        uses: codecov/codecov-action@v3

  deploy:
    runs-on: ubuntu-latest
    needs: test
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v3
      
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
          vercel-args: '--prod'
```

#### Manual Deployment

```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Deploy to staging
vercel --prod=false

# Deploy to production
vercel --prod

# Deploy with custom configuration
vercel --prod --build-env NODE_ENV=production
```

#### Vercel Configuration

```json
{
  "version": 2,
  "name": "swnext",
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/next",
      "config": {
        "buildCommand": "npm run build",
        "outputDirectory": ".next"
      }
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "/api/$1"
    },
    {
      "src": "/(.*)",
      "dest": "/$1"
    }
  ],
  "env": {
    "NODE_ENV": "production"
  },
  "regions": ["iad1", "sfo1"],
  "functions": {
    "pages/api/*.js": {
      "maxDuration": 10
    }
  }
}
```

### Alternative Deployment Strategies

#### Docker Deployment

```dockerfile
# Dockerfile
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --only=production

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Run SPARC validation
RUN npm run lint
RUN npm run type-check
RUN npm run test -- --passWithNoTests

# Build application
RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public

# Automatically leverage output traces to reduce image size
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000

CMD ["node", "server.js"]
```

```yaml
# docker-compose.yml
version: '3.8'
services:
  nextjs-app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - NEXT_PUBLIC_SUPABASE_URL=${NEXT_PUBLIC_SUPABASE_URL}
      - NEXT_PUBLIC_SUPABASE_ANON_KEY=${NEXT_PUBLIC_SUPABASE_ANON_KEY}
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3
```

## Post-Deployment Validation

### Health Check Implementation

```javascript
// pages/api/health.js
export default async function handler(req, res) {
  const checks = {
    timestamp: new Date().toISOString(),
    status: 'healthy',
    version: process.env.NEXT_PUBLIC_APP_VERSION,
    environment: process.env.NODE_ENV,
    checks: {}
  };

  try {
    // Database connectivity
    if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
      checks.checks.database = 'healthy';
    }

    // External API connectivity
    if (process.env.SMTP_HOST) {
      checks.checks.email_service = 'healthy';
    }

    // File system check
    const fs = require('fs');
    fs.accessSync('.next');
    checks.checks.filesystem = 'healthy';

    res.status(200).json(checks);
  } catch (error) {
    checks.status = 'unhealthy';
    checks.error = error.message;
    res.status(503).json(checks);
  }
}
```

### Smoke Tests

```bash
#!/bin/bash
# scripts/smoke-tests.sh

BASE_URL=${1:-https://swfoundation.com}

echo "🧪 Running smoke tests against $BASE_URL"

# Health check
echo "Testing health endpoint..."
curl -f "$BASE_URL/api/health" || exit 1

# Homepage load
echo "Testing homepage..."
curl -f "$BASE_URL" || exit 1

# Critical pages
echo "Testing critical pages..."
curl -f "$BASE_URL/services" || exit 1
curl -f "$BASE_URL/contact" || exit 1
curl -f "$BASE_URL/about" || exit 1

# API endpoints
echo "Testing API endpoints..."
curl -f "$BASE_URL/api/job-postings" || exit 1
curl -f "$BASE_URL/api/blog-posts" || exit 1

echo "✅ All smoke tests passed!"
```

### Performance Validation

```javascript
// scripts/performance-check.js
const lighthouse = require('lighthouse');
const chromeLauncher = require('chrome-launcher');

async function runPerformanceCheck(url) {
  const chrome = await chromeLauncher.launch({ chromeFlags: ['--headless'] });
  
  const options = {
    logLevel: 'info',
    output: 'json',
    onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
    port: chrome.port,
  };

  const runnerResult = await lighthouse(url, options);
  await chrome.kill();

  const scores = runnerResult.lhr.categories;
  
  console.log('Performance Scores:');
  console.log(`Performance: ${Math.round(scores.performance.score * 100)}`);
  console.log(`Accessibility: ${Math.round(scores.accessibility.score * 100)}`);
  console.log(`Best Practices: ${Math.round(scores['best-practices'].score * 100)}`);
  console.log(`SEO: ${Math.round(scores.seo.score * 100)}`);

  // Validate against SPARC requirements
  const requirements = {
    performance: 90,
    accessibility: 95,
    'best-practices': 90,
    seo: 95
  };

  let passed = true;
  for (const [category, minScore] of Object.entries(requirements)) {
    const score = Math.round(scores[category].score * 100);
    if (score < minScore) {
      console.error(`❌ ${category} score ${score} below requirement ${minScore}`);
      passed = false;
    }
  }

  if (passed) {
    console.log('✅ All performance requirements met!');
  } else {
    process.exit(1);
  }
}

const url = process.argv[2] || 'https://swfoundation.com';
runPerformanceCheck(url);
```

### Security Validation

```bash
#!/bin/bash
# scripts/security-check.sh

URL=${1:-https://swfoundation.com}

echo "🔒 Running security checks against $URL"

# SSL/TLS check
echo "Checking SSL configuration..."
curl -I --tlsv1.2 "$URL" || exit 1

# Security headers check
echo "Checking security headers..."
HEADERS=$(curl -s -I "$URL")

# Check for required security headers
if echo "$HEADERS" | grep -q "X-Frame-Options"; then
  echo "✅ X-Frame-Options header present"
else
  echo "❌ Missing X-Frame-Options header"
  exit 1
fi

if echo "$HEADERS" | grep -q "X-Content-Type-Options"; then
  echo "✅ X-Content-Type-Options header present"
else
  echo "❌ Missing X-Content-Type-Options header"
  exit 1
fi

if echo "$HEADERS" | grep -q "Strict-Transport-Security"; then
  echo "✅ HSTS header present"
else
  echo "❌ Missing HSTS header"
  exit 1
fi

echo "✅ Security checks passed!"
```

## Monitoring and Maintenance

### Application Monitoring

```javascript
// lib/monitoring.js
import { createClient } from '@supabase/supabase-js';

class ApplicationMonitor {
  constructor() {
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
  }

  async logEvent(event, data = {}) {
    try {
      await this.supabase
        .from('application_logs')
        .insert({
          event_type: event,
          event_data: data,
          timestamp: new Date().toISOString(),
          environment: process.env.NODE_ENV,
          version: process.env.NEXT_PUBLIC_APP_VERSION
        });
    } catch (error) {
      console.error('Failed to log event:', error);
    }
  }

  async logError(error, context = {}) {
    await this.logEvent('error', {
      message: error.message,
      stack: error.stack,
      context
    });
  }

  async logPerformance(metric, value) {
    await this.logEvent('performance', {
      metric,
      value,
      timestamp: Date.now()
    });
  }
}

export const monitor = new ApplicationMonitor();
```

### Error Tracking

```javascript
// lib/error-tracking.js
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  
  beforeSend(event, hint) {
    // Filter out non-critical errors in production
    if (process.env.NODE_ENV === 'production') {
      if (event.exception) {
        const error = hint.originalException;
        
        // Skip certain error types
        if (error.message?.includes('ResizeObserver loop limit exceeded')) {
          return null;
        }
      }
    }
    
    return event;
  },
  
  integrations: [
    new Sentry.BrowserTracing({
      tracePropagationTargets: ['localhost', 'swfoundation.com'],
    }),
  ],
  
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
});
```

### Automated Monitoring Checks

```yaml
# .github/workflows/monitoring.yml
name: Production Monitoring

on:
  schedule:
    - cron: '*/15 * * * *' # Every 15 minutes
  workflow_dispatch:

jobs:
  health-check:
    runs-on: ubuntu-latest
    steps:
      - name: Check Application Health
        run: |
          curl -f https://swfoundation.com/api/health
      
      - name: Check Performance
        run: |
          node scripts/performance-check.js https://swfoundation.com
      
      - name: Check Security
        run: |
          bash scripts/security-check.sh https://swfoundation.com
      
      - name: Notify on Failure
        if: failure()
        uses: 8398a7/action-slack@v3
        with:
          status: failure
          text: 'Production monitoring failed'
        env:
          SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK }}
```

## Rollback Procedures

### Immediate Rollback

```bash
#!/bin/bash
# scripts/rollback.sh

PREVIOUS_DEPLOYMENT_ID=${1:-}

if [ -z "$PREVIOUS_DEPLOYMENT_ID" ]; then
  echo "Getting previous deployment..."
  PREVIOUS_DEPLOYMENT_ID=$(vercel ls --limit 2 --format plain | tail -n 1 | awk '{print $1}')
fi

echo "Rolling back to deployment: $PREVIOUS_DEPLOYMENT_ID"

# Promote previous deployment
vercel promote "$PREVIOUS_DEPLOYMENT_ID" --prod

# Verify rollback
echo "Verifying rollback..."
sleep 30
curl -f https://swfoundation.com/api/health

# Update monitoring
npx claude-flow@alpha memory_usage --action store \
  --key "deployment/rollback" \
  --value "$(date -u +%Y-%m-%dT%H:%M:%SZ)" \
  --namespace "production"

echo "✅ Rollback completed successfully!"
```

### Database Rollback (if applicable)

```sql
-- Database rollback procedures
-- Create rollback script template

-- Step 1: Backup current state
CREATE TABLE backup_$(date +%Y%m%d_%H%M%S) AS SELECT * FROM critical_table;

-- Step 2: Restore from previous backup
-- (Implement based on specific backup strategy)

-- Step 3: Verify data integrity
SELECT COUNT(*) FROM critical_table;
```

### Rollback Verification

```bash
#!/bin/bash
# scripts/verify-rollback.sh

echo "🔍 Verifying rollback success..."

# Health check
curl -f https://swfoundation.com/api/health

# Critical functionality tests
bash scripts/smoke-tests.sh https://swfoundation.com

# Performance validation
node scripts/performance-check.js https://swfoundation.com

# Security check
bash scripts/security-check.sh https://swfoundation.com

echo "✅ Rollback verification completed!"
```

## Troubleshooting

### Common Deployment Issues

#### Build Failures
```bash
# Debug build issues
npm run build 2>&1 | tee build.log

# Check for common issues:
# - Environment variable missing
# - Dependency conflicts
# - TypeScript errors
# - Memory issues
```

#### Runtime Errors
```bash
# Check application logs
vercel logs --follow

# Monitor real-time errors
tail -f /var/log/application.log
```

#### Performance Issues
```bash
# Analyze bundle
npm run analyze

# Check lighthouse scores
npx lighthouse https://swfoundation.com --output json --output-path lighthouse-report.json
```

### Emergency Procedures

```markdown
# Emergency Response Checklist

## Immediate Actions (0-5 minutes)
- [ ] Assess severity of issue
- [ ] Check health endpoint status
- [ ] Review error monitoring dashboards
- [ ] Notify team via emergency channels

## Short-term Actions (5-30 minutes)
- [ ] Implement immediate rollback if critical
- [ ] Investigate root cause
- [ ] Implement hotfix if possible
- [ ] Update incident tracking

## Long-term Actions (30+ minutes)
- [ ] Implement permanent fix
- [ ] Update monitoring and alerting
- [ ] Conduct post-incident review
- [ ] Update documentation and procedures
```

This deployment guide ensures systematic, SPARC-compliant deployment processes that maintain application quality and reliability throughout the deployment lifecycle.