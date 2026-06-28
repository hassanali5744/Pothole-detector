"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Map } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuthStore } from "@/lib/store/auth-store";
import { APP_NAME } from "@/lib/constants";
import type { UserRole } from "@/lib/types";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>("citizen");
  const [loading, setLoading] = useState(false);
  const { register } = useAuthStore();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await register(name, email, password, role);
    const redirect =
      role === "admin" ? "/admin" : role === "inspector" ? "/inspector" : "/citizen";
    router.push(redirect);
    setLoading(false);
  };

  return (
    <Card className="overflow-hidden shadow-[var(--shadow-elevated)]">
      <div className="h-1.5 bg-gradient-to-r from-brand-700 via-accent-500 to-brand-700" />
      <CardHeader className="pb-2 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-800 shadow-[0_4px_12px_rgba(12,25,41,0.25)]">
          <Map className="h-6 w-6 text-accent-200" />
        </div>
        <CardTitle className="font-display text-2xl">Create an account</CardTitle>
        <CardDescription>Join {APP_NAME} to report and track road damage</CardDescription>
      </CardHeader>
      <CardContent className="pb-8">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            id="name"
            label="Full Name"
            placeholder="John Doe"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <Input
            id="email"
            label="Email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Input
            id="password"
            label="Password"
            type="password"
            placeholder="Min. 8 characters"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={8}
            required
          />
          <Select
            id="role"
            label="Account Type"
            value={role}
            onChange={(e) => setRole(e.target.value as UserRole)}
            options={[
              { value: "citizen", label: "Citizen" },
              { value: "inspector", label: "Road Inspector" },
              { value: "admin", label: "Administrator" },
            ]}
          />
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Creating account..." : "Create Account"}
          </Button>
        </form>

        <p className="mt-8 text-center text-sm text-muted">
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-accent-600 hover:text-accent-700">
            Sign In
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
