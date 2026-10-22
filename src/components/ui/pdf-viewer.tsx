import { useEffect, useRef, useState } from "react"
import { Document, Page, pdfjs } from "react-pdf"
import "react-pdf/dist/Page/AnnotationLayer.css"
import "react-pdf/dist/Page/TextLayer.css"
import { ArrowLeft01Icon, ArrowRight01Icon, MinusSignIcon, PlusSignIcon } from "@hugeicons/core-free-icons"
import { cn } from "cn"
import { Button } from "@/components/ui/button"
import { Icon } from "@/components/ui/icon"
import { Progress } from "@/components/ui/progress"

pdfjs.GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/build/pdf.worker.min.mjs", import.meta.url).toString()

/** In-app PDF reader (react-pdf): page navigation, zoom, and a progress bar while the file loads. */
export function PdfViewer({ url, className }: { url: string; className?: string }) {
  const [pages, setPages] = useState(0)
  const [page, setPage] = useState(1)
  const [zoom, setZoom] = useState(1)
  const [loaded, setLoaded] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const boxRef = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(600)

  useEffect(() => {
    const el = boxRef.current
    if (!el) return
    const observer = new ResizeObserver(([entry]) => setWidth(Math.max(200, Math.floor(entry.contentRect.width))))
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <div className={cn("flex min-h-0 flex-col text-xs", className)}>
      <div className="flex shrink-0 items-center justify-between gap-2 border-b border-border px-3 py-1.5">
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon-sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1} aria-label="Previous page">
            <Icon icon={ArrowLeft01Icon} size={16} />
          </Button>
          <span className="tabular min-w-14 text-center text-muted-foreground">{pages ? `${page} / ${pages}` : "–"}</span>
          <Button variant="ghost" size="icon-sm" onClick={() => setPage((p) => Math.min(pages, p + 1))} disabled={page >= pages} aria-label="Next page">
            <Icon icon={ArrowRight01Icon} size={16} />
          </Button>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon-sm" onClick={() => setZoom((z) => Math.max(0.5, +(z - 0.25).toFixed(2)))} aria-label="Zoom out">
            <Icon icon={MinusSignIcon} size={16} />
          </Button>
          <span className="tabular w-10 text-center text-muted-foreground">{Math.round(zoom * 100)}%</span>
          <Button variant="ghost" size="icon-sm" onClick={() => setZoom((z) => Math.min(3, +(z + 0.25).toFixed(2)))} aria-label="Zoom in">
            <Icon icon={PlusSignIcon} size={16} />
          </Button>
        </div>
      </div>
      <div ref={boxRef} className="min-h-0 flex-1 overflow-auto bg-muted/40 p-3">
        {error ? (
          <p className="py-10 text-center text-destructive">{error}</p>
        ) : (
          <Document
            file={url}
            onLoadProgress={({ loaded: l, total }) => setLoaded(total ? Math.round((l * 100) / total) : 0)}
            onLoadSuccess={({ numPages }) => {
              setPages(numPages)
              setPage(1)
            }}
            onLoadError={(e) => setError(`Could not open this PDF: ${e.message}`)}
            loading={
              <div className="mx-auto flex max-w-xs flex-col gap-2 py-10">
                <p className="text-center text-muted-foreground">Loading document…</p>
                <Progress value={loaded} />
              </div>
            }
            className="flex justify-center"
          >
            <Page pageNumber={page} width={Math.round((width - 24) * zoom)} className="shadow-sm" />
          </Document>
        )}
      </div>
    </div>
  )
}
