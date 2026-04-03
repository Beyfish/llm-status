# LLM Status Design System

Status: Active
Updated: 2026-04-03

## Product Character

LLM Status is not a marketing site pretending to be a tool. It is a calm desktop control room for developers who manage sensitive credentials and need immediate operational confidence.

The product should feel:
- trustworthy, not playful
- fast, not flashy
- dense, but never cramped
- intentional, not template-generated

If a user opens the app while something is broken, the UI should help them feel oriented in under 3 seconds.

## Core Interaction Principles

1. **Sidebar-detail is the primary information architecture**
   - The sidebar is for orientation and switching providers.
   - The main panel is for detail, action, and diagnosis.
   - Do not show the same provider summary in both places at the same time.

2. **Check All is the signature interaction**
   - It must show progress at the provider level.
   - Users should see the system working card by card / row by row, not a frozen global spinner.
   - Bulk checking should feel alive, deterministic, and trustworthy.

3. **Sensitive input moments need reassurance**
   - API key inputs require inline validation.
   - Validate obvious errors early: empty value, leading/trailing spaces, known prefix mismatches, malformed URLs.
   - Never wait until full submission to reveal low-confidence input problems.

4. **Empty states are features**
   - First-run empty state must explain what the product does, what happens next, and provide one primary action.
   - Avoid sterile language like "No items found."

5. **Status is always visible**
   - Status should be legible through text, color, and placement.
   - Color alone is never enough.

## Layout Rules

## App Shell

- Header height: `56px`
- Sidebar width: `220px` default
- Main content padding: `24px`
- Minimum window width: `640px`

### Header hierarchy

Header should read left to right:
1. Product identity
2. Search / current filtering context
3. Global actions

Global actions should prioritize:
1. Check All
2. Add / import provider
3. Sync / export
4. Settings

Language and theme toggles are utility actions and should visually recede.

### Sidebar-detail mode

Sidebar items should include:
- provider logo (or status dot if no logo)
- provider name
- compact status indicator

Main panel should include, in order:
1. selected provider identity and current status
2. most important operational metrics
3. credentials section
4. latency / diagnostics section
5. advanced actions

Do not render a full provider card grid when a sidebar-detail layout is active.

## Visual Language

## Typography

Base UI font stack:
- `-apple-system`
- `BlinkMacSystemFont`
- `'Segoe UI Variable'`
- `'Segoe UI'`
- `sans-serif`

Code / credential / latency numeric text:
- `'JetBrains Mono'`
- `'Fira Code'`
- `'Cascadia Code'`
- `monospace`

### Type scale

- App title / primary panel title: `24px`, weight `600`
- Section title: `14px`, weight `600`, uppercase allowed only for dense metadata sections
- Body text: `13px` to `14px`
- Secondary/meta text: `12px`
- Key numeric metric (latency): `20px` to `24px`, mono, weight `700`

Avoid large hero typography. This is an app, not a landing page.

## Color System

Use existing tokens from `src/styles/tokens.css` as source of truth.

### Core semantic colors

- Accent: `--accent`
- Success: `--green`
- Warning: `--yellow`
- Error: `--red`

### Surfaces

- Primary background: `--bg-primary`
- Surface: `--bg-surface`
- Elevated surface: `--bg-elevated`

### Text

- Primary text: `--text-primary`
- Secondary text: `--text-secondary`
- Muted text: `--text-muted`

### Usage rules

- Accent is for focus, active state, and one primary action at a time.
- Success / warning / error colors are operational colors, not decorative colors.
- Do not introduce additional bright palette colors without updating this document and tokens.

## Spacing and Shape

Use the spacing scale from `tokens.css`:
- `--space-1` = 4px
- `--space-2` = 8px
- `--space-3` = 12px
- `--space-4` = 16px
- `--space-5` = 24px
- `--space-6` = 32px
- `--space-7` = 48px

Radius rules:
- Inputs / buttons: `8px`
- Cards: `12px`
- Modals: `16px`

Do not increase radius globally just to make the UI feel "modern." Calm geometry wins.

## Motion

- Motion should communicate state change, not style for style's sake.
- Hover movements should be subtle. Avoid toy-like bouncing.
- Bulk status updates should rely on status transition and progress indicators, not dramatic animation.

Prefer:
- fade
- small elevation shift
- border / background transition

Avoid:
- large translate effects
- decorative parallax
- meaningless looping motion

## State Design

Every user-facing feature should define these states where relevant:

| Feature | Loading | Empty | Error | Success | Partial |
|--------|---------|-------|-------|---------|---------|
| Provider list | skeleton or muted placeholders | first-run onboarding state | config read failure with retry | sidebar list visible | some providers hidden by filter |
| Provider detail | detail skeleton | no provider selected prompt | provider config invalid | detail sections visible | some sections unavailable |
| Check All | per-provider loading status | n/a | all failed state | all finished | mixed success/failure |
| Smart Import | OCR parsing state | empty input helper | parse failure with editable recovery | extracted fields preview | partial extraction confidence |
| Sync | progress / syncing badge | no sync configured | conflict / auth / network issue | last sync timestamp | some providers synced |

## Empty State Copy Principles

Empty states should include:
1. what this area is for
2. what the user should do next
3. one primary action

Example tone:
- Good: "Add your first provider to start checking key health and latency."
- Bad: "No providers found."

## Accessibility

- All clickable non-button elements must support keyboard activation with `Enter` and `Space`.
- Minimum interactive target size: `32px` desktop, `44px` where practical.
- Focus states must remain visible and use `--accent`.
- Status must be represented with text plus color.
- Modal dialogs must have labeled titles and escape / close behavior.

## Responsive Behavior

This is a desktop app, but it still needs small-window behavior.

### At narrow desktop widths

- Card grids should reduce columns before content becomes cramped.
- Large modals must shrink to fit viewport width with safe margins.
- Command palette should preserve visible side margins.
- Sidebar can remain fixed, but main detail layout must collapse vertically when width is constrained.

### Rules

- Never allow 3-column provider layouts at widths where content truncates meaningfully.
- Never let modals touch the viewport edges.
- Prefer fewer columns over smaller unreadable content.

## Brand Identity

The current product identity is functional, but too generic if left untouched.

Rules for near-term brand strengthening:
- Keep the app identity compact and tool-like.
- Strengthen the product mark / title lockup before adding decorative graphics.
- Brand should come from typography, spacing, and operational clarity, not gradient spectacle.

Avoid turning the app into a generic AI dashboard with:
- default card mosaics as the first impression
- decorative gradient blobs
- generic purple AI styling
- centered marketing-style copy in app surfaces

## Anti-Slop Rules

Reject these patterns by default:
1. provider card grid as the only first impression
2. stacked cards replacing real layout hierarchy
3. decorative shadows doing the work of hierarchy
4. generic "clean modern dashboard" language without specifics
5. repeated icon-in-card layouts where table/list/detail would be clearer

## Implementation Notes

When changing UI, update this document if you change:
- app information architecture
- token semantics
- primary interaction feedback patterns
- accessibility interaction model
- brand identity direction

Stale design docs are worse than none.
