#!/bin/bash
# Exit script on first error
set -e

echo "🚀 Starting development deployment..."

# 1. Pull latest code
echo "📥 Fetching latest changes from Git..."
git pull origin dev

# 2. Build Frontend
echo "📦 Building Frontend (Vite)..."
cd frontend
npm install
# Set API URL at build-time so Vite embeds the correct API endpoint for mobile/hybrid apps
VITE_API_URL="https://api.dev.bvpindia.org" npm run build
cd ..

# 3. Build Backend
echo "📦 Building Backend (Next.js)..."
cd backend
npm install
npx prisma generate
npx prisma db push           # Push database schema updates to dev DB
npm run build
cd ..

# 4. Reload PM2 and update environment variables
echo "🔄 Reloading PM2 backend application..."
pm2 startOrReload ecosystem.config.js --update-env
echo "✅ Deployment completed successfully!"
