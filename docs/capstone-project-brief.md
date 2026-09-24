# BSE4104 — Emerging Trends in Software Engineering
## 8-Week AI-Native & Agentic Engineering Capstone Project Brief

**Makerere University — College of Computing and Information Sciences — School of Computing and Informatics Technology — Department of Networks**

| | |
|---|---|
| **Level** | Year IV \| BSc Software Engineering \| Semester I |
| **Course Convener** | Dr Kamulegeya Grace B (PhD) |
| **Project Mode** | Group project with individual accountability |
| **Recommended Group Size** | 4–5 students |
| **Duration** | 8 weeks |
| **Primary Evidence** | GitHub + ClickUp + MUELE |
| **Start / Due Date** | 31 August 2026 – 23 October 2026 |
| **Presentation Dates** | 27, 29, 30 October 2026 |
| **Academic Year** | 2026/2027 |

> Student learning model — **Learn → Build → Demonstrate → Evaluate → Improve**. The objective is not maximum autonomy; it is professional engineering of a useful, bounded and explainable AI-native system.

---

## 1. Purpose and Learning Outcomes

This capstone converts the AI-native and agentic engineering lecture series into one progressive eight-week project. Teams will engineer a small but credible AI-native application that moves from a foundation-model baseline through context/RAG, tools, bounded agency, state/memory, evaluation and hardening. The project is aligned to BSE4104, which expects students to understand current software innovations and demonstrate practical skill in applying current software solutions to software engineering tasks.

By the end of the project, students should be able to:

- Justify where AI adds value and where deterministic software or human decision-making should remain in control.
- Integrate and evaluate a foundation model using versioned prompts and explicit acceptance criteria.
- Ground model behaviour using trusted context and retrieval rather than relying only on model memory.
- Use tools/functions through explicit contracts and permissions.
- Implement a bounded agent workflow that can decide among approved actions, observe results and stop safely.
- Manage workflow state and justified memory, and understand agent/tool interoperability.
- Evaluate reliability, failures, security, observability and guardrails using evidence.
- Demonstrate ownership of AI-generated code and artefacts through review, testing, documentation and explanation.

## 2. Project Scope and Proposal Approval Rules

Each group will propose one problem and progressively extend the same application throughout the eight weeks. The project should be deliberately small enough to finish, test and explain within the semester.

> **Proposal rule** — A chat interface may be part of the product, but the proposal must not be only "a chatbot." The final system must perform at least one traceable multi-step workflow using approved data/tools and must demonstrate engineering beyond text generation.

| A proposal should… | A proposal should NOT… |
|---|---|
| Solve one clearly bounded problem for a defined user. | Be a generic "assistant for everything" or an entire national/enterprise platform. |
| Use public, team-created, synthetic or otherwise authorized data that the team can obtain in Week 1. | Depend on confidential institutional databases, proprietary APIs, large datasets or approvals that students do not already have. |
| Include at least two explicit tools/functions by Week 4. | Simply wrap ChatGPT/Claude/Gemini in a new UI. |
| Contain one bounded agentic workflow with limits and stop conditions. | Use autonomy merely for novelty, or allow open-ended browsing/execution. |
| Keep high-impact actions behind human approval. | Make financial, disciplinary, admissions, legal, safety-critical, medical or destructive decisions autonomously. |
| Be testable using a small controlled corpus and scenario set. | Require training a foundation model from scratch or building an unrealistic amount of infrastructure. |

**Minimum proposal statement (Week 1):** "Our system helps [specific user] complete [specific task]. AI is used for [reasoning/generation/retrieval/planning]. Deterministic software remains responsible for [rules/validation/authorization]. The agent may use [approved tools] but may not [prohibited actions]. We will build and evaluate the system using [available data/corpus]."

## 3. Recommended Uganda-Relevant Agentic Use Cases

Teams must select only **one** of the following and may adapt it or propose alternatives of similar complexity. Use public, synthetic or team-created data unless explicit authorization has already been obtained.

