#!/usr/bin/env bash

# =========================================================================
# TCRE GLUCOMETER SYSTEM LOCAL DEVELOPMENT SETUP SCRIPT
# =========================================================================

echo "=================================================="
echo "  Setting up TCRE Glucometer local workspace..."
echo "=================================================="

# 1. Copy environment variables if they don't exist
if [ ! -f .env ]; then
  echo "[Setup] Copying .env.example to .env..."
  cp .env.example .env
else
  echo "[Setup] .env already exists, skipping copy."
fi

# 2. Install dependencies
echo "[Setup] Installing NPM workspaces dependencies..."
npm install

# 3. Create logs directory for PM2/local logs
mkdir -p logs

# 4. Check for node and npm
if ! command -v node &> /dev/null; then
    echo "[Warning] Node.js is not installed. Please install Node.js (v18.x or later)."
fi

echo "=================================================="
echo "  Setup Complete! Run 'npm run dev' to start."
echo "=================================================="
