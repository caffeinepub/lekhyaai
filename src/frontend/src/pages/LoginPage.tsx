import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  BookOpen,
  Calculator,
  Code2,
  Eye,
  EyeOff,
  FileText,
  Mail,
  Phone,
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

// Google "G" icon SVG
function GoogleIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="w-5 h-5 flex-shrink-0"
      aria-hidden="true"
      focusable="false"
    >
      <title>Google</title>
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}

// Apple logo SVG
function AppleIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="w-5 h-5 flex-shrink-0"
      aria-hidden="true"
      focusable="false"
    >
      <title>Apple</title>
      <path
        d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.7 9.05 7.4c1.36.07 2.29.75 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.55-1.32 3.07-2.53 4zm-3.55-17.4c.08 2.03-1.48 3.69-3.37 3.52-.24-1.9 1.74-3.66 3.37-3.52z"
        fill="currentColor"
      />
    </svg>
  );
}

export default function LoginPage() {
  const { login, isLoggingIn } = useInternetIdentity();
  const [devModalOpen, setDevModalOpen] = useState(false);
  const [devPin, setDevPin] = useState("");
  const [showPin, setShowPin] = useState(false);
  const [superUserActive, setSuperUserActive] = useState(() =>
    isSuperUserActive(),
  );

  function handleDevPinSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (activateSuperUser(devPin)) {
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

  const signInOptions = [
    {
      id: "google",
      label: "Continue with Google",
      icon: <GoogleIcon />,
      className:
        "bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 shadow-sm font-medium",
    },
    {
      id: "apple",
      label: "Continue with Apple",
      icon: <AppleIcon />,
      className:
        "bg-black hover:bg-gray-900 text-white border border-black font-medium",
    },
    {
      id: "mobile",
      label: "Continue with Mobile Number",
      icon: <Phone className="w-5 h-5 flex-shrink-0" />,
      className:
        "bg-primary hover:bg-primary/90 text-primary-foreground border border-primary font-medium",
    },
    {
      id: "email",
      label: "Continue with Email",
      icon: <Mail className="w-5 h-5 flex-shrink-0" />,
      className:
        "bg-transparent hover:bg-muted text-foreground border border-border font-medium",
    },
  ];

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

          <div className="flex flex-col gap-3">
            {signInOptions.map((opt, i) => (
              <motion.div
                key={opt.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + i * 0.07 }}
              >
                <Button
                  data-ocid={`login.${opt.id}.button`}
                  onClick={login}
                  disabled={isLoggingIn}
                  size="lg"
                  className={`w-full h-12 text-sm flex items-center gap-3 justify-center transition-all ${opt.className}`}
                >
                  {isLoggingIn ? (
                    <div className="w-4 h-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
                  ) : (
                    opt.icon
                  )}
                  <span>{isLoggingIn ? "Signing in…" : opt.label}</span>
                </Button>
              </motion.div>
            ))}
          </div>

          <div className="mt-6 flex items-start gap-2 p-3 bg-muted/50 rounded-lg border border-border/50">
            <div className="w-4 h-4 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-primary text-[10px] font-bold">i</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              All sign-in methods use secure Internet Identity. Your data is
              private and on-chain.
            </p>
          </div>

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
