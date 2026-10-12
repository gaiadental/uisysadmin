<!--
Ported from Cursor's `.cursor/commands/generate/readme-frontend.md` (v1.0, 2026-06-24).
type: readme-frontend
owner: developer_frontend
gate: none
This is a subcommand loaded only by `/generate readme-frontend` — not a top-level slash command.
-->


# /generate readme-frontend — Service runbook

Create or refresh the **service runbook** at the path given by `service_roots[].readme` in `output/project-profile.md`: prerequisites, one-time manual setup, run the app, run tests, smoke verification, troubleshooting.

## Purpose

Operator guide for local development. **Not** the UI/behavior reference — point readers to `output/docs/` after `/document`.

## Preconditions

- Resolve service from `project-profile.md` `service_roots` where `stack: frontend` (orchestrator passes selected `path` and `readme`).

- The service root directory exists with a runnable React app (at minimum bootstrap TODO complete).

- Derive dev-server URL, port, and env vars from **actual** `{path}package.json` scripts, `{path}.env.example` or `{path}.env.local.example`, and `{path}next.config.*` or `{path}vite.config.*` — never invent values.

## Owner

`developer-frontend` (runbook tied to delivered code and config).

## Output template

Write to the resolved `readme` path. The README must include these sections (omit subsections that do not apply yet; note "available after TODO-XXX" if incomplete):

1. **Overview** — one paragraph: what the app does.

2. **Prerequisites** — Node.js version (from `{path}package.json` `engines.node`, `.nvmrc`, or `.node-version` when present); npm (or documented package manager from lockfile).

3. **One-time setup (manual)**

   - Copy `.env.example` → `.env` or `.env.local.example` → `.env.local` under the service root (whichever exists) and set API base URL and other required vars.

   - Port conflict note: default dev port from `package.json` `scripts.dev` or framework config; override via env (e.g. `PORT`) when another tool uses that port.

   - IDE: run **dev** script with **working directory** = service root so env files load.

4. **Run the application** — install (`npm install` or project lockfile command) and dev server (`npm run dev` or script name from `package.json`) from service root.

5. **Run tests** — `npm test` or `npm run test` (Vitest or Jest per project); note watch vs single-run flags when documented in `package.json`.

6. **Smoke test** — open the local dev URL in a browser (default from dev script or config); verify a primary route or health page loads.

7. **Troubleshooting** — common errors: missing env vars (API URL undefined), wrong Node version, port already in use, CORS or proxy misconfiguration vs backend, stale `.next` or `node_modules`.

8. **Further reading** — link to `output/docs/` for UI/behavior spec (after `/document`); ARCH-FE-* for design traceability only.

## Steps

1. Resolve `path` and `readme` from `project-profile.md` `service_roots` where `stack: frontend` (prompt if multiple and not specified).

2. Read front-matter `reads`, then `{path}package.json`.

3. Read whichever env template exists: `{path}.env.example` and/or `{path}.env.local.example`.

4. Detect framework from `package.json` dependencies (`next` vs `vite`) and read the matching config under `{path}` (`next.config.*` or `vite.config.*`).

5. Read `optional_service_reads` (prefixed with `{path}`) when Vitest config or proxy settings affect run/test instructions.

6. Inspect completed TODOs in `master-todo.md` to scope what is runnable.

7. Write or update the resolved `readme` path from delivered code — no secrets in examples.

8. Propose `file-provenance-register.md` row for the resolved readme path (`agent-created` or `agent-modified`, `enforcement: full`) to `project-manager`.

9. Summarize for the user: manual steps they must run once, default dev URL, and verify commands.

## Do not

- Do not hardcode service directory names — always resolve from `project-profile.md`.

- Do not duplicate full UI/behavior documentation (component catalog belongs in `/document`).

- Do not read or summarize entire ARCH-* or ADR-* files.

- Do not commit real credentials or copy from `.env` / `.env.local`.

- Do not block pipeline checkpoints on README presence.
