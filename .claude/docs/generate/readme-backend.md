<!--
Ported from Cursor's `.cursor/commands/generate/readme-backend.md` (v1.2, 2026-06-24).
type: readme-backend
owner: developer_backend
gate: none
This is a subcommand loaded only by `/generate readme-backend` — not a top-level slash command.
-->


# /generate readme-backend — Service runbook

Create or refresh the **service runbook** at the path given by `service_roots[].readme` in `output/project-profile.md`: prerequisites, one-time manual setup, run the app, run tests, smoke verification, troubleshooting.

## Purpose

Operator guide for local development. **Not** the API/behavior reference — point readers to `output/docs/` after `/document`.

## Preconditions

- Resolve service from `project-profile.md` `service_roots` where `stack: backend` (orchestrator passes selected `path` and `readme`).
- The service root directory exists with a runnable Spring Boot app (at minimum bootstrap TODO complete).
- Derive endpoints, ports, and env vars from **actual** `{path}src/main/resources/application.yml` and `{path}.env.example` — never invent values.

## Owner

`developer-backend` (runbook tied to delivered code and config).

## Output template

Write to the resolved `readme` path. The README must include these sections (omit subsections that do not apply yet; note "available after TODO-XXX" if incomplete):

1. **Overview** — one paragraph: what the service does.
2. **Prerequisites** — Java version (from `{path}pom.xml`), PostgreSQL, optional Docker for tests.
3. **One-time setup (manual)**
   - Create PostgreSQL database (name from `application.yml`; Flyway creates tables on first app start).
   - Copy `.env.example` → `.env` under the service root and set credentials.
   - Port conflict note: default port from `application.yml`; set `SERVER_PORT` in `.env` if another tool uses that port.
   - IntelliJ: run the main application class with **working directory** = service root so `.env` loads.
4. **Run the application** — Maven and IDE instructions (from service root).
5. **Run tests** — `mvn test`; Testcontainers requires Docker (WSL or Docker Desktop on Windows).
6. **Smoke test** — health URL and primary API example (PowerShell `Invoke-RestMethod` and `curl.exe` with valid JSON).
7. **Troubleshooting** — common errors: `${DB_USERNAME}` literal (`.env` not loaded), Flyway non-empty schema, JSON escaping in PowerShell, wrong port.
8. **Further reading** — link to `output/docs/` for API spec (after `/document`); ARCH-BE-* for design traceability only.

## Steps

1. Resolve `path` and `readme` from `project-profile.md` `service_roots` where `stack: backend` (prompt if multiple and not specified).
2. Read front-matter `reads`, then each `service_reads` path prefixed with `{path}`.
3. Locate the main `@SpringBootApplication` class under `{path}src/main/java/` if needed for IDE run instructions.
4. Read `optional_service_reads` (prefixed with `{path}`) when registration API or Testcontainers tests exist.
5. Inspect completed TODOs in `master-todo.md` to scope what is runnable.
6. Write or update the resolved `readme` path from delivered code — no secrets in examples.
7. Propose `file-provenance-register.md` row for the resolved readme path (`agent-created` or `agent-modified`, `enforcement: full`) to `project-manager`.
8. Summarize for the user: manual steps they must run once, default URLs, and verify commands.

## Do not

- Do not hardcode service directory names — always resolve from `project-profile.md`.
- Do not duplicate full API documentation (request/response catalog belongs in `/document`).
- Do not read or summarize entire ARCH-* or ADR-* files.
- Do not commit real credentials or copy from `.env`.
- Do not block pipeline checkpoints on README presence.
