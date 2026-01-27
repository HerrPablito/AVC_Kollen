# Backend Deployment Guide

Complete guide for deploying the JWT authentication backend to production with HTTPS, secure cookies, and proper CORS configuration.

---

## Prerequisites

- Backend code in Docker container
- PostgreSQL database
- Domain name (for HTTPS)
- Git repository (for deployment)

---

## Option 1: Railway (Recommended - Easiest)

Railway provides the simplest deployment experience with automatic HTTPS, database provisioning, and Docker support.

### Step 1: Prepare Your Repository

```bash
cd auth-system
git init
git add .
git commit -m "Initial commit"
```

Push to GitHub:
```bash
gh repo create jwt-auth-backend --public
git remote add origin https://github.com/YOUR_USERNAME/jwt-auth-backend.git
git push -u origin main
```

### Step 2: Deploy to Railway

1. **Go to [Railway.app](https://railway.app)** and sign in with GitHub

2. **Create New Project**
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose your `jwt-auth-backend` repository

3. **Add PostgreSQL Database**
   - Click "+ New"
   - Select "Database" → "PostgreSQL"
   - Railway automatically provisions a database

4. **Configure Backend Service**
   - Railway auto-detects Dockerfile
   - Click on your backend service

5. **Set Environment Variables**
   
   Go to "Variables" tab and add:

   ```env
   NODE_ENV=production
   PORT=3000
   
   # Database (Railway provides these automatically)
   DB_HOST=${{Postgres.PGHOST}}
   DB_PORT=${{Postgres.PGPORT}}
   DB_USER=${{Postgres.PGUSER}}
   DB_PASSWORD=${{Postgres.PGPASSWORD}}
   DB_NAME=${{Postgres.PGDATABASE}}
   
   # JWT Secrets (CHANGE THESE!)
   JWT_ACCESS_SECRET=your-production-access-secret-min-32-chars
   JWT_REFRESH_SECRET=your-production-refresh-secret-min-32-chars
   JWT_ACCESS_EXPIRY=15m
   JWT_REFRESH_EXPIRY=30d
   
   # CORS (Your Cloudflare Pages URL)
   CORS_ORIGIN=https://your-app.pages.dev
   ```

   **Generate secure secrets:**
   ```bash
   # On Mac/Linux
   openssl rand -base64 32
   ```

6. **Deploy**
   - Railway automatically builds and deploys
   - Wait for deployment to complete
   - You'll get a URL like: `https://jwt-auth-backend-production.up.railway.app`

### Step 3: Update Backend for Production Cookies

Edit `auth-system/routes/auth.js`:

```javascript
// In login route, update cookie settings:
res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: true, // HTTPS only
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
    maxAge: REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000,
    domain: process.env.COOKIE_DOMAIN || undefined // Optional: .yourdomain.com
});
```

**Important Cookie Settings for Cross-Origin:**
- `secure: true` - Only send over HTTPS
- `sameSite: 'none'` - Allow cross-origin requests (Angular on Cloudflare, API on Railway)
- `httpOnly: true` - Prevent JavaScript access

### Step 4: Update CORS Configuration

Edit `auth-system/server.js`:

```javascript
app.use(cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:4200',
    credentials: true, // Allow cookies
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
```

### Step 5: Test Deployment

```bash
# Test health check
curl https://your-railway-url.up.railway.app/health

# Test registration
curl -X POST https://your-railway-url.up.railway.app/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"test123"}'
```

### Railway Pricing

- **Free Tier**: $5 credit/month (enough for small apps)
- **Hobby**: $5/month for more resources
- **Pro**: $20/month for production apps

---

## Option 2: Render

Render is another excellent option with free tier and easy Docker deployment.

### Step 1: Prepare Database

**Option A: Render PostgreSQL (Paid)**
- Render PostgreSQL starts at $7/month
- Automatic backups and scaling

**Option B: Neon (Free Tier)**

1. Go to [Neon.tech](https://neon.tech)
2. Create account and new project
3. Get connection string:
   ```
   postgresql://user:pass@ep-xxx.us-east-2.aws.neon.tech/dbname?sslmode=require
   ```

**Option C: Supabase (Free Tier)**

1. Go to [Supabase.com](https://supabase.com)
2. Create new project
3. Go to Settings → Database
4. Get connection string (use "Connection pooling" for better performance)

### Step 2: Deploy to Render

1. **Go to [Render.com](https://render.com)** and sign in

2. **Create New Web Service**
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Select `jwt-auth-backend` repo

3. **Configure Service**
   ```
   Name: jwt-auth-backend
   Environment: Docker
   Region: Choose closest to your users
   Branch: main
   Dockerfile Path: ./Dockerfile (or leave default)
   ```

4. **Set Environment Variables**
   
   ```env
   NODE_ENV=production
   PORT=3000
   
   # Database (from Neon/Supabase)
   DATABASE_URL=postgresql://user:pass@host/dbname?sslmode=require
   
   # OR separate variables
   DB_HOST=your-db-host.neon.tech
   DB_PORT=5432
   DB_USER=your-user
   DB_PASSWORD=your-password
   DB_NAME=your-database
   
   # JWT Secrets
   JWT_ACCESS_SECRET=your-production-access-secret
   JWT_REFRESH_SECRET=your-production-refresh-secret
   JWT_ACCESS_EXPIRY=15m
   JWT_REFRESH_EXPIRY=30d
   
   # CORS
   CORS_ORIGIN=https://your-app.pages.dev
   ```

5. **Update Database Config** (if using DATABASE_URL)

   Edit `auth-system/config/database.js`:

   ```javascript
   const { Pool } = require('pg');

   // Support both individual vars and DATABASE_URL
   const pool = process.env.DATABASE_URL
       ? new Pool({
           connectionString: process.env.DATABASE_URL,
           ssl: { rejectUnauthorized: false }
       })
       : new Pool({
           host: process.env.DB_HOST,
           port: process.env.DB_PORT,
           user: process.env.DB_USER,
           password: process.env.DB_PASSWORD,
           database: process.env.DB_NAME,
           ssl: { rejectUnauthorized: false }
       });

   module.exports = pool;
   ```

6. **Deploy**
   - Click "Create Web Service"
   - Render builds and deploys automatically
   - You'll get a URL like: `https://jwt-auth-backend.onrender.com`

### Step 3: Initialize Database

Since Render doesn't run `init.sql` automatically:

```bash
# Connect to your database
psql "postgresql://user:pass@host/dbname?sslmode=require"

# Run init.sql manually
\i init.sql

# Or copy-paste the SQL from init.sql
```

### Render Pricing

- **Free Tier**: Available (spins down after inactivity)
- **Starter**: $7/month (always on)
- **Standard**: $25/month (more resources)

---

## Option 3: Fly.io

Fly.io offers excellent performance with global edge deployment.

### Quick Deploy

```bash
# Install flyctl
brew install flyctl

# Login
fly auth login

# Launch app (in auth-system directory)
cd auth-system
fly launch

# Add PostgreSQL
fly postgres create

# Attach database
fly postgres attach <postgres-app-name>

# Set secrets
fly secrets set JWT_ACCESS_SECRET=your-secret
fly secrets set JWT_REFRESH_SECRET=your-secret
fly secrets set CORS_ORIGIN=https://your-app.pages.dev

# Deploy
fly deploy
```

---

## Production Checklist

### Backend Configuration

- [ ] **HTTPS Enabled** (automatic on Railway/Render/Fly)
- [ ] **Secure Cookies**:
  ```javascript
  secure: true,
  sameSite: 'none', // For cross-origin
  httpOnly: true
  ```
- [ ] **CORS Configured**:
  ```javascript
  origin: 'https://your-frontend.pages.dev',
  credentials: true
  ```
- [ ] **JWT Secrets**: Strong, random, 32+ characters
- [ ] **Database**: SSL enabled
- [ ] **Environment Variables**: All set correctly

### Database Setup

- [ ] **Run init.sql** to create tables
- [ ] **Indexes created** for performance
- [ ] **Backups enabled** (automatic on Railway/Render)
- [ ] **Connection pooling** configured

### Security

- [ ] **Secrets rotated** from development
- [ ] **HTTPS enforced** (no HTTP)
- [ ] **Rate limiting** (optional, add express-rate-limit)
- [ ] **Helmet.js** (optional, for security headers)

---

## Angular Frontend Deployment (Cloudflare Pages)

### Step 1: Update Environment

Edit `angular-client/src/environments/environment.ts`:

```typescript
export const environment = {
    production: true,
    apiUrl: 'https://your-railway-url.up.railway.app' // Your deployed backend
};
```

### Step 2: Build Angular App

```bash
cd angular-client
ng build --configuration production
```

### Step 3: Deploy to Cloudflare Pages

1. **Go to Cloudflare Dashboard** → Pages
2. **Create New Project** → Connect to Git
3. **Build Settings**:
   ```
   Build command: ng build --configuration production
   Build output directory: dist/angular-client/browser
   ```
4. **Deploy**

Your app will be at: `https://your-app.pages.dev`

### Step 4: Update Backend CORS

Update `CORS_ORIGIN` environment variable in Railway/Render:
```
CORS_ORIGIN=https://your-app.pages.dev
```

---

## Testing Production Setup

### 1. Test Backend Health

```bash
curl https://your-backend-url.com/health
```

### 2. Test Registration

```bash
curl -X POST https://your-backend-url.com/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"prod@test.com","password":"test123"}' \
  -v
```

Check for:
- `Set-Cookie` header with `Secure; HttpOnly; SameSite=None`

### 3. Test Login from Frontend

1. Open `https://your-app.pages.dev`
2. Register/Login
3. Open DevTools → Application → Cookies
4. Verify `refreshToken` cookie exists with:
   - ✅ HttpOnly
   - ✅ Secure
   - ✅ SameSite=None

### 4. Test Token Refresh

1. Login to app
2. Wait 15+ minutes (or manually delete access token)
3. Navigate to dashboard
4. Should auto-refresh without logout

---

## Troubleshooting

### Cookies Not Being Set

**Problem**: Refresh token cookie not appearing in browser

**Solutions**:
1. Ensure `sameSite: 'none'` for cross-origin
2. Ensure `secure: true` (requires HTTPS)
3. Check CORS `credentials: true`
4. Verify Angular uses `withCredentials: true`

### CORS Errors

**Problem**: `Access-Control-Allow-Origin` errors

**Solutions**:
1. Set exact origin (no wildcards with credentials)
2. Include `credentials: true` in CORS config
3. Add `OPTIONS` to allowed methods
4. Check `Access-Control-Allow-Credentials: true` header

### Database Connection Fails

**Problem**: Backend can't connect to database

**Solutions**:
1. Check SSL mode: `?sslmode=require`
2. Verify connection string format
3. Check firewall rules (allow Railway/Render IPs)
4. Test connection with `psql` directly

### Token Refresh Fails After Deploy

**Problem**: 401 errors on all requests

**Solutions**:
1. Check JWT secrets are set
2. Verify token expiry times
3. Check database has refresh_tokens table
4. Verify cookies are being sent (DevTools → Network)

---

## Monitoring & Maintenance

### Logs

**Railway**:
```bash
# View logs in dashboard or CLI
railway logs
```

**Render**:
- View logs in dashboard (real-time)

### Database Backups

- **Railway**: Automatic daily backups
- **Render**: Automatic backups on paid plans
- **Neon**: Point-in-time recovery
- **Supabase**: Daily backups

### Scaling

**Railway**:
- Auto-scales based on usage
- Configure in dashboard

**Render**:
- Upgrade plan for more resources
- Horizontal scaling available

---

## Cost Estimate (Monthly)

### Option 1: Railway (Recommended)
- Backend: ~$5 (Hobby plan)
- Database: Included
- **Total: $5/month**

### Option 2: Render + Neon
- Backend: $7 (Starter)
- Database: Free (Neon)
- **Total: $7/month**

### Option 3: Render + Render DB
- Backend: $7
- Database: $7
- **Total: $14/month**

---

## Summary

1. **Deploy Backend** → Railway (easiest) or Render
2. **Setup Database** → Railway PostgreSQL or Neon/Supabase
3. **Configure Cookies** → `secure: true`, `sameSite: 'none'`
4. **Set CORS** → Exact origin, `credentials: true`
5. **Deploy Frontend** → Cloudflare Pages
6. **Test** → Registration, login, token refresh, cookies

**Recommended Stack**:
- Backend: Railway ($5/month)
- Database: Railway PostgreSQL (included)
- Frontend: Cloudflare Pages (free)
- **Total: $5/month**
