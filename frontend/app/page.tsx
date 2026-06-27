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
  Zap,
  FileText,
  Bell,
} from "lucide-react";
import { Navbar } from "@/components/layout/navbar";
import { Button } from "@/components/ui/button";
import { APP_NAME } from "@/lib/constants";

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
    description: "Citizens upload road images or videos with location data.",
  },
  {
    step: "02",
    title: "AI Analysis",
    description: "Our AI model detects defects, assigns severity, and generates explanations.",
  },
  {
    step: "03",
    title: "Inspector Review",
    description: "Road inspectors verify AI detections and approve or adjust reports.",
  },
  {
    step: "04",
    title: "Repair & Track",
    description: "Teams are assigned, repairs are tracked, and citizens receive updates.",
  },
];

const roles = [
  {
    icon: Upload,
    title: "Citizens",
    items: ["Upload road images/videos", "Report road issues", "Track complaint status", "Receive notifications"],
  },
  {
    icon: CheckCircle,
    title: "Road Inspectors",
    items: ["Verify AI detections", "Approve reports", "Assign severity levels", "Schedule maintenance"],
  },
  {
    icon: Users,
    title: "Administrators",
    items: ["Manage users", "Monitor all reports", "Assign repair teams", "View analytics & export data"],
  },
];

export default function Home() {
  return (
    <div className="flex flex-1 flex-col">
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-brand-700 to-brand-600 px-4 py-24 sm:px-6 lg:px-8">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-50" />
        <div className="relative mx-auto max-w-7xl">
          <div className="max-w-3xl">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-sm text-white backdrop-blur-sm">
              <Zap className="h-4 w-4" />
              AI-Powered Road Infrastructure Platform
            </div>
            <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">
              Smarter Roads Start with{" "}
              <span className="text-blue-200">{APP_NAME}</span>
            </h1>
            <p className="mt-6 text-lg leading-8 text-blue-100">
              Automatically detect road defects, generate intelligent inspection reports,
              and help authorities prioritize repairs — all from a single platform.
            </p>
            <div className="mt-10 flex flex-col gap-4 sm:flex-row">
              <Link href="/register">
                <Button size="lg" className="w-full bg-white text-brand-700 hover:bg-blue-50 sm:w-auto">
                  Start Reporting
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/login">
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full border-white/30 bg-white/10 text-white hover:bg-white/20 sm:w-auto"
                >
                  Sign In to Dashboard
                </Button>
              </Link>
            </div>
          </div>

          {/* Stats */}
          <div className="mt-16 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {[
              { value: "5+", label: "Damage Types Detected" },
              { value: "94%", label: "AI Accuracy" },
              { value: "3", label: "User Roles" },
              { value: "24/7", label: "Report Tracking" },
            ].map((stat) => (
              <div
                key={stat.label}
                className="rounded-xl bg-white/10 p-4 text-center backdrop-blur-sm"
              >
                <p className="text-2xl font-bold text-white">{stat.value}</p>
                <p className="mt-1 text-xs text-blue-200">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="px-4 py-24 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-slate-900">Core Features</h2>
            <p className="mt-4 text-lg text-slate-600">
              Everything you need to detect, report, and repair road damage efficiently.
            </p>
          </div>
          <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="mb-4 inline-flex rounded-lg bg-brand-50 p-3">
                  <feature.icon className="h-6 w-6 text-brand-600" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900">{feature.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="bg-slate-100 px-4 py-24 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-slate-900">How It Works</h2>
            <p className="mt-4 text-lg text-slate-600">
              From citizen report to completed repair in four simple steps.
            </p>
          </div>
          <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((step) => (
              <div key={step.step} className="relative">
                <div className="text-5xl font-bold text-brand-100">{step.step}</div>
                <h3 className="mt-2 text-lg font-semibold text-slate-900">{step.title}</h3>
                <p className="mt-2 text-sm text-slate-600">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Roles */}
      <section id="roles" className="px-4 py-24 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-slate-900">Built for Everyone</h2>
            <p className="mt-4 text-lg text-slate-600">
              Tailored experiences for citizens, inspectors, and administrators.
            </p>
          </div>
          <div className="mt-16 grid gap-8 lg:grid-cols-3">
            {roles.map((role) => (
              <div
                key={role.title}
                className="rounded-xl border border-slate-200 bg-white p-8 shadow-sm"
              >
                <div className="mb-4 inline-flex rounded-lg bg-brand-50 p-3">
                  <role.icon className="h-6 w-6 text-brand-600" />
                </div>
                <h3 className="text-xl font-semibold text-slate-900">{role.title}</h3>
                <ul className="mt-4 space-y-2">
                  {role.items.map((item) => (
                    <li key={item} className="flex items-center gap-2 text-sm text-slate-600">
                      <CheckCircle className="h-4 w-4 shrink-0 text-emerald-500" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-brand-600 px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-bold text-white">Ready to improve your roads?</h2>
          <p className="mt-4 text-lg text-blue-100">
            Join RoadVision AI and help build safer, better-maintained road infrastructure.
          </p>
          <Link href="/register" className="mt-8 inline-block">
            <Button size="lg" className="bg-white text-brand-700 hover:bg-blue-50">
              Create Free Account
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 sm:flex-row">
          <p className="text-sm text-slate-500">
            &copy; 2026 {APP_NAME}. All rights reserved.
          </p>
          <div className="flex gap-6 text-sm text-slate-500">
            <Link href="/login" className="hover:text-slate-700">Sign In</Link>
            <Link href="/register" className="hover:text-slate-700">Register</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
