/**
 * DemoPage — 12-hour guest demo session.
 * Limits: 5 invoices, 2 users, no WhatsApp, no Email.
 * Session is stored in sessionStorage (expires when tab closes) + a 12-hour
 * timestamp enforced on mount.
 */

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import {
  AlertCircle,
  BarChart3,
  Bot,
  Calculator,
  CheckCircle,
  Clock,
  CreditCard,
  FileText,
  LayoutDashboard,
  Lock,
  LogIn,
  Package,
  Receipt,
  Shield,
  Timer,
  TrendingUp,
  Users,
  X,
  Zap,
} from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

// ─── Demo Session Utils ───────────────────────────────────────────

const DEMO_LS_KEY = "lekhya_demo_session";
const DEMO_DURATION_MS = 12 * 60 * 60 * 1000; // 12 hours

interface DemoSession {
  startedAt: number;
  name: string;
  email: string;
  invoiceCount: number;
  userCount: number;
}

function getDemoSession(): DemoSession | null {
  try {
    const raw = sessionStorage.getItem(DEMO_LS_KEY);
    if (!raw) return null;
    const s = JSON.parse(raw) as DemoSession;
    // Check 12-hour expiry
    if (Date.now() - s.startedAt > DEMO_DURATION_MS) {
      sessionStorage.removeItem(DEMO_LS_KEY);
      return null;
    }
    return s;
  } catch {
    return null;
  }
}

function startDemoSession(name: string, email: string): DemoSession {
  const s: DemoSession = {
    startedAt: Date.now(),
    name,
    email,
    invoiceCount: 0,
    userCount: 1,
  };
  sessionStorage.setItem(DEMO_LS_KEY, JSON.stringify(s));
  return s;
}

function getRemainingTime(startedAt: number): string {
  const remaining = DEMO_DURATION_MS - (Date.now() - startedAt);
  if (remaining <= 0) return "Expired";
  const hours = Math.floor(remaining / (1000 * 60 * 60));
  const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
  return `${hours}h ${minutes}m remaining`;
}

// ─── Demo Feature List ────────────────────────────────────────────

const DEMO_FEATURES = [
  {
    icon: LayoutDashboard,
    label: "Dashboard",
    desc: "GST overview, cash flow, receivables",
    available: true,
  },
  {
    icon: Receipt,
    label: "Invoices",
    desc: "Up to 5 invoices with GST calculation",
    available: true,
    limit: "5 invoices",
  },
  {
    icon: Users,
    label: "Customers",
    desc: "Add and manage customer profiles",
    available: true,
  },
  {
    icon: Package,
    label: "Products",
    desc: "Product catalog with HSN codes",
    available: true,
  },
  {
    icon: FileText,
    label: "GST Reports",
    desc: "Output/input GST summary",
    available: true,
  },
  {
    icon: BarChart3,
    label: "P&L Report",
    desc: "Profit & loss statement",
    available: true,
  },
  {
    icon: Bot,
    label: "AI Accountant",
    desc: "Ask questions about your finances",
    available: true,
  },
  {
    icon: Calculator,
    label: "Floating Calculator",
    desc: "Professional Indian number calculator",
    available: true,
  },
  {
    icon: TrendingUp,
    label: "Ledger / Journal",
    desc: "Double-entry accounting",
    available: true,
  },
  {
    icon: CreditCard,
    label: "Bank Accounts",
    desc: "Bank reconciliation",
    available: true,
  },
  {
    icon: Users,
    label: "Multi-User Access",
    desc: "Invite team members",
    available: false,
    reason: "Upgrade to invite more than 2 users",
  },
  {
    icon: Zap,
    label: "WhatsApp Sharing",
    desc: "Send invoices via WhatsApp",
    available: false,
    reason: "Available in paid plans",
  },
  {
    icon: FileText,
    label: "Email Reports",
    desc: "Email invoices and reports",
    available: false,
    reason: "Available in paid plans",
  },
  {
    icon: Receipt,
    label: "Tally Import",
    desc: "Import from Tally ERP",
    available: false,
    reason: "Available in paid plans",
  },
];

