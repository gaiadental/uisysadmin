# Design system: SysAdmin (GAIA Dental Clinic)

The style of the tenant create wizard is the standard for the whole app. This
file is the reference. Change a token or a base component, not a single page.

## Direction

A calm admin console for clinic staff. White cards on a light grey canvas, one
teal accent, generous controls, text sized to be read (14px body, 16px root).
No gradients, glow, or decorative motion. The only gradient is the login
button, which follows the approved login reference.

## Color (tokens in `src/index.css`)

| Role | Token | Use |
|------|-------|-----|
| Canvas | `background` (grey 97%) | Page background behind cards |
| Surface | `card` (white) | Cards, inputs, selects, chips |
| Text | `foreground` / `muted-foreground` | Body / helper text (helper stays at 4.5:1) |
| Accent | `primary` (teal) | Primary button, selected chip, progress, focus ring |
| Control border | `input` | Inputs, selects, chips, outline buttons |
| Divider | `border` | Card dividers, table rows |
| Quiet fill | `secondary` / `muted` | Secondary button, read-only blocks |
| Danger | `destructive` | Errors and destructive actions only |

Teal is the accent. It marks the primary action, the selected state, and
progress. It is not used for decoration. Status uses a dot plus text (green
active, grey inactive), never color alone.

## Type

- Headings: Plus Jakarta Sans (`font-heading`), semibold.
- Body: Inter. Mono only for codes and identifiers (tenant code, IDs).
- Page title `text-2xl`. Step or section title `text-xl`/`text-2xl`. Card title
  `text-base`. Body and labels `text-sm`. Nothing below `text-xs` (12px), and
  `text-xs` only for secondary metadata.
- Labels `text-sm font-medium`. Helper text `text-sm text-muted-foreground`
  under the field. Error text `text-sm text-destructive`.

## Shape

| Element | Radius | Height |
|---------|--------|--------|
| Input, select, button | `rounded-xl` (12px) | 44px (`h-11`) |
| Dense button (rows, toolbars) | `rounded-lg` | 36px (`size="sm"`) |
| Tight button | `rounded-lg` | 28px (`size="xs"`) |
| Choice chip | `rounded-full` | 44px |
| Card | `rounded-2xl` (16px) | n/a |
| Wizard or focused card | `rounded-3xl` (24px) | n/a |

Shadow: `shadow-xs` on cards only. The wizard card uses `shadow-sm` because it
is the single focused surface on its page. Everything else sits flat.

## Components

- **Button** (`ui/button.tsx`): `default` teal, `secondary` grey fill for Back
  and Cancel, `outline` white with control border, `ghost`, `destructive`.
  Primary action on the right, secondary on its left.
- **Input / SelectField / SelectTrigger**: one look, 44px, white, `input`
  border, `px-4`. Do not set height or radius in a page.
- **ChoiceChip** (`ui/choice-chip.tsx`): 2 to 5 short exclusive options. Check
  mark and teal tint when selected. A longer list uses a select.
- **WizardSteps**: "Langkah n/N" and a thin progress bar. The step title is
  the heading under it.
- **Tabs** (`ui/tabs.tsx`): default is a segmented pill (white, control border,
  44px) with the selected tab filled teal. `variant="line"` is an underline
  style for long page sections. Labels are short nouns, 2 to 4 tabs.
- **Card, TableCard, PageHeader, MetricCard**: white surface on the canvas.
  Text never sits directly on the canvas except the page title and its
  description.
- **Status**: `TenantStatusBadge` (dot plus text).

## Destructive actions

Friction scales with the damage. Every confirm goes through `confirm()` in
`components/dialogs`.

| Tier | Examples | Flow |
|------|----------|------|
| Reversible | Nonaktifkan, tangguhkan, paksa keluar, reset password | One step. Focus starts on Batal. |
| Permanent | Hapus user, peran, permission, negara, kategori | Type `delete` in the field, then the red button enables (case-insensitive, trimmed; Enter also confirms). Focus starts on Batal. |

- Batal is the primary (teal) button, on the right. The destructive button is
  on the left, tinted red, and never the focused one.
- `impact` lists concrete consequences, one short line each. Do not invent
  counts the API does not return.
- Row delete is a quiet icon button (`RowDeleteButton`) behind a divider, away
  from Ubah. It turns red on hover and focus only.
- Typed confirmation is an owner decision that supersedes the "no typed input"
  line of ARCH-FE-001 D11. Record it in the architecture and an ADR.

## Layout

- App pages: `PageBody` (padding 16, 24 from `lg`), `PageHeader`, then cards.
- Forms: one column, `gap-5` between fields, label above control, helper text
  below. Two columns only for short paired fields at `sm` and up.
- Focused flows (create, change password): one centered card, `max-w-xl`.
- Lists: `TableCard` with toolbar, table, pagination footer.

## Behavior

- Focus ring `ring-3 ring-ring/50` on every interactive element.
- Motion is limited to color and width transitions of 150 to 300ms and respects
  `prefers-reduced-motion`.
- Empty, loading, and error states say what is happening and what to do next.
- Never show invented numbers or sample data. Empty fields use honest
  placeholders (`email@example.com`, `https://`).

## Rules for new screens

1. Reuse the base components. A className that sets height, radius, or border on
   an input or button means the system is missing something: change it here.
2. Group related fields in a card or a bordered block, and give each step or
   section a title and one line of context.
3. One accent action per screen.
4. Update this file when a token or component changes.
