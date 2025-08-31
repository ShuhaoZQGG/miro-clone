# Miro Clone - Production Deployment Guide

## 🚀 Quick Start

```bash
# 1. Validate deployment configuration
npm run validate:deployment vercel

# 2. Deploy to production
npm run deploy:production

# 3. Verify deployment
npm run verify:deployment
```

## 📋 Prerequisites

- Node.js 18+ and npm 9+
- Git repository with push access
- Accounts on deployment platforms (Vercel, Railway, Supabase)
- Environment variables configured

## 🏗️ Architecture Overview

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│                 │     │                  │     │                 │
│  Vercel (CDN)   │────▶│  Vercel (Next)   │────▶│ Railway (WS)    │
│  Static Assets  │     │  Frontend App    │     │  WebSocket      │
│                 │     │                  │     │                 │
└─────────────────┘     └──────────────────┘     └─────────────────┘
                               │                          │
                               ▼                          ▼
                        ┌──────────────────┐     ┌─────────────────┐
                        │                  │     │                 │
                        │  Supabase (DB)   │     │  Upstash Redis  │
                        │  PostgreSQL      │     │  Cache/Sessions │
                        │                  │     │                 │
                        └──────────────────┘     └─────────────────┘
```

## 🔧 Environment Configuration

### Required Environment Variables

Create `.env.production` with:

```bash
# Application URLs
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
NEXT_PUBLIC_WS_URL=wss://your-ws.railway.app

# Database
DATABASE_URL=postgresql://user:pass@host:5432/dbname
REDIS_URL=redis://default:pass@host:port

# Authentication
JWT_SECRET=your-secret-key-minimum-32-characters
JWT_REFRESH_SECRET=your-refresh-secret-minimum-32-chars

# Monitoring (Optional)
SENTRY_DSN=https://key@sentry.io/project
SENTRY_AUTH_TOKEN=your-auth-token
```

### Platform-Specific Variables

#### Vercel
```bash
VERCEL_URL=auto-provided
VERCEL_ENV=production
```

#### Railway
```bash
RAILWAY_ENVIRONMENT=production
PORT=3001
```

## 📦 Deployment Steps

### 1. Frontend Deployment (Vercel)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy to production
vercel --prod

# Or connect GitHub repository for auto-deploy
vercel link
vercel git connect
```

**Vercel Configuration:**
- Framework Preset: Next.js
- Build Command: `npm run build`
- Output Directory: `.next`
- Install Command: `npm install`

### 2. WebSocket Server (Railway)

```bash
# Install Railway CLI
npm i -g @railway/cli

# Login and initialize
railway login
railway link

# Deploy WebSocket server
railway up

# Set environment variables
railway variables set NODE_ENV=production
railway variables set PORT=3001
```

**Railway Configuration:**
- Start Command: `npm run start:websocket`
- Build Command: `npm run build:websocket`
- Health Check Path: `/health`

### 3. Database Setup (Supabase)

