"use client"

import { useEffect, useState, type ChangeEvent } from "react"
import { apiClient } from "@/backend/api/client"
import { Icon } from "@/components/ui/icon"
import { File02Icon, Upload01Icon } from "@hugeicons/core-free-icons"

interface RequestAttachment {
  id: string
  fileUrl: string
  fileName: string
  fileType: string | null
  fileSizeBytes: number | null
  createdAt: string
  messageId?: string | null
}

function formatSize(bytes: number | null) {
  if (bytes == null) return null
  if (bytes < 1024) return `${bytes} B`
  return `${Math.round(bytes / 1024)} KB`
}

export function AttachmentsPanel({ requestId }: { requestId: string | null }) {
  const [attachments, setAttachments] = useState<RequestAttachment[]>([])
  const [loadedFor, setLoadedFor] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!requestId) return
    let active = true
    apiClient
      .get<{ attachments: RequestAttachment[] }>(`/requests/${requestId}`)
      .then(({ data }) => {
        if (!active) return
        setAttachments(data.attachments ?? [])
        setLoadedFor(requestId)
      })
      .catch(() => {
        if (active) setLoadedFor(requestId)
      })
    return () => {
      active = false
    }
  }, [requestId])

  const visibleAttachments = loadedFor === requestId ? attachments : []

  async function handleUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ""
    if (!file || !requestId) return

    setUploading(true)
    setError(null)

    const formData = new FormData()
    formData.append("file", file)

    try {
      const { data: row } = await apiClient.post<RequestAttachment>(
        `/requests/${requestId}/attachments`,
        formData
      )
      setAttachments((prev) => [row, ...prev])
      setLoadedFor(requestId)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed")
    } finally {
      setUploading(false)
    }
  }

  if (!requestId) return null

  return (
    <div>
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-muted-foreground">Attachments</p>
        <label className="cursor-pointer">
          <span className="inline-flex h-6 items-center gap-1 rounded-md border border-border px-2 text-xs font-medium hover:bg-muted">
            <Icon icon={Upload01Icon} size={14} />
            {uploading ? "Uploading…" : "Upload"}
          </span>
          <input type="file" className="hidden" onChange={handleUpload} disabled={uploading} />
        </label>
      </div>
      {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
      <div className="mt-1.5 flex flex-col gap-1.5">
        {visibleAttachments.length === 0 && <p className="text-xs text-muted-foreground">No attachments.</p>}
        {visibleAttachments.map((a) => (
          <a
            key={a.id}
            href={a.fileUrl}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 rounded-md border border-border px-2.5 py-2 text-sm hover:bg-muted/50"
          >
            <Icon icon={File02Icon} size={16} className="shrink-0 text-muted-foreground" />
            <span className="min-w-0 flex-1 truncate text-foreground">{a.fileName}</span>
            {formatSize(a.fileSizeBytes) && (
              <span className="shrink-0 text-xs text-muted-foreground">{formatSize(a.fileSizeBytes)}</span>
            )}
          </a>
        ))}
      </div>
    </div>
  )
}
