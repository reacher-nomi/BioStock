# Rubric Mapping

How Bio-Stock addresses each evaluation criterion, with file evidence. Items are
marked ✅ implemented or 🔭 roadmap (intentionally out of scope for a single-node
student prototype, documented honestly rather than faked).

| # | Criterion | Evidence |
|---|-----------|----------|
| 1 | **Dev Environment** | ✅ Git history with scoped commits · ✅ Docker reproducibility (`docker-compose.yml`, `.devcontainer/`) · ✅ Pre-commit hooks (`.pre-commit-config.yaml`) · ✅ CI matrix across Ubuntu/Windows/macOS × Python 3.11/3.12 with pip caching (`.github/workflows/ci.yml`) · ✅ Startup env validation (`config.py`) |
| 2 | **Testing** | ✅ Unit + integration tests (`tests/`) · ✅ Property-based tests via Hypothesis (`tests/test_property.py`) · ✅ Fuzz tests on `/health/log` · ✅ Coverage analytics with a 75% CI gate (88% actual, `pyproject.toml`) · ✅ Continuous regression detection (tests on every push) |
| 3 | **Configuration** | ✅ Env isolation dev/staging/prod (`config.py`, `APP_ENV`) · ✅ Typed validation at startup · ✅ JWT key **rotation** support (`JWT_PREVIOUS_KEYS`) · ✅ Secrets via env, never committed (`.env.example`) · 🔭 Vault/KMS-backed rotation infra |
| 4 | **Logging** | ✅ Structured JSON logs (`logging_config.py`) · ✅ Severity levels + per-request **correlation IDs** · ✅ **PII/PHI redaction** (passwords, tokens, emails) · ✅ Dedicated **audit logger** for security events · 🔭 Centralized log aggregation + ML anomaly detection |
| 5 | **Deployment & Architecture** | ✅ Containerized, modular (`models`/`routes`/`services`) · ✅ Non-root container + `HEALTHCHECK` (`Dockerfile`) · ✅ CI pipeline · 🔭 True microservices, autoscaling, multi-node HA |
| 6 | **Input Validation & Security** | ✅ Pydantic type/format/range validation · ✅ Parameterized queries (ORM, no SQLi) · ✅ **FHIR schema validation** · ✅ Security headers · ✅ **Automated dependency scanning** (`pip-audit`) + **CodeQL** SAST (`.github/workflows/codeql.yml`) · 🔭 Runtime WAF / real-time threat ML |
| 7 | **Error Handling** | ✅ Centralized exception handler with safe responses (`main.py`) · ✅ Categorized HTTP errors · ✅ Client retry/backoff · 🔭 Self-healing pipelines |
| 8 | **Auth & Encryption** | ✅ JWT + bcrypt password hashing · ✅ **MFA (TOTP)** (`routes/mfa.py`) · ✅ Rate limiting · ✅ Granular **audit logging** · ✅ TLS/HSTS in production mode · 🔭 Full zero-trust, end-to-end encryption, RBAC roles |
| 9 | **Fault Tolerance** | ✅ Retry with exponential backoff · ✅ **Circuit breaker** (`utils/api.js`) · ✅ Graceful degradation (keeps last-good UI state) · ✅ Container restart policy + healthcheck · 🔭 Distributed load balancing / multi-region |
| 10 | **FHIR Compliance** | ✅ Vitals modeled as FHIR R4 `Observation` with real LOINC codes + UCUM units · ✅ `Patient` resource · ✅ Schema validation via `fhir.resources` · ✅ `application/fhir+json` responses · 🔭 Live external FHIR-server interoperability |

## Scope note
The 🔭 items require multi-node infrastructure (orchestration, autoscaling,
log-aggregation/ML, KMS, distributed tracing) that isn't meaningful for a
single-node SQLite + Expo prototype. They are listed as the production roadmap
rather than implemented superficially.
