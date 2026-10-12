
# Governance Editing Standard

> Loading: on demand only. Not imported by `CLAUDE.md`. Read this file explicitly when an agent's or command's *Mandatory References* section names it (Claude Code has no automatic glob-based rule injection, unlike Cursor's `alwaysApply: false` + `globs`). Scope in the original Cursor rule: `**/.cursor/**/*.{md,mdc,txt}`. Ported from Cursor's `.cursor/rules/governance-editing.mdc`.

Version: 1.1

Last Updated: 2026-06-30

Status: Active

Full section index: `.claude/docs/rules-index.md` -> `governance-editing.md`.

Also read: `the original .claude/CHANGELOG.md (Cursor-era history; not ported to Claude Code)` -> **How to Tune Agents & Rules** and **File format by type**.

---

# Purpose

Prevent accidental loss of agent routing, orchestration, and contract guidance when tuning `.claude/` governance files.

Applies when creating, renaming, or editing files under `.claude/agents/`, `.claude/rules/` (including `rules/artifact-templates/`), `.claude/commands/`, and related guides (`workflow.md`, `sdlc-flow.txt`, etc.).

---

# Protected fields (do not remove or rename without MAJOR changelog + consistency check)

## Agents (`agents/*.md`) — YAML frontmatter

| Field | Why it matters |
|-------|----------------|
| `name` | Subagent routing slug (orchestrator delegation, `resume_agent`, gates) |
| `description` | When Cursor selects or delegates to this agent |
| `version` | Registry sync with `CHANGELOG.md` |
| `last_updated` | Registry sync with `CHANGELOG.md` |

## Rules (`rules/*.md`) — YAML frontmatter

| Field | Why it matters |
|-------|----------------|
| `description` | Rule picker and agent context |
| `alwaysApply` | Whether the rule loads every session |
| `globs` | File-scoped rule activation (when `alwaysApply` is false) |

## Commands (`commands/*.md`) — YAML frontmatter

| Field | Why it matters |
|-------|----------------|
| `checkpoint` | Pipeline stage letter (O, A–E) |
| `version`, `last_updated` | Registry sync |

## Orchestration keywords (exact slugs in body text)

Do not delete or casually reword without updating **all** references:

- Delegation map agent slugs (e.g. `developer`, `architect-backend`, `unit-test-writer`)
- Gate table rows (`From`, `To`, owner columns)
- `failure_handoff.resume_agent` values
- Checkpoint owner lists in `build.md`, `orchestrator.md`, `agent-orchestration.md`
- Agent Artifact Index rows in `artifact-standards.md`

Renaming an agent slug is a **MAJOR** change. Grep `.claude/` for the old slug before marking the task complete.

---

# Protected sections (agent contracts)

Do not remove these section headings or their substance unless explicitly replacing them in the same change:

- **Mandatory References**
- **Inputs** / **Preconditions**
- **Responsibilities** / **Non-Responsibilities**
- **Delegation Rules** / escalation targets
- **Failure retry context** (implementation agents)
- **Formats** pointer to `artifact-templates-*.md` section (or `artifact-standards.md` -> **Master TODO** for implementers) plus **Agent Artifact Index** in core

"Do not duplicate templates" applies to **artifact output formats** only — not to behavior contracts, routing tables, or checklists above.

---

# Safe edit rules

1. **Minimize scope** — change only files required for the stated goal; do not "clean up" unrelated sections in the same pass.
2. **Replace, don't hollow** — when moving artifact templates between core and bundle files (`artifact-standards.md` core + `artifact-templates/*.md`), keep a one-line pointer at the old location. Do not leave a section empty or delete it without a replacement reference.
3. **Rename in lockstep** — agent file rename + `name:` frontmatter + all orchestration references + `CHANGELOG.md` registry in one change.
4. **Consistency check** — after edits, verify delegation map, stage count, gate table, artifact owners, and `rules-index.md` agree (see `CHANGELOG.md`).
5. **Encoding** — comply with `document-encoding.md` when editing markdown text.

---

# Pre-complete checklist (governance edits)

Before marking a governance tuning task complete:

1. All protected frontmatter fields still present and valid.
2. No orphaned agent slugs (grep old names across `.claude/`).
3. `CHANGELOG.md` registry and changelog entry updated for version bumps.
4. `rules-index.md` updated when adding, renaming, or removing rule sections.
5. Removed content was artifact **templates** only — not Mandatory References, gates, or routing.

---

# Examples

Bad:

- Remove `description:` from an agent frontmatter to shorten the file.
- Delete **Non-Responsibilities** because it "duplicates" governance rules.
- Rename `developer` in one file but leave `resume_agent: developer` elsewhere.
- Replace a full **Inputs** list with "see artifact-standards" only, with no behavior guidance left.

Good:

- Split `developer` -> `developer-backend` + `developer-frontend` with updated slugs everywhere and a MAJOR changelog entry.
- Replace inline TODO template with pointer to `artifact-standards.md` -> **Master TODO** while keeping **File scope** requirement in `agent-governance.md`.
- Bump `version` / `last_updated` and `CHANGELOG.md` registry in the same commit.
