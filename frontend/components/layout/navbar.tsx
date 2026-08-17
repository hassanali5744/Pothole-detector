"use client";

import Link from "next/link";
import { Map, Menu, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { APP_NAME } from "@/lib/constants";
import { SlideInDown, FadeIn, StaggerChildren } from "@/components/animations";

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <SlideInDown duration={0.5}>
      <header className="sticky top-0 z-50 border-b border-line/80 bg-surface/95 backdrop-blur-md">
        <div className="mx-auto flex h-[4.25rem] max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <FadeIn duration={0.6} delay={0.1}>
            <Link href="/" className="group flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#0c1929] shadow-[0_2px_8px_rgba(12,25,41,0.25)] ring-1 ring-[#152a45]/50 transition-transform group-hover:scale-105">
                <Map className="h-4 w-4 text-[#e8c99a]" />
              </div>
              <div>
                <span className="font-display text-lg font-semibold text-ink">{APP_NAME}</span>
                <span className="hidden text-[10px] font-semibold uppercase tracking-[0.15em] text-[#9a5f28] sm:block">
                  Road Intelligence
                </span>
              </div>
            </Link>
          </FadeIn>

          <nav className="hidden items-center gap-10 md:flex">
            <StaggerChildren staggerDelay={0.08}>
              {[
                { href: "#features", label: "Features" },
                { href: "#how-it-works", label: "How It Works" },
                { href: "#roles", label: "For Everyone" },
              ].map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-sm font-medium text-muted transition-colors hover:text-ink"
                >
                  {link.label}
                </Link>
              ))}
            </StaggerChildren>
          </nav>

          <FadeIn duration={0.6} delay={0.3} className="hidden items-center gap-3 md:flex">
            <Link href="/login">
              <Button variant="ghost" size="sm">
                Sign In
              </Button>
            </Link>
            <Link href="/register">
              <Button size="sm">Get Started</Button>
            </Link>
          </FadeIn>

          <button
            className="rounded-lg p-2 text-muted transition-colors hover:bg-surface-muted hover:text-ink md:hidden"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {mobileOpen && (
          <FadeIn duration={0.3}>
            <div className="border-t border-line bg-surface px-4 py-4 md:hidden">
              <nav className="flex flex-col gap-3">
                <Link href="#features" className="py-1 text-sm font-medium text-muted" onClick={() => setMobileOpen(false)}>
                  Features
                </Link>
                <Link href="#how-it-works" className="py-1 text-sm font-medium text-muted" onClick={() => setMobileOpen(false)}>
                  How It Works
                </Link>
                <Link href="/login" onClick={() => setMobileOpen(false)}>
                  <Button variant="outline" className="w-full">
                    Sign In
                  </Button>
                </Link>
                <Link href="/register" onClick={() => setMobileOpen(false)}>
                  <Button className="w-full">Get Started</Button>
                </Link>
              </nav>
            </div>
          </FadeIn>
        )}
      </header>
    </SlideInDown>
  );
}
