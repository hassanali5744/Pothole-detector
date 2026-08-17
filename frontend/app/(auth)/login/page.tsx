"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Map, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuthStore } from "@/lib/store/auth-store";
import { APP_NAME } from "@/lib/constants";
import { SlideInUp, ScaleIn, FadeIn, StaggerChildren, HoverLift } from "@/components/animations";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuthStore();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const success = await login(email, password);
    if (success) {
      const user = useAuthStore.getState().user;
      const redirect =
        user?.role === "admin"
          ? "/admin"
          : user?.role === "inspector"
            ? "/inspector"
            : "/citizen";
      router.push(redirect);
    } else {
      setError("Invalid email or password. Try demo accounts below.");
    }
    setLoading(false);
  };

  const demoLogin = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword("demo123");
  };

  return (
    <SlideInUp duration={0.6}>
      <Card className="overflow-hidden shadow-[var(--shadow-elevated)]">
        <div className="h-1.5 bg-gradient-to-r from-brand-700 via-accent-500 to-brand-700" />
        <ScaleIn duration={0.5}>
          <CardHeader className="pb-2 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-800 shadow-[0_4px_12px_rgba(12,25,41,0.25)]">
              <Map className="h-6 w-6 text-accent-200" />
            </div>
            <CardTitle className="font-display text-2xl">Welcome back</CardTitle>
            <CardDescription>Sign in to your {APP_NAME} account</CardDescription>
          </CardHeader>
        </ScaleIn>
        <FadeIn duration={0.5} delay={0.2}>
          <CardContent className="pb-8">
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                id="email"
                label="Email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <div className="relative">
                <Input
                  id="password"
                  label="Password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="absolute right-3 top-10 text-muted hover:text-ink"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>

              {error && (
                <p className="rounded-xl bg-danger-soft px-3 py-2.5 text-sm font-medium text-danger">
                  {error}
                </p>
              )}

              <div className="flex justify-end">
                <Link href="/forgot-password" className="text-sm font-semibold text-accent-600 hover:text-accent-700">
                  Forgot password?
                </Link>
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Signing in..." : "Sign In"}
              </Button>
            </form>

            <StaggerChildren staggerDelay={0.1} className="mt-8 space-y-2">
              <p className="text-center text-[10px] font-bold uppercase tracking-[0.14em] text-muted">
                Demo Accounts
              </p>
              {[
                { email: "citizen@roadvision.ai", role: "Citizen" },
                { email: "inspector@roadvision.ai", role: "Inspector" },
                { email: "admin@roadvision.ai", role: "Admin" },
              ].map((demo) => (
                <HoverLift key={demo.email}>
                  <button
                    type="button"
                    onClick={() => demoLogin(demo.email)}
                    className="flex w-full items-center justify-between rounded-xl border border-line bg-surface-muted/40 px-4 py-2.5 text-sm transition-colors hover:border-line-strong hover:bg-surface-muted"
                  >
                    <span className="font-medium text-ink-secondary">{demo.role}</span>
                    <span className="text-xs text-muted">{demo.email}</span>
                  </button>
                </HoverLift>
              ))}
            </StaggerChildren>

            <p className="mt-8 text-center text-sm text-muted">
              Don&apos;t have an account?{" "}
              <Link href="/register" className="font-semibold text-accent-600 hover:text-accent-700">
                Register
              </Link>
            </p>
          </CardContent>
        </FadeIn>
      </Card>
    </SlideInUp>
  );
}
