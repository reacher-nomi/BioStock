# BioStock One-Button App

This repository is a full `React + Django + PostgreSQL` prototype for the course requirement:

- one button on the frontend
- button calls backend API
- backend writes user input to PostgreSQL
- app returns and displays: `WELCOME "Username" to BIOSTOCK`
- fully containerized and cloud-deployable with Docker
- runnable in GitHub Codespaces

## 1) Core Demo Flow

1. Open app in browser (`http://localhost:3000`).
2. Enter a name.
3. Click `Submit`.
4. Frontend `POST /api/submit-name/`.
5. Backend stores record in `NameSubmission` table.
6. Frontend displays welcome message returned by backend.

## 2) Architecture

- `frontend` (`React + Vite + Nginx`)
- `backend` (`Django + Django REST Framework + Gunicorn`)
- `db` (`PostgreSQL 16`)
- `docker-compose.yml` orchestrates all services

## 3) Quick Start (Local or Codespaces)

```bash
cp .env.example .env
docker compose up --build
```

Open `http://localhost:3000`.

## 4) Validation Commands

```bash
# Backend tests + coverage
cd backend
USE_SQLITE=True pytest --cov=api --cov-report=term-missing --cov-report=xml

# Frontend lint + build
cd ../frontend
npm ci
npm run lint
npm run build
```

## 5) Development Automation

- **Pre-commit hooks**: `.pre-commit-config.yaml` (Black, isort, flake8, ESLint)
- **CI/CD foundation**: `.github/workflows/ci.yml`
  - Python dependency caching
  - Node dependency caching
  - backend tests with coverage artifact upload
  - frontend lint + build
- **Cross-platform reproducibility**: Dockerized services and pinned dependencies
- **Environment validation**: `scripts/validate-env.sh`
- **Dev environment automation**: `.devcontainer/devcontainer.json` for Codespaces

## 6) Testing Strategy

- API integration tests for write-to-database path
- Property-based/fuzz-style validation test using Hypothesis
- Coverage analytics produced in CI (`coverage.xml` artifact)

## 7) Reliability and Security Baseline

Implemented in this MVP:

- container isolation by service (`frontend`, `backend`, `db`)
- backend waits for Postgres via `depends_on` + DB healthcheck, then runs `migrate` before Gunicorn (`docker-compose.yml`)
- strict backend input validation via serializers
- environment-based configuration (`.env`)
- CORS and host allow-list controls

## 8) Enterprise Requirement Mapping

Your listed requirements include enterprise-grade capabilities (HIPAA operations, zero-trust IAM, dynamic orchestration, FHIR federation, autonomous remediation, secrets rotation automation, real-time anomaly detection, etc.).  
This repository provides a working, course-compliant foundation and CI automation; the items below are the recommended next layers:

1. **Observability + anomaly detection**
   - OpenTelemetry + Prometheus + Grafana + Alertmanager
   - structured audit logs to centralized SIEM
2. **Security hardening**
   - Vault/KMS-driven secret rotation
   - MFA + OIDC SSO for admin/operator access
   - runtime policy enforcement (OPA/Gatekeeper/Falco)
3. **Scalable orchestration**
   - Kubernetes with HPA, rolling updates, PodDisruptionBudgets
   - queue-backed async jobs and circuit breakers
4. **Compliance + interoperability**
   - FHIR gateway service and schema conformance checks
   - automated compliance controls and evidence collection

## 9) Human + AI Team Collaboration Model

### Roles and responsibilities

- **Human team members**
  - define product goals and acceptance criteria
  - approve architecture and compliance boundaries
  - review/merge code and own release decisions
- **AI agents**
  - scaffold services, write tests, and draft docs
  - implement isolated tasks from issues
  - propose refactors and detect regressions

### Asynchronous unattended development

- Work is split into small issue-sized tickets.
- AI agents run independently on branch-scoped tasks.
- CI validates outputs automatically.
- Humans review only green CI branches for merge.

### Keeping team direction aligned

- shared backlog with acceptance criteria per issue
- mandatory PR checks (lint, tests, coverage)
- architecture decisions captured in docs
- weekly metric review against prototype dimensions:
  - performance
  - development time
  - cost
  - accuracy
  - usability
  - security
  - scalability
  - extensibility/maintainability
  - traceability

## 10) Professor Submission Comment (copy/paste)

```text
Repository: https://github.com/<your-org-or-user>/<your-repo>

This repo contains a fully functioning one-button app where the frontend sends input to a Django backend, and the backend writes the value to PostgreSQL. It is fully containerized with Docker and cloud-deployable, and it runs in GitHub Codespaces. The README explains our human + AI team workflow, asynchronous agent development process, governance, and how we optimize across performance, development time, cost, accuracy, usability, security, scalability, extensibility/maintainability, and traceability.
```
