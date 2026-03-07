import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  BookOpen,
  Calculator,
  Code2,
  Eye,
  EyeOff,
  FileText,
  Loader2,
  Shield,
  TrendingUp,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { activateSuperUser, isSuperUserActive } from "../utils/superuser";

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
  const [devModalOpen, setDevModalOpen] = useState(false);
  const [devPin, setDevPin] = useState("");
  const [showPin, setShowPin] = useState(false);
  const [superUserActive, setSuperUserActive] = useState(() =>
    isSuperUserActive(),
  );

  async function handleDevPinSubmit(e: React.FormEvent) {
    e.preventDefault();
    const ok = await activateSuperUser(devPin);
    if (ok) {
      setSuperUserActive(true);
      setDevModalOpen(false);
      setDevPin("");
      toast.success("Developer mode activated", {
        description:
          "SuperUser Settings will appear in the sidebar after login.",
      });
    } else {
      toast.error("Incorrect developer PIN");
    }
  }

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
          <p
            className="text-sm italic font-medium mb-2"
            style={{ color: "oklch(0.72 0.16 75)" }}
          >
            "Accounting ko banaye easy"
          </p>
          <div className="flex h-0.5 w-full mb-2 rounded-full overflow-hidden">
            <div className="flex-1" style={{ backgroundColor: "#FF9933" }} />
            <div className="flex-1 bg-white" />
            <div className="flex-1" style={{ backgroundColor: "#138808" }} />
          </div>
          <p className="text-sidebar-foreground/50 text-xs mb-3">
            🇮🇳 Made in India &nbsp;•&nbsp; Atmanirbhar Bharat
          </p>
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
        <div className="lg:hidden flex flex-col items-center gap-3 mb-8">
          <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center shadow-lg">
            <span className="text-primary-foreground font-display text-2xl font-bold">
              L
            </span>
          </div>
          <div className="text-center">
            <h1 className="text-foreground font-display text-2xl">LekhyaAI</h1>
            <p className="text-muted-foreground text-xs tracking-wide uppercase mt-0.5">
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
              Welcome to LekhyaAI
            </h2>
            <p className="text-muted-foreground text-sm">
              Sign in or create your account
            </p>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Button
              data-ocid="login.signin.primary_button"
              onClick={login}
              disabled={isLoggingIn}
              className="w-full bg-primary text-primary-foreground h-12 text-base font-semibold gap-3"
            >
              {isLoggingIn ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Shield className="w-5 h-5" />
              )}
              {isLoggingIn ? "Connecting…" : "Sign in with LekhyaAI"}
            </Button>
            <p className="text-xs text-muted-foreground text-center mt-3 leading-relaxed">
              Powered by Internet Identity — ICP's secure, password-free
              decentralised authentication. No email, no password. Your identity
              stays private.
            </p>
          </motion.div>

          <div className="mt-6 grid grid-cols-3 gap-4">
            {["10K+ Invoices", "GST Compliant", "Multi-Business"].map((t) => (
              <div key={t} className="text-center">
                <p className="text-xs text-muted-foreground">{t}</p>
              </div>
            ))}
          </div>

          {/* India identity */}
          <div className="mt-4 text-center">
            <p className="text-xs text-muted-foreground/60">
              🇮🇳 Made in India &nbsp;•&nbsp; Atmanirbhar Bharat
            </p>
          </div>

          {/* Mobile footer */}
          <div className="mt-6 text-center lg:hidden">
            <p className="text-xs italic text-muted-foreground/50">
              "Accounting ko banaye easy"
            </p>
            <div className="flex h-0.5 w-24 mx-auto mt-2 rounded-full overflow-hidden">
              <div className="flex-1" style={{ backgroundColor: "#FF9933" }} />
              <div className="flex-1 bg-muted" />
              <div className="flex-1" style={{ backgroundColor: "#138808" }} />
            </div>
          </div>

          {/* Hidden Developer Access trigger */}
          <div className="mt-4 flex justify-center">
            {superUserActive ? (
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-destructive/10 border border-destructive/20 rounded-full">
                <Shield className="w-3 h-3 text-destructive" />
                <span className="text-[10px] font-bold text-destructive uppercase tracking-wider">
                  Developer Mode Active
                </span>
              </div>
            ) : (
              <button
                type="button"
                data-ocid="login.dev_access.button"
                onClick={() => setDevModalOpen(true)}
                className="flex items-center gap-1 text-[10px] text-muted-foreground/30 hover:text-muted-foreground/60 transition-colors"
                title="Developer access"
              >
                <Code2 className="w-3 h-3" />
                Developer Access
              </button>
            )}
          </div>
        </motion.div>
      </div>

      {/* Developer PIN Modal */}
      <AnimatePresence>
        {devModalOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-50"
              onClick={() => setDevModalOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 16 }}
              transition={{ type: "spring", stiffness: 350, damping: 30 }}
              data-ocid="login.dev_modal.dialog"
              className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
            >
              <div className="pointer-events-auto bg-card border border-border rounded-2xl shadow-2xl w-full max-w-sm p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Shield className="w-5 h-5 text-primary" />
                    <h2 className="font-semibold text-foreground">
                      Developer Access
                    </h2>
                  </div>
                  <button
                    type="button"
                    data-ocid="login.dev_modal.close_button"
                    onClick={() => {
                      setDevModalOpen(false);
                      setDevPin("");
                    }}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  Enter the developer PIN to enable SuperUser mode. This gives
                  access to system-level settings.
                </p>
                <form onSubmit={handleDevPinSubmit} className="space-y-3">
                  <div className="relative">
                    <Input
                      data-ocid="login.dev_pin.input"
                      type={showPin ? "text" : "password"}
                      value={devPin}
                      onChange={(e) => setDevPin(e.target.value)}
                      placeholder="Enter developer PIN"
                      autoFocus
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPin((p) => !p)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPin ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                  <Button
                    type="submit"
                    data-ocid="login.dev_pin.submit_button"
                    className="w-full"
                    disabled={!devPin.trim()}
                  >
                    Activate Developer Mode
                  </Button>
                </form>
                <p className="text-[10px] text-muted-foreground/50 text-center mt-3">
                  Default PIN: LEKHYA2024
                </p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
