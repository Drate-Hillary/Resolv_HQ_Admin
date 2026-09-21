"use client"

import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Icon } from "@/components/ui/icon"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet"
import { apiClient } from "@/backend/api/client"
import {
  Search01Icon,
  Upload01Icon,
  CheckmarkCircle02Icon,
  File02Icon,
} from "@hugeicons/core-free-icons"

export interface KnowledgeDocumentRow {
  id: string
  title: string
  content: string | null
  file_url: string | null
  file_type: string | null
  status: "draft" | "published" | "archived"
  uploaded_by: string | null
  created_at: string
  updated_at: string
}

const statusVariant: Record<KnowledgeDocumentRow["status"], "approve" | "default" | "secondary"> = {
  published: "approve",
  draft: "default",
  archived: "secondary",
}

export function KnowledgeView({ initialDocuments }: { initialDocuments: KnowledgeDocumentRow[] }) {
  const [documents, setDocuments] = useState(initialDocuments)
  const [query, setQuery] = useState("")
  const [selected, setSelected] = useState<KnowledgeDocumentRow | null>(null)
  const [uploading, setUploading] = useState(false)

  const filtered = documents.filter((d) => d.title.toLowerCase().includes(query.toLowerCase()))

  const uploadDocument = async () => {
    setUploading(true)
    try {
      const { data } = await apiClient.post<KnowledgeDocumentRow>("/admin/knowledge", {
        title: "Untitled document",
        status: "draft",
      })
      setDocuments((prev) => [data, ...prev])

      // The backend flips this same row to "published" about 1.8s after
      // creating it (see admin/knowledge.ts) — mirrored here optimistically
      // so the UI updates without a second round trip.
      setTimeout(() => {
        setDocuments((prev) =>
          prev.map((d) => (d.id === data.id ? { ...d, status: "published" } : d))
        )
      }, 1800)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-5 px-4 py-6 lg:px-6">
      <div>
        <h2 className="text-lg font-semibold tracking-tight text-foreground">Knowledge base</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          The controlled corpus the agent retrieves from — every answer traces back to a source here.
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-64">
          <Icon icon={Search01Icon} size={19} className="absolute top-1/2 left-2.5 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search documents…"
            className="h-8 w-full rounded-md border border-border bg-transparent pl-8 pr-2.5 text-xs outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30"
          />
        </div>
        <Button size="lg" onClick={uploadDocument} disabled={uploading}>
          <Icon icon={Upload01Icon} data-icon="inline-start" />
          {uploading ? "Uploading…" : "Upload document"}
        </Button>
      </div>

      <div className="glass-panel overflow-x-auto">
        <table className="w-full min-w-150 text-left text-xs">
          <thead>
            <tr className="border-b border-border text-sm text-muted-foreground">
              <th className="px-4 py-2.5 font-medium">Title</th>
              <th className="px-4 py-2.5 font-medium">Type</th>
              <th className="px-4 py-2.5 font-medium">Added</th>
              <th className="px-4 py-2.5 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((doc) => (
              <tr
                key={doc.id}
                onClick={() => setSelected(doc)}
                className="cursor-pointer border-b border-border last:border-0 hover:bg-muted/50"
              >
                <td className="flex items-center gap-2 px-4 py-2.5 font-medium text-foreground">
                  <Icon icon={File02Icon} size={19} className="text-muted-foreground" />
                  {doc.title}
                </td>
                <td className="px-4 py-2.5 text-muted-foreground">{doc.file_type ?? "—"}</td>
                <td className="px-4 py-2.5 text-muted-foreground">{new Date(doc.created_at).toLocaleDateString()}</td>
                <td className="px-4 py-2.5">
                  <Badge variant={statusVariant[doc.status]}>{doc.status}</Badge>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-muted-foreground">
                  No documents match &ldquo;{query}&rdquo;.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="glass-panel p-4">
        <h3 className="text-xs font-medium text-muted-foreground">Example grounded answer</h3>
        <p className="mt-2 text-xs/relaxed text-foreground">
          &ldquo;Based on the Procurement Policy, requisitions over 25 USD equivalent require manager
          approval, and any purchase must compare at least two supplier quotations before submission.&rdquo;
        </p>
        <div className="mt-3">
          <p className="mb-1.5 text-sm font-medium text-muted-foreground">Sources</p>
          <div className="flex flex-col gap-1.5">
            {[
              { doc: "Procurement Policy", loc: "Page 12 · §4.2 Approval thresholds" },
              { doc: "Quotation Evaluation Criteria", loc: "Page 3 · §1.0 Minimum quotations" },
            ].map((s) => (
              <div key={s.doc} className="flex items-center gap-2 rounded-md border border-border px-2.5 py-2 text-sm">
                <Icon icon={CheckmarkCircle02Icon} size={18} className="shrink-0 text-approve" />
                <span className="font-medium text-foreground">{s.doc}</span>
                <span className="text-muted-foreground">{s.loc}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <Sheet open={Boolean(selected)} onOpenChange={(open) => !open && setSelected(null)}>
        <SheetContent>
          {selected && (
            <>
              <SheetHeader>
                <SheetTitle>{selected.title}</SheetTitle>
                <SheetDescription>{selected.file_type ?? "Document"}</SheetDescription>
              </SheetHeader>
              <div className="flex flex-col gap-3 px-6 pb-6 text-sm">
                <DetailRow label="Date added" value={new Date(selected.created_at).toLocaleDateString()} />
                <DetailRow label="Status" value={selected.status} />
                {selected.content && <DetailRow label="Content" value={selected.content.slice(0, 300)} />}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-border pb-2.5">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-foreground capitalize">{value}</span>
    </div>
  )
}
