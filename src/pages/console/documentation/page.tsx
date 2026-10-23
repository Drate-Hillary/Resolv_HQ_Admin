import { useEffect, useState, type ReactNode } from "react"
import { cn } from "cn"

interface Section {
  id: string
  title: string
  body: ReactNode
}

const P = ({ children }: { children: ReactNode }) => <p className="text-sm/relaxed text-foreground">{children}</p>

const List = ({ items }: { items: ReactNode[] }) => (
  <ul className="flex list-disc flex-col gap-1.5 pl-5 text-sm/relaxed text-foreground marker:text-muted-foreground">
    {items.map((item, i) => (
      <li key={i}>{item}</li>
    ))}
  </ul>
)

const Code = ({ children }: { children: ReactNode }) => (
  <code className="rounded bg-muted px-1 py-0.5 font-mono text-[0.85em] text-foreground">{children}</code>
)

function Table({ head, rows }: { head: string[]; rows: ReactNode[][] }) {
  return (
    <div className="overflow-x-auto rounded-md border border-border">
      <table className="w-full text-left text-xs/relaxed">
        <thead className="bg-muted/50 text-muted-foreground">
          <tr>
            {head.map((h) => (
              <th key={h} className="px-3 py-2 font-medium">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {rows.map((row, i) => (
            <tr key={i}>
              {row.map((cell, j) => (
                <td key={j} className="px-3 py-2 align-top text-foreground">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

const Note = ({ children }: { children: ReactNode }) => (
  <div className="rounded-md border border-border bg-muted/40 px-3 py-2 text-xs/relaxed text-muted-foreground">{children}</div>
)

const sections: Section[] = [
  {
    id: "overview",
    title: "Overview",
    body: (
      <>
        <P>
          RESOLV-HQ is a customer-support system built around an AI agent. Customers ask questions or file requests from the mobile and web app.
          The agent answers from the published knowledge base and the customer&rsquo;s own account data, and when a person has to act, it prepares
          a draft for staff to review. It never carries out a refund, cancellation, account change or deletion itself.
        </P>
        <P>The system is three applications that share one backend:</P>
        <Table
          head={["Part", "Repo", "What it is"]}
          rows={[
            ["Console (this app)", <Code key="a">resolv-hq</Code>, "Staff and admin console, plus a customer chat page. Vite, React and Tailwind."],
            ["Backend", <Code key="b">resolv-hq-backend</Code>, "Express and Prisma API on Supabase Postgres. Holds the LLM gateway, the agent loop, tools, storage and real-time events."],
            ["Customer app", <Code key="c">resolv-hq-customer</Code>, "Expo / React Native app for customers (and a web build): requests, AI chat, help centre, notifications."],
          ]}
        />
      </>
    ),
  },
  {
    id: "roles",
    title: "Roles and permissions",
    body: (
      <>
        <Table
          head={["Role", "Can do"]}
          rows={[
            ["Customer", "Chat with the assistant, file and follow requests, attach files, have a document summarised, choose a model, read the help centre."],
            ["Agent (staff)", "Everything staff-side: tickets, approvals, knowledge base, tools, traces, scheduler."],
            ["Admin", "Everything an agent can, plus registering and disabling AI models and managing boundary rules."],
          ]}
        />
        <List
          items={[
            <>Staff-only routes use <Code>requireRole(&quot;staff&quot;)</Code>; the console checks the caller&rsquo;s role from <Code>GET /me</Code>.</>,
            "Customers can never add a document to the knowledge base. They can have a document summarised once; nothing is stored.",
            "Every agent tool reads only the signed-in caller’s data. No tool accepts a customer id.",
          ]}
        />
      </>
    ),
  },
  {
    id: "agent",
    title: "The support agent",
    body: (
      <>
        <P>
          The agent runs a bounded loop (Sense, Plan, Act, Observe, Respond). The model decides each step whether to answer or call an approved
          tool, and the result of a tool is fed back until it has an answer.
        </P>
        <Table
          head={["Tool", "What it does", "Approval"]}
          rows={[
            [<Code key="1">search_knowledge_base</Code>, "Top published passages for a query.", "No"],
            [<Code key="2">account_status_lookup</Code>, "The caller’s own role, status and organisation.", "No"],
            [<Code key="3">outage_status_checker</Code>, "The caller’s own unresolved requests.", "No"],
            [<Code key="4">get_my_tickets</Code>, "The caller’s own tickets.", "No"],
            [<Code key="5">draft_escalation_ticket</Code>, "A structured draft only. Writes nothing.", "Yes, a human decides"],
          ]}
        />
        <List
          items={[
            <>At most <Code>4</Code> iterations per turn. If the cap is hit, the agent returns a safe message and offers to open a request.</>,
            <>Long knowledge results can be delegated to read-only sub-agents (a researcher and a case checker) through <Code>delegate_to_sub_agent</Code>. They have their own small limits and cannot delegate further.</>,
            "Vague questions get one clarifying question before the loop starts.",
            "If no model can answer, the system falls back to keyword search over the knowledge base.",
          ]}
        />
      </>
    ),
  },
  {
    id: "guardrails",
    title: "Guardrails and approvals",
    body: (
      <>
        <P>Two layers keep the agent from claiming actions it cannot take:</P>
        <List
          items={[
            "Layer 1: the system prompt forbids claiming refunds, cancellations, account changes or data deletion.",
            <>Layer 2: <Code>detectBoundaryViolation()</Code> checks the model&rsquo;s actual reply against the active boundary rules and replaces it with a safe message if it claims such an action.</>,
          ]}
        />
        <P>
          Anything with real consequence goes to the approval queue. A draft becomes a real ticket only when staff approve it, and each decision is
          written to the activity log. The agent cannot approve its own drafts.
        </P>
      </>
    ),
  },
  {
    id: "knowledge",
    title: "Knowledge base and documents",
    body: (
      <>
        <P>
          Staff upload documents on the Knowledge Base page, or from the paperclip in the chat box. A document is stored privately, split page by
          page into short passages, and embedded where an OpenAI provider is registered, so the agent can cite the right page.
        </P>
        <Table
          head={["File type", "Uploaded", "Searchable", "Previewed"]}
          rows={[
            ["PDF", "Yes", "Yes, by page", "Yes, in the page viewer"],
            ["Word (.docx)", "Yes", "Yes, in blocks of about 3,000 characters", "Yes, in the Word reader"],
            ["Plain text, Markdown, CSV", "Yes", "Yes", "Text shown in the details sheet"],
            ["Word (.doc)", "Yes", "No", "No (download only)"],
          ]}
        />
        <List
          items={[
            <>Summarise: the paperclip also offers &quot;Summarise for me&quot;. The file is read once, summarised and discarded. Customers can use this; they cannot add to the knowledge base.</>,
            "Previews are fetched through short-lived signed links. Files are never public.",
            "Page images and Word previews are produced in the browser; the file is not sent to any third party.",
          ]}
        />
      </>
    ),
  },
  {
    id: "attachments",
    title: "Request attachments",
    body: (
      <>
        <P>
          Customers attach images, PDFs, Word, Excel, text and CSV files to a request (up to 15 MB each). Each file appears on its message as a card
          with a picture of the document: the image itself, or the first page of a PDF. Clicking the card opens the document inside the app.
        </P>
        <List
          items={[
            "In this console, attachments show under each ticket message and open in a viewer.",
            "In the customer app on the web, PDFs and Word files open in the in-app reader. On phones they open in the phone’s own viewer, and photos open full screen.",
            "When a browser or phone sends no file type, the server works it out from the file extension.",
          ]}
        />
      </>
    ),
  },
  {
    id: "models",
    title: "AI models",
    body: (
      <>
        <P>
          Admins register models on the AI Models page (OpenAI, Anthropic, Google or LangChain), each with its own key. Registered, active models are
          tried in the order they were added. A failing model is retried with backoff and then the next one is used.
        </P>
        <List
          items={[
            "Choosing a model: the model button next to the chat box lists active models. “Automatic” lets the system choose. The customer app has the same choice.",
            "A chosen model is tried first; if it fails, the others still answer, so a question is not lost.",
            "Identical requests can be served from a Redis cache. The chosen model is part of the cache key.",
            "API keys never leave the backend. The model list sent to customers has names only.",
          ]}
        />
      </>
    ),
  },
  {
    id: "memory",
    title: "Memory",
    body: (
      <>
        <P>
          For customers, the backend loads that customer&rsquo;s enabled memory facts into the prompt as untrusted context, within a character
          budget, and only while their memory switch is on. Memory never authorises an action. Staff have their own separate memory, and may view a
          customer&rsquo;s memory only after choosing that customer. Those views are audit logged.
        </P>
      </>
    ),
  },
  {
    id: "tickets",
    title: "Tickets and real-time updates",
    body: (
      <>
        <P>
          Staff manage tickets on the Tickets page: change status, assign to themselves, reply and close. New messages, typing indicators,
          attachments and notifications are pushed live over a socket or server-sent events, backed by Redis so several backend instances stay in
          step.
        </P>
        <Note>If a message with a file arrives, the file appears on it a moment later, once the upload finishes.</Note>
      </>
    ),
  },
  {
    id: "dashboard",
    title: "Dashboard",
    body: (
      <>
        <P>The dashboard summarises the last seven days in three tabs:</P>
        <List
          items={[
            "Agent runs: runs per day, and which provider answered.",
            "Hallucination: runs by confidence, with the share flagged as a possible hallucination.",
            "Temperature: confidence and flagged rate for each registered model, with its configured temperature.",
          ]}
        />
        <Note>
          Confidence and hallucination are proxies computed from stored traces. Confidence is how strongly the best retrieved passage matched the
          question. A run is flagged if the boundary rules blocked its answer, or it answered with no source and no tool result. The model reports
          neither value. Only LangChain models pin a temperature (0); the other clients use the vendor default.
        </Note>
      </>
    ),
  },
  {
    id: "scheduler",
    title: "Scheduler",
    body: (
      <>
        <P>
          The scheduler board shows agent runs and staff-scheduled cards. Finished cards are removed automatically 48 hours after they finish.
          This only trims the board: agent runs themselves are kept as an audit trail and are never auto-deleted. Set{" "}
          <Code>SCHEDULER_TASK_TTL_HOURS</Code> on the backend to change the window (0 keeps everything).
        </P>
      </>
    ),
  },
  {
    id: "traces",
    title: "Traces and logs",
    body: (
      <>
        <P>
          Each agent run records its retrieval, every model call (provider, model, prompt version, latency, tokens), every tool call (input,
          result, error) and its outcome. Open Traces &amp; Logs to inspect a run step by step, or the activity drawer in the Chat page to watch
          one live.
        </P>
      </>
    ),
  },
  {
    id: "mcp",
    title: "MCP",
    body: (
      <>
        <P>
          The agent tools are also available as an MCP interface over authenticated HTTP at <Code>/mcp</Code> and as a stdio process. Both share
          the same tool logic and the same per-caller scoping. The MCP Tester page calls them directly.
        </P>
      </>
    ),
  },
  {
    id: "config",
    title: "Configuration",
    body: (
      <>
        <Table
          head={["Setting", "Where", "Effect"]}
          rows={[
            [<Code key="1">DATABASE_URL</Code>, "Backend", "Supabase pooler connection. Connect and pool timeouts are set to 30 s."],
            [<Code key="2">SCHEDULER_TASK_TTL_HOURS</Code>, "Backend", "Hours before finished scheduler cards disappear (default 48)."],
            [<Code key="3">SUB_AGENTS</Code>, "Backend", "on, off or auto: whether the agent may delegate to sub-agents."],
            [<Code key="4">CHUNK_TARGET_CHARS</Code>, "Backend", "Target size of a knowledge passage (default 700)."],
            [<Code key="5">ATTACHMENTS_STORAGE_BUCKET</Code>, "Backend", "Private bucket for request files (default request-attachments)."],
            [<Code key="6">KNOWLEDGE_STORAGE_BUCKET</Code>, "Backend", "Private bucket for knowledge files (default knowledge-documents)."],
            [<Code key="7">VITE_API_BASE_URL</Code>, "Console", "Where the console finds the backend (default http://localhost:3001)."],
          ]}
        />
      </>
    ),
  },
  {
    id: "running",
    title: "Running the system",
    body: (
      <>
        <List
          items={[
            <>Backend: <Code>docker compose up -d --build backend</Code> in <Code>resolv-hq-backend</Code> (API on port 3001, with Redis and RabbitMQ). After changing backend code, rebuild this container.</>,
            <>Console: <Code>npm run dev</Code> in <Code>resolv-hq</Code>.</>,
            <>Customer app: <Code>npx expo start</Code> in <Code>resolv-hq-customer</Code>, or <Code>npx expo export --platform web</Code> for the web build.</>,
          ]}
        />
      </>
    ),
  },
  {
    id: "limits",
    title: "Known limitations",
    body: (
      <List
        items={[
          "Hallucination and confidence on the dashboard are proxies, not verified measurements.",
          "Temperature is not configurable per model yet, so the Temperature tab compares models rather than temperatures.",
          "On phones, PDF and Word attachments open in the phone’s own viewer and show a tile rather than a first-page picture.",
          ".doc files (old Word format) cannot be read, searched or previewed.",
          "Output length from some model clients is capped, so very long summaries may be shortened.",
          "Retrieval is keyword and embedding based over a small corpus; an off-topic document in the knowledge base can still be retrieved until it is unpublished.",
        ]}
      />
    ),
  },
]

/** Tracks which section is nearest the top while scrolling, to highlight it in the contents list. */
function useActiveSection(ids: string[]) {
  const [active, setActive] = useState(ids[0])
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
        if (visible[0]) setActive(visible[0].target.id)
      },
      { rootMargin: "-10% 0px -75% 0px" }
    )
    ids.forEach((id) => {
      const el = document.getElementById(id)
      if (el) observer.observe(el)
    })
    return () => observer.disconnect()
  }, [ids])
  return active
}

const ids = sections.map((s) => s.id)

export default function DocumentationPage() {
  const active = useActiveSection(ids)

  return (
    <div className="mx-auto flex max-w-6xl gap-8 px-4 py-6 lg:px-6">
      <nav aria-label="Contents" className="sticky top-6 hidden h-fit w-52 shrink-0 lg:block">
        <p className="mb-2 text-xs font-medium text-muted-foreground">On this page</p>
        <ul className="flex flex-col border-l border-border">
          {sections.map((s) => (
            <li key={s.id}>
              <a
                href={`#${s.id}`}
                onClick={(e) => {
                  e.preventDefault()
                  document.getElementById(s.id)?.scrollIntoView({ behavior: "smooth", block: "start" })
                }}
                className={cn(
                  "-ml-px block border-l py-1 pl-3 text-xs transition-colors",
                  active === s.id
                    ? "border-primary font-medium text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                )}
              >
                {s.title}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      <article className="flex min-w-0 flex-1 flex-col gap-10">
        <header>
          <h1 className="text-lg font-semibold tracking-tight text-foreground">Documentation</h1>
          <p className="mt-1 text-xs text-muted-foreground">How RESOLV-HQ works: the apps, the agent, its limits and how to run it.</p>
        </header>
        {sections.map((s) => (
          <section key={s.id} id={s.id} className="flex scroll-mt-6 flex-col gap-3">
            <h2 className="text-base font-semibold tracking-tight text-foreground">{s.title}</h2>
            {s.body}
          </section>
        ))}
      </article>
    </div>
  )
}
