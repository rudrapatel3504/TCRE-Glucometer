# Folder Structure Reference

This document describes the structure and responsibility of each directory in the **TCRE Glucometer System** monorepo.

```
tcre-glucometer-system/         # Root Workspace Directory
│
├───frontend/                   # Next.js App Router UI Client (Port 3000)
│   ├───src/                    # Dashboard page, components, hooks, Zustand store
│   │   ├───app/                # App views (WITHOUT api route handlers)
│   │   ├───components/         # Reusable React components (Charts, Panels)
│   │   ├───lib/                # Clinical math engines and client utilities
│   │   └───store/              # Zustand global client store
│   ├───public/                 # Frontend static assets (icons, images)
│   ├───tsconfig.json           # Frontend typescript build parameters
│   └───next.config.ts          # Next.js server rewrites & proxy definitions
│
├───backend/                    # Node.js Express REST API Server (Port 3001)
│   ├───src/
│   │   ├───index.ts            # Service entry point and Express initialization
│   │   ├───controllers/        # Route controllers executing clinical logic
│   │   ├───routes/             # Express API routing mappings
│   │   ├───middleware/         # CORS, logging, and error-handling filters
│   │   └───lib/                # Local JSON DB I/O and device status memory
│   ├───tsconfig.json           # Backend typescript build parameters
│   └───package.json            # Backend dependencies
│
├───shared/                     # Code shared by frontend and backend
│   └───types.ts                # TypeScript data schemas & type interfaces
│
├───database/                   # Database files
│   ├───data/                   # Local patient and import logs database files (JSON)
│   ├───schema/                 # Proposed PostgreSQL production tables (SQL)
│   └───seeds/                  # PostgreSQL database initializer scripts (SQL)
│
├───firmware/                   # Embedded microcontroller code
│   └───TCRE_Storage/           # C++ Arduino/Mega firmware command processors & storage
│
├───hardware/                   # Device design schemas and client bridge
│   ├───datasets/               # Test blood glucose CSV files
│   └───TCRE_Device_Manager/    # Python serial to HTTP device bridge application
│
├───config/                     # Environment configuration files
│   ├───nginx/                  # Nginx server block definitions
│   ├───docker/                 # Service Dockerfiles and Docker Compose mapping
│   └───pm2/                    # PM2 process manager startup configurations
│
├───assets/                     # Static media files (schematics, photos, architecture logs)
│
├───docs/                       # Comprehensive system documentation
│   ├───EITS_Volume_*.md        # Existing clinical specification files
│   ├───Architecture.md         # Full architecture specification
│   ├───API.md                  # REST API endpoint reference
│   ├───Deployment.md           # AWS EC2 / Vercel deployment manual
│   ├───ESP32.md                # ESP32 and serial protocol manual
│   ├───Database.md             # PostgreSQL migration schema and steps
│   ├───EnvironmentVariables.md # Environment variables specification
│   ├───Contributing.md         # Contribution workflow
│   ├───GitWorkflow.md          # Branching and release model
│   └───Troubleshooting.md      # Troubleshooting guide
│
├───scripts/                    # Developer operations utility scripts
│   ├───setup-local-dev.sh      # Developer setup automation script
│   └───deploy-ec2.sh           # EC2 deployment automation script
│
├───.github/                    # Issue templates, PR templates, and workflows
└───archive/                    # Backup folder for unused files
```

---

## Directories Responsibility & Boundaries

### 1. `frontend/`
- **Boundary:** Handles UI rendering, user actions, charts, PDF generation, and local analysis simulation when backend is unreachable.
- **Rules:** Cannot import from `backend/` directly; must interact solely via HTTP/REST fetch requests or local store functions.

### 2. `backend/`
- **Boundary:** Handles client API requests, updates device status, processes telemetry uploads, and reads/writes to data stores.
- **Rules:** Pure API server. Does not render HTML pages. Returns JSON data structures only.

### 3. `shared/`
- **Boundary:** Centralized type declarations to prevent code duplication between client and server.
- **Rules:** Types must remain client/server agnostic. Do not import runtime modules here.

### 4. `database/`
- **Boundary:** Holds both local database files (for local dev) and schema migrations (for cloud hosting).
- **Rules:** Keeps database code separate from application code, assisting DBA reviews.

### 5. `firmware/` & `hardware/`
- **Boundary:** Stores code running on hardware (Mega 2560 / ESP32) and the desktop client utility (Python Bridge).
- **Rules:** Independent of Node.js environments. Kept here to maintain context in a single repository.
