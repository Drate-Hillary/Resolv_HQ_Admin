import { useRef, useState } from "react"
import { toast } from "sonner"
import { Attachment01Icon, BookOpen01Icon, File02Icon, SparklesIcon } from "@hugeicons/core-free-icons"
import { apiClient } from "@/backend/api/client"
import { getErrorMessage } from "@/lib/errors"
import { Button } from "@/components/ui/button"
import { Icon } from "@/components/ui/icon"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Progress } from "@/components/ui/progress"
import { useCallerRole } from "@/hooks/use-caller-role"
import { useConsoleStore } from "@/lib/stores/console-store"

type Mode = "knowledge" | "summarize"

interface Job {
  mode: Mode
  name: string
  /** Bytes sent, 0-100. */
  progress: number
  /** The upload finished and the backend is working on the file. */
  processing: boolean
}

const ACCEPT: Record<Mode, string> = {
  knowledge: ".pdf,.doc,.docx,.txt,.md,.csv",
  summarize: ".pdf,.docx,.txt,.md,.csv",
}

/** Paperclip in the composer: a popover to either add a document to the knowledge base or have the agent summarise it. */
export function AttachDocument({
  disabled,
  onSummary,
}: {
  disabled?: boolean
  /** Where the summary goes; defaults to the console workspace chat. */
  onSummary?: (fileName: string, summary: string) => void
}) {
  // Only staff can add to the knowledge base; anyone (customers too) can have a document summarised.
  const role = useCallerRole()
  const canAddToKnowledge = role === "admin" || role === "agent"
  const inputRef = useRef<HTMLInputElement>(null)
  const modeRef = useRef<Mode>("knowledge")
  const [open, setOpen] = useState(false)
  const [job, setJob] = useState<Job | null>(null)
  const providerId = useConsoleStore((s) => s.selectedProviderId)
  const addConsoleSummary = useConsoleStore((s) => s.addDocumentSummary)
  const addDocumentSummary = onSummary ?? addConsoleSummary

  const choose = (mode: Mode) => {
    modeRef.current = mode
    if (inputRef.current) {
      inputRef.current.accept = ACCEPT[mode]
      inputRef.current.click()
    }
  }

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ""
    if (!file) return
    const mode = canAddToKnowledge ? modeRef.current : "summarize"

    setJob({ mode, name: file.name, progress: 0, processing: false })
    const onUploadProgress = (event: { loaded: number; total?: number }) => {
      const progress = event.total ? Math.round((event.loaded * 100) / event.total) : 0
      setJob((j) => (j ? { ...j, progress, processing: progress >= 100 } : j))
    }

    try {
      const form = new FormData()
      form.append("file", file)
      if (mode === "knowledge") {
        await apiClient.post("/admin/knowledge", form, { onUploadProgress })
        toast.success(`${file.name} added to the knowledge base`, {
          description: "It is being indexed and will show as published shortly.",
        })
      } else {
        if (providerId && canAddToKnowledge) form.append("providerId", providerId)
        const { data } = await apiClient.post<{ summary: string; truncated: boolean }>("/chat/summarize-document", form, {
          onUploadProgress,
          timeout: 120_000,
        })
        addDocumentSummary(
          file.name,
          data.truncated
            ? `${data.summary}\n\n_Only the first part of this document was summarised because it is long._`
            : data.summary
        )
      }
      setOpen(false)
    } catch (err) {
      toast.error(
        getErrorMessage(err, mode === "knowledge" ? "Could not upload the document." : "Could not summarise the document.")
      )
    } finally {
      setJob(null)
    }
  }

  return (
    <>
      <input ref={inputRef} type="file" className="hidden" onChange={onFile} />
      <Popover open={open} onOpenChange={(next) => (job ? undefined : setOpen(next))}>
        <PopoverTrigger
          render={
            <Button
              variant="ghost"
              size="icon"
              className="size-9 shrink-0 rounded-full text-muted-foreground"
              aria-label="Attach a document"
              disabled={disabled}
            />
          }
        >
          <Icon icon={Attachment01Icon} size={18} />
        </PopoverTrigger>
        <PopoverContent side="top" align="start" className="w-72 p-2">
          {job ? (
            <div className="flex flex-col gap-2 p-1">
              <div className="flex items-center gap-2">
                <Icon icon={File02Icon} size={16} className="shrink-0 text-muted-foreground" />
                <span className="min-w-0 flex-1 truncate font-medium text-foreground">{job.name}</span>
                <span className="tabular shrink-0 text-muted-foreground">{job.progress}%</span>
              </div>
              <Progress value={job.progress} />
              <p className="text-muted-foreground">
                {job.processing
                  ? job.mode === "summarize"
                    ? "The agent is reading the document…"
                    : "Adding to the knowledge base…"
                  : "Uploading…"}
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-0.5">
              {canAddToKnowledge && (
                <Option
                  icon={BookOpen01Icon}
                  title="Add to knowledge base"
                  hint="The agent can cite it in future answers"
                  onClick={() => choose("knowledge")}
                />
              )}
              <Option
                icon={SparklesIcon}
                title="Summarise for me"
                hint="Read once here, nothing is stored"
                onClick={() => choose("summarize")}
              />
            </div>
          )}
        </PopoverContent>
      </Popover>
    </>
  )
}

function Option({
  icon,
  title,
  hint,
  onClick,
}: {
  icon: typeof Attachment01Icon
  title: string
  hint: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-start gap-2.5 rounded-md p-2 text-left outline-none hover:bg-accent focus-visible:bg-accent"
    >
      <Icon icon={icon} size={16} className="mt-0.5 shrink-0 text-muted-foreground" />
      <span className="flex flex-col">
        <span className="font-medium text-foreground">{title}</span>
        <span className="text-muted-foreground">{hint}</span>
      </span>
    </button>
  )
}
