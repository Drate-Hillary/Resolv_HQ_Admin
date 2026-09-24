# Week 1 — Problem Framing and AI-Native Requirements

**Brief dates:** 31 Aug – 4 Sept 2026 | **Status today (24 Sept):** running 3+ weeks behind on paperwork — must be backfilled this week, in parallel with Week 4 work.

## What the brief asks for

- A single approved use case and one primary end-to-end workflow.
- Project Charter (2–3 pages): problem, user, pain point, AI value, scope, assumptions, constraints.
- 8–12 testable user stories / acceptance criteria.
- AI Boundary Matrix: what AI may do, what stays deterministic, what needs human approval.
- Initial architecture/context diagram.
- GitHub + ClickUp setup evidence.
- Week 1 progress report (1–2 pages).

## Where things actually stand

| Deliverable | Status | Evidence / gap |
|---|---|---|
| Single use case defined | ❌ | Never formally decided — the console (`resolv-hq/README.md`) says procurement; the backend/customer app build a support-ticket triage agent. See [`../roadmap/README.md`](./README.md) for the resolution. |
| Project Charter | ❌ | No charter document found in any of the three repos. |
| User stories / AC | ❌ | None found in-repo. |
| AI Boundary Matrix | ⚠️ | `docs/ai-boundary-matrix.md` exists, but it's written as a 22 Sept *implementation* report for a later task, not a Week 1 planning artifact — and it doesn't name the chosen use case. |
| Architecture diagram | ❌ | No diagram (image or Mermaid) found anywhere in the workspace. |
| GitHub setup | ✅ | All three repos exist with real commit history; `resolv-hq-backend` has 10+ commits across named feature/fix branches. |
| ClickUp setup | ❓ | Can't verify from the repo — confirm a board exists and link it from the charter. |
| Week 1 report | ❌ | Not found — earliest report on file is `docs/week-2-progress-report.md`. |

## Action plan (do this week, alongside Week 4)

1. **Formally record the use-case decision.** One paragraph, filed at the top of the charter: *"Resolv HQ Support Agent — a bounded customer/staff support-request triage agent (adapted from the brief's Utility/service help-desk triage template). AI answers from an approved knowledge base, looks up the caller's own account/request status, and drafts an escalation ticket. It never itself issues a refund, changes billing, cancels a service, or edits an account — those always stop for a human."* This single paragraph resolves the domain conflict everything else in this roadmap depends on.
2. **Write the Project Charter (2–3 pages)** using the brief's minimum proposal statement as a skeleton: target user (Resolv HQ customers + support staff), current pain point (slow first-line support, inconsistent answers), AI value (retrieval-grounded answers + tool-assisted triage), what stays deterministic (approval gate, RLS-scoped data access), what's out of bounds (refunds/billing/cancellations/account edits — already well specified in `docs/ai-boundary-matrix.md` and `resolv-hq-backend/docs/system-prompt-spec.md`, just needs to be pulled forward into the charter).
3. **Write 8–12 user stories** — there's already enough *implemented* behaviour to derive these retroactively rather than invent them from scratch, e.g.:
   - "As a customer, I want to ask the assistant about my open request's status so I don't have to wait for a reply." (backed by `check_request_status` / `outage_status_checker`)
   - "As a customer, I want the assistant to answer from official help articles and say when it doesn't know, rather than guess." (backed by `search_knowledge_base`, clarification gate)
   - "As an admin, I want any AI-proposed escalation to sit in a queue I approve or reject before anything changes." (backed by `routes/admin/approvals.ts`, `agent_approvals`)
   - "As a customer, I want the assistant to never claim it processed a refund or account change it didn't actually make." (backed by the two-layer boundary matrix)
4. **Re-title/reframe `ai-boundary-matrix.md`'s core table** (may-do / stays-deterministic / needs-approval) as the Week 1 planning artifact, or add a short planning-style table at its top that the later implementation report hangs off.
5. **Draw one architecture diagram** (a Mermaid diagram in a `.md` file is fine) showing: customer app → backend API → knowledge base / requests / agent tools → LLM gateway → approval queue → admin console. Reuse and extend this same diagram in Weeks 3, 4, and 5 rather than drawing a new one each time.
6. **Confirm/create the ClickUp board**, backfill Weeks 1–4 tasks onto it now so the evidence trail lines up with actual work, and link it from the charter and every weekly report going forward.
7. **Write the Week 1 progress report** using the brief's §8 template — note plainly that it was compiled retrospectively in Week 4 for evidence purposes, with the real completion date, rather than backdating it silently.

## Deliverables checklist

- [ ] Use-case decision recorded in writing
- [ ] Project Charter (2–3 pages)
- [ ] 8–12 user stories + acceptance criteria
- [ ] AI Boundary Matrix (planning version, names the use case)
- [ ] Architecture/context diagram
- [ ] ClickUp board confirmed and linked
- [ ] Week 1 progress report
