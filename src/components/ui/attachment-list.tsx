import { useState } from "react"
import { Document, Page } from "react-pdf"
import { File02Icon } from "@hugeicons/core-free-icons"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { DocxViewer } from "@/components/ui/docx-viewer"
import { Icon } from "@/components/ui/icon"
import { PdfViewer } from "@/components/ui/pdf-viewer"
import type { TicketAttachment } from "@/types"

const DOCX = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"

type Kind = "image" | "pdf" | "docx" | "other"

function kindOf(a: TicketAttachment): Kind {
  if (a.fileType?.startsWith("image/")) return "image"
  if (a.fileType === "application/pdf" || /\.pdf$/i.test(a.fileName)) return "pdf"
  if (a.fileType === DOCX || /\.docx$/i.test(a.fileName)) return "docx"
  return "other"
}

/** Small picture of the document: the image itself, or the first page of a PDF. Other files get a typed tile. */
function Thumb({ attachment, kind }: { attachment: TicketAttachment; kind: Kind }) {
  const [failed, setFailed] = useState(false)
  if (kind === "image") {
    return <img src={attachment.fileUrl} alt={attachment.fileName} className="h-full w-full object-cover" />
  }
  if (kind === "pdf" && !failed) {
    return (
      <Document file={attachment.fileUrl} loading={null} error={null} onLoadError={() => setFailed(true)} onSourceError={() => setFailed(true)}>
        <Page pageNumber={1} width={112} renderTextLayer={false} renderAnnotationLayer={false} />
      </Document>
    )
  }
  const label = kind === "docx" ? "DOCX" : (attachment.fileName.split(".").pop()?.toUpperCase().slice(0, 4) ?? "FILE")
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-1 text-muted-foreground">
      <Icon icon={File02Icon} size={24} />
      <span className="text-[10px] font-semibold">{label}</span>
    </div>
  )
}

/** A message's files as picture cards; clicking one opens it in the app. */
export function AttachmentList({ attachments }: { attachments: TicketAttachment[] }) {
  const [open, setOpen] = useState<TicketAttachment | null>(null)
  const kind = open ? kindOf(open) : "other"

  return (
    <>
      <ul className="mt-2 flex flex-wrap gap-2">
        {attachments.map((a) => (
          <li key={a.id}>
            <button
              type="button"
              onClick={() => setOpen(a)}
              className="flex w-28 flex-col overflow-hidden rounded-md border border-border bg-background text-left outline-none transition-colors hover:border-ring focus-visible:ring-2 focus-visible:ring-ring/40"
            >
              <span className="flex h-32 w-full items-start justify-center overflow-hidden bg-muted/40">
                <Thumb attachment={a} kind={kindOf(a)} />
              </span>
              <span className="truncate px-2 py-1.5 text-xs font-medium text-foreground">{a.fileName}</span>
            </button>
          </li>
        ))}
      </ul>

      <Dialog open={Boolean(open)} onOpenChange={(next) => !next && setOpen(null)}>
        <DialogContent className="flex h-[85vh] w-[min(56rem,calc(100vw-2rem))] flex-col gap-3">
          <DialogTitle className="truncate">{open?.fileName}</DialogTitle>
          {open && kind === "pdf" && <PdfViewer url={open.fileUrl} className="min-h-0 flex-1 overflow-hidden rounded-md border border-border" />}
          {open && kind === "docx" && <DocxViewer url={open.fileUrl} className="min-h-0 flex-1 rounded-md border border-border" />}
          {open && kind === "image" && (
            <div className="min-h-0 flex-1 overflow-auto rounded-md border border-border bg-muted/40">
              <img src={open.fileUrl} alt={open.fileName} className="mx-auto max-w-full" />
            </div>
          )}
          {open && kind === "other" && (
            <p className="py-10 text-center text-sm text-muted-foreground">
              This file type can&rsquo;t be previewed here.{" "}
              <a href={open.fileUrl} target="_blank" rel="noopener noreferrer" className="text-primary underline">
                Download it
              </a>
            </p>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
