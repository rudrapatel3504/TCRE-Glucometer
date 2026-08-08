#!/usr/bin/env bash

# =========================================================================
# TCRE GLUCOMETER SYSTEM AWS EC2 DEPLOYMENT SCRIPT
# =========================================================================

set -e

echo "=================================================="
echo "  Deploying TCRE Glucometer System on AWS EC2..."
echo "=================================================="

# 1. Update source code from main branch
echo "[Deploy] Pulling latest code changes from origin..."
git pull origin main

# 2. Install production dependencies
echo "[Deploy] Installing npm dependencies..."
npm install --production=false # Install full packages to compile ts files

# 3. Build workspaces
echo "[Deploy] Compiling backend and frontend bundles..."
npm run build

# 4. Remove development packages (prune)
echo "[Deploy] Pruning node_modules for production size..."
npm prune --production

# 5. Reload running servers under PM2
echo "[Deploy] Restarting running servers in PM2 process manager..."
pm2 restart config/pm2/ecosystem.config.js --env production || pm2 start config/pm2/ecosystem.config.js --env production

echo "=================================================="
echo "  Deployment Complete and Active!"
echo "=================================================="
