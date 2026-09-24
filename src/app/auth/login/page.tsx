"use client";

import { Suspense, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Icon } from "@/components/ui/icon";
import { CheckmarkCircle02Icon, Cancel01Icon, SparklesIcon } from "@hugeicons/core-free-icons";
import { createClient } from "@/backend/supabase/client";

// Mirrors the boundary matrix enforced in resolv-hq-backend (see
// docs/ai-boundary-matrix.md and system-prompt-spec.md §4) — what this
// console actually is, shown before a single field is filled in, not
// decorative copy.
const BOUNDARY_ROWS = [
  { capability: "Draft an escalation ticket", aiAllowed: true },
  { capability: "Issue a refund", aiAllowed: false },
  { capability: "Change billing or account details", aiAllowed: false },
  { capability: "Cancel a service", aiAllowed: false },
];

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      setError(signInError.message);
      setLoading(false);
      return;
    }

    const next = searchParams.get("next") ?? "/dashboard";
    router.replace(next);
    router.refresh();
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-[minmax(0,5fr)_minmax(0,4fr)]">
      {/* Design column — what the console actually governs, not decoration */}
      <div className="relative flex-col justify-between hidden overflow-hidden dark bg-background px-14 py-14 text-foreground lg:flex">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center justify-center rounded-full size-8 bg-primary text-primary-foreground">
            <Icon icon={SparklesIcon} size={24} className="" />
          </div>
          <span className="text-sm font-medium tracking-tight">Resolv-HQ</span>
        </div>

        <div className="max-w-md">
          <h1 className="font-(family-name:--font-space-grotesk) text-[2.25rem] leading-[1.15] font-medium text-balance">
            A support agent that never signs its own name.
          </h1>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground text-pretty">
            It can search the knowledge base, check your account and request
            status, and draft an escalation ticket on its own. Everything
            below always stops for a person.
          </p>

          <dl className="mt-8 border-t divide-y divide-border border-border">
            {BOUNDARY_ROWS.map((row) => (
              <div
                key={row.capability}
                className="flex items-center justify-between gap-4 py-3"
              >
                <dt className="text-sm text-foreground">{row.capability}</dt>
                <dd className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Icon
                    icon={row.aiAllowed ? CheckmarkCircle02Icon : Cancel01Icon}
                    size={16}
                    className={row.aiAllowed ? "text-approve" : "text-destructive"}
                  />
                  {row.aiAllowed ? "AI, unsupervised" : "Human approval required"}
                </dd>
              </div>
            ))}
          </dl>
        </div>

        <p className="text-xs text-muted-foreground">
          Full boundary matrix under Guardrails, once you&rsquo;re in.
        </p>
      </div>

      {/* Input column */}
      <div className="flex items-center justify-center px-6 py-16 bg-background">
        <div className="w-full max-w-md">
          <div className="mb-10 space-y-1.5 lg:hidden">
            <div className="mb-6 flex items-center gap-2.5">
              <div className="flex items-center justify-center rounded-full size-8 bg-primary text-primary-foreground">
                <Icon icon={SparklesIcon} size={24} className="" />
              </div>
              <span className="text-sm font-medium tracking-tight">Resolv-HQ</span>
            </div>
          </div>

          <div className="mb-8 space-y-1.5">
            <h2 className="font-(family-name:--font-space-grotesk) text-2xl font-medium tracking-tight">
              Sign in
            </h2>
            <p className="text-sm text-muted-foreground">
              Staff accounts only — provisioned in Supabase, not self-serve.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <label htmlFor="email" className="text-sm font-medium text-foreground">
                Email
              </label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@resolv-hq.com"
                className="h-12 rounded-lg px-3.5 text-base md:text-base"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="password" className="text-sm font-medium text-foreground">
                Password
              </label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="••••••••"
                className="h-12 rounded-lg px-3.5 text-base md:text-base"
              />
            </div>

            {error && (
              <p className="rounded-lg border border-destructive/20 bg-destructive/10 px-3 py-2.5 text-sm text-destructive">
                {error}
              </p>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-12 text-base rounded-lg"
            >
              {loading ? "Signing in…" : "Sign in"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
