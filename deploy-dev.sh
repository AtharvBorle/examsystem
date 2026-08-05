#!/bin/bash
echo "=== Starting DEV (Staging) Deployment ==="

# Pull latest changes from dev branch
git pull origin dev

# Build Frontend (compiled to point to dev API)
echo "Building Frontend..."
cd frontend
npm install
VITE_API_URL=https://dev.bvpindia.org npm run build

# Build Backend
echo "Building Backend..."
cd ../backend
npm install
npx prisma generate
npx prisma db push           # Push database schema updates to dev DB
npx prisma db seed           # Seed default data to dev DB if empty

# Start or Reload PM2 Dev Process on Port 5001
echo "Reloading Dev PM2 instance..."
pm2 delete bvp-exam-backend-dev 2>/dev/null
PORT=5001 pm2 start npm --name "bvp-exam-backend-dev" -- start -- -p 5001

echo "=== DEV Deployment Completed successfully! ==="