1. Create project at [supabase.com](https://supabase.com)
2. Get connection string from Settings > Database
3. Run migrations:

```bash
# Set DATABASE_URL
export DATABASE_URL="your-supabase-url"

# Run Prisma migrations
npx prisma migrate deploy
npx prisma generate
```

### 4. Redis Cache (Upstash)

1. Create database at [upstash.com](https://upstash.com)
2. Get connection string from Dashboard
3. Configure in environment variables

## ✅ Deployment Verification

### Automated Verification

```bash
# Run comprehensive checks
npm run verify:deployment

# Check specific service
npm run check:frontend
npm run check:websocket
npm run check:database
```

### Manual Verification Checklist

- [ ] Frontend loads at production URL
- [ ] WebSocket connects successfully
- [ ] Database queries work
- [ ] Redis caching functional
- [ ] Authentication flow works
- [ ] Real-time collaboration works
- [ ] Health endpoint returns 200
- [ ] Monitoring captures errors

### Health Check Endpoints

- Frontend: `https://your-app.vercel.app/api/health`
- WebSocket: `https://your-ws.railway.app/health`

## 📊 Monitoring Setup

### Sentry Configuration

1. Create project at [sentry.io](https://sentry.io)
2. Get DSN from Settings > Client Keys
3. Configure source maps:

```bash
# Install Sentry CLI
npm i -g @sentry/cli

# Upload source maps
sentry-cli releases files RELEASE_VERSION upload-sourcemaps .next
```

### Performance Metrics

Target metrics for production:
- **Page Load**: < 2 seconds
- **WebSocket Latency**: < 200ms
- **API Response**: < 500ms
- **Uptime**: > 99.9%

## 🔄 CI/CD Pipeline

### GitHub Actions Workflow

```yaml
name: Deploy Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm run test
      - run: npm run build
      - run: npm run validate:deployment vercel
      - uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
```

## 🚨 Rollback Procedures

### Vercel Rollback
```bash
# List deployments
vercel ls

# Rollback to previous
vercel rollback [deployment-url]
```

### Railway Rollback
```bash
# View deployment history
railway deployments

# Rollback to specific version
railway deployments rollback [deployment-id]
```

### Database Rollback
```bash
# Revert last migration
npx prisma migrate resolve --rolled-back
```

## 🔐 Security Checklist

- [ ] All secrets in environment variables
- [ ] HTTPS enforced on all endpoints
- [ ] CORS configured correctly
- [ ] Rate limiting enabled
- [ ] SQL injection protection (Prisma)
- [ ] XSS protection headers set
- [ ] CSP headers configured
- [ ] Authentication required for mutations
- [ ] Input validation on all endpoints
- [ ] Error messages don't leak sensitive data

## 📈 Scaling Considerations

### Horizontal Scaling
- **Frontend**: Vercel auto-scales
- **WebSocket**: Railway supports multiple instances
- **Database**: Supabase handles connection pooling
- **Redis**: Upstash auto-scales

### Performance Optimization
- Enable CDN caching for static assets
- Implement database query optimization
- Use Redis for session storage
- Enable WebSocket connection pooling
- Implement client-side caching

## 🆘 Troubleshooting

### Common Issues

**WebSocket Connection Failed**
```bash
# Check Railway logs
railway logs

# Verify WebSocket URL format
echo $NEXT_PUBLIC_WS_URL  # Should be wss://
```

**Database Connection Error**
```bash
# Test connection
npx prisma db pull

# Check connection pool
DATABASE_URL="...?connection_limit=5"
```

**Build Failures**
```bash
# Clear cache and rebuild
rm -rf .next node_modules
npm install
npm run build
```

### Debug Commands

```bash
# Check deployment status
npm run status:deployment

# View logs
vercel logs
railway logs

# Test endpoints
curl https://your-app.vercel.app/api/health
```

## 📝 Post-Deployment Tasks

1. **Configure DNS**: Point domain to Vercel
2. **Set up SSL**: Automatic with Vercel
3. **Configure CDN**: Enable Vercel Edge Network
4. **Set up backups**: Configure Supabase backups
5. **Enable monitoring**: Activate Sentry alerts
6. **Load testing**: Run performance tests
7. **Documentation**: Update API docs
8. **Team access**: Grant platform access

## 🔗 Useful Links

- [Vercel Documentation](https://vercel.com/docs)
- [Railway Documentation](https://docs.railway.app)
- [Supabase Documentation](https://supabase.com/docs)
- [Upstash Documentation](https://docs.upstash.com)
- [Sentry Documentation](https://docs.sentry.io)

## 📞 Support Contacts

- **DevOps Team**: devops@example.com
- **On-call Engineer**: +1-xxx-xxx-xxxx
- **Slack Channel**: #deployment-support

---

Last Updated: August 30, 2025
Version: 1.0.0