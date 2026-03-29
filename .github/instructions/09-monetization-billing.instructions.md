---
description: "Use when planning or implementing payments, subscriptions, pricing tiers, billing limits, upgrade and downgrade flows, or pricing pages. Keywords: billing, monetization, Stripe, subscriptions, plans, pricing, limits, upgrade, downgrade."
name: "Monetization And Billing"
---
# Monetization And Billing

Use this instruction when working on monetization and billing.

## Core Focus

- Choose a payments provider that supports subscriptions and one-time payments.
- Define clear plans such as Free, Pro, and Business.
- Implement subscription lifecycle actions, including create, upgrade, downgrade, and cancel.
- Enforce per-plan limits for tools, AI requests, and storage.
- Provide a public pricing page with benefits and constraints.
- Make upgrade and downgrade flows understandable from the dashboard.

## Checklist

- [ ] Choose the payments provider.
- [ ] Define pricing plans and limits.
- [ ] Implement subscription management.
- [ ] Implement per-plan enforcement.
- [ ] Create the pricing page.
- [ ] Implement upgrade and downgrade UX.

## Output Expectations

- Keep plan boundaries legible and enforceable in code.
- Avoid hidden limits that surprise coaches after activation.
- Make billing state visible where it affects product behavior.