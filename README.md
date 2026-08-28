# GovAI Hub

French-first, bilingual web platform for internal AI-system governance. It provides a central registry, explainable risk assessment, compliance audits, corrective actions, incident management, documented human decisions, an audit trail, dashboard indicators, and PDF reporting.

> Educational prototype for an ENSIASD MGSI internship project. All data is fictional. GovAI Hub is not legal advice, regulatory certification, ISO certification, or an official compliance assessment.

## What is implemented

- Auth.js credentials authentication and server-side role-based authorization
- User and department management
- AI-system registry with multi-step registration
- Deterministic, explainable 0-100 risk scoring
- Rule-based control recommendations
- Compliance-audit workflow with evidence and findings
- Corrective actions with owner evidence and completion tracking
- Governance decisions: approve, conditionally approve, reject, suspend
- Incident reporting and secure incident status updates
- Complete system timeline / audit events
- Role-oriented workspace and notifications
- Governance dashboard with PostgreSQL indicators and a protected PDF report
- French-first interface with English language preference
- Fictional seed portfolio, including RecruitAI

## Roles

| Role | Main responsibilities |
| --- | --- |
| Administrator | Manages users and departments; can access and manage all governance records. |
| AI System Owner | Registers owned systems, completes risk assessments, evidence for actions, and reports incidents. |
| Risk & Compliance Auditor | Audits controls, records findings/evidence, reports and updates incidents. |
| Governance Approver | Reviews the evidence and records justified governance decisions. |
| Viewer | Read-only access to the registry and governance evidence. |

## Main workflow

```text
Register system -> Assess risk -> Audit controls -> Corrective actions
       -> Governance decision -> Ongoing incident management
```

Risk scores are calculated locally from published TypeScript rules. A system description never calls an external AI service and does not silently affect its score.

### Complete AI-system workflow

Use this sequence for TalentMatch AI or any new system.

| Step | Role | Action in GovAI Hub | Result / next status |
| --- | --- | --- | --- |
| 0. Set up | Administrator | Creates the users, assigns their roles and departments. | Each participant sees only the actions allowed for their role. |
| 1. Register | AI System Owner (Lina) | Registers the system, its purpose, owner, data, lifecycle stage, and autonomy level. | System is **Draft**. |
| 2. Assess risk | Owner | Answers the risk questionnaire and saves the assessment. | A transparent score, risk level, factors, and recommended controls are created. System moves to **In review**. |
| 3. Audit controls | Auditor (Rayan) | Opens the system, checks each recommended control, records the result, finding, and evidence. | A compliance score is created. If any control is non-conforming, the system moves to **Action required**. |
| 4. Correct gaps | Owner | Opens each assigned corrective action, adds implementation evidence, and marks it completed. | Open-action count returns to zero. The evidence stays in the system timeline. |
| 5. Decide | Governance Approver (Imane) | Reviews score, audit, actions, and incidents. Records a decision and a mandatory justification. | System becomes **Approved**, **Conditionally approved**, **Rejected**, or **Suspended**. |
| 6. Monitor | Owner, Auditor, Administrator | Reviews notifications, records new assessments after major changes, and manages incidents. | Governance record remains active and traceable. |

**Decision rule:** an ordinary approval is blocked while corrective actions are still open. A conditional approval must contain written conditions.

### Complete incident workflow

| Step | Role | Action in GovAI Hub | Result / next status |
| --- | --- | --- | --- |
| 1. Identify | Owner, Auditor, or Administrator | Identifies an issue, for example a potentially biased recommendation, unexpected disclosure, or incorrect ranking. | Incident is ready to be recorded. |
| 2. Report | Owner (only an owned system), Auditor, or Administrator | Opens the system record and enters a title, severity, occurrence date/time, and factual description. | Incident status is **Open**; a timeline event is created. |
| 3. Investigate | Auditor or Administrator | Changes the status to **Investigating** and records investigation notes and evidence. | The incident remains visible on the system record and dashboard count. |
| 4. Resolve | Auditor or Administrator | Documents the corrective measure and changes the status to **Resolved**. | Resolution date and note are retained. |
| 5. Close | Auditor or Administrator | Confirms the resolution is complete and changes status to **Closed**. | The incident remains in the audit trail; it is never deleted. |

Viewers and Governance Approvers can read incidents through the system record but cannot report, investigate, resolve, close, or delete them.

## Technology

- Next.js 16 App Router, TypeScript, Tailwind CSS
- PostgreSQL (Neon compatible), Prisma 7 and migrations
- Auth.js, Zod, React Hook Form
- Recharts, pdf-lib, Vitest

## Project structure

```text
prisma/
  migrations/        PostgreSQL schema history
  schema.prisma      Governance data model
  seed.ts            Fictional development data
src/
  app/               App Router pages, Server Actions, route handlers
  components/        Interactive UI components
  lib/auth/          Authorization and roles
  lib/data/          Database query layer
  lib/risk-engine.ts Explainable scoring rules
docs/
  design-system.md   Brand and UX guidance
```

## Local setup

Requirements: Node.js, pnpm, and a PostgreSQL database. Neon is supported.

```bash
pnpm install
```

Create `.env` from `.env.example`, then set `DATABASE_URL`, `AUTH_SECRET`, and a strong `SEED_USER_PASSWORD`.

```bash
pnpm db:generate
pnpm db:migrate
pnpm db:seed
pnpm dev
```

Open `http://localhost:3000`.

For an already hosted database, apply committed migrations with:

```bash
pnpm db:deploy
pnpm db:seed
```

Never commit `.env`, credentials, or passwords.

## Development accounts

The fictional seed uses the initial password stored only in `SEED_USER_PASSWORD` in your local `.env`.

| Role | Email |
| --- | --- |
| Administrator | `amine.admin@govai.example` |
| AI System Owner | `nadia.hr@govai.example` |
| AI System Owner | `youssef.ops@govai.example` |
| Risk & Compliance Auditor | `salma.audit@govai.example` |
| Governance Approver | `omar.governance@govai.example` |

### Additional workflow accounts

These accounts can be created by the Administrator from **User and role management** to demonstrate a clean end-to-end workflow. Their passwords are the values chosen during account creation and are never stored in this README.

| Role | Name | Suggested email | Department | Demonstration use |
| --- | --- | --- | --- | --- |
| AI System Owner | Lina Bensaid | `lina.owner@govai.example` | Human Resources | Owns TalentMatch AI, assesses risk, completes corrective actions, and reports incidents. |
| Risk & Compliance Auditor | Rayan El Mansouri | `rayan.auditor@govai.example` | Risk & Compliance | Reviews controls, records audit findings, and updates incidents. |
| Governance Approver | Imane Ait Lahcen | `imane.approver@govai.example` | Governance | Reviews evidence and records the final governance decision. |

## Scoring model

- Sensitive personal data: +20
- Material effect on individuals: +25
- Autonomous important decisions: +20
- No formal human review: +15
- Insufficient explanation: +10
- No appeal mechanism: +10

Risk levels: Low (0-25), Moderate (26-50), High (51-75), Critical (76-100).

## Incident management

Owners can report incidents only for their own systems. Auditors and administrators can report incidents; auditors and administrators can move an incident through Open, Investigating, Resolved, and Closed. Incidents cannot be deleted, preserving the governance record.

## Verification

```bash
pnpm lint
pnpm test
pnpm build
```

Run these checks before demonstrations or deployment. The PDF report and dashboard both use current database records and should be refreshed after relevant workflow changes.
