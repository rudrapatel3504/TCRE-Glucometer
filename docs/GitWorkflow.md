# Git Branch & Release Workflow

This guide details the git workflow and branching models for collaborating on the **TCRE Glucometer System**.

---

## 1. Branch Strategy

We follow a modified GitFlow pattern:
- **`main`**: Production release-ready code. Always stable.
- **`develop`**: Integration branch for new features. Staged for releases.
- **`feature/*`**: Topic branch for implementing user stories.
- **`hotfix/*`**: Emergency patch branches applied directly to main.

---

## 2. Commit Message Guidelines

Commit messages must be concise and descriptive:
```
[frontend] Add Recharts downsampling for long histories
[backend] Fix duplicate measurement ingestion race condition
[firmware] Update command parser buffer size
[shared] Sync PatientData types with database constraints
```

---

## 3. Pull Request Checklist

Before submitting a Pull Request to `develop`:
- [ ] Code builds without errors.
- [ ] No ESLint / TypeScript compiler warnings.
- [ ] Parity with local files verified.
- [ ] Local JSON database contains valid test data.
