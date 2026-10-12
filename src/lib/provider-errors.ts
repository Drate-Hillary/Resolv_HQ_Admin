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
  return code ? `${code}, "${message}"` : `"${message}"`
}

function diagnose(raw: string): { cause: string; fix: string } {
  const text = raw.toLowerCase()
  if (/credit balance|insufficient_quota|billing|payment required|\b402\b/.test(text)) {
    return { cause: "The account has no credit.", fix: "Add credit under Plans & Billing." }
  }
  const model = raw.match(/model [`'"]?([\w.:-]+)[`'"]?/i)?.[1]
  if (/\b404\b/.test(text) && /model/.test(text)) {
    return {
      cause: `The provider row names a model${model ? ` (${model})` : ""} that doesn't exist or this key can't access.`,
      fix: "Change the model on that provider to one the account can use. You can do this on the Providers page.",
    }
  }
  if (/\b429\b|rate limit|resource_exhausted|too many requests/.test(text)) {
    return {
      cause: "The provider's rate or usage limit was reached (free tiers allow very few requests per minute).",
      fix: "Wait and retry, or use a billed key.",
    }
  }
  if (/\b50[234]\b|unavailable|high demand|overloaded/.test(text)) {
    return { cause: "The provider is overloaded or temporarily down.", fix: "Retry later, or use a billed key." }
  }
  if (/fetch failed|econnrefused|enotfound|etimedout|network|timed out/.test(text)) {
    return {
      cause: "The backend couldn't reach the provider (network failure).",
      fix: "Check the server's internet connection and the provider's endpoint, then retry.",
    }
  }
  if (/\b40[13]\b|api key|unauthorized|permission/.test(text)) {
    return { cause: "The API key is missing, invalid or lacks permission.", fix: "Update the provider's API key." }
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
