"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { useChatStore } from "@/lib/stores/chat-store"

export function MemorySettings() {
  const customerMemoryFacts = useChatStore((s) => s.customerMemoryFacts)
  const loadMemoryFacts = useChatStore((s) => s.loadMemoryFacts)
  const toggleMemoryFact = useChatStore((s) => s.toggleMemoryFact)
  const updateMemoryFactValue = useChatStore((s) => s.updateMemoryFactValue)

  useEffect(() => {
    loadMemoryFacts()
  }, [loadMemoryFacts])

  return (
    <Card className="border-border/70 bg-card/85 shadow-sm backdrop-blur-sm">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-sm font-medium">
          <span>Saved information</span>
          <span className="rounded-full border border-primary/20 bg-primary/5 px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.12em] text-primary">
            Profile
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-xs text-muted-foreground">
          These facts stay in your chat context and help the agent personalize replies without
          authorizing any real action on their own.
        </p>

        {customerMemoryFacts.map((fact) => (
          <div
            key={fact.id}
            className="space-y-2 rounded-md border border-border/70 bg-muted/20 p-3"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="text-xs font-medium text-foreground">{fact.label}</div>
              <Button
                type="button"
                variant={fact.enabled ? "default" : "outline"}
                size="sm"
                aria-pressed={fact.enabled}
                onClick={() => toggleMemoryFact(fact.id, !fact.enabled)}
                className="min-w-[72px]"
              >
                {fact.enabled ? "On" : "Off"}
              </Button>
            </div>

            {fact.id === "preferred-contact-method" ? (
              <select
                aria-label={fact.label}
                value={fact.value}
                onChange={(event) => updateMemoryFactValue(fact.id, event.target.value)}
                className="h-8 w-full rounded-md border border-border bg-background px-2 text-xs text-foreground outline-none focus:border-ring focus:ring-2 focus:ring-ring/30"
              >
                <option value="email">Email</option>
                <option value="sms">SMS</option>
                <option value="phone call">Phone call</option>
              </select>
            ) : (
              <Input
                value={fact.value}
                onChange={(event) => updateMemoryFactValue(fact.id, event.target.value)}
                className="h-8 w-full text-xs"
                aria-label={fact.label}
              />
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
