# Architecture Diagrams — Week 4 and Week 5

**Project:** RESOLV-HQ | **Dates:** Week 4 (21–25 Sep 2026), Week 5 (28 Sep – 2 Oct 2026)
Both diagrams are Mermaid, so they render on GitHub and in most Markdown viewers. They are the standalone copies of what lives in [`architecture-diagram.md`](./architecture-diagram.md).

---

## Week 4 — System architecture with the tool-calling layer

**Focus:** Tools and Function Calling. The headline addition is the `Agent Tools` box and the Act/Observe edges around it: four tools (`search_knowledge_base`, `account_status_lookup`, `outage_status_checker`, `draft_escalation_ticket`) called from the ReAct loop. See [`tool-catalogue.md`](./tool-catalogue.md).

```mermaid
flowchart TB
    subgraph Client["Client surfaces"]
        Console["resolv-hq (React console)\n/chat · /admin · /agent · /dashboard"]
        Mobile["resolv-hq-customer (Expo app)"]
    end

    subgraph Backend["resolv-hq-backend (Express API)"]
        API["POST /chat/conversations/:id/messages"]
        Loaders["Per-caller context loaders\nloadAccountInput(), requests, knowledge_documents\n— scoped to req.user.id, never client-supplied"]
        Gateway["LLM Gateway — completeWithFallback()\nretry w/ backoff + Redis cache (10 min TTL)"]
        ReAct["ReAct Loop — runReActLoop()\nSense -> Plan -> Act -> Observe -> Respond\nMAX_ITERATIONS = 4"]
        Tools["Agent Tools — agent-tools.ts\nsearch_knowledge_base\naccount_status_lookup\noutage_status_checker\ndraft_escalation_ticket"]
        Boundary["Boundary Matrix\nLayer 1: system-prompt rule\nLayer 2: detectBoundaryViolation()"]
        Approvals["Approval Queue\nagent_approvals + decideApproval()"]
        Memory["customer_memory_facts\n(not yet read by the agent — Week 6)"]
    end

    subgraph Data["Supabase / Postgres"]
        KB[("knowledge_documents")]
        Req[("requests")]
        Acc[("profiles / customer_profiles")]
        Appr[("agent_approvals")]
    end

    subgraph Model["Foundation model"]
        LLM["Anthropic / Google / OpenAI providers\nchosen from agent_providers table"]
    end

    Console --> API
    Mobile --> API
    API --> Loaders
    Loaders --> KB
    Loaders --> Req
    Loaders --> Acc
    Loaders --> ReAct
    ReAct -->|"Plan"| Gateway
    Gateway --> LLM
    LLM -->|"tool call requested"| ReAct
    ReAct -->|"Act: execute tool"| Tools
    Tools -->|"reads only its own caller's data"| Loaders
    Tools -->|"tool result (Observe)"| ReAct
    ReAct -->|"final answer"| Boundary
    Boundary -->|"clean response"| API
    Boundary -.->|"violation caught -> safe fallback"| API
    ReAct -->|"drafted escalation ticket"| Approvals
    Approvals --> Appr
    Approvals -->|"staff approve / reject"| Console
    Loaders -.->|"planned, Week 6"| Memory
    API --> Console
    API --> Mobile
```

**How to read it**
- Solid arrows are built and working; dashed arrows are a violation-only safety path or a planned item.
- `Loaders` is the single authorization boundary: every tool and prompt context comes from data already scoped to `req.user.id`, and no tool takes a customer selector argument.
- Evidence: [`tool-failure-auth-test-evidence.md`](./tool-failure-auth-test-evidence.md).

---

## Week 5 — The bounded agent loop in detail

**Focus:** Agent Architecture and Bounded Autonomy. The `ReAct` node above is expanded into its five phases, the `MAX_ITERATIONS = 4` stop condition, every exit path, and the human hand-off. See [`agent-task-contract.md`](./agent-task-contract.md).

```mermaid
flowchart TB
    Q["Caller message"] --> Clar{"Clarification gate\n(deterministic, pre-loop)"}
    Clar -->|"vague"| ClarQ["One clarifying question\n(loop never entered)"]
    Clar -->|"clear"| Sense

    subgraph Loop["runReActLoop() — MAX_ITERATIONS = 4"]
        direction TB
        Sense["SENSE\nprompt v1.1 + query + caller-scoped context\n(knowledge, own requests, own account)"]
        Plan["PLAN\nmodel decides via native tool-calling:\nanswer now, or call an approved tool"]
        Act["ACT\nexecuteAgentTool() — closed set of 4 tools"]
        Observe["OBSERVE\ntool result appended as a tool message"]
        Cap{"iteration < 4 ?"}
        Respond["RESPOND\nplain-content final answer"]
        Sense --> Plan
        Plan -->|"tool call requested"| Act
        Act --> Observe
        Observe --> Cap
        Cap -->|"yes: re-plan"| Plan
        Plan -->|"no tool call"| Respond
    end

    Act -.->|"bad / unknown args: error returned to model"| Observe
    Act -->|"draft_escalation_ticket"| Approve["HUMAN HAND-OFF\nagent_approvals queue\nstaff approve / reject"]
    Cap -->|"no: cap hit"| SafeStop["STOP: safe message\n'wasn't able to work through this fully'\n+ offer a support request"]
    Plan -.->|"all providers fail"| KW["STOP: keyword fallback\nanswerQuestion() + fallbackReason"]
    Respond --> BM{"Boundary matrix\ndetectBoundaryViolation()"}
    BM -->|"clean"| Out["Answer + sources to caller"]
    BM -->|"violation"| BFall["STOP: discard text,\nsafe fallback + warning log"]
```

**How to read it**
- **Exit paths (the only five):** normal answer, clarification question, iteration cap, boundary-violation fallback, gateway-unavailable keyword fallback.
- The agent never files anything: a drafted escalation goes to the approval queue and only staff can approve it.
- Customers and staff take identical paths.

**What changed from Week 4 to Week 5**

| Aspect | Week 4 | Week 5 |
|---|---|---|
| Level of detail | Whole system, loop as one node | Loop opened into phases and exits |
| Stop conditions | `MAX_ITERATIONS = 4` noted in the node label | Cap, boundary, gateway and clarification exits drawn explicitly |
| Human hand-off | Approval queue shown as a side branch | Shown as the outcome of the `draft_escalation_ticket` Act step |
| Pre-loop gate | Not shown | Clarification gate added |

**Build status:** every box is implemented. Not yet backed by a live-model trace: the iteration-cap and boundary exits, and live Act/Observe ([`../evidence/traces/week-5-execution-traces.md`](../evidence/traces/week-5-execution-traces.md)).
