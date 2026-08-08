# TCRE Glucometer System (Monorepo)

An Embedded IoT Glucometer Web Application built using Next.js, React, Express, and Python Serial Bridge, leveraging the Temporal Clinical Reasoning Engine (TCRE) pipeline.

---

## 1. Monorepo Overview

This repository has been structured as a professional, production-ready monorepo using npm workspaces:

- **`frontend/`**: Next.js App Router dashboard UI client (running on port `3000`).
- **`backend/`**: Node.js Express REST API server (running on port `3001`).
- **`shared/`**: Shared TypeScript interfaces between frontend and backend.
- **`database/`**: Development JSON files and proposed PostgreSQL schemas.
- **`firmware/`**: C++ Arduino/Mega firmware processing logic.
- **`hardware/`**: Python Serial bridge client daemon and clinical test datasets.
- **`docs/`**: Production-grade system architecture and integration manuals.
- **`config/`**: System configurations for Nginx proxy, Docker Compose, and PM2.
- **`scripts/`**: Automation scripts for dev setup and EC2 cloud deployment.

---

## 2. Quickstart: Run Local Environment

Prerequisites: Node.js (v18.x or later).

```bash
# 1. Install all dependencies across workspaces
npm install

# 2. Start the frontend & backend concurrently in development mode
npm run dev
```

- **Frontend Dashboard**: `http://localhost:3000`
- **Backend Express API**: `http://localhost:3001`
- **API Health Status**: `http://localhost:3001/api/health`

---

## 3. Communication Bridge Compatibility

The Next.js frontend has been configured with an internal API rewrite proxy. Requests made to `http://localhost:3000/api/*` are dynamically proxied to `http://localhost:3001/api/*`. 

This ensures that the Python serial bridge and frontend fetches continue to work flawlessly on port `3000` without modifying any hardcoded configurations!

---

## 4. Documentation Index

For details on the clinical validation engines, database designs, or devops setup:

- **[System Architecture](file:///e:/1-Summer%20Internship/Patent%20Frontend/docs/Architecture.md)**
- **[Folder Structure Map](file:///e:/1-Summer%20Internship/Patent%20Frontend/docs/FolderStructure.md)**
- **[REST API Reference](file:///e:/1-Summer%20Internship/Patent%20Frontend/docs/API.md)**
- **[ESP32 & Serial Bridge](file:///e:/1-Summer%20Internship/Patent%20Frontend/docs/ESP32.md)**
- **[Database Migration Plan](file:///e:/1-Summer%20Internship/Patent%20Frontend/docs/Database.md)**
- **[Deployment Manual](file:///e:/1-Summer%20Internship/Patent%20Frontend/docs/Deployment.md)**
- **[Environment Variables](file:///e:/1-Summer%20Internship/Patent%20Frontend/docs/EnvironmentVariables.md)**
- **[Full Documentation Index](file:///e:/1-Summer%20Internship/Patent%20Frontend/docs/README.md)**
