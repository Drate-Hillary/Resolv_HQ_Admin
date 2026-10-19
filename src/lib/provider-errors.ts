export interface ProviderFailure {
  provider: string
  error: string
  cause: string
  fix: string
}

const PREFIX = "All registered providers failed:"

/** True when `text` is the gateway's combined "every provider failed" message. */
export function isProviderFailureMessage(text: string | null | undefined): text is string {
  return !!text && text.trimStart().startsWith(PREFIX)
}

const MAX_ERROR_CHARS = 180

/** How long the provider says to wait, e.g. "Please retry in 18h18m31.5s" -> "about 18 hours". */
function retryHint(raw: string): string | null {
  const m = raw.match(/retry (?:in|after)\s+(?:(\d+)h)?\s*(?:(\d+)m(?!s))?\s*(?:(\d+(?:\.\d+)?)s)?/i)
  if (!m || (!m[1] && !m[2] && !m[3])) return null
  const hours = Number(m[1] ?? 0)
  const minutes = Number(m[2] ?? 0)
  const seconds = Math.ceil(Number(m[3] ?? 0))
  if (hours) return `about ${hours} hour${hours === 1 ? "" : "s"}`
  if (minutes) return `about ${minutes} minute${minutes === 1 ? "" : "s"}`
  return `${seconds} second${seconds === 1 ? "" : "s"}`
}

/** Pulls the human message out of a raw provider error (`400 {"error":{"message":…}}`, `Google 503: {…}`, plain text). */
function summarize(raw: string): string {
  const code = raw.match(/\b([1-5]\d{2})\b/)?.[1]
  let message = raw.trim()
  const brace = raw.indexOf("{")
  if (brace !== -1) {
    try {
      const parsed = JSON.parse(raw.slice(brace).trim()) as { error?: { message?: string } | string; message?: string }
      const inner = typeof parsed.error === "string" ? parsed.error : parsed.error?.message
      message = inner ?? parsed.message ?? message
    } catch {
      // not JSON — keep the raw text
    }
  } else if (code) {
    message = raw.replace(/^\D*\d{3}:?\s*/, "").trim() || message
  }
  // Keep the first line; drop links and "for more information" tails.
  message = message
    .split(/\r?\n/)[0]
    .replace(/\s*For more information[^.]*\./i, "")
    .replace(/https?:\/\/\S+/g, "")
    .replace(/\s+/g, " ")
    .trim()
  if (message.length > MAX_ERROR_CHARS) message = `${message.slice(0, MAX_ERROR_CHARS).trimEnd()}…`
  return code ? `${code}, "${message}"` : `"${message}"`
}

function diagnose(raw: string): { cause: string; fix: string } {
  const text = raw.toLowerCase()
  const wait = retryHint(raw)
  const quota = /exceeded your current quota|free_tier|quota exceeded|resource_exhausted/.test(text)
  if (/credit balance|insufficient_quota|no credits|out of credits|payment required|\b402\b/.test(text)) {
    return {
      cause: "The account has run out of credit.",
      fix: "Add credit in the provider's billing settings, or turn this provider off on the AI Models page.",
    }
  }
  if (quota && /free_tier|free tier/.test(text)) {
    return {
      cause: `The free-tier quota is used up${wait ? `; the provider says it resets in ${wait}` : ""}.`,
      fix: "Move this key to a billed plan, or wait for the quota to reset. Other active providers are used meanwhile.",
    }
  }
  if (quota || /billing/.test(text)) {
    return {
      cause: "The account has hit its usage quota or has no billing set up.",
      fix: "Check the plan and billing in the provider's console.",
    }
  }
  const model = raw.match(/model [`'"]?([\w.:-]+)[`'"]?/i)?.[1]
  if (/\b404\b/.test(text) && /model/.test(text)) {
    return {
      cause: `The provider row names a model${model ? ` (${model})` : ""} that doesn't exist or this key can't access.`,
      fix: "Change the model on that provider to one the account can use. You can do this on the AI Models page.",
    }
  }
  if (/\b429\b|rate limit|too many requests/.test(text)) {
    return {
      cause: `Too many requests were sent to the provider${wait ? `; it asks you to wait ${wait}` : ""}.`,
      fix: "Wait and retry, or use a key with a higher limit.",
    }
  }
  if (/\b50[234]\b|unavailable|high demand|overloaded/.test(text)) {
    return {
      cause: "The provider is overloaded or temporarily down.",
      fix: "Retry in a few minutes. Another provider takes over if one is active.",
    }
  }
  if (/fetch failed|econnrefused|enotfound|etimedout|network|timed out/.test(text)) {
    return {
      cause: "The backend couldn't reach the provider (network failure).",
      fix: "Check the server's internet connection and the provider's endpoint, then retry.",
    }
  }
  if (/\b40[13]\b|api key|unauthorized|permission/.test(text)) {
    return { cause: "The API key is missing, invalid or lacks permission.", fix: "Update the provider's API key on the AI Models page." }
  }
  if (/no client implementation/.test(text)) {
    return {
      cause: "This provider type isn't supported by the gateway yet.",
      fix: "Deactivate it, or switch it to a supported provider.",
    }
  }
  return { cause: "The provider returned an unexpected error.", fix: "Check the provider's configuration and try again." }
}

/** Builds the Provider / Error / Cause / Fix entry for one raw provider error string. */
export function describeProviderError(provider: string, raw: string): ProviderFailure {
  return { provider, error: summarize(raw), ...diagnose(raw) }
}

/** Splits the gateway's combined failure message into one structured entry per provider. */
export function parseProviderFailures(message: string): ProviderFailure[] {
  const body = message.trimStart().slice(PREFIX.length).trim()
  return body
    .split(/;\s+(?=[^;:]{1,60}: )/)
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => {
      const sep = part.indexOf(": ")
      const provider = sep === -1 ? "Unknown provider" : part.slice(0, sep)
      const raw = sep === -1 ? part : part.slice(sep + 2)
      return describeProviderError(provider, raw)
    })
}

/**
 * One plain sentence for toasts and chat: how many providers failed and why.
 * The per-provider detail lives in the Provider / Error / Cause / Fix cards.
 */
export function summarizeProviderFailures(message: string): string {
  const failures = parseProviderFailures(message)
  if (failures.length === 0) return "No AI provider is available. Check the AI Models page."
  const causes = [...new Set(failures.map((f) => f.cause))]
  const lead = failures.length === 1 ? "The AI provider couldn't answer." : `All ${failures.length} AI providers couldn't answer.`
  if (causes.length === 1) return `${lead} ${causes[0]} Open Traces and Logs for the fix.`
  const each = failures.map((f) => `${f.provider}: ${f.cause.replace(/\.$/, "")}`)
  return `${lead} ${each.join("; ")}. Open Traces and Logs for the fix for each.`
}
