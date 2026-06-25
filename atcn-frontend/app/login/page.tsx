"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { AlertTriangle, Loader2, BarChart3 } from "lucide-react";

export default function LoginPage() {
  const { login, register } = useAuth();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [mode, setMode]       = useState<"login" | "register">("login");
  const [email, setEmail]     = useState("");
  const [name, setName]       = useState("");
  const [password, setPass]   = useState("");
  const [error, setError]     = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      try {
        if (mode === "login") {
          await login(email, password);
        } else {
          await register(email, name, password);
        }
        router.push("/");
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Authentication failed");
      }
    });
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-base p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="mb-8 flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center border border-signal-amber/40 bg-signal-amberDim">
            <BarChart3 size={18} className="text-signal-amber" />
          </div>
          <div>
            <div className="font-mono text-sm font-semibold tracking-widest text-ink">ATCN</div>
            <div className="text-2xs text-ink-tertiary">AI Trading Copilot Network</div>
          </div>
        </div>

        {/* Card */}
        <div className="border border-line bg-base-panel p-6">
          <div className="mb-6">
            <h1 className="font-mono text-base font-semibold text-ink">
              {mode === "login" ? "Sign in to your desk" : "Create your account"}
            </h1>
            <p className="mt-1 text-2xs text-ink-tertiary">
              {mode === "login"
                ? "Enter your credentials to access the platform."
                : "Set up your ATCN account to get started."}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {mode === "register" && (
              <Field
                label="Full Name"
                type="text"
                value={name}
                onChange={setName}
                placeholder="Arjun Sharma"
                required
              />
            )}
            <Field
              label="Email"
              type="email"
              value={email}
              onChange={setEmail}
              placeholder="you@fund.com"
              required
            />
            <Field
              label="Password"
              type="password"
              value={password}
              onChange={setPass}
              placeholder="••••••••"
              required
            />

            {error && (
              <div className="flex items-start gap-2 border border-neg/30 bg-neg/10 px-3 py-2">
                <AlertTriangle size={13} className="mt-0.5 shrink-0 text-neg" />
                <span className="text-2xs text-neg">{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isPending}
              className="flex items-center justify-center gap-2 border border-signal-amber/40 bg-signal-amberDim py-2.5 text-xs font-medium text-signal-amber transition-colors hover:bg-signal-amber/20 disabled:opacity-50 focus-ring"
            >
              {isPending && <Loader2 size={13} className="animate-spin" />}
              {mode === "login" ? "Sign In" : "Create Account"}
            </button>
          </form>

          <div className="mt-4 border-t border-line-soft pt-4 text-center text-2xs text-ink-tertiary">
            {mode === "login" ? (
              <>
                New to ATCN?{" "}
                <button
                  onClick={() => { setMode("register"); setError(null); }}
                  className="text-signal-amber hover:underline focus-ring"
                >
                  Create account
                </button>
              </>
            ) : (
              <>
                Already have an account?{" "}
                <button
                  onClick={() => { setMode("login"); setError(null); }}
                  className="text-signal-amber hover:underline focus-ring"
                >
                  Sign in
                </button>
              </>
            )}
          </div>
        </div>

        <p className="mt-4 text-center text-2xs text-ink-tertiary">
          NSE-focused institutional intelligence platform
        </p>
      </div>
    </div>
  );
}

function Field({
  label, type, value, onChange, placeholder, required,
}: {
  label: string; type: string; value: string;
  onChange: (v: string) => void; placeholder: string; required?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-2xs text-ink-tertiary">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        className="border border-line bg-base-raised px-3 py-2 font-mono text-xs text-ink placeholder:text-ink-tertiary focus:border-signal-amber/60 focus:outline-none"
      />
    </div>
  );
}
