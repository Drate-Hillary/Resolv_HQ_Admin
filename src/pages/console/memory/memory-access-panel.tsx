"use client"

import { useEffect, useState, type FormEvent } from "react"
import { apiClient } from "@/backend/api/client"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"

interface MemoryFact {
  id: string
  key: string
  value: string
  enabled: boolean
}

interface CustomerOption {
  id: string
  name: string
  email: string | null
  memoryEnabled?: boolean
}

interface CustomerMemoryResponse {
  customer: CustomerOption
  memoryEnabled: boolean
  facts: MemoryFact[]
}

function getErrorMessage(error: unknown) {
  if (typeof error === "object" && error !== null && "response" in error) {
    const response = (error as { response?: { data?: { error?: string; message?: string } } }).response
    if (response?.data?.error) return response.data.error
    if (response?.data?.message) return response.data.message
  }
  return error instanceof Error ? error.message : "Request failed. Please try again."
}

export function MemoryAccessPanel() {
  const [staffFacts, setStaffFacts] = useState<MemoryFact[]>([])
  const [staffLoading, setStaffLoading] = useState(true)
  const [staffLoadFailed, setStaffLoadFailed] = useState(false)
  const [search, setSearch] = useState("")
  const [customers, setCustomers] = useState<CustomerOption[]>([])
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerOption | null>(null)
  const [customerFacts, setCustomerFacts] = useState<MemoryFact[]>([])
  const [searchFailed, setSearchFailed] = useState(false)
  const [searching, setSearching] = useState(false)
  const [customerLoading, setCustomerLoading] = useState(false)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    apiClient
      .get<MemoryFact[]>("/admin/memory/me")
      .then(({ data }) => {
        if (!cancelled) setStaffFacts(data)
      })
      .catch((requestError: unknown) => {
        if (!cancelled) {
          setStaffLoadFailed(true)
          setError(getErrorMessage(requestError))
        }
      })
      .finally(() => {
        if (!cancelled) setStaffLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  async function searchCustomers(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const query = search.trim()
    if (query.length < 2) {
      setError("Enter at least two characters to search for a customer.")
      return
    }

    setError(null)
    setSearching(true)
    setSearchFailed(false)
    setSelectedCustomer(null)
    setCustomerFacts([])
    try {
      const { data } = await apiClient.get<CustomerOption[]>("/admin/memory/customers", {
        params: { search: query },
      })
      setCustomers(data)
    } catch (requestError) {
      setSearchFailed(true)
      setError(getErrorMessage(requestError))
      setCustomers([])
    } finally {
      setSearching(false)
    }
  }

  async function selectCustomer(customer: CustomerOption) {
    setSelectedCustomer(customer)
    setCustomerFacts([])
    setError(null)
    setCustomerLoading(true)
    try {
      const { data } = await apiClient.get<CustomerMemoryResponse>(
        `/admin/memory/customers/${customer.id}`,
      )
      setSelectedCustomer({ ...data.customer, memoryEnabled: data.memoryEnabled })
      setCustomerFacts(data.facts)
    } catch (requestError) {
      setError(getErrorMessage(requestError))
      setSelectedCustomer(null)
    } finally {
      setCustomerLoading(false)
    }
  }

  async function saveFact(fact: MemoryFact, customerId?: string) {
    const scope = customerId
      ? `/admin/memory/customers/${customerId}/${fact.id}`
      : `/admin/memory/me/${fact.id}`
    setBusyId(fact.id)
    setError(null)
    try {
      const { data } = await apiClient.patch<MemoryFact>(scope, fact)
      const update = (previous: MemoryFact[]) => previous.map((item) => (item.id === fact.id ? data : item))
      if (customerId) setCustomerFacts(update)
      else setStaffFacts(update)
    } catch (requestError) {
      setError(getErrorMessage(requestError))
    } finally {
      setBusyId(null)
    }
  }

  async function deleteFact(fact: MemoryFact, customerId?: string) {
    const scope = customerId
      ? `/admin/memory/customers/${customerId}/${fact.id}`
      : `/admin/memory/me/${fact.id}`
    setBusyId(fact.id)
    setError(null)
    try {
      await apiClient.delete(scope)
      if (customerId) setCustomerFacts((previous) => previous.filter((item) => item.id !== fact.id))
      else setStaffFacts((previous) => previous.filter((item) => item.id !== fact.id))
    } catch (requestError) {
      setError(getErrorMessage(requestError))
    } finally {
      setBusyId(null)
    }
  }

  async function createFact(key: string, value: string, customerId?: string): Promise<boolean> {
    setBusyId("create")
    setError(null)
    try {
      const path = customerId ? `/admin/memory/customers/${customerId}` : "/admin/memory/me"
      const { data } = await apiClient.post<MemoryFact>(path, { key, value })
      if (customerId) setCustomerFacts((previous) => [...previous, data])
      else setStaffFacts((previous) => [...previous, data])
      return true
    } catch (requestError) {
      setError(getErrorMessage(requestError))
      return false
    } finally {
      setBusyId(null)
    }
  }

  async function toggleCustomerMemory(enabled: boolean) {
    if (!selectedCustomer) return
    setBusyId("customer-memory-toggle")
    setError(null)
    try {
      const { data } = await apiClient.patch<{ memoryEnabled: boolean }>(
        `/admin/memory/customers/${selectedCustomer.id}/preferences`,
        { memoryEnabled: enabled },
      )
      setSelectedCustomer({ ...selectedCustomer, memoryEnabled: data.memoryEnabled })
    } catch (requestError) {
      setError(getErrorMessage(requestError))
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {error && (
        <div role="alert" className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive lg:col-span-2">
          {error}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>My staff memory</CardTitle>
          <p className="text-xs text-muted-foreground">
            Private notes owned by your staff account. They are separate from customer memory and
            are not injected into customer chat.
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          {staffLoading ? (
            <p className="text-sm text-muted-foreground">Loading your memory…</p>
          ) : staffLoadFailed ? (
            <p className="text-sm text-destructive">
              Could not load staff memory. Refresh the page to try again.
            </p>
          ) : (
            <>
              {staffFacts.map((fact) => (
                <MemoryFactEditor
                  key={fact.id}
                  fact={fact}
                  busy={busyId === fact.id}
                  enabledLabel="Enabled (not used in customer chat)"
                  onSave={(updated) => saveFact(updated)}
                  onDelete={() => deleteFact(fact)}
                />
              ))}
              {staffFacts.length === 0 && (
                <p className="text-sm text-muted-foreground">No staff memory records.</p>
              )}
              <NewFactForm busy={busyId === "create"} onCreate={(key, value) => createFact(key, value)} />
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Customer memory</CardTitle>
          <p className="text-xs text-muted-foreground">
            Search for a specific customer before opening their saved facts. Views and staff
            changes are recorded in the memory access audit log.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={searchCustomers} className="flex gap-2">
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by customer name or email"
              aria-label="Search customers by name or email"
              maxLength={100}
            />
            <Button type="submit" disabled={searching}>
              {searching ? "Searching…" : "Search"}
            </Button>
          </form>

          {customers.length > 0 && (
            <div className="max-h-44 space-y-1 overflow-y-auto rounded-md border border-border p-2">
              {customers.map((customer) => (
                <button
                  key={customer.id}
                  type="button"
                  onClick={() => void selectCustomer(customer)}
                  className="flex w-full items-center justify-between gap-3 rounded px-2 py-2 text-left text-xs hover:bg-muted"
                >
                  <span className="font-medium text-foreground">{customer.name}</span>
                  <span className="truncate text-muted-foreground">{customer.email}</span>
                </button>
              ))}
            </div>
          )}
          {!searching && !searchFailed && search.trim().length >= 2 && customers.length === 0 && !selectedCustomer && (
            <p className="text-xs text-muted-foreground">No matching customers found.</p>
          )}

          {selectedCustomer && (
            <div className="space-y-3 border-t border-border pt-3">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-foreground">{selectedCustomer.name}</h3>
                  <Badge variant="outline">Selected customer</Badge>
                </div>
                <p className="text-xs text-muted-foreground">{selectedCustomer.email}</p>
              </div>
              <label className="flex items-center gap-2 rounded-md border border-border p-3 text-xs text-foreground">
                <input
                  type="checkbox"
                  checked={selectedCustomer.memoryEnabled ?? true}
                  disabled={busyId === "customer-memory-toggle"}
                  onChange={(event) => void toggleCustomerMemory(event.target.checked)}
                />
                {busyId === "customer-memory-toggle" ? "Saving master setting…" : "Memory enabled for customer chat"}
              </label>
              {customerLoading ? (
                <p className="text-sm text-muted-foreground">Loading selected customer memory…</p>
              ) : (
                <>
                  {customerFacts.map((fact) => (
                    <MemoryFactEditor
                      key={fact.id}
                      fact={fact}
                      busy={busyId === fact.id}
                      onSave={(updated) => saveFact(updated, selectedCustomer.id)}
                      onDelete={() => deleteFact(fact, selectedCustomer.id)}
                    />
                  ))}
                  {customerFacts.length === 0 && (
                    <p className="text-sm text-muted-foreground">This customer has no saved facts.</p>
                  )}
                  <NewFactForm
                    busy={busyId === "create"}
                    onCreate={(key, value) => createFact(key, value, selectedCustomer.id)}
                  />
                </>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function MemoryFactEditor({
  fact,
  busy,
  enabledLabel = "Enabled for customer chat",
  onSave,
  onDelete,
}: {
  fact: MemoryFact
  busy: boolean
  enabledLabel?: string
  onSave: (fact: MemoryFact) => void
  onDelete: () => void
}) {
  const [key, setKey] = useState(fact.key)
  const [value, setValue] = useState(fact.value)
  const [enabled, setEnabled] = useState(fact.enabled)

  return (
    <div className="space-y-2 rounded-md border border-border/70 bg-muted/20 p-3">
      <Input value={key} onChange={(event) => setKey(event.target.value)} aria-label="Memory key" maxLength={64} />
      <Input value={value} onChange={(event) => setValue(event.target.value)} aria-label="Memory value" maxLength={2000} />
      <div className="flex flex-wrap items-center justify-between gap-2">
        <label className="flex items-center gap-2 text-xs text-muted-foreground">
          <input type="checkbox" checked={enabled} onChange={(event) => setEnabled(event.target.checked)} />
          {enabledLabel}
        </label>
        <div className="flex gap-2">
          <Button type="button" size="sm" onClick={() => onSave({ ...fact, key, value, enabled })} disabled={busy}>
            {busy ? "Saving…" : "Save"}
          </Button>
          <Button
            type="button"
            size="sm"
            variant="destructive"
            onClick={() => {
              if (window.confirm("Delete this memory fact? This cannot be undone.")) onDelete()
            }}
            disabled={busy}
          >
            Delete
          </Button>
        </div>
      </div>
    </div>
  )
}

function NewFactForm({
  busy,
  onCreate,
}: {
  busy: boolean
  onCreate: (key: string, value: string) => Promise<boolean>
}) {
  const [key, setKey] = useState("")
  const [value, setValue] = useState("")

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!key.trim() || !value.trim()) return
    void onCreate(key.trim(), value.trim()).then((created) => {
      if (created) {
        setKey("")
        setValue("")
      }
    })
  }

  return (
    <form onSubmit={submit} className="space-y-2 rounded-md border border-dashed border-border p-3">
      <p className="text-xs font-medium text-foreground">Add a memory fact</p>
      <Input value={key} onChange={(event) => setKey(event.target.value)} placeholder="Key" aria-label="New memory key" maxLength={64} />
      <Input value={value} onChange={(event) => setValue(event.target.value)} placeholder="Value" aria-label="New memory value" maxLength={2000} />
      <Button type="submit" size="sm" variant="outline" disabled={busy || !key.trim() || !value.trim()}>
        {busy ? "Adding…" : "Add fact"}
      </Button>
    </form>
  )
}
