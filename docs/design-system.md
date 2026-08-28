# GovAI Hub product and design charter

This document is the visual and interaction contract for the project. New screens should extend these rules before introducing new patterns. The existing dashboard and `tokens.css` are the coded reference.

## Selected product direction

**Evidence Triage Workspace** is the approved design direction. GovAI Hub should organize complex governance work around a stable system header, local object navigation, a central evidence ledger, and a decision-readiness summary. Portfolio pages may be broader, but system-level workflows should keep evidence, missing controls, corrective-action ownership, and human decision blockers visible together. The implemented RecruitAI workspace is the primary coded reference for this direction.

## Brand position

**Promise:** make AI-governance evidence understandable, traceable, and ready for a human decision.

**Personality:** calm authority, transparent, rigorous, and humane. GovAI Hub should resemble a well-run evidence workspace—not a futuristic AI demo, legal portal, or certification badge.

**Trust boundary:** always describe the product as an educational prototype with fictional data. Never imply an official legal assessment, regulatory approval, ISO certification, or automated governance decision.

## Product principles

1. **Evidence before status.** A score or decision must link to answers, findings, controls, actions, and rationale.
2. **Humans own decisions.** Automation may calculate and recommend; named people submit, verify, approve, reject, or suspend.
3. **Risk is never color alone.** Pair every semantic color with a label, score, icon, or explanatory text.
4. **Progressive disclosure.** Summaries lead to details; complex evidence appears when a user asks for it.
5. **One clear next action.** Every workflow state should make its owner and next step obvious.
6. **Auditability by default.** Destructive or governance-significant actions require confirmation and a written reason.

## Visual language

- **Surfaces:** paper white and quiet blue-gray layers. Avoid glossy gradients, glass effects, neon, and decorative AI imagery.
- **Ink:** deep blue-black for authority and readability.
- **Accent:** governance blue for navigation, links, selection, and primary actions—not for risk severity.
- **Semantic colors:** green for acceptable/complete, amber for moderate/conditional, red for high/action-required, deep red for critical/rejected/suspended.
- **Typography:** Geist Sans for interface and evidence narratives; Geist Mono only for references, rule keys, timestamps, and technical identifiers.
- **Shape:** small controlled radii for work surfaces; pills only for compact status labels and people.
- **Density:** compact tables for expert scanning, with comfortable forms and 44px minimum interactive targets.
- **Motion:** short functional transitions only; honor reduced-motion preferences.

The token source of truth is [`tokens.css`](../tokens.css). Components must use tokens instead of adding arbitrary color, spacing, or radius values.

## Information architecture

The primary navigation should grow in this order:

1. Overview
2. AI systems
3. Assessments
4. Compliance
5. Corrective actions
6. Decisions
7. Audit trail
8. Administration

Role permissions change available actions, not the language or location of the underlying object. A system named RecruitAI should remain RecruitAI for owners, auditors, and approvers.

## Core page patterns

### Portfolio and registry

Start with portfolio metrics, then filters, then a scannable registry. Show system reference, name, department, owner, risk label and score, compliance, lifecycle/status, and open actions. Filters must be reflected in the URL when added.

### System workspace

Use a stable system header with reference, owner, department, lifecycle, risk, and workflow status. Organize details into Overview, Risk, Compliance, Actions, Decisions, and Activity. Keep the main decision summary visible before raw evidence.

### Multi-step registration

Group fields by governance meaning: identity and ownership; purpose and users; data; model and autonomy; impact and oversight; review. Preserve progress, show validation beside the affected field, and provide a final review before creation.

### Assessment

Keep the question and its help text together. Results must show total score, classification, every triggered factor, points, and recommended control. Changing an answer must never silently overwrite a submitted assessment version.

### Governance decision

Present risk, open findings, overdue actions, incidents, and prior decisions before the decision controls. Justification is mandatory. Conditional approval also requires conditions; suspension should require impact acknowledgement.

## Component rules

- **Status badge:** text plus semantic color; no ambiguous dots by themselves.
- **Metric:** label, value, and a plain-language basis. Do not invent trends without stored historical data.
- **Table:** real headers, keyboard-reachable row actions, responsive card conversion, explicit empty/loading/error states.
- **Form:** persistent labels, optional/required clarity, help before error, server validation as the authority.
- **Callout:** blue for information, amber for attention, red for blocking risk, green for completed confirmation.
- **Audit event:** actor, action, object, and absolute timestamp; relative time may be secondary.
- **Decision panel:** outcome, approver, timestamp, rationale, conditions, and evidence snapshot.

## Content language

Use direct verbs: Register system, Submit for review, Verify assessment, Add finding, Assign action, Record decision. Prefer “AI system” over “model” when referring to the governed product. Avoid alarmist labels and legal conclusions. Write helpful empty states that explain why the state exists and what a permitted user can do next.

## Accessibility and responsive baseline

- WCAG AA contrast target; visible `:focus-visible` treatment.
- Semantic headings, landmarks, fieldsets, tables, and live regions.
- 44px minimum targets and no hover-only information.
- Desktop rail becomes a compact top navigation; tables become labeled rows/cards without horizontal page scrolling.
- Do not claim accessibility conformance from visual inspection alone; verify keyboard, screen-reader names, zoom, reduced motion, and automated checks.

## Definition of design done

A screen is ready when it follows the tokens and page patterns, covers loading/empty/error/success and permission states, communicates the next action, preserves the educational disclaimer where relevant, works at mobile and desktop widths, and has been checked in a real browser with keyboard focus.
