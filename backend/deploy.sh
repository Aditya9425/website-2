#!/bin/bash

echo "🚀 Deploying Shagun Saree Backend to Vercel..."

# Check if vercel is installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI not found. Installing..."
    npm install -g vercel
fi

# Deploy to Vercel
echo "📦 Deploying..."
vercel --prod

echo "✅ Deployment complete!"
echo "🔧 Don't forget to set environment variables in Vercel dashboard:"
echo "   - RAZORPAY_KEY_ID"
echo "   - RAZORPAY_KEY_SECRET"
echo "   - NODE_ENV=production"