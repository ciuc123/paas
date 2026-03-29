---
description: "Use when defining the product framework, internal architecture, blueprint schema, automation decisions, internal APIs, stack choices, or end-to-end generation flow for the coaching platform. Keywords: blueprint, rules, architecture, stack, schema, automation, flow."
name: "Product Framework And Architecture"
---
# Product Framework And Architecture

Use this instruction when translating the product idea into an internal technical framework.

## Core Focus

- Preserve the main product flow: coach answers questions, the system generates a technical framework, then deploys a usable tool.
- Keep the first tool types narrow: PDF access, chatbot Q&A, and a simple client portal.
- Make automated decisions explicit for auth, storage, communication, deployment, and security.
- Define an internal blueprint structure in JSON or YAML that can describe each generated tool.
- Separate required parameters from optional parameters in the blueprint.
- Describe how a blueprint is translated into concrete software components and infrastructure.
- Select a realistic stack for frontend, backend, database, AI provider, and auth provider.

## Task Status

| Task | Status | Notes |
| --- | --- | --- |
| Define the end-to-end product flow from coach input to deployment. | not_started | The flow is described conceptually, but no formal product flow doc exists. |
| List the initial tool types the platform supports. | not_started | Candidate tool types are noted, but no locked list is tracked. |
| Document the automated decision areas and decision boundaries. | not_started | No decision matrix or architecture note exists yet. |
| Draft the internal blueprint schema. | not_started | No JSON or YAML blueprint schema has been added to the repo. |
| Mark mandatory and optional blueprint fields. | not_started | Depends on blueprint schema definition. |
| Sketch the internal API surface that consumes and produces blueprints. | not_started | No API design draft exists yet. |
| Choose the initial technical stack with reasons and constraints. | not_started | No final stack decision document is in the repo. |

## Output Expectations

- Prefer decision tables, schemas, and flow descriptions over vague prose.
- Keep the blueprint stable enough to support automation and iteration.
- If a choice is reversible, document the migration path or fallback.