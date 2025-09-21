# Railway Deployment Guide

## Setting Environment Variables in Railway

### 1. Railway Dashboard Method

1. Go to your Railway project dashboard
2. Click on your service/project
3. Navigate to **Variables** tab
4. Add these environment variables:

```
SUPABASE_URL = https://jstvadizuzvwhabtfhfs.supabase.co
SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpzdHZhZGl6dXp2d2hhYnRmaGZzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY2NjI3NjAsImV4cCI6MjA3MjIzODc2MH0.6btNpJfUh6Fd5PfoivIvu-f31Fj5IXl1vxBLsHz5ISw
```

### 2. Railway CLI Method

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login to Railway
railway login

# Set environment variables
railway variables set SUPABASE_URL=https://jstvadizuzvwhabtfhfs.supabase.co
railway variables set SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpzdHZhZGl6dXp2d2hhYnRmaGZzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY2NjI3NjAsImV4cCI6MjA3MjIzODc2MH0.6btNpJfUh6Fd5PfoivIvu-f31Fj5IXl1vxBLsHz5ISw
```

### 3. For Static Site Deployment

Since this is a frontend admin panel, create an API endpoint to serve config:

**Create `api/config.js`:**
```javascript
export default function handler(req, res) {
  res.json({
    SUPABASE_URL: process.env.SUPABASE_URL,
    SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY
  });
}
```

### 4. Quick Setup Steps

1. **Add variables in Railway dashboard**
2. **Deploy your project**
3. **Verify environment variables are loaded**

The admin panel will automatically detect and use these environment variables.