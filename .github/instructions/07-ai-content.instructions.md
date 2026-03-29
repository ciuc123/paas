---
description: "Use when planning or implementing AI integrations, PDF upload, PDF processing, embeddings, vector storage, Q&A APIs, prompt templates, coach-specific prompts, or basic guardrails. Keywords: AI provider, LLM, PDF, embeddings, vector DB, Q&A, prompts, guardrails."
name: "AI And Content Handling"
---
# AI And Content Handling

Use this instruction when building the content ingestion and AI features.

## Core Focus

- Choose the AI provider and models deliberately for Q&A and reasoning tasks.
- Support PDF upload in both frontend and backend.
- Process PDFs with text extraction, chunking, embeddings, and vector storage.
- Expose a Q&A API over uploaded content.
- Create prompt templates that work across generic coaching tools.
- Create prompt variants for specific coach types, such as life, business, and fitness.
- Implement basic guardrails, including inappropriate language filtering and visible disclaimers.

## Task Status

| Task | Status | Notes |
| --- | --- | --- |
| Choose the AI provider and baseline models. | not_started | No AI provider decision is committed yet. |
| Implement PDF upload flows. | not_started | No upload UI or backend flow exists yet. |
| Implement PDF processing and vector storage. | not_started | No extraction, chunking, or vector storage code exists yet. |
| Implement the Q&A API over content. | not_started | No Q&A endpoint exists yet. |
| Create generic prompt templates. | not_started | No prompt template library exists yet. |
| Create coach-type-specific prompt templates. | not_started | No coach-specific prompt variants exist yet. |
| Implement basic guardrails and disclaimers. | not_started | No safety or disclaimer layer exists yet. |

## Output Expectations

- Keep the retrieval pipeline inspectable and debuggable.
- Separate prompt design from transport and storage concerns.
- Prefer simple safety measures that are clear to users over hidden magic.