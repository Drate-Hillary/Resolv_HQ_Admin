"use client"

import { useMemo, useRef, useState } from "react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Icon } from "@/components/ui/icon"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet"
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { apiClient } from "@/backend/api/client"
import {
  Search01Icon,
  Upload01Icon,
  CheckmarkCircle02Icon,
  File02Icon,
  MoreVerticalIcon,
  ViewIcon,
  Download04Icon,
  Archive01Icon,
  ArchiveRestoreIcon,
  Delete02Icon,
  FolderLibraryIcon,
  PlusSignIcon,
  Tag01Icon,
} from "@hugeicons/core-free-icons"

export interface KnowledgeDocumentRow {
  id: string
  title: string
  content: string | null
  file_url: string | null
  file_type: string | null
  status: "draft" | "published" | "archived"
  category_id: string | null
  uploaded_by: string | null
  created_at: string
  updated_at: string
}

export interface KnowledgeCategoryRow {
  id: string
  name: string
  description: string | null
  created_at: string
}

const statusVariant: Record<KnowledgeDocumentRow["status"], "approve" | "default" | "secondary"> = {
  published: "approve",
  draft: "default",
  archived: "secondary",
}

const UNCATEGORIZED = "uncategorized"
const ALL_CATEGORIES = "all"

function errorMessage(err: unknown, fallback: string) {
  return (err as { response?: { data?: { error?: string } } })?.response?.data?.error ?? fallback
}

