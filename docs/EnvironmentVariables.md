# Environment Variables Reference

This document describes all environment variables used by the **TCRE Glucometer System**.

---

## 1. System Variables

### `NODE_ENV`
- **Purpose**: Defines the operational environment of the running processes.
- **Allowed Values**: `development` | `production` | `test`
- **Default**: `development`

---

## 2. Backend API Server Variables (`backend/`)

### `PORT`
- **Purpose**: TCP port Express listens to.
- **Default**: `3001`

### `CORS_ORIGIN`
- **Purpose**: Whitelisted domain allowed to query the API.
- **Default**: `http://localhost:3000`

### `LOCAL_DB_DIR`
- **Purpose**: Folder location containing the database JSON files.
- **Default**: `../database/data`

### `DATABASE_URL`
- **Purpose**: PostgreSQL connection string (utilized for cloud staging and production environments).
- **Format**: `postgresql://[user]:[password]@[host]:[port]/[database_name]?schema=public`

---

## 3. Frontend UI Client Variables (`frontend/`)

### `NEXT_PUBLIC_API_URL`
- **Purpose**: The base destination URL for api calls when proxy rewrites are bypassed.
- **Default**: `http://localhost:3000` (Next.js server handles proxy redirects to the Express backend port `3001` dynamically).
