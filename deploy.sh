#!/bin/bash
echo "=== Starting Production Deployment ==="

# Pull latest changes from main branch
git pull origin main

# Build Frontend (compiled to point to production API)
echo "Building Frontend..."
cd frontend
npm install
VITE_API_URL=https://bvpindia.org npm run build

# Build Backend
echo "Building Backend..."
cd ../backend
npm install
npx prisma generate
npx prisma db push           # Push database schema updates to production DB
npx prisma db seed           # Seed default data if empty

# Restart PM2 Production Process
echo "Reloading PM2 instance..."
pm2 delete bvp-exam-backend 2>/dev/null
pm2 start npm --name "bvp-exam-backend" -- start

echo "=== Production Deployment Completed successfully! ==="
