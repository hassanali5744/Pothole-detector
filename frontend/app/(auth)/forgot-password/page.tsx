"use client";

import { useState } from "react";
import Link from "next/link";
import { Map, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { APP_NAME } from "@/lib/constants";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSent(true);
  };

  if (sent) {
    return (
      <Card className="overflow-hidden shadow-[var(--shadow-elevated)]">
        <div className="h-1.5 bg-gradient-to-r from-brand-700 via-accent-500 to-brand-700" />
        <CardContent className="py-14 text-center">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-success-soft">
            <CheckCircle className="h-7 w-7 text-success" />
          </div>
          <h2 className="font-display text-xl font-semibold text-ink">Check your email</h2>
          <p className="mt-2 text-sm text-muted">
            We&apos;ve sent a password reset link to <strong className="text-ink">{email}</strong>
          </p>
          <Link href="/login" className="mt-8 inline-block">
            <Button variant="outline">Back to Sign In</Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden shadow-[var(--shadow-elevated)]">
      <div className="h-1.5 bg-gradient-to-r from-brand-700 via-accent-500 to-brand-700" />
      <CardHeader className="pb-2 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-800 shadow-[0_4px_12px_rgba(12,25,41,0.25)]">
          <Map className="h-6 w-6 text-accent-200" />
        </div>
        <CardTitle className="font-display text-2xl">Forgot password?</CardTitle>
        <CardDescription>
          Enter your email and we&apos;ll send you a reset link
        </CardDescription>
      </CardHeader>
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
          <Button type="submit" className="w-full">
            Send Reset Link
          </Button>
        </form>
        <p className="mt-8 text-center text-sm text-muted">
          Remember your password?{" "}
          <Link href="/login" className="font-semibold text-accent-600 hover:text-accent-700">
            Sign In
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
