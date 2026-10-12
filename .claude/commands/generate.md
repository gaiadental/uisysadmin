<!-- Ported from Cursor's `.cursor/commands/generate.md` (v2.0, 2026-06-24). -->


# /generate — On-demand artifact generation

## Registered Types (source of truth for `/generate`)

Ported from the original Cursor command's YAML front-matter `types` array (kept here as body content instead, since this is the data `/generate` itself reads to resolve a type):

```yaml
types:
  - id: readme-backend
    file: docs/generate/readme-backend.md
    owner: developer_backend
    output_key: readme
    stack: backend
    description: Backend local runbook — prerequisites, setup, run app, smoke tests
  - id: readme-frontend
    file: docs/generate/readme-frontend.md
    owner: developer_frontend
    output_key: readme
    stack: frontend
    description: Frontend local runbook — prerequisites, setup, run app, smoke tests
```

Run an **on-demand generator**. Not a checkpoint — no approval gate. The text following the command selects the generator type:

- `/generate readme-backend` — create or refresh the backend service runbook at `service_roots[].readme` from `output/project-profile.md` (local runbook).
- `/generate readme-frontend` — create or refresh the frontend service runbook at `service_roots[].readme` from `output/project-profile.md` (local runbook).
- `/generate readme-backend <service-path>` — same, for one backend entry when multiple `service_roots` exist (e.g. `auth-service/`).
- `/generate readme-frontend <service-path>` — same, for one frontend entry when multiple `service_roots` exist (e.g. `web-app/`).
- `/generate` (no argument) — list registered types from the **Registered Types** section below and ask which one the user wants.

You are the Orchestrator. Comply with `agent-governance.md` and `agent-orchestration.md`.

## Precondition

Read `output/project-profile.md` first. Resolve all output and source paths from `service_roots` (see **Path resolution** below).

Load **only** the subcommand file for the requested type (e.g. `.claude/docs/generate/readme-backend.md` or `.claude/docs/generate/readme-frontend.md`). Do not load other generator subcommands. Do not load full architecture or ADR sets unless the subcommand explicitly lists them under `reads`.

If the requested `id` is not in the **Registered Types** registry below, stop and list available types.

## Path resolution

After reading `output/project-profile.md`:

1. Load `service_roots` from YAML front-matter (array of `{ path, stack, readme, ... }`).
2. For each type, map `output_key` to the field on the selected entry (e.g. `readme` → `service_roots[].readme`).
3. Service module root = selected entry's `path` (keep trailing slash). Prefix relative paths in subcommands with this root.
4. **Single entry** — use it automatically.
5. **Multiple entries** — prompt user to pick by `path`, or honor `/generate <type> <service-path>` when provided.
6. **Missing `service_roots`, empty array, or missing output field** — stop; orchestrator must update `project-profile.md` before retrying.

Each `service_roots[].path` should appear in `included_paths` for enforcement scope consistency.

### Stack filtering

After loading `service_roots`, filter entries by the requested type's `stack` field (`backend` or `frontend`):

1. User picks generator type (`readme-backend` or `readme-frontend`).
2. Filter `service_roots` to entries where `stack` matches the type's `stack`.
3. **One match** — use it automatically.
4. **Multiple matches** — prompt user to pick by `path`, or honor `/generate <type> <service-path>` when provided.
5. **No match** — stop with a clear message (e.g. "No frontend `service_roots` entry; update `project-profile.md`.").
6. **Mismatch** — stop if the user runs `readme-backend` on a `stack: frontend` entry, or `readme-frontend` on a `stack: backend` entry, or if a `<service-path>` argument points to an entry with the wrong `stack`.

Projects with both backend and frontend apps use **one `service_roots` row per app**, each with its own `path`, `stack`, and `readme`. Run the matching generator per stack — the orchestrator never combines both stacks in one row or one command.

## Scope

Utility lane parallel to checkpoints A–E. Generators produce **human-facing operational artifacts** (runbooks, rollups, stubs) with a **narrow read scope** for token efficiency.

| Property | Value |
|----------|-------|
| Approval gate | None |
| Blocks `/validate` or `/document` | No |
| Replaces `/document` | No — `/document` owns API/behavior spec in `output/docs/` |

## Steps

1. **Resolve type** from user argument or prompt if omitted.
2. **Resolve service** from `project-profile.md` `service_roots` (see Path resolution and Stack filtering).
3. **Load subcommand** — read `.claude/docs/generate/<type>.md` only.
4. **Execute** per subcommand owner and steps, passing resolved `path` and output paths.
5. **Provenance** — if the subcommand creates or modifies repo files, propose `file-provenance-register.md` rows to `project-manager` (orchestrator does not edit the register directly).
6. **Pause** — present resolved output path and a short summary; do not self-approve.

## Registered types

| Type | Subcommand | Owner | Stack | Output (from profile) |
|------|------------|-------|-------|------------------------|
| `readme-backend` | `generate/readme-backend.md` | `developer-backend` | `backend` | `service_roots[].readme` |
| `readme-frontend` | `generate/readme-frontend.md` | `developer-frontend` | `frontend` | `service_roots[].readme` |

Add new types by extending front-matter `types`, adding matching fields on `service_roots` entries as needed, and adding `generate/<type>.md`.

## Do not

- Do not hardcode service paths in this file — always resolve from `project-profile.md`.
- Do not implement features or run `/build` TODOs.
- Do not produce API/behavior reference docs — that is `/document` → `output/docs/`.
- Do not load the full ARCH/ADR stack unless a subcommand requires it.
- Do not add generator types without a matching subcommand file.
