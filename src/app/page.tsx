"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Login failed");
        setLoading(false);
        return;
      }
      const next = new URLSearchParams(window.location.search).get("next");
      router.push(next && next.startsWith("/dashboard") ? next : "/dashboard");
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6">
      {/* Atmospheric background */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-accent/5 rounded-full blur-[100px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-accent/5 rounded-full blur-[100px]" />
      </div>

      <div className="glass-panel rounded-xl p-8 max-w-md w-full space-y-6">
        {/* Brand logo — full-colour lockup on a light plate so the teal reads
            on the dark page. File lives at public/layerforge-logo.png */}
        <div className="bg-black/40 backdrop-blur-md border border-white/10 shadow-lg rounded-2xl px-8 py-7 flex items-center justify-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/layerforge-logo.png"
            alt="LayerForge — Built with Precision"
            className="w-full max-w-[320px] h-auto"
          />
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="username" className="font-mono text-[11px] uppercase tracking-widest text-ink-mute">
              Username
            </label>
            <input
              id="username"
              type="text"
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="w-full px-4 py-3 bg-surface-2 border border-line rounded-lg text-ink text-sm placeholder:text-ink-mute focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/40 transition-colors"
              placeholder="Enter your username"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="password" className="font-mono text-[11px] uppercase tracking-widest text-ink-mute">
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-3 bg-surface-2 border border-line rounded-lg text-ink text-sm placeholder:text-ink-mute focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/40 transition-colors"
              placeholder="Enter your password"
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 px-3 py-2 bg-danger/10 border border-danger/20 rounded-lg">
              <span className="material-symbols-outlined text-danger text-[18px]">error</span>
              <span className="text-danger text-sm">{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-accent text-on-accent font-mono font-bold rounded-lg hover:bg-accent-hover active:bg-accent-press transition-colors flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="material-symbols-outlined text-lg animate-spin">progress_activity</span>
            ) : (
              <span className="material-symbols-outlined text-lg">login</span>
            )}
            {loading ? "Signing in…" : "Sign In"}
          </button>
        </form>

        <div className="flex items-center justify-center gap-4 opacity-40">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-sm">lock</span>
            <span className="font-mono text-[11px] uppercase tracking-widest">E2E Encrypted</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-sm">auto_awesome</span>
            <span className="font-mono text-[11px] uppercase tracking-widest">AI Moderated</span>
          </div>
        </div>
      </div>
    </main>
  );
}