| Use case | Agentic workflow | Feasible data | Safety boundary |
|---|---|---|---|
| University student-support case agent | Uses approved university/course documents to answer grounded questions, checks a sample timetable or case status, creates/routes a support ticket, and remembers the active case. | Public course/handbook documents + synthetic student/case data. | No admissions, grading, disciplinary or fee decisions. |
| SME procurement-preparation agent | Reads sample inventory, checks reorder need, compares supplied quotations, drafts a purchase requisition and routes it for human approval. | Synthetic inventory and supplier quotation CSV/JSON. | No real purchasing, payment, supplier award or autonomous financial commitment. |
| Manufacturing maintenance-triage agent | Grounds troubleshooting in machine manuals, queries mock maintenance history, proposes checks and creates a maintenance ticket. | Equipment manuals + synthetic asset/history records. | No direct machine control, shutdown or safety-critical actuation. |
| Agricultural extension visit-preparation agent | Uses curated agronomy guidance and a sample farm profile to prepare a field-visit checklist, retrieve relevant advice and schedule/log follow-up. | Public extension/agronomy materials + synthetic farm profiles; optional public weather API. | No pesticide dosing, veterinary/medical diagnosis or autonomous farm-control decisions. |
| NGO/local-government field-report follow-up agent | Reads sample field reports, classifies issues, extracts actions, assigns a simulated follow-up task and tracks status. | Synthetic/anonymized reports and task records. | No benefit eligibility, enforcement, policing or rights-affecting decisions. |
| Public procurement document-completeness agent | Checks a sample tender submission against a published checklist, locates required clauses and produces a missing-item report. | Public procurement templates/checklists + synthetic submissions. | No bid scoring, ranking, legal conclusion or contract-award recommendation. |
| Utility/service help-desk triage agent | Uses a knowledge base to troubleshoot service requests, queries a mock outage/status tool and creates/routes a ticket. | Public help content + synthetic service incidents. | No remote control of infrastructure or automatic service disconnection/reconnection. |
| SACCO member-case preparation agent | Uses policy documents and synthetic member records to explain procedures, compute illustrative schedules and prepare a case for staff review. | Public/team-created policy + synthetic member data. | No credit scoring, loan approval, disbursement, account changes or real financial transactions. |
| Software-engineering QA agent | Reads requirements/repository documentation, proposes tests, runs approved tests in a sandbox, summarizes failures and drafts an issue or pull-request note. | Team-owned codebase, requirements and test logs. | No automatic merge, production deployment, secret access or arbitrary shell commands without approval. |

**Recommended first-time scope** — One main user workflow, one small document corpus (about 10–50 documents or equivalent records), two to four tools, one bounded agent loop, one persistent-memory use case, and a 30-scenario final evaluation are sufficient.

## 4. Minimum Engineering Scope by Week 8

| Capability | Minimum evidence |
|---|---|
| Foundation model | One model integrated through the application; rationale documented. |
| Prompt engineering | Important prompts stored/versioned; prompt specification and tests. |
| Context/RAG | Controlled corpus, retrieval, source grounding and unsupported-answer handling. |
| Tools/function calling | At least two explicit tools; one may retrieve current application data or create a low-risk simulated side effect. |
| Bounded agent | One goal-directed multi-step loop with approved tools, iteration/stop limits and human hand-off. |
| State and memory | Workflow/session state plus one justified persistent-memory mechanism. |
| Interoperability | One external integration or a clear MCP-style tool/interface design. |
| Evaluation | At least 30 final scenarios including normal, edge, failure and adversarial cases. |
| Observability/guardrails | Useful logs/traces, validation, permissions, tool allow-list, limits and approval controls. |
| Software engineering | Git history, tasks/issues, tests, documentation, secure configuration and reproducible run/deployment. |

## 5. Team Organisation, Task Management and Repository

Groups should contain 4–5 students. Roles may rotate. Every member must own identifiable tasks per week and must understand the whole system well enough to explain major decisions and failures.

- Project/Requirements Lead
- Application/Integration Lead
- AI Engineering Lead
- Quality/Security Lead
- DevOps/Documentation Lead (for five-person groups)

**Task management:** ClickUp throughout the project — weekly tasks, owners, deadlines, and links from tasks to repository evidence.

**Recommended GitHub structure**

```
README.md
docs/
  requirements/
  architecture/
  weekly-reports/
  evaluation/
prompts/
knowledge/              # metadata/provenance; do not commit restricted data
src/
tests/
evidence/
  traces/
  screenshots/
  demo/
.env.example             # never commit real secrets
```

## 6. AI Use and Professional Integrity

> **Core rule** — AI-generated work is permitted and expected. Unexplained work is not. Students remain accountable for correctness, security, requirements, architecture, testing, documentation and final system behaviour.

- Declare the AI tools/models used for design, coding, testing, documentation and evaluation.
- Keep a concise AI Engineering Log for material AI-assisted decisions or generated artefacts.
- Review, test and refactor generated code before accepting it into the main branch.
- Version important prompts and retain evidence of meaningful changes.
- Do not send confidential, personal or restricted data to external AI services without authorization.
- Do not permit destructive or high-impact actions without explicit human approval controls.
- Verify all AI-suggested references and technical claims before using them.
- Every student in each group must be able to explain the work they submit.

## 7. Eight-Week Project Timeline

### Week 1 (31 Aug – 4 Sept 2026): Problem Framing and AI-Native Requirements
**Focus:** Choose a feasible problem, define users and success criteria, justify AI use, set agent boundaries.