export function KnowledgeView({
  initialDocuments,
  initialCategories,
}: {
  initialDocuments: KnowledgeDocumentRow[]
  initialCategories: KnowledgeCategoryRow[]
}) {
  const [documents, setDocuments] = useState(initialDocuments)
  const [categories, setCategories] = useState(initialCategories)
  const [query, setQuery] = useState("")
  const [categoryFilter, setCategoryFilter] = useState<string>(ALL_CATEGORIES)
  const [selected, setSelected] = useState<KnowledgeDocumentRow | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<KnowledgeDocumentRow | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [pendingActionId, setPendingActionId] = useState<string | null>(null)
  const [uploadingFile, setUploadingFile] = useState<{ name: string; progress: number } | null>(null)
  const [uploadCategoryId, setUploadCategoryId] = useState<string>(UNCATEGORIZED)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [manageOpen, setManageOpen] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState("")
  const [creatingCategory, setCreatingCategory] = useState(false)
  const [deletingCategoryId, setDeletingCategoryId] = useState<string | null>(null)

  const categoryNameById = useMemo(() => new Map(categories.map((c) => [c.id, c.name])), [categories])

  const filtered = documents.filter((d) => {
    const matchesQuery = d.title.toLowerCase().includes(query.toLowerCase())
    const matchesCategory =
      categoryFilter === ALL_CATEGORIES ||
      (categoryFilter === UNCATEGORIZED ? !d.category_id : d.category_id === categoryFilter)
    return matchesQuery && matchesCategory
  })

  function triggerUpload() {
    fileInputRef.current?.click()
  }

  async function handleFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ""
    if (!file) return

    setUploadingFile({ name: file.name, progress: 0 })
    try {
      const formData = new FormData()
      formData.append("file", file)
      if (uploadCategoryId !== UNCATEGORIZED) formData.append("category_id", uploadCategoryId)

      const { data } = await apiClient.post<KnowledgeDocumentRow>("/admin/knowledge", formData, {
        onUploadProgress: (event) => {
          const progress = event.total ? Math.round((event.loaded * 100) / event.total) : 0
          setUploadingFile((prev) => (prev ? { ...prev, progress } : prev))
        },
      })
      setDocuments((prev) => [data, ...prev])
      toast.success(`${data.title} uploaded`, { description: "Indexing — it'll show as published shortly." })

      // The backend flips this same row to "published" about 1.8s after
      // creating it (see admin/knowledge.ts) — mirrored here optimistically
      // so the UI updates without a second round trip.
      setTimeout(() => {
        setDocuments((prev) =>
          prev.map((d) => (d.id === data.id ? { ...d, status: "published" } : d))
        )
      }, 1800)
    } catch (err) {
      toast.error(errorMessage(err, "Could not upload the document. Please try again."))
    } finally {
      setUploadingFile(null)
    }
  }

  async function updateStatus(doc: KnowledgeDocumentRow, status: KnowledgeDocumentRow["status"]) {
    setPendingActionId(doc.id)
    try {
      const { data } = await apiClient.patch<KnowledgeDocumentRow>(`/admin/knowledge/${doc.id}`, { status })
      setDocuments((prev) => prev.map((d) => (d.id === doc.id ? data : d)))
      toast(`${data.title} ${status}`)
    } catch (err) {
      toast.error(errorMessage(err, "Could not update the document."))
    } finally {
      setPendingActionId(null)
    }
  }

  async function updateCategory(doc: KnowledgeDocumentRow, categoryId: string | null) {
    setPendingActionId(doc.id)
    try {
      const { data } = await apiClient.patch<KnowledgeDocumentRow>(`/admin/knowledge/${doc.id}`, {
        category_id: categoryId,
      })
      setDocuments((prev) => prev.map((d) => (d.id === doc.id ? data : d)))
      toast(`${data.title} moved to ${categoryId ? categoryNameById.get(categoryId) : "Uncategorized"}`)
    } catch (err) {
      toast.error(errorMessage(err, "Could not update the document's category."))
    } finally {
      setPendingActionId(null)
    }
  }

  async function downloadDocument(doc: KnowledgeDocumentRow) {
    setPendingActionId(doc.id)
    try {
      const { data } = await apiClient.get<{ url: string }>(`/admin/knowledge/${doc.id}/download`)
      window.open(data.url, "_blank", "noopener,noreferrer")
    } catch (err) {
      toast.error(errorMessage(err, "Could not generate a download link."))
    } finally {
      setPendingActionId(null)
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await apiClient.delete(`/admin/knowledge/${deleteTarget.id}`)
      setDocuments((prev) => prev.filter((d) => d.id !== deleteTarget.id))
      toast(`${deleteTarget.title} deleted`)
      setDeleteTarget(null)
    } catch (err) {
      toast.error(errorMessage(err, "Could not delete the document."))
    } finally {
      setDeleting(false)
    }
  }

  async function createCategory() {
    if (!newCategoryName.trim()) return
    setCreatingCategory(true)
    try {
      const { data } = await apiClient.post<KnowledgeCategoryRow>("/admin/knowledge-categories", {
        name: newCategoryName.trim(),
      })
      setCategories((prev) => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)))
      setNewCategoryName("")
    } catch (err) {
      toast.error(errorMessage(err, "Could not create the category."))
    } finally {
      setCreatingCategory(false)
    }
  }

  async function deleteCategory(category: KnowledgeCategoryRow) {
    setDeletingCategoryId(category.id)
    try {
      await apiClient.delete(`/admin/knowledge-categories/${category.id}`)
      setCategories((prev) => prev.filter((c) => c.id !== category.id))
      setDocuments((prev) =>
        prev.map((d) => (d.category_id === category.id ? { ...d, category_id: null } : d))
      )
      if (categoryFilter === category.id) setCategoryFilter(ALL_CATEGORIES)
      toast(`${category.name} deleted`)
    } catch (err) {
      toast.error(errorMessage(err, "Could not delete the category."))
    } finally {
      setDeletingCategoryId(null)
    }
  }

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-5 px-4 py-6 lg:px-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-foreground">Knowledge base</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            The controlled corpus the agent retrieves from — every answer traces back to a source here.
          </p>
        </div>
        <Button variant="outline" size="lg" onClick={() => setManageOpen(true)}>
          <Icon icon={FolderLibraryIcon} data-icon="inline-start" />
          Manage categories
        </Button>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative w-full sm:max-w-64">
            <Icon icon={Search01Icon} size={19} className="absolute top-1/2 left-2.5 -translate-y-1/2 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search documents…"
              className="h-8 w-full rounded-md border border-border bg-transparent pl-8 pr-2.5 text-xs outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30"
            />
          </div>
          <Select value={categoryFilter} onValueChange={(value) => setCategoryFilter(value as string)}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_CATEGORIES}>All categories</SelectItem>
              <SelectItem value={UNCATEGORIZED}>Uncategorized</SelectItem>
              {categories.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <Select value={uploadCategoryId} onValueChange={(value) => setUploadCategoryId(value as string)}>
            <SelectTrigger className="w-full sm:w-44">
              <SelectValue placeholder="Upload to…" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={UNCATEGORIZED}>No category</SelectItem>
              {categories.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            onChange={handleFileSelected}
            accept=".pdf,.doc,.docx,.txt,.md,.csv"
          />
          <Button size="lg" onClick={triggerUpload} disabled={Boolean(uploadingFile)}>
            <Icon icon={Upload01Icon} data-icon="inline-start" />
            {uploadingFile ? "Uploading…" : "Upload document"}
          </Button>
        </div>
      </div>

      {uploadingFile && (
        <div className="glass-panel flex items-center gap-3 p-3">
          <Icon icon={File02Icon} size={18} className="shrink-0 text-muted-foreground" />
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2 text-xs">
              <span className="truncate font-medium text-foreground">{uploadingFile.name}</span>
              <span className="shrink-0 text-muted-foreground">{uploadingFile.progress}%</span>
            </div>
            <Progress value={uploadingFile.progress} className="mt-1.5" />
          </div>
        </div>
      )}

      <div className="glass-panel overflow-x-auto">
        <table className="w-full min-w-150 text-left text-xs">
          <thead>
            <tr className="border-b border-border text-sm text-muted-foreground">
              <th className="px-4 py-2.5 font-medium">Title</th>
              <th className="px-4 py-2.5 font-medium">Category</th>
              <th className="px-4 py-2.5 font-medium">Type</th>
              <th className="px-4 py-2.5 font-medium">Added</th>
              <th className="px-4 py-2.5 font-medium">Status</th>
              <th className="px-4 py-2.5 font-medium">
                <span className="sr-only">Actions</span>
              </th>
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
                <td className="px-4 py-2.5 text-muted-foreground">
                  {doc.category_id ? categoryNameById.get(doc.category_id) ?? "—" : "Uncategorized"}
                </td>
                <td className="px-4 py-2.5 text-muted-foreground">{doc.file_type ?? "—"}</td>
                <td className="px-4 py-2.5 text-muted-foreground">{new Date(doc.created_at).toLocaleDateString("en-US")}</td>
                <td className="px-4 py-2.5">
                  <Badge variant={statusVariant[doc.status]}>{doc.status}</Badge>
                </td>
                <td className="px-4 py-2.5 text-right" onClick={(e) => e.stopPropagation()}>
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      render={
                        <Button variant="ghost" size="icon-sm" disabled={pendingActionId === doc.id}>
                          <Icon icon={MoreVerticalIcon} size={16} />
                        </Button>
                      }
                    />
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setSelected(doc)}>
                        <Icon icon={ViewIcon} size={15} />
                        View details
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => downloadDocument(doc)} disabled={!doc.file_url}>
                        <Icon icon={Download04Icon} size={15} />
                        Download
                      </DropdownMenuItem>
                      <DropdownMenuSub>
                        <DropdownMenuSubTrigger>
                          <Icon icon={Tag01Icon} size={15} />
                          Category
                        </DropdownMenuSubTrigger>
                        <DropdownMenuSubContent>
                          <DropdownMenuItem
                            disabled={!doc.category_id}
                            onClick={() => updateCategory(doc, null)}
                          >
                            Uncategorized
                          </DropdownMenuItem>
                          {categories.map((c) => (
                            <DropdownMenuItem
                              key={c.id}
                              disabled={doc.category_id === c.id}
                              onClick={() => updateCategory(doc, c.id)}
                            >
                              {c.name}
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuSubContent>
                      </DropdownMenuSub>
                      <DropdownMenuSeparator />
                      {doc.status === "draft" && (
                        <DropdownMenuItem onClick={() => updateStatus(doc, "published")}>
                          <Icon icon={CheckmarkCircle02Icon} size={15} />
                          Publish now
                        </DropdownMenuItem>
                      )}
                      {doc.status === "published" && (
                        <DropdownMenuItem onClick={() => updateStatus(doc, "archived")}>
                          <Icon icon={Archive01Icon} size={15} />
                          Archive
                        </DropdownMenuItem>
                      )}
                      {doc.status === "archived" && (
                        <DropdownMenuItem onClick={() => updateStatus(doc, "published")}>
                          <Icon icon={ArchiveRestoreIcon} size={15} />
                          Restore
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem variant="destructive" onClick={() => setDeleteTarget(doc)}>
                        <Icon icon={Delete02Icon} size={15} />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-muted-foreground">
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
                <DetailRow label="Date added" value={new Date(selected.created_at).toLocaleDateString("en-US")} />
                <DetailRow label="Status" value={selected.status} />
                <DetailRow
                  label="Category"
                  value={selected.category_id ? categoryNameById.get(selected.category_id) ?? "—" : "Uncategorized"}
                />
                {selected.content && <DetailRow label="Content" value={selected.content.slice(0, 300)} />}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      <Dialog open={Boolean(deleteTarget)} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent>
          <DialogTitle>Delete document?</DialogTitle>
          <DialogDescription>
            {deleteTarget && (
              <>
                &ldquo;{deleteTarget.title}&rdquo; will be removed from the knowledge base and the agent will
                no longer retrieve from it. This can&rsquo;t be undone.
              </>
            )}
          </DialogDescription>
          <div className="mt-5 flex justify-end gap-2">
            <Button variant="outline" onClick={() => setDeleteTarget(null)} disabled={deleting}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete} disabled={deleting}>
              {deleting ? "Deleting…" : "Delete"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={manageOpen} onOpenChange={setManageOpen}>
        <DialogContent>
          <DialogTitle>Manage categories</DialogTitle>
          <DialogDescription>
            Group knowledge documents so both admins and the agent can narrow retrieval by topic.
          </DialogDescription>

          <div className="mt-4 flex gap-2">
            <Input
              placeholder="e.g. Billing & Payments"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && createCategory()}
            />
            <Button onClick={createCategory} disabled={creatingCategory || !newCategoryName.trim()}>
              <Icon icon={PlusSignIcon} data-icon="inline-start" />
              Add
            </Button>
          </div>

          <div className="mt-4 flex max-h-64 flex-col gap-1.5 overflow-y-auto">
            {categories.map((c) => (
              <div key={c.id} className="flex items-center justify-between gap-2 rounded-md border border-border px-2.5 py-1.5">
                <span className="text-xs font-medium text-foreground">{c.name}</span>
                <Button
                  variant="ghost"
                  size="icon-xs"
                  onClick={() => deleteCategory(c)}
                  disabled={deletingCategoryId === c.id}
                >
                  <Icon icon={Delete02Icon} size={14} />
                </Button>
              </div>
            ))}
            {categories.length === 0 && (
              <p className="py-2 text-center text-xs text-muted-foreground">No categories yet.</p>
            )}
          </div>

          <div className="mt-5 flex justify-end">
            <Button variant="outline" onClick={() => setManageOpen(false)}>
              Done
            </Button>
          </div>
        </DialogContent>
      </Dialog>
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
