## Project TODOs

Maintain this list of pending tasks, trade-offs, and next steps. Each item includes a priority label: [MUST], [SHOULD], or [NICE-TO-HAVE].

### Pending Tasks

#### Backend (NestJS)

- [MUST] Add authentication/authorization for telemetry WebSocket namespace and HTTP endpoints.
- [MUST] Implement input rate limiting/throttling on telemetry ingestion to protect the DB.
- [MUST] Add pagination, filtering, and time-range parameters to telemetry REST endpoints.
- [SHOULD] Optimize bulk telemetry inserts and add DB indexes for frequent queries (deviceId, timestamp).

#### Frontend (Vite + React)

- [MUST] Add sorting, filtering, and pagination to `DeviceTable`; persist UI state via URL/search params.
- [SHOULD] Provide loading states, empty states, and error boundaries across pages and widgets.
- [SHOULD] Add component/unit tests for charts, tables, and API hooks.
- [NICE-TO-HAVE] Add theme switch (light/dark) and responsive layout polish for `RichDashboard`.

#### DevOps / Infra

- [MUST] Harden Docker images (multi-stage builds, non-root user) for backend and frontend.
- [SHOULD] Set up CI to run install, build, lint, and tests on PRs.
- [NICE-TO-HAVE] Add deployment manifests (Docker Compose prod profile / Kubernetes) with secrets handling.

#### Security

- [MUST] Enforce device registration and credentials (API keys/JWT) for telemetry submission.
- [SHOULD] Apply CORS restrictions and security headers (Helmet) with strict defaults.
- [NICE-TO-HAVE] Centralize secrets management and rotate credentials regularly.

### Trade-offs & Notes

- Simplicity vs. robustness: initial implementation favors velocity; hardening (auth, rate limit, retention) is planned.
- Real-time vs. historical consistency: charting will prioritize eventual consistency; gaps may occur during reconnects.
- Storage cost vs. query performance: aggressive indexing improves reads but increases write cost and disk usage.
- Monorepo convenience vs. duplication: current backend duplication in `backend/` vs `backend/backend/` should be resolved.

### Next Steps (Suggested Order)

1. Lock down ingestion: add auth, validation, and rate limiting for telemetry.
2. Improve data access: implement pagination/filters and add required DB indexes.
3. Stabilize UI: table sorting/filtering/pagination and realtime+historical chart reconciliation.
4. Ship guardrails: CI pipeline, healthchecks, and basic observability/logging.