- Select one approved/feasible use case and define a single primary end-to-end workflow.
- Write a 2–3 page Project Charter: problem, user, current pain point, AI value, scope, assumptions and constraints.
- Create 8–12 testable user stories/acceptance criteria.
- Create an AI Boundary Matrix (what AI may do, what stays deterministic, what needs human approval).
- Create the GitHub repository and ClickUp project; assign Week 1 tasks.

**Deliverables:** Project Charter (2–3 pages); user stories and acceptance criteria; AI Boundary Matrix; initial architecture/context diagram; GitHub + ClickUp setup evidence; Week 1 progress report (1–2 pages).

### Week 2 (7 – 11 Sept 2026): Foundation-Model Engineering and Prompting
**Focus:** Build the smallest useful model-backed capability and establish a tested baseline before adding RAG or agents.

- Choose an accessible model; document capability, cost, latency, privacy and access considerations.
- Integrate the model into the application.
- Create Prompt Specification v1.0 (role, task, context, constraints, output format, failure behaviour).
- Create at least 10 test cases and record expected vs actual behaviour.
- Version at least two meaningful prompt iterations.

**Deliverables:** Working baseline model interaction; Model Selection Note (≤1 page); Prompt Specification + prompt version history; 10-case prompt evaluation table; Week 2 progress report.

### Week 3 (14 – 18 Sept 2026): Context Engineering and RAG
**Focus:** Answer from a controlled, traceable knowledge source instead of relying only on model memory.

- Assemble a controlled corpus (recommended 10–50 documents/records) and record provenance.
- Implement ingestion, chunking/segmentation, indexing and retrieval.
- Construct model context from retrieved evidence; show sources in the response or trace.
- Create at least 15 RAG test questions (answerable, partially answerable, deliberately unanswerable).
- Document at least three retrieval/grounding failures and their causes.

**Deliverables:** Corpus/Source Register; RAG architecture diagram; working RAG pipeline with source grounding; 15-case RAG evaluation results; Week 3 progress report.

### Week 4 (21 – 25 Sept 2026): Tools and Function Calling
**Focus:** Move beyond answer generation by letting the model use explicit, safe software capabilities.

- Define at least two tools/functions (purpose, input schema, output schema, authorization, failure behaviour).
- Implement tool/function calling through the application/orchestration layer.
- At least one tool should retrieve current application data or perform a low-risk simulated side effect (e.g., create a ticket/draft record).
- Test missing parameters, unauthorized requests, unavailable services and unexpected tool responses.
- Add human approval before any higher-impact action.

**Deliverables:** Tool Catalogue and tool/API schemas; working demonstration of at least two tools; failure/authorization test evidence; updated architecture diagram; Week 4 progress report.

### Week 5 (28 Sept – 2 Oct 2026): Agent Architecture and Bounded Autonomy
**Focus:** Implement one goal-directed, multi-step workflow in which the system chooses among approved next actions and stops safely.

- Define one task that genuinely benefits from multi-step decision making.
- Design Sense/Context → Plan/Decide → Act/Tool → Observe → Stop/Re-plan.
- Set maximum iterations, approved tools, stop conditions and human hand-off/approval conditions.
- Implement the workflow using direct orchestration or a framework.
- Capture at least three execution traces, including one failure/recovery case.

**Deliverables:** Agent Architecture Diagram; Agent Task Contract (goal, tools, state, limits, stop conditions); working bounded agent workflow; three execution traces; Week 5 progress report.

### Week 6 (5 – 9 Oct 2026): Memory, State and Interoperability
**Focus:** Make the workflow state explicit, retain only justified memory, and connect capabilities through clear interfaces.

- Model workflow/session state explicitly.
- Implement one justified persistent-memory use case (e.g., approved preference, case history, prior task result).
- Document what is stored, why, who can access it, retention and deletion.
- Demonstrate that memory improves a legitimate task without silently controlling critical decisions.
- Implement one external integration OR document one project capability as an MCP-style interface (capability, inputs, outputs, permissions, security boundary).

**Deliverables:** State model; Memory Design and Data Handling Note; working memory/state demonstration; integration or MCP-style interface specification; Week 6 progress report.

> Reading note on MCP — the shared course books do not substantively cover MCP; MCP-specific material comes from personal reading elsewhere.

### Week 7 (12 – 16 Oct 2026): Evaluation, Observability and Guardrails
**Focus:** Produce evidence that the system is sufficiently reliable, grounded, inspectable and safe for its bounded use case.

- Create a final evaluation set of at least 30 scenarios: normal, edge, incorrect-information, adversarial, tool-failure and unauthorized-action cases.
- Define measurable criteria (task completion, groundedness, tool selection, instruction following, latency, safety violations).
- Add logs/traces capturing model, prompt, retrieval, tool, latency/error and outcome evidence.
- Implement input/output validation, tool allow-list, authorization, agent iteration limits, approval controls and prompt-injection awareness.
- Create a Failure Catalogue with at least five genuine failures and re-test after fixes.

