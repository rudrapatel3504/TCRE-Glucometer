# Development Contribution Guidelines

This document outlines the workflow and coding standards for developing the **TCRE Glucometer System**.

---

## 1. Setup Local Environment

Follow the steps in [docs/README.md](file:///e:/1-Summer%20Internship/Patent%20Frontend/docs/README.md) or run the setup script:
```bash
./scripts/setup-local-dev.sh
```

---

## 2. Decoupled Development Workflow

When modifying features, ensure modifications respect component boundaries:
1. **Frontend Changes**: Code inside `frontend/` should only use relative `/api/...` calls. Do not reference `backend/` functions directly.
2. **Backend Changes**: Keep API responses aligned with the TypeScript interfaces in `shared/types.ts`.
3. **Shared Changes**: When adding data fields (e.g. metadata or clinical records), first update `shared/types.ts`. Next, implement validation on the Express backend, and finally update the React state handlers.

---

## 3. Code Standards & Linting

We enforce strict TypeScript configurations and lint standards:
- **TypeScript**: No implicit `any` mappings.
- **ESLint**: Run eslint validations before committing changes:
  ```bash
  npm run lint
  ```
- **Code Formatter**: Ensure clean trailing spaces, matching brackets, and file endings.
