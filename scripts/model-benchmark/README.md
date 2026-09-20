# Foundation Model Benchmark - Customer Support Triage

Benchmarks small/fast-tier models on the triage task RESOLV-HQ's `/admin` escalation queue needs: read a customer
ticket, classify it, decide priority, and decide whether it needs to be escalated to a human (mirroring the
guardrail boundary already defined in `/guardrails`). Measures latency, reasoning accuracy, and token cost.

## Model substitutions

The original request was GPT-4o mini, Claude 3.5 Haiku, and Gemini 1.5 Flash. As of 2026-09-17, two of those are
retired and can't be called via API:

| Requested | Status | Used instead |
|---|---|---|
| GPT-4o mini | Active | GPT-4o mini (`gpt-4o-mini`) |
| Claude 3.5 Haiku | Retired 2026-02-19 | Claude Haiku 4.5 (`claude-haiku-4-5`) |
| Gemini 1.5 Flash | Retired (API returns 404) | Gemini 3.8 Flash (`gemini-3.8-flash`) |

See `src/models.ts` for exact model IDs and pricing, and `results/*-report.md` for a per-run note on this.

## Setup

```bash
cd scripts/model-benchmark
npm install
cp .env.example .env   # fill in the keys for the providers you want to test
```

You don't need all three keys - see "Running a subset" below.

## Running

```bash
npm run bench                 # all 3 models, all 12 cases
npm run bench:dry-run         # validates the harness with synthetic data, no API calls, no keys needed
```

### Running a subset

```bash
tsx src/run.ts --model=claude       # keys: openai | claude | gemini
tsx src/run.ts --limit=4            # first 4 cases only, useful for a quick/cheap smoke test
```

Each run writes a timestamped `results/<stamp>.json` (raw data) and `results/<stamp>-report.md` (human-readable
report with per-case detail) - both gitignored since they contain live-run numbers, not the harness itself.

## Methodology

- **Dataset** (`src/dataset.ts`): 12 tickets covering the same categories as RESOLV-HQ's own prompt evaluation
  (`docs/evaluation-table.md`) - normal, edge/ambiguous, incorrect-info, adversarial (prompt injection + system
  prompt extraction), unauthorized-action, and a safety incident.
- **Task**: each model gets the same system prompt (`TRIAGE_SYSTEM_PROMPT` in `src/dataset.ts`) and one ticket per
  call, and must return a JSON object: `category`, `priority`, `escalate`, `summary`.
- **Latency**: wall-clock time for the single API call, timed client-side. Includes network round-trip, not pure
  inference time.
- **Reasoning accuracy**: 0-1 per case. `category` match is worth 0.4, `priority` 0.3, `escalate` 0.3. Four cases
  also run a behavioral check worth half the score alongside field-matching - e.g. whether the model complied with
  an instruction injected into the ticket body, or repeated an unverified policy claim as fact instead of declining
  to confirm it. See `src/grade.ts`.
- **Cost**: `(input tokens / 1e6) * input price + (output tokens / 1e6) * output price`, using each provider's
  reported token usage for that call and the pricing snapshot in `src/models.ts`.

## Caveats

- 12 cases per model is enough to catch gross behavioral differences, not enough for a statistically tight accuracy
  number - treat it as directional, and increase the dataset before using this to justify a production model choice.
- Model outputs aren't deterministic; run multiple trials (`npm run bench` a few times) before drawing conclusions,
  especially for the accuracy dimension.
- Pricing is a snapshot from 2026-09-17. Gemini's rate is an introductory price that expires 2026-12-31 (doubles
  after) - re-check before relying on a Gemini cost number after that date.
- This benchmarks *this task* (short-ticket triage classification), not general reasoning capability - don't
  extrapolate the accuracy numbers to other workloads.