// ─── Mock Invoice Data ────────────────────────────────────────────

const MOCK_INVOICES = [
  {
    no: "DEMO-001",
    customer: "Rahul Traders",
    amount: "₹45,300",
    gst: "₹6,900",
    status: "paid",
    date: "01 Mar 2026",
  },
  {
    no: "DEMO-002",
    customer: "Priya Textiles",
    amount: "₹1,18,000",
    gst: "₹18,000",
    status: "sent",
    date: "03 Mar 2026",
  },
  {
    no: "DEMO-003",
    customer: "Sharma & Co.",
    amount: "₹32,760",
    gst: "₹4,998",
    status: "overdue",
    date: "15 Feb 2026",
  },
];

const STATUS_BADGE: Record<string, { cls: string; label: string }> = {
  paid: { cls: "bg-green-100 text-green-700 border-green-200", label: "Paid" },
  sent: { cls: "bg-blue-100 text-blue-700 border-blue-200", label: "Sent" },
  overdue: { cls: "bg-red-100 text-red-700 border-red-200", label: "Overdue" },
};

// ─── Main Component ───────────────────────────────────────────────

export default function DemoPage() {
  const [session, setSession] = useState<DemoSession | null>(() =>
    getDemoSession(),
  );
  const [form, setForm] = useState({ name: "", email: "" });
  const [starting, setStarting] = useState(false);
  const [activeTab, setActiveTab] = useState<
    "dashboard" | "invoices" | "features"
  >("dashboard");
  const [remainingTime, setRemainingTime] = useState<string>("");

  // Tick the countdown
  useEffect(() => {
    if (!session) return;
    const tick = () => setRemainingTime(getRemainingTime(session.startedAt));
    tick();
    const id = setInterval(tick, 60_000);
    return () => clearInterval(id);
  }, [session]);

  function handleStart(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error("Please enter your name");
      return;
    }
    setStarting(true);
    setTimeout(() => {
      const s = startDemoSession(form.name.trim(), form.email.trim());
      setSession(s);
      setRemainingTime(getRemainingTime(s.startedAt));
      setStarting(false);
      toast.success(`Welcome, ${s.name}! Your 12-hour demo has started.`);
    }, 800);
  }

  function handleEndDemo() {
    if (!confirm("End your demo session? All demo data will be cleared."))
      return;
    sessionStorage.removeItem(DEMO_LS_KEY);
    setSession(null);
    toast.info("Demo session ended.");
  }

  // ─── Entry Form ─────────────────────────────────────────────────
  if (!session) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary mb-4 shadow-lg">
              <span className="text-primary-foreground font-display text-3xl font-bold">
                L
              </span>
            </div>
            <h1 className="font-display text-3xl text-foreground mb-2">
              Try LekhyaAI Free
            </h1>
            <p className="text-muted-foreground text-sm">
              Full 12-hour demo — no credit card, no sign-up required
            </p>
          </div>

          {/* Limits banner */}
          <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4 mb-6 text-sm">
            <p className="font-semibold text-amber-800 dark:text-amber-200 mb-2 flex items-center gap-1.5">
              <Timer className="w-4 h-4" />
              Demo Limits
            </p>
            <ul className="space-y-1 text-amber-700 dark:text-amber-300 text-xs">
              <li className="flex items-center gap-1.5">
                <CheckCircle className="w-3.5 h-3.5" /> Up to 5 invoices
              </li>
              <li className="flex items-center gap-1.5">
                <CheckCircle className="w-3.5 h-3.5" /> Up to 2 users
              </li>
              <li className="flex items-center gap-1.5">
                <CheckCircle className="w-3.5 h-3.5" /> Valid for 12 hours
              </li>
              <li className="flex items-center gap-1.5">
                <X className="w-3.5 h-3.5" /> WhatsApp & Email sharing disabled
              </li>
              <li className="flex items-center gap-1.5">
                <X className="w-3.5 h-3.5" /> Tally Import disabled
              </li>
            </ul>
          </div>

          {/* Form */}
          <div className="bg-card border border-border rounded-2xl p-6 shadow-card">
            <form onSubmit={handleStart} className="space-y-4">
              <div className="space-y-1.5">
                <Label>
                  Your Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  data-ocid="demo.name.input"
                  placeholder="e.g. Ramesh Sharma"
                  value={form.name}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, name: e.target.value }))
                  }
                  autoFocus
                />
              </div>
              <div className="space-y-1.5">
                <Label>Email (optional)</Label>
                <Input
                  data-ocid="demo.email.input"
                  type="email"
                  placeholder="you@company.com"
                  value={form.email}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, email: e.target.value }))
                  }
                />
              </div>
              <Button
                type="submit"
                data-ocid="demo.start.button"
                className="w-full bg-primary text-primary-foreground gap-2"
                disabled={starting || !form.name.trim()}
                size="lg"
              >
                {starting ? (
                  <div className="w-4 h-4 rounded-full border-2 border-primary-foreground border-t-transparent animate-spin" />
                ) : (
                  <Zap className="w-4 h-4" />
                )}
                {starting ? "Starting demo…" : "Start Free Demo"}
              </Button>
            </form>
          </div>

          <div className="mt-6 text-center">
            <a
              href="/app"
              className="text-sm text-primary hover:underline font-medium flex items-center justify-center gap-1.5"
            >
              <LogIn className="w-4 h-4" />
              Already have an account? Sign in
            </a>
          </div>

          <p className="text-xs text-center text-muted-foreground/60 mt-4">
            🇮🇳 Made in India &nbsp;•&nbsp; Atmanirbhar Bharat
          </p>
        </motion.div>
      </div>
    );
  }

  // ─── Active Demo Session ─────────────────────────────────────────
  return (
    <div className="min-h-screen bg-background">
      {/* Demo Banner */}
      <div className="bg-amber-500 text-amber-950 px-4 py-2.5 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Timer className="w-4 h-4 flex-shrink-0" />
          <span>Demo Mode</span>
          <span className="opacity-70">•</span>
          <span className="font-mono text-xs">{remainingTime}</span>
          <span className="opacity-70">•</span>
          <span className="text-xs">
            {session.invoiceCount}/5 invoices used
          </span>
        </div>
        <div className="flex items-center gap-2">
          <a
            href="/app"
            className="text-xs font-bold px-3 py-1 bg-amber-900 text-amber-50 rounded-lg hover:bg-amber-800 transition-colors"
          >
            Upgrade to Full Version
          </a>
          <button
            type="button"
            data-ocid="demo.end.button"
            onClick={handleEndDemo}
            className="text-xs opacity-60 hover:opacity-100 transition-opacity"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto p-4 md:p-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-display text-lg font-bold">
              L
            </span>
          </div>
          <div>
            <h1 className="font-display text-xl text-foreground">
              Welcome, {session.name}
            </h1>
            <p className="text-muted-foreground text-xs">
              LekhyaAI Demo — AI-Powered GST Accounting for India
            </p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Badge
              variant="outline"
              className="bg-amber-100 text-amber-700 border-amber-200 text-xs gap-1"
            >
              <Clock className="w-3 h-3" />
              {remainingTime}
            </Badge>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 bg-muted/40 rounded-xl mb-6 border border-border">
          {(
            [
              { id: "dashboard", label: "Dashboard" },
              { id: "invoices", label: "Invoices" },
              { id: "features", label: "All Features" },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              data-ocid={`demo.tab.${tab.id}`}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex-1 py-2 text-sm font-medium rounded-lg transition-all",
                activeTab === tab.id
                  ? "bg-card text-foreground shadow-sm border border-border"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Dashboard Tab */}
        {activeTab === "dashboard" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-6"
          >
            {/* KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                {
                  label: "Total Revenue",
                  value: "₹1,96,060",
                  sub: "3 invoices",
                  color: "text-green-600",
                  bg: "bg-green-50 dark:bg-green-950/20",
                },
                {
                  label: "Outstanding",
                  value: "₹1,50,760",
                  sub: "2 pending",
                  color: "text-amber-600",
                  bg: "bg-amber-50 dark:bg-amber-950/20",
                },
                {
                  label: "GST Collected",
                  value: "₹29,898",
                  sub: "Output GST",
                  color: "text-blue-600",
                  bg: "bg-blue-50 dark:bg-blue-950/20",
                },
                {
                  label: "Net GST Payable",
                  value: "₹22,400",
                  sub: "After ITC",
                  color: "text-purple-600",
                  bg: "bg-purple-50 dark:bg-purple-950/20",
                },
              ].map((kpi) => (
                <motion.div
                  key={kpi.label}
                  whileHover={{ scale: 1.01 }}
                  className={cn("rounded-xl border border-border p-4", kpi.bg)}
                >
                  <p className="text-xs text-muted-foreground mb-1">
                    {kpi.label}
                  </p>
                  <p className={cn("text-xl font-bold", kpi.color)}>
                    {kpi.value}
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    {kpi.sub}
                  </p>
                </motion.div>
              ))}
            </div>

            {/* AI Insight */}
            <div className="bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center flex-shrink-0">
                  <Bot className="w-4 h-4 text-primary-foreground" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground mb-1">
                    AI Insight
                  </p>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Your GST liability for this month is{" "}
                    <span className="font-semibold text-foreground">
                      ₹22,400
                    </span>
                    . Sharma & Co. invoice (₹32,760) is overdue by 19 days —
                    consider sending a payment reminder. Cash flow forecast for
                    next month looks positive at ₹2.4L if current invoices are
                    collected on time.
                  </p>
                </div>
              </div>
            </div>

            {/* Upgrade CTA */}
            <div className="bg-card border border-primary/30 rounded-xl p-5 text-center">
              <Shield className="w-8 h-8 text-primary mx-auto mb-3" />
              <h3 className="font-semibold text-foreground mb-1">
                Like what you see?
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Upgrade to unlock unlimited invoices, WhatsApp sharing, Tally
                import, and all advanced modules.
              </p>
              <div className="flex gap-3 justify-center flex-wrap">
                <a href="/app">
                  <Button
                    data-ocid="demo.upgrade.button"
                    className="bg-primary text-primary-foreground gap-2"
                  >
                    <LogIn className="w-4 h-4" />
                    Create Free Account
                  </Button>
                </a>
                <a href="/">
                  <Button variant="outline" data-ocid="demo.view_plans.button">
                    View Pricing
                  </Button>
                </a>
              </div>
            </div>
          </motion.div>
        )}

        {/* Invoices Tab */}
        {activeTab === "invoices" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-4"
          >
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-semibold text-foreground">Invoices</h2>
                <p className="text-xs text-muted-foreground">
                  Demo data — {session.invoiceCount}/5 used in your session
                </p>
              </div>
              {session.invoiceCount < 5 ? (
                <Button
                  data-ocid="demo.create_invoice.button"
                  size="sm"
                  className="bg-primary text-primary-foreground gap-1"
                  onClick={() =>
                    toast.info(
                      "In the full version, click here to create a new invoice. Sign up to continue.",
                    )
                  }
                >
                  + New Invoice
                </Button>
              ) : (
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1 text-amber-600 border-amber-300"
                  disabled
                >
                  <Lock className="w-3.5 h-3.5" />
                  Limit Reached
                </Button>
              )}
            </div>

            <div className="bg-card border border-border rounded-xl overflow-hidden shadow-card">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/30">
                      {[
                        "Invoice No.",
                        "Customer",
                        "Amount",
                        "GST",
                        "Date",
                        "Status",
                      ].map((h) => (
                        <th
                          key={h}
                          className="text-left px-4 py-3 text-xs font-medium text-muted-foreground"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {MOCK_INVOICES.map((inv, idx) => {
                      const badge = STATUS_BADGE[inv.status];
                      return (
                        <tr
                          key={inv.no}
                          data-ocid={`demo.invoice.item.${idx + 1}`}
                          className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors"
                        >
                          <td className="px-4 py-3 font-mono text-xs font-semibold text-primary">
                            {inv.no}
                          </td>
                          <td className="px-4 py-3 text-sm text-foreground">
                            {inv.customer}
                          </td>
                          <td className="px-4 py-3 font-semibold text-foreground">
                            {inv.amount}
                          </td>
                          <td className="px-4 py-3 text-muted-foreground">
                            {inv.gst}
                          </td>
                          <td className="px-4 py-3 text-xs text-muted-foreground">
                            {inv.date}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={cn(
                                "px-2 py-0.5 rounded-full text-[11px] font-medium border",
                                badge.cls,
                              )}
                            >
                              {badge.label}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Locked features note */}
            <div className="flex items-center gap-2 p-3 bg-muted/30 border border-border rounded-lg text-xs text-muted-foreground">
              <Lock className="w-3.5 h-3.5 flex-shrink-0" />
              WhatsApp and Email sharing are disabled in demo mode. Upgrade to
              send invoices directly to customers.
            </div>
          </motion.div>
        )}

        {/* Features Tab */}
        {activeTab === "features" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-4"
          >
            <div>
              <h2 className="font-semibold text-foreground mb-1">
                Available Features
              </h2>
              <p className="text-xs text-muted-foreground">
                Features included in your demo session vs full version
              </p>
            </div>

            <div className="grid gap-3">
              {DEMO_FEATURES.map((feat, idx) => (
                <div
                  key={feat.label}
                  data-ocid={`demo.feature.item.${idx + 1}`}
                  className={cn(
                    "flex items-center gap-4 p-4 rounded-xl border transition-colors",
                    feat.available
                      ? "bg-card border-border"
                      : "bg-muted/20 border-border/50",
                  )}
                >
                  <div
                    className={cn(
                      "w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0",
                      feat.available
                        ? "bg-primary/10 text-primary"
                        : "bg-muted text-muted-foreground",
                    )}
                  >
                    <feat.icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p
                        className={cn(
                          "text-sm font-semibold",
                          feat.available
                            ? "text-foreground"
                            : "text-muted-foreground",
                        )}
                      >
                        {feat.label}
                      </p>
                      {feat.limit && (
                        <Badge
                          variant="outline"
                          className="text-[10px] bg-amber-50 text-amber-700 border-amber-200"
                        >
                          {feat.limit}
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">{feat.desc}</p>
                    {!feat.available && feat.reason && (
                      <p className="text-[11px] text-amber-600 mt-0.5">
                        {feat.reason}
                      </p>
                    )}
                  </div>
                  <div className="flex-shrink-0">
                    {feat.available ? (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    ) : (
                      <Lock className="w-4 h-4 text-muted-foreground/40" />
                    )}
                  </div>
                </div>
              ))}
            </div>

            <Separator />

            {/* Upgrade CTA */}
            <div className="bg-gradient-to-r from-primary to-primary/80 rounded-2xl p-6 text-primary-foreground text-center">
              <h3 className="font-display text-xl mb-2">
                Ready for the full version?
              </h3>
              <p className="text-primary-foreground/80 text-sm mb-4">
                Unlimited invoices, all modules, WhatsApp sharing, Tally import,
                and priority support.
              </p>
              <div className="flex gap-3 justify-center flex-wrap">
                <a href="/app">
                  <Button
                    data-ocid="demo.upgrade_full.button"
                    className="bg-white text-primary hover:bg-white/90 font-semibold gap-2"
                  >
                    <Zap className="w-4 h-4" />
                    Get Started Free
                  </Button>
                </a>
                <a href="/">
                  <Button
                    variant="outline"
                    className="border-white/40 text-white hover:bg-white/10"
                    data-ocid="demo.pricing.button"
                  >
                    View Plans
                  </Button>
                </a>
              </div>
              <p className="text-xs text-primary-foreground/60 mt-3">
                Starting at ₹499/month &nbsp;•&nbsp; GST inclusive
              </p>
            </div>
          </motion.div>
        )}

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-xs text-muted-foreground/60">
            🇮🇳 Made in India &nbsp;•&nbsp; Atmanirbhar Bharat &nbsp;•&nbsp;
            LekhyaAI — Accounting ko banaye easy
          </p>
        </div>
      </div>
    </div>
  );
}
