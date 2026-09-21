# Week 3 Progress Report — Hillary (Project Lead)

**Workstream:** Observability, CI/CD & Testing Pipeline | **Period covered:** Week 3 | **Date:** 18 Sep 2026

Source: `docs/week-3-report.docx` (Week 3 Task Breakdown — RESOLV-HQ), Tasks 18–20.

> **Critical path note (from the report overview):** "The critical path for Week 3 is the same one flagged at the end of Week 2 — live model + retrieval wiring (Tasks 13-15, 17) — plus everything downstream of it that currently has nothing to test against (Tasks 18-20)." All three of this workstream's tasks fall in that "nothing to test against yet" category.

## Tasks

| # | Task | Status | Notes |
|---|---|---|---|
| 18 | **Centralized Audit Logging Pipeline** — Set up structured JSON log aggregators to capture agent intermediate reasoning, tool inputs/outputs, system timestamps, and session context. | 🟡 Partial | `admin_activity_logs` already captures structured JSON detail for two call sites — `approval_decided` (`lib/approval-decisions.ts`) and `request_assigned` (`routes/admin/approvals.ts`) — with admin id, action, target type/id, and timestamp. It is not yet a general-purpose pipeline: there's no logging of agent intermediate reasoning or tool inputs/outputs, since no live agent/tool-calling loop exists yet (depends on Tasks 14/15/17 landing first). |
| 19 | **GitHub Actions Integration Test Pipeline** — Configure automated CI workflows to validate Docker container builds, lint codebases, and run endpoint sanity checks on pull requests. | ❌ Not started | The only content under `.github/` across the three repos is an unrelated java-upgrade modernization scaffold — no workflow YAML exists for Docker build validation, linting, or endpoint sanity checks on PRs. |
| 20 | **End-to-End API Integration Test Suite** — Build automated Postman/Pytest integration suites to simulate full user request journeys through gateway, model, tool, and approval stages. | ❌ Not started | No test files (`*.test.ts`, `*.spec.ts`) or Postman collections exist in `resolv-hq`, `resolv-hq-backend`, or `resolv-hq-customer` today. This depends on Tasks 7, 14, 15, and 17 landing first so there's an actual end-to-end journey (gateway → model → tool → approval) to script against. |

## Summary

This workstream is the most blocked of the six: all three tasks depend on work landing elsewhere first (the live model/retrieval pipeline, the SSE streaming pipeline, and the post-approval dispatch engine) before there's a real journey to log, test, or validate in CI. The one piece already in place — structured activity logging for approval decisions and assignments — is a solid foundation to extend once the agent loop is live.

## Plan for next week

1. Track progress on Tasks 7, 13–15, and 17 closely — this workstream can't meaningfully start Tasks 19–20 until at least one real gateway → model → tool → approval journey exists.
2. Extend `admin_activity_logs` (or a purpose-built log table) to capture agent intermediate reasoning and tool inputs/outputs once the agent loop is live (Task 18).
3. Stand up a baseline GitHub Actions workflow now for what's already testable — Docker build validation and linting — rather than waiting on the full pipeline (Task 19).
4. Draft the E2E test suite's scenario list now against the target journey, so it's ready to implement the moment Task 17 lands (Task 20).