**Deliverables:** 30+ scenario evaluation dataset and results; observability/tracing evidence; guardrail implementation evidence; Failure Catalogue with remediation and re-test evidence; Week 7 progress report (≤2 pages).

### Week 8 (19 – 23 Oct 2026): Hardening, Final Release and Demonstration
**Focus:** Consolidate the product into a reproducible release and demonstrate value, evidence, limitations and professional ownership.

- Review requirements, architecture, model/prompt behaviour, RAG, tools, agent limits, memory, tests, security and documentation.
- Fix critical defects; document known limitations that remain.
- Prepare a deployed or reproducibly runnable tagged release.
- Complete the 8–12 page final engineering report and evidence appendices.
- Prepare the final live presentation/demonstration.

**Deliverables:** Final tagged release and README/run instructions; final engineering report (8–12 pages, excluding appendices); final evaluation/evidence pack; presentation deck and live demonstration; completed ClickUp board and final repository evidence.

## 8. Weekly Progress Report (1–2 pages)

The group leader submits one short weekly report with repository and ClickUp evidence, covering:

- Group and project name and week ending.
- Work completed against the weekly objectives.
- Key engineering decisions and why they were made.
- Failures/challenges and current response.
- Links to relevant GitHub commit/tag/PR and ClickUp board/tasks.
- Individual contribution summary: member, task owned, evidence.
- Plan for the next week.

## 9. Final Engineering Report Template (8–12 pages, excluding appendices)

| Section | Expected content |
|---|---|
| 1. Executive Summary (~0.5p) | Problem, target user, AI-native solution, major result, principal limitation. |
| 2. Problem Context and Requirements (0.75–1p) | Workflow, requirements, acceptance criteria, AI Boundary Matrix, success measures. |
| 3. System Architecture (~1p) | Application architecture; deterministic components; model, RAG, tools, agent, state/memory, external-service boundaries. |
| 4. Foundation Model and Prompt Engineering (0.75–1p) | Model rationale, prompt architecture/versioning, key iterations, baseline evaluation. |
| 5. Context Engineering and RAG (0.75–1p) | Corpus/provenance, chunking/indexing, retrieval approach, source grounding, retrieval failures. |
| 6. Tools and Agentic Workflow (1–1.25p) | Tool contracts, permissions/side effects, agent goal, plan-act-observe loop, limits, approval/handoff. |
| 7. Memory, State and Interoperability (0.5–0.75p) | State model, retained memory, privacy/retention, integration/MCP-style interface decisions. |
| 8. Evaluation, Observability and Guardrails (1.5–2p) | Evaluation data/criteria/results, genuine failures, traces/logs, guardrails, remediation, re-test evidence. |
| 9. Software Engineering Quality and Deployment (0.75–1p) | Testing, configuration/secrets, code quality, CI where used, reproducibility/deployment, maintainability. |
| 10. Results, Limitations and Professional Reflection (0.75–1p) | What works, what doesn't, remaining risks, cost/latency, future work, human responsibility. |
| References | Consistent academic style; verify all AI-suggested references. |
| Appendices (outside page limit) | Detailed user stories, prompt excerpts, test/evaluation tables, tool schemas, logs/traces, AI Engineering Log summary, additional diagrams. |

## 10. Final Presentation and Demonstration Requirements

A 12–15 minute presentation and live demonstration, followed by questions, showing the engineered system rather than reading the report:

- Problem, target user and why AI is justified — ~1–2 min.
- Architecture and progression model → RAG → tools → bounded agent → evaluation — ~2 min.
- Live end-to-end successful workflow — ~4 min.
- One engineering evidence view (retrieval trace, tool/agent trace, evaluation run or log) — ~2 min.
- One real failure, limitation or controlled recovery — ~2 min.
- Guardrails, human approval boundaries and key lessons — ~1–2 min.

> **Demonstration expectation** — A polished happy-path demo is not enough. The team must show that it can inspect what the AI/agent did, explain a real failure, and show where human control is retained.

## 11. Core Reference Books

- Osmani, A. (2025). *Beyond Vibe Coding: From Coder to AI-Era Developer*. O'Reilly Media.
- Huyen, C. (2025). *AI Engineering: Building Applications with Foundation Models*. O'Reilly Media.
- Lanham, M. (2025). *AI Agents in Action*. Manning Publications.

**Closing principle:** Build the smallest useful agentic system that you can test, explain and safely control.

---
*Source: "Group H.txt", filed verbatim as the canonical capstone brief for reference against weekly deliverables. See [`brief-alignment-review.md`](./brief-alignment-review.md) for a review of current progress against this brief.*
