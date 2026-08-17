"use client";

import Link from "next/link";

import {
  Brain,
  MapPin,
  BarChart3,
  Shield,
  Upload,
  CheckCircle,
  Users,
  ArrowRight,
  Sparkles,
  FileText,
  Bell,
} from "lucide-react";

import { Navbar } from "@/components/layout/navbar";
import { Button } from "@/components/ui/button";
import { APP_NAME } from "@/lib/constants";

import {
  SlideInLeft,
  SlideInRight,
  SlideInUp,
  FadeIn,
  ScaleIn,
  StaggerChildren,
  HoverLift,
  PulseGlow,
} from "@/components/animations";

const features = [
  {
    icon: Brain,
    title: "AI Detection",
    description:
      "Automatically detect potholes, cracks, faded markings, waterlogging, and debris with bounding boxes and confidence scores.",
  },
  {
    icon: FileText,
    title: "Smart Reports",
    description:
      "Generate intelligent inspection reports with severity classification and AI-powered explanations.",
  },
  {
    icon: MapPin,
    title: "Interactive Map",
    description:
      "Visualize damage locations, repair sites, and high-risk areas on an interactive city map.",
  },
  {
    icon: BarChart3,
    title: "Analytics Dashboard",
    description:
      "Track damage trends, repair completion rates, and city-wise statistics with rich charts.",
  },
  {
    icon: Shield,
    title: "Role-Based Access",
    description:
      "Dedicated dashboards for citizens, road inspectors, and administrators with secure JWT auth.",
  },
  {
    icon: Bell,
    title: "Notifications",
    description:
      "Stay updated with email and in-app alerts for report status changes and repair completions.",
  },
];

const steps = [
  {
    step: "01",
    title: "Upload Evidence",
    description:
      "Citizens upload road images or videos with location data.",
  },
  {
    step: "02",
    title: "AI Analysis",
    description:
      "Our AI model detects defects, assigns severity, and generates explanations.",
  },
  {
    step: "03",
    title: "Inspector Review",
    description:
      "Road inspectors verify AI detections and approve or adjust reports.",
  },
  {
    step: "04",
    title: "Repair & Track",
    description:
      "Teams are assigned, repairs are tracked, and citizens receive updates.",
  },
];

const roles = [
  {
    icon: Upload,
    title: "Citizens",
    items: [
      "Upload road images/videos",
      "Report road issues",
      "Track complaint status",
      "Receive notifications",
    ],
  },
  {
    icon: CheckCircle,
    title: "Road Inspectors",
    items: [
      "Verify AI detections",
      "Approve reports",
      "Assign severity levels",
      "Schedule maintenance",
    ],
  },
  {
    icon: Users,
    title: "Administrators",
    items: [
      "Manage users",
      "Monitor all reports",
      "Assign repair teams",
      "View analytics & export data",
    ],
  },
];

