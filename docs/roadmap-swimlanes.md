# Project Roadmap Swimlanes

This roadmap groups the work into major swimlanes and shows the execution structure for the project.

The live task status lives in `.github/instructions/*.instructions.md` and is read on every load.

For the public live view, open `docs/roadmap/index.html` locally or use `https://paas.ciuculescu.com/roadmap/`.

## Live Status Source

- Source of truth: `.github/instructions/*.instructions.md`
- Required section in each file: `## Task Status`
- Supported status values: `done`, `in_progress`, `blocked`, `not_started`
- Public frontend: reads those instruction files from the `main` branch on every page load

---

## Swimlane 1 — Research & Product

> Source: `.github/instructions/01-product-research.instructions.md`

| Task | Status | Notes | Content |
| --- | --- | --- | --- |
| Define the primary coach persona and early adopter profile. | done | Example persona drafted covering solo life coach and online fitness coach archetypes. | docs/outputs/coach-persona.md |
| Run and document 5-10 coach interviews. | not_started | No interview plan or notes exist in the repo yet. | |
| Summarize the current workflow coaches use to sell and deliver value. | not_started | Depends on interview input and research synthesis. | |
| Map the main competitors, substitutes, and gaps in the market. | not_started | No competition analysis has been documented yet. | |
| Write a clear core value statement for the product. | not_started | The product intent exists, but no final value statement is locked. | |
| Select the first 3-5 use cases to support. | not_started | Candidate use cases exist, but no explicit final selection is tracked. | |
| Decide the initial pricing model and rationale. | not_started | No pricing decision is stored yet. | |
| Validate desirability and price sensitivity with 2-3 real coaches. | not_started | Validation with paying intent has not started. | |

---

## Swimlane 2 — Framework & Architecture

> Source: `.github/instructions/02-product-architecture.instructions.md`

| Task | Status | Notes |
| --- | --- | --- |
| Define the end-to-end product flow from coach input to deployment. | not_started | The flow is described conceptually, but no formal product flow doc exists. |
| List the initial tool types the platform supports. | not_started | Candidate tool types are noted, but no locked list is tracked. |
| Document the automated decision areas and decision boundaries. | not_started | No decision matrix or architecture note exists yet. |
| Draft the internal blueprint schema. | not_started | No JSON or YAML blueprint schema has been added to the repo. |
| Mark mandatory and optional blueprint fields. | not_started | Depends on blueprint schema definition. |
| Sketch the internal API surface that consumes and produces blueprints. | not_started | No API design draft exists yet. |
| Choose the initial technical stack with reasons and constraints. | not_started | No final stack decision document is in the repo. |

---

## Swimlane 3 — Coach UX

> Source: `.github/instructions/03-coach-ux.instructions.md`

| Task | Status | Notes |
| --- | --- | --- |
| Map the full coach user journey. | not_started | No end-to-end UX journey document exists yet. |
| Create a dashboard wireframe. | not_started | No dashboard wireframe has been created in the repo. |
| Create a wizard wireframe. | not_started | No wizard wireframe has been created in the repo. |
| Create a generated tool preview wireframe. | not_started | No preview wireframe exists yet. |
| Create an advanced settings wireframe. | not_started | No advanced settings wireframe exists yet. |
| Define the UI tone of voice and wording guidelines. | not_started | Tone guidance is directional only, not formalized. |
| Validate wireframes with coaches and record improvement points. | not_started | Validation depends on completed wireframes. |

---

## Swimlane 4 — Questionnaire & Rules

> Source: `.github/instructions/04-questionnaire-wizard.instructions.md`

| Task | Status | Notes |
| --- | --- | --- |
| Define questions about client audience and usage patterns. | not_started | No questionnaire draft exists yet. |
| Define questions about content format and update cadence. | not_started | No content question set exists yet. |
| Define questions about access, payment, and authentication. | not_started | No access decision questions are stored yet. |
| Define questions about branding and experience type. | not_started | No branding question set exists yet. |
| Define questions about security and compliance. | not_started | No compliance question set exists yet. |
| Map questionnaire responses to technical rules and defaults. | not_started | No rules mapping artifact exists yet. |
| Document the decision logic clearly for internal use. | not_started | No internal logic doc exists yet. |

---

## Swimlane 5 — Backend & Infra

> Source: `.github/instructions/05-backend-infrastructure.instructions.md`

| Task | Status | Notes |
| --- | --- | --- |
| Decide the repo structure and workspace boundaries. | not_started | The repo currently contains planning assets only. |
| Configure dev, staging, and prod environments. | not_started | No environment configuration exists yet. |
| Choose the hosting provider. | not_started | No hosting decision is documented yet. |
| Implement the backend blueprint model and endpoints. | not_started | No backend code exists yet. |
| Implement the rules engine. | not_started | No rules engine implementation exists yet. |
| Implement the auth module. | not_started | No auth module exists yet. |
| Implement the storage module. | not_started | No storage module exists yet. |
| Implement the AI integration module. | not_started | No AI integration backend exists yet. |
| Implement the deployment module. | not_started | No deployment automation exists yet. |
| Implement logs and observability. | not_started | No logging or monitoring setup exists yet. |
| Design the database schema. | not_started | No schema file or migration plan exists yet. |

---

## Swimlane 6 — Frontend & UI

> Source: `.github/instructions/06-frontend-ui.instructions.md`

