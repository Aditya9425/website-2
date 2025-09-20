# Railway Deployment Guide

## Steps to Deploy Backend on Railway

### 1. Create Railway Account
- Go to https://railway.app
- Sign up with GitHub account

### 2. Deploy Backend
1. Click "New Project"
2. Select "Deploy from GitHub repo"
3. Connect your GitHub account
4. Select your repository
5. Choose the `backend` folder

### 3. Set Environment Variables
In Railway dashboard, go to Variables tab and add:
```
RAZORPAY_KEY_ID=rzp_live_RJncjoroiyYe1k
RAZORPAY_KEY_SECRET=ZGu0ojYoTP1MrgyHMVj0hGoW
PORT=5000
NODE_ENV=production
```

### 4. Update Frontend Config
After deployment, Railway will give you a URL like:
`https://your-app-name.railway.app`

Update your frontend config.js:
```javascript
BACKEND_URL: {
    development: 'http://localhost:5000',
    production: 'https://your-app-name.railway.app'
}
```

### 5. Test Deployment
- Visit your Railway URL
- Should show: `{"status":"OK","message":"Shagun Saree Backend API"}`
- Test `/health` endpoint

## Files Ready for Railway:
- ✅ server.js (Node.js Express server)
- ✅ package.json (dependencies)
- ✅ railway.json (Railway config)
- ✅ .env (environment variables)

## Next Steps:
1. Push backend to GitHub
2. Deploy on Railway
3. Update frontend config with Railway URL
4. Test payment integration