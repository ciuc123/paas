# Project Roadmap Swimlanes

This roadmap groups the work into major swimlanes and shows the execution structure for the project.

The live task status now lives in `.github/instructions/*.instructions.md`.

For the public live view, open `docs/index.html` locally or use `https://paas.ciuculescu.com/`.

## Live Status Source

- Source of truth: `.github/instructions/*.instructions.md`
- Required section in each file: `## Task Status`
- Supported status values: `done`, `in_progress`, `blocked`, `not_started`
- Public frontend: reads those instruction files from the `main` branch on every page load

## Swimlane View

```mermaid
flowchart LR
    classDef done fill:#d1fae5,stroke:#047857,color:#064e3b,stroke-width:2px;
    classDef now fill:#fef3c7,stroke:#b45309,color:#78350f,stroke-width:2px;
    classDef next fill:#dbeafe,stroke:#1d4ed8,color:#1e3a8a,stroke-width:2px;
    classDef later fill:#e5e7eb,stroke:#4b5563,color:#111827,stroke-width:2px;

    subgraph research["Research & Product"]
        direction LR
        r0["Done\nInstruction set and task domains"]:::done
        r1["Now\nPersona, interviews, competition"]:::now
        r2["Now\nCore value, use cases, pricing"]:::now
        r3["Later\nCoach validation and payment proof"]:::later
    end

    subgraph architecture["Framework & Architecture"]
        direction LR
        a1["Now\nProduct flow and tool types"]:::now
        a2["Now\nBlueprint schema and decision rules"]:::now
        a3["Next\nInternal APIs and stack choices"]:::next
    end

    subgraph coachux["Coach UX & Questionnaire"]
        direction LR
        u1["Now\nCoach flow and wireframes"]:::now
        u2["Now\nWizard questions and mapping logic"]:::now
        u3["Next\nPreview, advanced settings, wording tests"]:::next
    end

    subgraph platform["Backend, Frontend & AI"]
        direction LR
        p1["Next\nRepo setup, environments, DB, hosting"]:::next
        p2["Next\nFrontend app, dashboard, wizard, preview"]:::next
        p3["Next\nPDF upload, processing, Q&A API"]:::next
        p4["Later\nDeployment automation and whitelabeling"]:::later
    end

    subgraph trust["Security, Billing & Analytics"]
        direction LR
        s1["Next\nPermissions, auth, rate limiting, audit logs"]:::next
        s2["Later\nBilling plans, pricing page, subscription flows"]:::later
        s3["Later\nUsage dashboard, feedback, reporting"]:::later
    end

    subgraph launch["Pilot & Go-To-Market"]
        direction LR
        g1["Later\nPilot coach selection and guided onboarding"]:::later
        g2["Later\nQuestionnaire iteration and critical bug fixes"]:::later
        g3["Later\nLanding page, demos, outreach, newsletter"]:::later
    end

    r1 --> a1
    r2 --> a2
    a2 --> u2
    a3 --> p1
    u1 --> p2
    u2 --> p2
    p1 --> p3
    p2 --> s1
    p3 --> s1
    s1 --> g1
    p2 --> g1
    p3 --> g1
    g1 --> g2
    g2 --> g3
```

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
4. For the live public dashboard, open [docs/index.html](docs/index.html) or `https://paas.ciuculescu.com/`.