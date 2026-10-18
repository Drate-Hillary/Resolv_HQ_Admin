import { cn } from "cn"

type Block = { type: "p"; text: string } | { type: "ul" | "ol"; items: string[] }

const BULLET = /^\s*[-*•]\s+/
const NUMBER = /^\s*\d+[.)]\s+/

/** Splits plain text on blank lines; a run of "- " or "1." lines becomes a list. */
function toBlocks(content: string): Block[] {
  const blocks: Block[] = []
  for (const chunk of content.replace(/\r\n/g, "\n").trim().split(/\n{2,}/)) {
    let list: Block | null = null
    let text: string[] = []
    const flushText = () => {
      if (text.length) blocks.push({ type: "p", text: text.join("\n") })
      text = []
    }
    for (const line of chunk.split("\n")) {
      const kind = BULLET.test(line) ? "ul" : NUMBER.test(line) ? "ol" : null
      if (!kind) {
        list = null
        text.push(line)
        continue
      }
      flushText()
      if (!list || list.type !== kind) {
        list = { type: kind, items: [] }
        blocks.push(list)
      }
      list.items.push(line.replace(kind === "ul" ? BULLET : NUMBER, ""))
    }
    flushText()
  }
  return blocks
}

/** Renders a reply as real paragraphs and lists with space between them. */
export function ReplyText({ content, className }: { content: string; className?: string }) {
  return (
    <div className={cn("flex flex-col gap-3 text-pretty", className)}>
      {toBlocks(content).map((b, i) =>
        b.type === "p" ? (
          <p key={i} className="whitespace-pre-line">
            {b.text}
          </p>
        ) : (
          <ul key={i} className={cn("flex flex-col gap-1 pl-5", b.type === "ul" ? "list-disc" : "list-decimal")}>
            {b.items.map((item, j) => (
              <li key={j}>{item}</li>
            ))}
          </ul>
        )
      )}
    </div>
  )
}
