import { Button } from "@/components/ui/button";
import {
  BookOpen,
  Calculator,
  FileText,
  ShieldCheck,
  TrendingUp,
} from "lucide-react";
import { motion } from "motion/react";
import { useInternetIdentity } from "../hooks/useInternetIdentity";

const features = [
  {
    icon: Calculator,
    title: "GST Auto-Calculate",
    desc: "CGST+SGST or IGST — auto-detected by state",
  },
  {
    icon: FileText,
    title: "Smart Invoicing",
    desc: "Create, send, and track invoices in seconds",
  },
  {
    icon: TrendingUp,
    title: "Cash Flow Insights",
    desc: "Real-time receivables, payables & GST liability",
  },
  {
    icon: BookOpen,
    title: "AI Accountant",
    desc: "Ask questions about your finances in plain Hindi/English",
  },
];

export default function LoginPage() {
  const { login, isLoggingIn } = useInternetIdentity();

  return (
    <div className="min-h-screen bg-background flex flex-col lg:flex-row">
      {/* Left branding panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-sidebar flex-col justify-between p-12 relative overflow-hidden">
        {/* Background pattern */}
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `radial-gradient(circle at 20% 50%, oklch(0.55 0.14 185 / 0.4) 0%, transparent 60%),
            radial-gradient(circle at 80% 20%, oklch(0.72 0.16 80 / 0.3) 0%, transparent 50%)`,
          }}
        />
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.03'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-12">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-display text-lg font-bold">
                L
              </span>
            </div>
            <div>
              <h1 className="text-sidebar-foreground font-display text-2xl">
                LekhyaAI
              </h1>
              <p className="text-sidebar-foreground/60 text-xs font-sans tracking-wide uppercase">
                AI-Powered GST Accounting
              </p>
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-sidebar-foreground font-display text-4xl leading-snug mb-4">
              Smart accounting for{" "}
              <span className="italic" style={{ color: "oklch(0.72 0.16 80)" }}>
                India's
              </span>{" "}
              growing businesses
            </h2>
            <p className="text-sidebar-foreground/70 text-base leading-relaxed font-sans">
              GST-compliant invoicing, real-time tax insights, and an AI
              accountant that knows Indian tax law — all in one platform.
            </p>
          </motion.div>
        </div>

        <div className="relative z-10 grid grid-cols-1 gap-4">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 + i * 0.1 }}
              className="flex items-start gap-3 p-4 rounded-lg bg-sidebar-accent/40 backdrop-blur-sm"
            >
              <div className="w-8 h-8 rounded-md bg-primary/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                <f.icon className="w-4 h-4 text-sidebar-foreground" />
              </div>
              <div>
                <p className="text-sidebar-foreground font-semibold text-sm">
                  {f.title}
                </p>
                <p className="text-sidebar-foreground/60 text-xs mt-0.5">
                  {f.desc}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Indian Identity strip */}
        <div className="relative z-10">
          {/* Tagline */}
          <p
            className="text-sm italic font-medium mb-2"
            style={{ color: "oklch(0.72 0.16 75)" }}
          >
            "Accounting ko banaye easy"
          </p>
          {/* Tricolor strip */}
          <div className="flex h-0.5 w-full mb-2 rounded-full overflow-hidden">
            <div className="flex-1" style={{ backgroundColor: "#FF9933" }} />
            <div className="flex-1 bg-white" />
            <div className="flex-1" style={{ backgroundColor: "#138808" }} />
          </div>
          {/* Made in India */}
          <p className="text-sidebar-foreground/50 text-xs mb-3">
            🇮🇳 Made in India &nbsp;•&nbsp; Atmanirbhar Bharat
          </p>
          {/* Copyright */}
          <div className="text-sidebar-foreground/40 text-xs">
            © {new Date().getFullYear()}. Built with love using{" "}
            <a
              href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
              className="underline hover:text-sidebar-foreground/60 transition-colors"
              target="_blank"
              rel="noopener noreferrer"
            >
              caffeine.ai
            </a>
          </div>
        </div>
      </div>

      {/* Right login panel */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 lg:p-12">
        {/* Mobile logo */}
        <div className="lg:hidden flex items-center gap-3 mb-10">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-display text-lg font-bold">
              L
            </span>
          </div>
          <div>
            <h1 className="text-foreground font-display text-2xl">LekhyaAI</h1>
            <p className="text-muted-foreground text-xs tracking-wide uppercase">
              AI-Powered GST Accounting
            </p>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-sm"
        >
          <div className="text-center mb-8">
            <h2 className="font-display text-3xl text-foreground mb-2">
              Welcome back
            </h2>
            <p className="text-muted-foreground text-sm">
              Sign in to manage your GST accounting
            </p>
          </div>

          <div className="bg-card rounded-2xl shadow-card p-8 border border-border">
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-3 p-3 bg-secondary rounded-lg">
                <ShieldCheck className="w-5 h-5 text-primary flex-shrink-0" />
                <p className="text-sm text-secondary-foreground">
                  Secured by Internet Identity — no passwords needed
                </p>
              </div>

              <Button
                data-ocid="login.primary_button"
                onClick={login}
                disabled={isLoggingIn}
                size="lg"
                className="w-full font-semibold text-base h-12 bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                {isLoggingIn ? (
                  <>
                    <div className="w-4 h-4 rounded-full border-2 border-primary-foreground border-t-transparent animate-spin mr-2" />
                    Signing in…
                  </>
                ) : (
                  "Sign In with Internet Identity"
                )}
              </Button>

              <p className="text-xs text-muted-foreground text-center">
                New to LekhyaAI? Your account is created automatically on first
                sign-in.
              </p>
            </div>
          </div>

          <div className="mt-8 grid grid-cols-3 gap-4">
            {["10K+ Invoices", "GST Compliant", "Multi-Business"].map((t) => (
              <div key={t} className="text-center">
                <p className="text-xs text-muted-foreground">{t}</p>
              </div>
            ))}
          </div>

          {/* India identity */}
          <div className="mt-6 text-center">
            <p className="text-xs text-muted-foreground/60">
              🇮🇳 Made in India &nbsp;•&nbsp; Atmanirbhar Bharat
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
