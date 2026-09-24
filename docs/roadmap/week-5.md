# Week 5 — Agent Architecture and Bounded Autonomy

**Brief dates:** 28 Sept – 2 Oct 2026 | **Status today (24 Sept):** the hard part is already built, a week early — this week is mostly formalizing and evidencing it.

## What the brief asks for

- One task that genuinely benefits from multi-step decision-making.
- Sense/Context → Plan/Decide → Act/Tool → Observe → Stop/Re-plan design.
- Max iterations, approved tools, stop conditions, human hand-off/approval conditions.
- Implemented workflow (direct orchestration or a framework).
- At least 3 execution traces, including one failure/recovery case.

## Where things actually stand

| Deliverable | Status | Evidence / gap |
|---|---|---|
| Multi-step agent loop | ✅ | `resolv-hq-backend/src/lib/react-agent.ts`'s `runReActLoop()` already implements Sense → Plan → Act → Observe → Respond, called from `generateAssistantReply()`. Built and committed 22 Sept — a week ahead of this slot. |
| Iteration cap / safe stop | ✅ | `MAX_ITERATIONS = 4`; hitting it returns a safe "wasn't able to work through this fully" message instead of looping forever. |
| Approved tool set | ✅ | The four tools from Week 4, all read-only. |
| Human hand-off / approval | ✅ | Anything the loop drafts (an escalation) routes to `agent_approvals` rather than executing. |
| Agent Task Contract (named artifact) | ❌ | The goal/tools/state/limits/stop-conditions are all described informally across `docs/react-loop-core.md` and `docs/ai-boundary-matrix.md` — no single doc states them as a formal contract the way the brief names it. |
| Agent Architecture Diagram | ❌ | Extend the running diagram from Weeks 1/3/4 rather than starting fresh. |
| 3 execution traces incl. one failure/recovery | ⚠️ | `docs/evaluation-table.md` has scenario-level results (e.g. case 8: tool timeout → retry → recovery) but these are traces of the **scripted mock pipeline**, not the real ReAct loop running against a live model. Once Week 2's live-model gap is closed, these need to be re-captured as real traces. |

## Action plan

1. **Write the Agent Task Contract**: goal ("resolve or route a support query without ever executing a state-changing action itself"), the four approved tools, the state it operates on (conversation + caller's own requests/account), `MAX_ITERATIONS = 4`, and the stop/hand-off conditions (iteration cap hit, boundary-matrix violation detected, low-confidence/ungrounded answer). Most of this content already exists in `react-loop-core.md` and `ai-boundary-matrix.md` — this is consolidation, not new design work.
2. **Extend the architecture diagram** with the loop's five phases and where the approval hand-off sits.
3. **Once the Week 2 live-model key is registered**, run three real conversations end-to-end and save the full traces (messages, tool calls, iteration count) under an `evidence/traces/` folder (per the brief's recommended repo structure):
   - One normal success (answer grounded + cited, no escalation needed).
   - One tool-failure-then-recovery (e.g., a simulated knowledge-base timeout, retried, succeeded).
   - One that hits `MAX_ITERATIONS` and stops safely, or one that trips the boundary-matrix detector and is caught.
4. Confirm the loop's behavior is identical whether the caller is a customer or staff (per `system-prompt-spec.md` §5) and note this explicitly in the contract.
5. Write the Week 5 progress report — this is a good week to highlight "built ahead of schedule" honestly, since it's true and worth the credit.

## Deliverables checklist

- [ ] Agent Task Contract (goal, tools, state, limits, stop conditions)
- [ ] Architecture diagram extended with the agent loop
- [ ] 3 real execution traces (incl. one failure/recovery), captured against a live model
- [ ] Week 5 progress report