export default function Home() {
  return (
    <div className="flex flex-1 flex-col">
      <Navbar />

      {/* =========================
          HERO SECTION
      ========================== */}
      <section
        className="relative overflow-hidden px-4 py-28 sm:px-6 lg:px-8 lg:py-36"
        style={{
          background:
            "linear-gradient(135deg, #071018 0%, #0c1929 45%, #152a45 100%)",
        }}
      >
        {/* Background Pattern */}
        <div className="pointer-events-none absolute inset-0 opacity-[0.04]">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage:
                "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
            }}
          />
        </div>

        <div className="relative mx-auto max-w-7xl">
          <div className="grid items-center gap-16 lg:grid-cols-[1.1fr_0.9fr]">

            {/* LEFT SIDE */}
            <SlideInLeft duration={0.8}>
              <div>
                <FadeIn delay={0.2} duration={0.6}>
                  <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#e8c99a]/30 bg-[#b87333]/15 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-[#f5e6cc]">
                    <Sparkles className="h-3.5 w-3.5 text-[#e8c99a]" />
                    AI-Powered Infrastructure
                  </div>
                </FadeIn>

                <SlideInUp delay={0.3} duration={0.7}>
                  <h1 className="font-display text-4xl font-semibold leading-[1.1] tracking-tight text-white sm:text-5xl lg:text-[3.5rem]">
                    Smarter roads begin with{" "}
                    <span className="text-[#e8c99a]">
                      {APP_NAME}
                    </span>
                  </h1>
                </SlideInUp>

                <FadeIn delay={0.5} duration={0.6}>
                  <p className="mt-6 max-w-xl text-lg leading-relaxed text-[#d5dfea]">
                    Detect road defects automatically, generate intelligent
                    inspection reports, and help authorities prioritize
                    repairs — from one trusted civic platform.
                  </p>
                </FadeIn>

                <SlideInUp delay={0.7} duration={0.6}>
                  <div className="mt-10 flex flex-col gap-4 sm:flex-row">
                    <PulseGlow>
                      <Link href="/register">
                        <Button
                          size="lg"
                          className="w-full sm:w-auto"
                        >
                          Start Reporting
                          <ArrowRight className="h-4 w-4" />
                        </Button>
                      </Link>
                    </PulseGlow>

                    <Link href="/login">
                      <Button
                        size="lg"
                        variant="ghost"
                        className="w-full border border-white/30 bg-white/10 text-white hover:bg-white/20 hover:text-white sm:w-auto"
                      >
                        Sign In to Dashboard
                      </Button>
                    </Link>
                  </div>
                </SlideInUp>
              </div>
            </SlideInLeft>

            {/* RIGHT SIDE */}
            <SlideInRight duration={0.8} delay={0.2}>
              <StaggerChildren
                staggerDelay={0.1}
                className="grid grid-cols-2 gap-4"
              >
                {[
                  {
                    value: "5+",
                    label: "Damage Types Detected",
                  },
                  {
                    value: "94%",
                    label: "AI Accuracy",
                  },
                  {
                    value: "3",
                    label: "User Roles",
                  },
                  {
                    value: "24/7",
                    label: "Report Tracking",
                  },
                ].map((stat) => (
                  <HoverLift key={stat.label}>
                    <div className="rounded-2xl border border-white/20 bg-white/10 p-6 backdrop-blur-sm">
                      <p className="font-display text-3xl font-semibold text-white">
                        {stat.value}
                      </p>

                      <p className="mt-2 text-xs font-medium leading-snug text-[#a8bdd4]">
                        {stat.label}
                      </p>
                    </div>
                  </HoverLift>
                ))}
              </StaggerChildren>
            </SlideInRight>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-accent-500/40 to-transparent" />
      </section>

      {/* =========================
          FEATURES
      ========================== */}
      <section
        id="features"
        className="px-4 py-24 sm:px-6 lg:px-8"
      >
        <div className="mx-auto max-w-7xl">
          <SlideInUp duration={0.6}>
            <div className="mx-auto max-w-2xl text-center">
              <p className="eyebrow justify-center">
                Capabilities
              </p>

              <h2 className="section-heading mt-3">
                Everything for modern road care
              </h2>

              <p className="section-subheading mx-auto">
                A complete platform to detect, report, verify, and repair road
                damage with clarity and accountability.
              </p>
            </div>
          </SlideInUp>

          <StaggerChildren
            staggerDelay={0.1}
            className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
          >
            {features.map((feature) => (
              <HoverLift key={feature.title}>
                <div className="surface-card surface-card-hover group p-7">
                  <div className="mb-5 inline-flex rounded-xl bg-accent-50 p-3 ring-1 ring-accent-100 transition-colors group-hover:bg-accent-100">
                    <feature.icon className="h-6 w-6 text-accent-600" />
                  </div>

                  <h3 className="font-display text-xl font-semibold text-ink">
                    {feature.title}
                  </h3>

                  <p className="mt-2.5 text-sm leading-relaxed text-muted">
                    {feature.description}
                  </p>
                </div>
              </HoverLift>
            ))}
          </StaggerChildren>
        </div>
      </section>

      {/* =========================
          HOW IT WORKS
      ========================== */}
      <section
        id="how-it-works"
        className="border-y border-line bg-surface-muted/50 px-4 py-24 sm:px-6 lg:px-8"
      >
        <div className="mx-auto max-w-7xl">
          <FadeIn duration={0.6}>
            <div className="mx-auto max-w-2xl text-center">
              <p className="eyebrow justify-center">
                Process
              </p>

              <h2 className="section-heading mt-3">
                How it works
              </h2>

              <p className="section-subheading mx-auto">
                From citizen report to completed repair in four deliberate
                steps.
              </p>
            </div>
          </FadeIn>

          <StaggerChildren
            staggerDelay={0.15}
            className="relative mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-4"
          >
            {/* Connector */}
            <div className="absolute left-0 right-0 top-8 hidden h-px bg-gradient-to-r from-transparent via-line-strong to-transparent lg:block" />

            {steps.map((step) => (
              <HoverLift key={step.step}>
                <div className="relative text-center lg:text-left">
                  <ScaleIn duration={0.5}>
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-line bg-surface font-display text-xl font-semibold text-brand-700 shadow-[var(--shadow-soft)] lg:mx-0">
                      {step.step}
                    </div>
                  </ScaleIn>

                  <h3 className="font-display text-lg font-semibold text-ink">
                    {step.title}
                  </h3>

                  <p className="mt-2 text-sm leading-relaxed text-muted">
                    {step.description}
                  </p>
                </div>
              </HoverLift>
            ))}
          </StaggerChildren>
        </div>
      </section>

      {/* =========================
          ROLES
      ========================== */}
      <section
        id="roles"
        className="px-4 py-24 sm:px-6 lg:px-8"
      >
        <div className="mx-auto max-w-7xl">
          {/* FIXED:
              SlideInDown was used but was not imported.
              FadeIn is already available and safe.
          */}
          <FadeIn duration={0.6}>
            <div className="mx-auto max-w-2xl text-center">
              <p className="eyebrow justify-center">
                Audience
              </p>

              <h2 className="section-heading mt-3">
                Built for everyone
              </h2>

              <p className="section-subheading mx-auto">
                Tailored experiences for citizens, inspectors, and
                administrators.
              </p>
            </div>
          </FadeIn>

          <StaggerChildren
            staggerDelay={0.15}
            className="mt-16 grid gap-6 lg:grid-cols-3"
          >
            {roles.map((role) => (
              <HoverLift key={role.title}>
                <div className="surface-card relative overflow-hidden p-8">
                  <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-brand-600 to-accent-500" />

                  <ScaleIn duration={0.5}>
                    <div className="mb-5 inline-flex rounded-xl bg-brand-50 p-3 ring-1 ring-brand-100">
                      <role.icon className="h-6 w-6 text-brand-700" />
                    </div>
                  </ScaleIn>

                  <h3 className="font-display text-xl font-semibold text-ink">
                    {role.title}
                  </h3>

                  <ul className="mt-5 space-y-3">
                    {role.items.map((item) => (
                      <li
                        key={item}
                        className="flex items-start gap-2.5 text-sm text-ink-secondary"
                      >
                        <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </HoverLift>
            ))}
          </StaggerChildren>
        </div>
      </section>

      {/* =========================
          CTA
      ========================== */}
      <section
        className="relative overflow-hidden px-4 py-20 sm:px-6 lg:px-8"
        style={{
          background:
            "linear-gradient(135deg, #0c1929 0%, #152a45 100%)",
        }}
      >
        <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-[#b87333]/15 blur-3xl" />

        <ScaleIn duration={0.7}>
          <div className="relative mx-auto max-w-3xl text-center">
            <h2 className="font-display text-3xl font-semibold text-white sm:text-4xl">
              Ready to improve your roads?
            </h2>

            <p className="mt-4 text-lg leading-relaxed text-[#d5dfea]">
              Join {APP_NAME} and help build safer, better-maintained road
              infrastructure for your community.
            </p>

            <FadeIn delay={0.3} duration={0.6}>
              <Link
                href="/register"
                className="mt-8 inline-block"
              >
                <PulseGlow>
                  <Button size="lg">
                    Create Free Account
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </PulseGlow>
              </Link>
            </FadeIn>
          </div>
        </ScaleIn>
      </section>

      {/* =========================
          FOOTER
      ========================== */}
      <footer className="border-t border-line bg-surface px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 sm:flex-row">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-800">
              <MapPin className="h-4 w-4 text-accent-200" />
            </div>

            <p className="text-sm text-muted">
              &copy; 2026 {APP_NAME}. All rights reserved.
            </p>
          </div>

          <div className="flex gap-8 text-sm font-medium text-muted">
            <Link
              href="/login"
              className="transition-colors hover:text-ink"
            >
              Sign In
            </Link>

            <Link
              href="/register"
              className="transition-colors hover:text-ink"
            >
              Register
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}