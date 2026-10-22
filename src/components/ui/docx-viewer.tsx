import { useEffect, useState } from "react"
import mammoth from "mammoth"
import { cn } from "cn"
import { Progress } from "@/components/ui/progress"

/** In-app Word (.docx) reader: the file is fetched and converted to HTML in the browser, nothing leaves it. */
export function DocxViewer({ url, className }: { url: string; className?: string }) {
  const [html, setHtml] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loaded, setLoaded] = useState(0)

  useEffect(() => {
    const controller = new AbortController()
    ;(async () => {
      try {
        const response = await fetch(url, { signal: controller.signal })
        if (!response.ok) throw new Error(`HTTP ${response.status}`)
        const total = Number(response.headers.get("content-length")) || 0
        const reader = response.body?.getReader()
        const chunks: Uint8Array[] = []
        let received = 0
        while (reader) {
          const { done, value } = await reader.read()
          if (done) break
          chunks.push(value)
          received += value.length
          if (total) setLoaded(Math.round((received * 100) / total))
        }
        const bytes = new Uint8Array(received)
        let offset = 0
        for (const chunk of chunks) {
          bytes.set(chunk, offset)
          offset += chunk.length
        }
        const result = await mammoth.convertToHtml({ arrayBuffer: bytes.buffer })
        setHtml(result.value)
      } catch (err) {
        if (!controller.signal.aborted) setError(err instanceof Error ? err.message : "Unknown error")
      }
    })()
    return () => controller.abort()
  }, [url])

  return (
    <div className={cn("min-h-0 overflow-auto bg-background p-4 text-sm", className)}>
      {error ? (
        <p className="py-10 text-center text-destructive">Could not open this document: {error}</p>
      ) : html === null ? (
        <div className="mx-auto flex max-w-xs flex-col gap-2 py-10">
          <p className="text-center text-muted-foreground">Loading document…</p>
          <Progress value={loaded} />
        </div>
      ) : (
        <div
          className="flex flex-col gap-3 leading-relaxed [&_h1]:text-lg [&_h1]:font-semibold [&_h2]:text-base [&_h2]:font-semibold [&_h3]:font-semibold [&_img]:max-w-full [&_li]:ml-5 [&_li]:list-disc [&_table]:w-full [&_td]:border [&_td]:border-border [&_td]:p-1.5 [&_a]:text-primary [&_a]:underline"
          // mammoth emits a small, escaped subset of HTML (no scripts or styles).
          dangerouslySetInnerHTML={{ __html: html || "<p>This document has no readable text.</p>" }}
        />
      )}
    </div>
  )
}