| Task | Status | Notes |
| --- | --- | --- |
| Set up the frontend project. | not_started | No frontend application scaffold exists yet. |
| Implement onboarding for coaches. | not_started | No onboarding UI exists yet. |
| Implement the coach dashboard. | not_started | No dashboard UI exists yet. |
| Implement the multi-step wizard. | not_started | No wizard UI exists yet. |
| Implement the tool preview page. | not_started | No preview UI exists yet. |
| Implement the advanced settings page. | not_started | No advanced settings UI exists yet. |
| Implement public tool pages. | not_started | No public-facing tool pages exist yet. |
| Implement minimal whitelabeling. | not_started | No whitelabel support exists yet. |

---

## Swimlane 7 — AI & Content

> Source: `.github/instructions/07-ai-content.instructions.md`

| Task | Status | Notes |
| --- | --- | --- |
| Choose the AI provider and baseline models. | not_started | No AI provider decision is committed yet. |
| Implement PDF upload flows. | not_started | No upload UI or backend flow exists yet. |
| Implement PDF processing and vector storage. | not_started | No extraction, chunking, or vector storage code exists yet. |
| Implement the Q&A API over content. | not_started | No Q&A endpoint exists yet. |
| Create generic prompt templates. | not_started | No prompt template library exists yet. |
| Create coach-type-specific prompt templates. | not_started | No coach-specific prompt variants exist yet. |
| Implement basic guardrails and disclaimers. | not_started | No safety or disclaimer layer exists yet. |

---

## Swimlane 8 — Security & Privacy

> Source: `.github/instructions/08-security-privacy.instructions.md`

| Task | Status | Notes |
| --- | --- | --- |
| Define the permission model. | not_started | No role model specification exists yet. |
| Implement authentication and authorization. | not_started | No auth or authorization logic exists yet. |
| Implement rate limiting. | not_started | No rate limiting controls exist yet. |
| Implement audit logs. | not_started | No audit logging implementation exists yet. |
| Define the data storage and retention policy. | not_started | No retention policy doc exists yet. |
| Draft terms and conditions plus privacy policy. | not_started | No legal draft files exist yet. |
| Implement GDPR-style deletion options. | not_started | No account or data deletion flow exists yet. |

---

## Swimlane 9 — Monetization & Billing

> Source: `.github/instructions/09-monetization-billing.instructions.md`

| Task | Status | Notes |
| --- | --- | --- |
| Choose the payments provider. | not_started | No payments provider decision exists yet. |
| Define pricing plans and limits. | not_started | No plan matrix is documented yet. |
| Implement subscription management. | not_started | No subscription system exists yet. |
| Implement per-plan enforcement. | not_started | No billing limit enforcement exists yet. |
| Create the pricing page. | not_started | No pricing page exists yet. |
| Implement upgrade and downgrade UX. | not_started | No billing management UI exists yet. |

---

## Swimlane 10 — Analytics & Feedback

> Source: `.github/instructions/10-analytics-feedback.instructions.md`

| Task | Status | Notes |
| --- | --- | --- |
| Implement core product metrics. | not_started | No analytics implementation exists yet. |
| Implement a coach usage dashboard. | not_started | No coach analytics UI exists yet. |
| Implement in-app feedback capture. | not_started | No in-app feedback flow exists yet. |
| Set up testimonial collection. | not_started | No testimonial workflow exists yet. |
| Produce a lightweight recurring internal report. | not_started | No reporting cadence or template exists yet. |

---

## Swimlane 11 — Pilot & Iteration

> Source: `.github/instructions/11-pilot-iterations.instructions.md`

| Task | Status | Notes |
| --- | --- | --- |
| Select the pilot coaches. | not_started | No pilot cohort has been selected yet. |
| Run guided onboarding for the first pilots. | not_started | No pilot onboarding has started yet. |
| Collect technical problems and product gaps. | not_started | No pilot issue log exists yet. |
| Iterate on questionnaire wording and logic. | not_started | Depends on pilot usage and feedback. |
| Resolve critical pilot bugs. | not_started | No pilot bugs exist yet because pilot work has not started. |
| Document best practices for tool configuration. | not_started | No pilot-derived best practices exist yet. |

---

## Swimlane 12 — Go-To-Market

> Source: `.github/instructions/12-go-to-market.instructions.md`

| Task | Status | Notes |
| --- | --- | --- |
| Define product positioning for a concrete coach persona. | not_started | Positioning is not finalized yet. |
| Create the landing page. | not_started | No public landing page exists yet. |
| Create short demo videos. | not_started | No demo videos exist yet. |
| Create the quick-start guide. | not_started | No quick-start guide exists yet. |
| Plan and execute outreach to coaches. | not_started | No outreach plan or execution log exists yet. |
| Set up the newsletter and onboarding sequence. | not_started | No newsletter flow exists yet. |

---

## Recommended Execution Order

1. Finish research and product clarification.
2. Lock the architecture, blueprint, and questionnaire logic.
3. Design the coach UX flow and validate wireframes.
4. Build the platform foundations across backend, frontend, and AI.
5. Add security controls before exposing the product widely.
6. Run a pilot, then expand into billing, analytics, and go-to-market.

## How To Open It

1. Open [docs/roadmap-swimlanes.md](docs/roadmap-swimlanes.md).
2. In VS Code, run `Markdown: Open Preview` or press `Ctrl+Shift+V`.
3. If you want side-by-side preview, use `Markdown: Open Preview to the Side`.
4. For the live public dashboard, open [docs/roadmap/index.html](docs/roadmap/index.html) or `https://paas.ciuculescu.com/roadmap/`.