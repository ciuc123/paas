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

## Checklist

- [ ] Define the end-to-end product flow from coach input to deployment.
- [ ] List the initial tool types the platform supports.
- [ ] Document the automated decision areas and decision boundaries.
- [ ] Draft the internal blueprint schema.
- [ ] Mark mandatory and optional blueprint fields.
- [ ] Sketch the internal API surface that consumes and produces blueprints.
- [ ] Choose the initial technical stack with reasons and constraints.

## Output Expectations

- Prefer decision tables, schemas, and flow descriptions over vague prose.
- Keep the blueprint stable enough to support automation and iteration.
- If a choice is reversible, document the migration path or fallback.