# TCRE Glucometer System Documentation Hub

Welcome to the central documentation directory for the **Temporal Clinical Reasoning Engine (TCRE) Glucometer System**.

---

## 1. Documentation Index

To understand the system design, communication bridge, development, and deployment:

- **[System Architecture](file:///e:/1-Summer%20Internship/Patent%20Frontend/docs/Architecture.md)**: Decoding data flows, telemetry pathways, and security boundaries.
- **[Folder Structure Map](file:///e:/1-Summer%20Internship/Patent%20Frontend/docs/FolderStructure.md)**: Comprehensive mapping of file organization and module boundaries.
- **[REST API Reference](file:///e:/1-Summer%20Internship/Patent%20Frontend/docs/API.md)**: Request and response schemas for all patient endpoints and hardware hooks.
- **[ESP32 & Serial Bridge](file:///e:/1-Summer%20Internship/Patent%20Frontend/docs/ESP32.md)**: Hardware serial commands, buffer parsing, and Python bridge operation.
- **[Database Migration Plan](file:///e:/1-Summer%20Internship/Patent%20Frontend/docs/Database.md)**: Details on JSON local persistence and migration steps for PostgreSQL.
- **[Environment Variables](file:///e:/1-Summer%20Internship/Patent%20Frontend/docs/EnvironmentVariables.md)**: Environment profiles and variables guide.
- **[Deployment Manual](file:///e:/1-Summer%20Internship/Patent%20Frontend/docs/Deployment.md)**: Step-by-step instructions for AWS EC2, PM2, and Vercel.
- **[Contribution Guidelines](file:///e:/1-Summer%20Internship/Patent%20Frontend/docs/Contributing.md)**: Branch setups, lint checks, and developer workflows.
- **[Git Workflow](file:///e:/1-Summer%20Internship/Patent%20Frontend/docs/GitWorkflow.md)**: Branch naming rules and PR checklists.
- **[Troubleshooting Guide](file:///e:/1-Summer%20Internship/Patent%20Frontend/docs/Troubleshooting.md)**: Remediation steps for port collisions, network disconnects, and file locks.

---

## 2. Quickstart: Run Local Environment

To launch both the Next.js frontend (port 3000) and Express backend (port 3001) concurrently:

```bash
# Install root, frontend and backend workspace dependencies
npm install

# Start both servers concurrently in development mode
npm run dev
```

Visit `http://localhost:3000` to interact with the dashboard.
