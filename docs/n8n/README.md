# Agent workflow in n8n

`resolv-agent-workflow.json` is an n8n workflow that orchestrates one agent task end to end. It maps one to one onto the stages shown on the console's Scheduler board, so the board and n8n describe the same pipeline.

**Status:** designed and checked for structure only (valid JSON, every connection points at an existing node). It has not been imported into a running n8n instance, so node parameters may need small adjustments for your n8n version (written against n8n 1.x node versions).

## Stage mapping

| Scheduler column | n8n node(s) | What happens |
| --- | --- | --- |
| Scheduled | Task intake, Validate request, Wait until scheduled time | Webhook receives `{ request, runAt? }`, rejects empty or oversized input, then the execution sleeps until `runAt`. |
| Intake and clarification | Open conversation | Creates the backend conversation (`POST /chat/conversations`). |
| Planner, Tool executor, Boundary guard | Planner, tools and guard (backend agent) | `POST /chat/conversations/:id/messages` runs the existing ReAct loop in `resolv-hq-backend`. Tool calls and the boundary check stay in the backend, so n8n does not duplicate or bypass them. |
| Human approval | Escalation drafted?, Record result: awaiting approval, Human approval gate | If the agent drafted an escalation ticket, the execution pauses on a Wait node with a resume URL until staff decide. |
| Done | Approved?, File escalation ticket / Discard escalation, Record result: answered | `PATCH /admin/approvals/:id/approve` or `/reject`, or the answer is recorded when no approval is needed. |

## Why the agent stays in the backend

The boundary matrix (`docs/ai-boundary-matrix.md`) says the model may only draft actions; a person approves anything that changes a customer record. n8n therefore owns scheduling, waiting and routing, while the planner, tools and guard remain one backend call. Splitting the planner into separate n8n AI Agent nodes would move tool permissions out of the audited code path.

## Setup

1. In n8n, Import from File and choose `resolv-agent-workflow.json`.
2. Set the environment variable `RESOLV_API_URL` for n8n (for example `https://your-backend/api`). Use the same base URL the console's `apiClient` calls.
3. Create a Header Auth credential (`Authorization: Bearer <token>`) for a staff account that may call `/chat` and `/admin/approvals`, and attach it to the four HTTP Request nodes. Keep this token in n8n credentials only.
4. Activate the workflow and call the production webhook URL:

```bash
curl -X POST "$N8N_URL/webhook/resolv-task" \
  -H "Content-Type: application/json" \
  -d '{"request":"What details should a refund request include?","runAt":"2026-10-17T09:00:00Z"}'
```

The webhook answers immediately (the execution continues in the background). The two `Record result` nodes shape the outcome; add a Slack, email or HTTP node after them to deliver it. The awaiting-approval record includes `resumeUrl`; staff approve with:

```bash
curl -X POST "<resumeUrl>" -H "Content-Type: application/json" -d '{"decision":"approve"}'
```

## Not connected yet

The console Scheduler still runs its own in-browser clock and calls the backend directly. Pointing it at this webhook (so schedules survive a page reload) needs the n8n URL exposed to the console and a way for n8n to report stage changes back, for example a status callback per node. That is the next step if you want n8n to be the real scheduler.
