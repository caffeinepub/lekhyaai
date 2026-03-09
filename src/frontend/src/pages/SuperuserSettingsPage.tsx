import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Bot,
  CalendarClock,
  CheckCircle2,
  CreditCard,
  Database,
  Download,
  Eye,
  EyeOff,
  IndianRupee,
  KeyRound,
  Lock,
  Mail,
  MessageSquare,
  Save,
  ServerCog,
  Shield,
  Smartphone,
  Timer,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useActor } from "../hooks/useActor";
import {
  exportAllDataAsJSON,
  getLastBackupTime,
  isBackupOverdue,
} from "../utils/backupUtils";
import {
  type PricingConfig,
  getPricingConfig,
  savePricingConfig,
} from "../utils/pricingConfig";
import {
  type SuperUserConfig,
  activateSuperUser,
  changeSuperUserPin,
  deactivateSuperUser,
  getSuperUserConfig,
  isSuperUserActive,
  saveSuperUserConfig,
} from "../utils/superuser";

// ─── PIN Gate ────────────────────────────────────────────────────────────────
function PinGate({ onUnlocked }: { onUnlocked: () => void }) {
  const [pin, setPin] = useState("");
  const [showPin, setShowPin] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!pin.trim()) {
      setError("Please enter the Developer PIN");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const ok = await activateSuperUser(pin.trim());
      if (ok) {
        toast.success("Developer Mode activated");
        onUnlocked();
      } else {
        setError("Incorrect PIN. Please try again.");
        setPin("");
        inputRef.current?.focus();
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="bg-card border border-border rounded-2xl p-8 shadow-lg space-y-6">
          {/* Icon + title */}
          <div className="flex flex-col items-center gap-3 text-center">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Shield className="w-7 h-7 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-display font-bold text-foreground">
                Developer Mode
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Enter the SuperUser PIN to continue
              </p>
            </div>
          </div>

          {/* PIN form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="dev-pin" className="text-sm font-medium">
                Developer PIN
              </Label>
              <div className="relative">
                <Input
                  ref={inputRef}
                  id="dev-pin"
                  data-ocid="superuser.pin_gate.input"
                  type={showPin ? "text" : "password"}
                  value={pin}
                  onChange={(e) => {
                    setPin(e.target.value);
                    setError("");
                  }}
                  placeholder="Enter PIN"
                  className={`pr-10 font-mono tracking-widest text-center text-lg ${error ? "border-destructive focus-visible:ring-destructive" : ""}`}
                  autoComplete="off"
                />
                <button
                  type="button"
                  onClick={() => setShowPin((p) => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  tabIndex={-1}
                >
                  {showPin ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
              {error && (
                <p
                  className="text-xs text-destructive flex items-center gap-1"
                  data-ocid="superuser.pin_gate.error_state"
                >
                  {error}
                </p>
              )}
            </div>

            <Button
              data-ocid="superuser.pin_gate.submit_button"
              type="submit"
              className="w-full"
              disabled={loading || !pin.trim()}
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 rounded-full border-2 border-primary-foreground border-t-transparent animate-spin mr-2" />
                  Verifying…
                </>
              ) : (
                <>
                  <KeyRound className="w-4 h-4 mr-2" />
                  Activate Developer Mode
                </>
              )}
            </Button>
          </form>

          <p className="text-[11px] text-muted-foreground text-center">
            This area is restricted to SuperUser access only.
            <br />
            Not visible to regular app users.
          </p>
        </div>
      </div>
    </div>
  );
}

function Section({
  icon: Icon,
  title,
  subtitle,
  children,
}: {
  icon: React.ElementType;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-card border border-border rounded-2xl p-5 md:p-6 space-y-4">
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
          <Icon className="w-4.5 h-4.5 text-primary" />
        </div>
        <div>
          <h3 className="font-semibold text-foreground">{title}</h3>
          {subtitle && (
            <p className="text-sm text-muted-foreground mt-0.5">{subtitle}</p>
          )}
        </div>
      </div>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

function ApiKeyField({
  label,
  value,
  onChange,
  placeholder,
  ocid,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  ocid: string;
}) {
  const [show, setShow] = useState(false);
  return (
    <div className="space-y-1.5">
      <Label className="text-sm font-medium">{label}</Label>
      <div className="relative">
        <Input
          data-ocid={ocid}
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder ?? "Paste API key here"}
          className="pr-10 font-mono text-xs"
        />
        <button
          type="button"
          onClick={() => setShow((p) => !p)}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
        >
          {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}

function SuperuserSettingsContent() {
  const [config, setConfig] = useState<SuperUserConfig>(() =>
    getSuperUserConfig(),
  );
  const [saving, setSaving] = useState(false);

  // Stripe + Razorpay backend status
  const { actor, isFetching: actorFetching } = useActor();
  const [stripeConfigured, setStripeConfigured] = useState<boolean | null>(
    null,
  );
  const [stripeSaving, setStripeSaving] = useState(false);

  // Razorpay config state
  const [razorpayConfigured, setRazorpayConfigured] = useState<boolean | null>(
    null,
  );
  const [razorpayKeyId, setRazorpayKeyId] = useState("");
  const [razorpayKeySecret, setRazorpayKeySecret] = useState("");
  const [showRazorpaySecret, setShowRazorpaySecret] = useState(false);
  const [razorpaySaving, setRazorpaySaving] = useState(false);

  useEffect(() => {
    if (!actor || actorFetching) return;
    Promise.all([
      actor.isStripeConfigured().catch(() => false),
      actor.isRazorpayConfigured().catch(() => false),
    ]).then(([stripe, razorpay]) => {
      setStripeConfigured(stripe);
      setRazorpayConfigured(razorpay);
    });
  }, [actor, actorFetching]);

  async function handleSaveStripeBackend() {
    if (!actor || !config.paymentGatewaySecret) return;
    setStripeSaving(true);
    try {
      await actor.setStripeConfiguration({
        secretKey: config.paymentGatewaySecret,
        allowedCountries: ["IN"],
      });
      toast.success("Stripe configured on backend");
      const v = await actor.isStripeConfigured();
      setStripeConfigured(v);
    } catch {
      toast.error("Failed to save Stripe configuration to backend");
    } finally {
      setStripeSaving(false);
    }
  }

  async function handleSaveRazorpayBackend() {
    if (!actor || !razorpayKeyId || !razorpayKeySecret) return;
    setRazorpaySaving(true);
    try {
      await actor.setRazorpayConfiguration(razorpayKeyId, razorpayKeySecret);
      toast.success("Razorpay configured on backend");
      const v = await actor.isRazorpayConfigured();
      setRazorpayConfigured(v);
    } catch {
      toast.error("Failed to save Razorpay configuration to backend");
    } finally {
      setRazorpaySaving(false);
    }
  }

  // Pricing config state
  const [pricing, setPricing] = useState<PricingConfig>(() =>
    getPricingConfig(),
  );
  const [pricingSaving, setPricingSaving] = useState(false);

  function setPricingField<K extends keyof PricingConfig>(
    key: K,
    value: PricingConfig[K],
  ) {
    setPricing((p) => ({ ...p, [key]: value }));
  }

  function handleSavePricing() {
    setPricingSaving(true);
    try {
      savePricingConfig(pricing);
      toast.success("Pricing configuration saved");
    } finally {
      setPricingSaving(false);
    }
  }

  // Backup
  const lastBackup = getLastBackupTime();
  const backupOverdue =
    config.autoBackupEnabled && isBackupOverdue(config.autoBackupFrequency);

  // Password-protected backup
  const LS_BACKUP_LOCKOUT = "lekhya_backup_lockout";
  const MAX_BACKUP_ATTEMPTS = 3;
  const LOCKOUT_DURATION = 5 * 60 * 1000; // 5 minutes
  const [backupPasswordInput, setBackupPasswordInput] = useState("");
  const [showBackupForm, setShowBackupForm] = useState(false);
  const [backupAttempts, setBackupAttempts] = useState(0);
  const [backupPwdError, setBackupPwdError] = useState("");
  const [backupLocked, setBackupLocked] = useState(() => {
    const lockout = localStorage.getItem(LS_BACKUP_LOCKOUT);
    if (!lockout) return false;
    return Date.now() - Number(lockout) < LOCKOUT_DURATION;
  });
  const [backupLockRemaining, setBackupLockRemaining] = useState(0);

  useEffect(() => {
    if (!backupLocked) return;
    const lockout = localStorage.getItem(LS_BACKUP_LOCKOUT);
    if (!lockout) {
      setBackupLocked(false);
      return;
    }
    const interval = setInterval(() => {
      const remaining = LOCKOUT_DURATION - (Date.now() - Number(lockout));
      if (remaining <= 0) {
        setBackupLocked(false);
        setBackupAttempts(0);
        localStorage.removeItem(LS_BACKUP_LOCKOUT);
        clearInterval(interval);
      } else {
        setBackupLockRemaining(Math.ceil(remaining / 1000));
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [backupLocked]);

  function handleBackupPasswordSubmit() {
    const correct = config.backupPassword || "BACKUP2024";
    if (backupPasswordInput === correct) {
      exportAllDataAsJSON();
      toast.success("Backup downloaded successfully");
      setShowBackupForm(false);
      setBackupPasswordInput("");
      setBackupAttempts(0);
      setBackupPwdError("");
    } else {
      const newAttempts = backupAttempts + 1;
      setBackupAttempts(newAttempts);
      if (newAttempts >= MAX_BACKUP_ATTEMPTS) {
        const now = Date.now();
        localStorage.setItem(LS_BACKUP_LOCKOUT, String(now));
        setBackupLocked(true);
        setBackupLockRemaining(Math.ceil(LOCKOUT_DURATION / 1000));
        setBackupPwdError("Too many incorrect attempts. Locked for 5 minutes.");
        setShowBackupForm(false);
      } else {
        setBackupPwdError(
          `Incorrect password. ${MAX_BACKUP_ATTEMPTS - newAttempts} attempt${MAX_BACKUP_ATTEMPTS - newAttempts === 1 ? "" : "s"} remaining.`,
        );
      }
      setBackupPasswordInput("");
    }
  }

  // Backup requests from Client Admins
  const [backupRequests, setBackupRequests] = useState<
    Array<{
      id: string;
      requestedBy: string;
      requestedAt: string;
      status: "pending" | "fulfilled";
    }>
  >(() => {
    try {
      return JSON.parse(localStorage.getItem("lekhya_backup_requests") ?? "[]");
    } catch {
      return [];
    }
  });

  function markRequestFulfilled(id: string) {
    const updated = backupRequests.map((r) =>
      r.id === id ? { ...r, status: "fulfilled" as const } : r,
    );
    setBackupRequests(updated);
    localStorage.setItem("lekhya_backup_requests", JSON.stringify(updated));
    toast.success("Backup request marked as fulfilled");
  }

  // Subscription renewal mock data
  const RENEWAL_CLIENTS = [
    {
      id: "C001",
      name: "Sunrise Traders Pvt Ltd",
      plan: "Professional",
      expiresAt: Date.now() + 5 * 24 * 60 * 60 * 1000,
    },
    {
      id: "C002",
      name: "GreenLeaf Exports",
      plan: "Starter",
      expiresAt: Date.now() + 18 * 24 * 60 * 60 * 1000,
    },
    {
      id: "C003",
      name: "Mehta & Sons CA Firm",
      plan: "Enterprise",
      expiresAt: Date.now() + 12 * 24 * 60 * 60 * 1000,
    },
    {
      id: "C004",
      name: "Agro Input Suppliers",
      plan: "Starter",
      expiresAt: Date.now() + 40 * 24 * 60 * 60 * 1000,
    },
    {
      id: "C005",
      name: "Coastal Seafoods Ltd",
      plan: "Professional",
      expiresAt: Date.now() + 2 * 24 * 60 * 60 * 1000,
    },
  ];

  // PIN change state
  const [oldPin, setOldPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [pinSaving, setPinSaving] = useState(false);

  function setField<K extends keyof SuperUserConfig>(
    key: K,
    value: SuperUserConfig[K],
  ) {
    setConfig((p) => ({ ...p, [key]: value }));
  }

  async function handleSave() {
    setSaving(true);
    try {
      saveSuperUserConfig(config);
      toast.success("SuperUser settings saved");
    } finally {
      setSaving(false);
    }
  }

  async function handlePinChange() {
    if (!oldPin || !newPin || !confirmPin) {
      toast.error("Please fill all PIN fields");
      return;
    }
    if (newPin !== confirmPin) {
      toast.error("New PIN and confirm PIN do not match");
      return;
    }
    if (newPin.trim().length < 6) {
      toast.error("PIN must be at least 6 characters");
      return;
    }
    setPinSaving(true);
    try {
      const ok = await changeSuperUserPin(oldPin, newPin);
      if (ok) {
        toast.success("Developer PIN changed successfully");
        setOldPin("");
        setNewPin("");
        setConfirmPin("");
      } else {
        toast.error("Current PIN is incorrect");
      }
    } finally {
      setPinSaving(false);
    }
  }

  function handleDeactivate() {
    deactivateSuperUser();
    toast.info("Developer mode deactivated");
    window.location.reload();
  }

  return (
    <div className="max-w-3xl mx-auto px-4 md:px-6 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Shield className="w-5 h-5 text-primary" />
            <h1 className="text-2xl font-display font-bold text-foreground">
              SuperUser Settings
            </h1>
            <span className="px-2 py-0.5 bg-destructive/10 text-destructive text-xs font-bold rounded-full border border-destructive/20">
              DEVELOPER MODE
            </span>
          </div>
          <p className="text-muted-foreground text-sm">
            System-level settings. Not visible to regular users.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleDeactivate}
          className="text-destructive border-destructive/30 hover:bg-destructive/10 flex-shrink-0"
          data-ocid="superuser.deactivate_button"
        >
          Exit Dev Mode
        </Button>
      </div>

      {/* Security — PIN Change */}
      <Section
        icon={Lock}
        title="Change Developer PIN"
        subtitle="Minimum 6 characters. Current default: LEKHYA2024"
      >
        <div className="grid gap-3 md:grid-cols-3">
          <div className="space-y-1.5">
            <Label className="text-sm">Current PIN</Label>
            <Input
              data-ocid="superuser.old_pin.input"
              type="password"
              value={oldPin}
              onChange={(e) => setOldPin(e.target.value)}
              placeholder="Current PIN"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm">New PIN</Label>
            <Input
              data-ocid="superuser.new_pin.input"
              type="password"
              value={newPin}
              onChange={(e) => setNewPin(e.target.value)}
              placeholder="New PIN (min 6 chars)"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm">Confirm New PIN</Label>
            <Input
              data-ocid="superuser.confirm_pin.input"
              type="password"
              value={confirmPin}
              onChange={(e) => setConfirmPin(e.target.value)}
              placeholder="Repeat new PIN"
            />
          </div>
        </div>
        <Button
          data-ocid="superuser.change_pin.button"
          onClick={handlePinChange}
          disabled={pinSaving}
          variant="outline"
          size="sm"
        >
          <KeyRound className="w-4 h-4 mr-2" />
          Change PIN
        </Button>
      </Section>

      {/* AI Engine */}
      <Section
        icon={Bot}
        title="AI Engine — Groq API"
        subtitle="Powers the AI Assistant, floating widget, and invoice OCR analysis"
      >
        <ApiKeyField
          label="Groq API Key"
          value={config.groqApiKey}
          onChange={(v) => setField("groqApiKey", v)}
          placeholder="gsk_..."
          ocid="superuser.groq_key.input"
        />
        <div className="grid gap-3 md:grid-cols-2">
          <div className="space-y-1.5">
            <Label className="text-sm">AI Chat Model</Label>
            <Select
              value={config.groqModel}
              onValueChange={(v) => setField("groqModel", v)}
            >
              <SelectTrigger data-ocid="superuser.groq_model.select">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="llama-3.3-70b-versatile">
                  Llama 3.3 70B (Best)
                </SelectItem>
                <SelectItem value="llama3-70b-8192">Llama 3 70B</SelectItem>
                <SelectItem value="llama3-8b-8192">
                  Llama 3 8B (Fast)
                </SelectItem>
                <SelectItem value="llama-3.1-8b-instant">
                  Llama 3.1 8B Instant
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm">Vision / OCR Model</Label>
            <Select
              value={config.llamaVisionModel}
              onValueChange={(v) => setField("llamaVisionModel", v)}
            >
              <SelectTrigger data-ocid="superuser.vision_model.select">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="meta-llama/llama-4-scout-17b-16e-instruct">
                  Llama 4 Scout 17B (Best OCR)
                </SelectItem>
                <SelectItem value="llama-3.2-11b-vision-preview">
                  Llama 3.2 11B Vision (Fast)
                </SelectItem>
                <SelectItem value="llama-3.2-90b-vision-preview">
                  Llama 3.2 90B Vision (Powerful)
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="bg-muted/50 rounded-lg p-3 text-xs text-muted-foreground">
          Get a free key at{" "}
          <a
            href="https://console.groq.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary underline"
          >
            console.groq.com
          </a>
          . One key powers both the AI assistant and invoice OCR scanning.
        </div>
      </Section>

      {/* WhatsApp */}
      <Section
        icon={MessageSquare}
        title="WhatsApp Business API"
        subtitle="Used for sending invoices and reports via WhatsApp"
      >
        <ApiKeyField
          label="WhatsApp API Access Token"
          value={config.whatsappApiKey}
          onChange={(v) => setField("whatsappApiKey", v)}
          placeholder="EAAxxxxx..."
          ocid="superuser.whatsapp_key.input"
        />
        <div className="space-y-1.5">
          <Label className="text-sm">WhatsApp Phone Number ID</Label>
          <Input
            data-ocid="superuser.whatsapp_phone_id.input"
            value={config.whatsappPhoneId}
            onChange={(e) => setField("whatsappPhoneId", e.target.value)}
            placeholder="10-digit WhatsApp Phone Number ID from Meta Business"
            className="font-mono text-xs"
          />
        </div>
        <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3 text-xs text-amber-800 dark:text-amber-200">
          Leave empty to use wa.me deep-link fallback (opens WhatsApp with
          pre-filled message — no API needed).
        </div>
      </Section>

      {/* Email */}
      <Section
        icon={Mail}
        title="Email (SMTP)"
        subtitle="Used for sending invoices and GST reports by email"
      >
        <div className="grid gap-3 md:grid-cols-2">
          <div className="space-y-1.5">
            <Label className="text-sm">SMTP Host</Label>
            <Input
              data-ocid="superuser.email_host.input"
              value={config.emailSmtpHost}
              onChange={(e) => setField("emailSmtpHost", e.target.value)}
              placeholder="smtp.gmail.com"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm">SMTP Port</Label>
            <Input
              data-ocid="superuser.email_port.input"
              value={config.emailSmtpPort}
              onChange={(e) => setField("emailSmtpPort", e.target.value)}
              placeholder="587"
            />
          </div>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <div className="space-y-1.5">
            <Label className="text-sm">SMTP Username / Email</Label>
            <Input
              data-ocid="superuser.email_user.input"
              value={config.emailSmtpUser}
              onChange={(e) => setField("emailSmtpUser", e.target.value)}
              placeholder="noreply@yourcompany.com"
            />
          </div>
          <ApiKeyField
            label="SMTP Password / App Password"
            value={config.emailSmtpPass}
            onChange={(v) => setField("emailSmtpPass", v)}
            placeholder="App password or SMTP password"
            ocid="superuser.email_pass.input"
          />
        </div>
      </Section>

      {/* Payment Gateway */}
      <Section
        icon={Smartphone}
        title="Payment Gateway"
        subtitle="Used for subscription billing on the LekhyaAI website"
      >
        {/* Backend Stripe status */}
        <div
          className="flex items-center justify-between bg-muted/40 rounded-xl px-4 py-3 border border-border"
          data-ocid="superuser.stripe_backend_status.card"
        >
          <div className="flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium text-foreground">
              Stripe Backend Status
            </span>
          </div>
          {stripeConfigured === null ? (
            <Badge variant="outline" className="text-xs">
              Checking…
            </Badge>
          ) : stripeConfigured ? (
            <Badge className="bg-success/15 text-success border border-success/30 text-xs font-semibold">
              Backend: Configured
            </Badge>
          ) : (
            <Badge className="bg-amber-100 text-amber-700 border border-amber-200 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-800 text-xs font-semibold">
              Backend: Not Set
            </Badge>
          )}
        </div>

        <ApiKeyField
          label="Payment Gateway API Key (Public)"
          value={config.paymentGatewayKey}
          onChange={(v) => setField("paymentGatewayKey", v)}
          placeholder="rzp_live_... or pk_live_..."
          ocid="superuser.payment_key.input"
        />
        <ApiKeyField
          label="Payment Gateway Secret Key"
          value={config.paymentGatewaySecret}
          onChange={(v) => setField("paymentGatewaySecret", v)}
          placeholder="sk_live_... or sk_test_..."
          ocid="superuser.payment_secret.input"
        />
        <div className="bg-muted/50 rounded-lg p-3 text-xs text-muted-foreground">
          Supports Razorpay and Stripe format keys. The checkout UI
          automatically detects the provider from the key prefix (rzp_ =
          Razorpay, pk_ = Stripe). The secret key is saved to the backend
          canister for server-side checkout session creation.
        </div>
        <Button
          data-ocid="superuser.save_stripe_backend.button"
          onClick={handleSaveStripeBackend}
          disabled={
            stripeSaving || !config.paymentGatewaySecret || actorFetching
          }
          variant="outline"
          className="w-full border-primary/30 text-primary hover:bg-primary/5"
        >
          {stripeSaving ? (
            <>
              <span className="mr-2 h-4 w-4 animate-spin inline-block border-2 border-current border-t-transparent rounded-full" />
              Saving to Backend…
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Save Stripe Secret to Backend
            </>
          )}
        </Button>
      </Section>

      {/* Razorpay Payment Gateway */}
      <Section
        icon={IndianRupee}
        title="Razorpay Payment Gateway"
        subtitle="Indian payment gateway for subscription billing (preferred for India)"
      >
        {/* Razorpay backend status */}
        <div
          className="flex items-center justify-between bg-muted/40 rounded-xl px-4 py-3 border border-border"
          data-ocid="superuser.razorpay_backend_status.card"
        >
          <div className="flex items-center gap-2">
            <IndianRupee className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium text-foreground">
              Razorpay Backend Status
            </span>
          </div>
          {razorpayConfigured === null ? (
            <Badge variant="outline" className="text-xs">
              Checking…
            </Badge>
          ) : razorpayConfigured ? (
            <Badge className="bg-success/15 text-success border border-success/30 text-xs font-semibold">
              Backend: Configured
            </Badge>
          ) : (
            <Badge className="bg-amber-100 text-amber-700 border border-amber-200 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-800 text-xs font-semibold">
              Backend: Not Set
            </Badge>
          )}
        </div>

        {/* Razorpay Key ID */}
        <div className="space-y-1.5">
          <Label className="text-sm font-medium">Razorpay Key ID</Label>
          <Input
            data-ocid="superuser.razorpay_key_id.input"
            type="text"
            value={razorpayKeyId}
            onChange={(e) => setRazorpayKeyId(e.target.value)}
            placeholder="rzp_live_..."
            className="font-mono text-xs"
          />
        </div>

        {/* Razorpay Key Secret */}
        <div className="space-y-1.5">
          <Label className="text-sm font-medium">Razorpay Key Secret</Label>
          <div className="relative">
            <Input
              data-ocid="superuser.razorpay_key_secret.input"
              type={showRazorpaySecret ? "text" : "password"}
              value={razorpayKeySecret}
              onChange={(e) => setRazorpayKeySecret(e.target.value)}
              placeholder="Paste Razorpay secret key here"
              className="pr-10 font-mono text-xs"
            />
            <button
              type="button"
              onClick={() => setShowRazorpaySecret((p) => !p)}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              {showRazorpaySecret ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>

        <div className="bg-muted/50 rounded-lg p-3 text-xs text-muted-foreground">
          Get your keys from the{" "}
          <a
            href="https://dashboard.razorpay.com/app/website-app-settings/api-keys"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary underline"
          >
            Razorpay Dashboard
          </a>
          . After saving, create a test order at{" "}
          <strong>/app/razorpay-checkout</strong> to verify.
        </div>

        <Button
          data-ocid="superuser.save_razorpay_backend.button"
          onClick={handleSaveRazorpayBackend}
          disabled={
            razorpaySaving ||
            !razorpayKeyId ||
            !razorpayKeySecret ||
            actorFetching
          }
          variant="outline"
          className="w-full border-primary/30 text-primary hover:bg-primary/5"
        >
          {razorpaySaving ? (
            <>
              <span className="mr-2 h-4 w-4 animate-spin inline-block border-2 border-current border-t-transparent rounded-full" />
              Saving to Backend…
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Save Razorpay Keys to Backend
            </>
          )}
        </Button>
      </Section>

      {/* Cloud Services */}
      <Section
        icon={ServerCog}
        title="Cloud Services (GCP)"
        subtitle="Google Cloud Platform API key for optional Document AI"
      >
        <ApiKeyField
          label="GCP API Key"
          value={config.gcpApiKey}
          onChange={(v) => setField("gcpApiKey", v)}
          placeholder="AIzaSy..."
          ocid="superuser.gcp_key.input"
        />
      </Section>

      {/* Custom Database — Server Config */}
      <Section
        icon={Database}
        title="Custom Database — Server Config"
        subtitle="Production-grade database configuration (not visible to regular users)"
      >
        <div className="space-y-4">
          <ApiKeyField
            label="DB Connection String / API URL"
            value={config.dbConnectionString}
            onChange={(v) => setField("dbConnectionString", v)}
            placeholder="postgres://user:pass@host:5432/db or https://api.example.com"
            ocid="superuser.db_connection.input"
          />
          <ApiKeyField
            label="DB API Key / Service Account Key"
            value={config.dbApiKey}
            onChange={(v) => setField("dbApiKey", v)}
            placeholder="Bearer token, service account key, or anon key"
            ocid="superuser.db_api_key.input"
          />
          <div className="space-y-1.5">
            <Label className="text-sm">Webhook URL for Push Sync</Label>
            <Input
              data-ocid="superuser.db_webhook.input"
              type="url"
              value={config.dbWebhookUrl}
              onChange={(e) => setField("dbWebhookUrl", e.target.value)}
              placeholder="https://your-server.com/webhook/lekhya"
            />
          </div>
          <ApiKeyField
            label="Webhook Secret"
            value={config.dbWebhookSecret}
            onChange={(v) => setField("dbWebhookSecret", v)}
            placeholder="Webhook signing secret"
            ocid="superuser.db_webhook_secret.input"
          />
          <div className="space-y-2">
            <Label className="text-sm font-medium">Sync Triggers</Label>
            <p className="text-xs text-muted-foreground">
              Automatically push data to the external database when:
            </p>
            <div className="space-y-2.5">
              {[
                {
                  key: "dbSyncOnInvoice",
                  label: "On Invoice Create / Update",
                  ocid: "superuser.db_sync_invoice.switch",
                },
                {
                  key: "dbSyncOnExpense",
                  label: "On Expense Create",
                  ocid: "superuser.db_sync_expense.switch",
                },
                {
                  key: "dbSyncOnPayment",
                  label: "On Payment Record",
                  ocid: "superuser.db_sync_payment.switch",
                },
              ].map(({ key, label, ocid }) => (
                <div key={key} className="flex items-center justify-between">
                  <Label className="text-sm text-muted-foreground cursor-pointer">
                    {label}
                  </Label>
                  <Switch
                    data-ocid={ocid}
                    checked={!!config[key as keyof typeof config]}
                    onCheckedChange={(v) =>
                      setField(key as keyof typeof config, v)
                    }
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </Section>

      {/* Auto Backup */}
      <Section
        icon={Database}
        title="Auto Backup"
        subtitle="Automatic backup of client account data"
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">Enable Auto Backup</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Automatically export account data on a schedule
            </p>
          </div>
          <Switch
            data-ocid="superuser.auto_backup.switch"
            checked={config.autoBackupEnabled}
            onCheckedChange={(v) => setField("autoBackupEnabled", v)}
          />
        </div>

        {config.autoBackupEnabled && (
          <div className="space-y-3 pt-2 border-t border-border">
            <div className="space-y-1.5">
              <Label className="text-sm">Backup Frequency</Label>
              <Select
                value={config.autoBackupFrequency}
                onValueChange={(v) =>
                  setField(
                    "autoBackupFrequency",
                    v as "daily" | "weekly" | "monthly",
                  )
                }
              >
                <SelectTrigger data-ocid="superuser.backup_frequency.select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm">
                Backup Destination (S3 / GCS / FTP)
              </Label>
              <Input
                data-ocid="superuser.backup_destination.input"
                value={config.backupDestination}
                onChange={(e) => setField("backupDestination", e.target.value)}
                placeholder="s3://my-bucket/lekhyaai-backups or ftp://..."
              />
            </div>
          </div>
        )}
      </Section>

      {/* Developer Notes */}
      <Section
        icon={Shield}
        title="Developer Notes"
        subtitle="Internal documentation, TODOs, and release notes (not visible to users)"
      >
        <Textarea
          data-ocid="superuser.dev_notes.textarea"
          value={config.developerNotes}
          onChange={(e) => setField("developerNotes", e.target.value)}
          placeholder="Add internal notes, known issues, upcoming features, deployment instructions..."
          rows={6}
          className="font-mono text-xs resize-none"
        />
      </Section>

      {/* Subscription Pricing Editor */}
      <Section
        icon={CreditCard}
        title="Subscription Pricing Editor"
        subtitle="These prices appear on the marketing website and quotation form"
      >
        <div className="space-y-4">
          {/* Plan tiers */}
          {(
            [
              { key: "starter", label: "Starter" },
              { key: "professional", label: "Professional" },
              { key: "enterprise", label: "Enterprise" },
            ] as const
          ).map(({ key, label }) => (
            <div key={key} className="space-y-2">
              <p className="text-sm font-medium text-foreground">
                {label} Plan
              </p>
              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-1.5">
                  <Label className="text-xs">Monthly (₹)</Label>
                  <Input
                    data-ocid={`superuser.pricing_${key}_monthly.input`}
                    type="number"
                    min={0}
                    value={pricing[key].monthly}
                    onChange={(e) =>
                      setPricingField(key, {
                        ...pricing[key],
                        monthly: Number(e.target.value) || 0,
                      })
                    }
                    className="font-mono"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Annual (₹)</Label>
                  <Input
                    data-ocid={`superuser.pricing_${key}_annual.input`}
                    type="number"
                    min={0}
                    value={pricing[key].annual}
                    onChange={(e) =>
                      setPricingField(key, {
                        ...pricing[key],
                        annual: Number(e.target.value) || 0,
                      })
                    }
                    className="font-mono"
                  />
                </div>
              </div>
            </div>
          ))}

          {/* Per-unit rates */}
          <div className="border-t border-border pt-3 grid gap-3 md:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-sm">Per Additional User/Month (₹)</Label>
              <Input
                data-ocid="superuser.pricing_per_user.input"
                type="number"
                min={0}
                value={pricing.perUser}
                onChange={(e) =>
                  setPricingField("perUser", Number(e.target.value) || 0)
                }
                className="font-mono"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm">Per Invoice above limit (₹)</Label>
              <Input
                data-ocid="superuser.pricing_per_invoice.input"
                type="number"
                min={0}
                value={pricing.perInvoice}
                onChange={(e) =>
                  setPricingField("perInvoice", Number(e.target.value) || 0)
                }
                className="font-mono"
              />
            </div>
          </div>

          {/* Tally Import tiers */}
          <div className="border-t border-border pt-3">
            <p className="text-sm font-medium text-foreground mb-3">
              Tally Import Pricing (₹)
            </p>
            <div className="grid gap-3 md:grid-cols-3">
              <div className="space-y-1.5">
                <Label className="text-xs">100 Records</Label>
                <Input
                  data-ocid="superuser.pricing_tally_100.input"
                  type="number"
                  min={0}
                  value={pricing.tallyImport.records100}
                  onChange={(e) =>
                    setPricingField("tallyImport", {
                      ...pricing.tallyImport,
                      records100: Number(e.target.value) || 0,
                    })
                  }
                  className="font-mono"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">500 Records</Label>
                <Input
                  data-ocid="superuser.pricing_tally_500.input"
                  type="number"
                  min={0}
                  value={pricing.tallyImport.records500}
                  onChange={(e) =>
                    setPricingField("tallyImport", {
                      ...pricing.tallyImport,
                      records500: Number(e.target.value) || 0,
                    })
                  }
                  className="font-mono"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Unlimited</Label>
                <Input
                  data-ocid="superuser.pricing_tally_unlimited.input"
                  type="number"
                  min={0}
                  value={pricing.tallyImport.recordsUnlimited}
                  onChange={(e) =>
                    setPricingField("tallyImport", {
                      ...pricing.tallyImport,
                      recordsUnlimited: Number(e.target.value) || 0,
                    })
                  }
                  className="font-mono"
                />
              </div>
            </div>
          </div>

          {/* Dev + Server + GST */}
          <div className="border-t border-border pt-3 grid gap-3 md:grid-cols-3">
            <div className="space-y-1.5">
              <Label className="text-sm">Dev Charges One-Time (₹)</Label>
              <Input
                data-ocid="superuser.pricing_dev_charges.input"
                type="number"
                min={0}
                value={pricing.devChargesOneTime}
                onChange={(e) =>
                  setPricingField(
                    "devChargesOneTime",
                    Number(e.target.value) || 0,
                  )
                }
                className="font-mono"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm">Server Monthly (₹)</Label>
              <Input
                data-ocid="superuser.pricing_server_monthly.input"
                type="number"
                min={0}
                value={pricing.serverMonthly}
                onChange={(e) =>
                  setPricingField("serverMonthly", Number(e.target.value) || 0)
                }
                className="font-mono"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm">GST Rate (%)</Label>
              <Input
                data-ocid="superuser.pricing_gst_rate.input"
                type="number"
                min={0}
                max={100}
                value={pricing.gstRate}
                onChange={(e) =>
                  setPricingField("gstRate", Number(e.target.value) || 18)
                }
                className="font-mono"
              />
            </div>
          </div>

          <Button
            data-ocid="superuser.save_pricing.button"
            onClick={handleSavePricing}
            disabled={pricingSaving}
            size="sm"
            className="w-full md:w-auto"
          >
            {pricingSaving ? (
              <div className="w-4 h-4 rounded-full border-2 border-primary-foreground border-t-transparent animate-spin mr-2" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            Save Pricing
          </Button>
        </div>
      </Section>

      {/* Data Backup */}
      <Section
        icon={Database}
        title="Data Backup"
        subtitle="Password-protected export of all account data"
      >
        <div className="space-y-4">
          {/* Backup Access Password config */}
          <div className="space-y-1.5 border-b border-border pb-4">
            <Label className="text-sm font-medium">
              Backup Access Password
            </Label>
            <p className="text-xs text-muted-foreground">
              Required before any backup download. Default: BACKUP2024
            </p>
            <ApiKeyField
              label="Backup Password"
              value={config.backupPassword}
              onChange={(v) => setField("backupPassword", v)}
              placeholder="BACKUP2024"
              ocid="superuser.backup_password.input"
            />
          </div>

          {/* Status */}
          {lastBackup ? (
            <div
              className={`rounded-lg p-3 text-xs flex items-center gap-2 ${
                backupOverdue
                  ? "bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200"
                  : "bg-success/10 border border-success/20 text-success"
              }`}
              data-ocid="superuser.backup.status"
            >
              <Database className="w-4 h-4 flex-shrink-0" />
              <span>
                Last backup:{" "}
                {new Date(lastBackup).toLocaleString("en-IN", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
                {backupOverdue && " — Backup overdue!"}
              </span>
            </div>
          ) : (
            <div
              className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3 text-xs text-amber-800 dark:text-amber-200 flex items-center gap-2"
              data-ocid="superuser.backup.warning_state"
            >
              <Database className="w-4 h-4 flex-shrink-0" />
              No backup has been taken yet. Download your first backup now.
            </div>
          )}

          {/* Lockout warning */}
          {backupLocked && (
            <div
              className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-xs text-destructive"
              data-ocid="superuser.backup.locked_state"
            >
              <Lock className="w-4 h-4 flex-shrink-0" />
              Backup locked for {backupLockRemaining}s after too many failed
              attempts.
            </div>
          )}

          {/* Download button → inline password prompt */}
          {!backupLocked && (
            <>
              <Button
                data-ocid="superuser.backup_now.button"
                onClick={() => setShowBackupForm((p) => !p)}
                variant="outline"
                className="gap-2"
              >
                <Download className="w-4 h-4" />
                Download Backup Now
              </Button>

              {showBackupForm && (
                <div className="border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/20 rounded-xl p-4 space-y-3">
                  <p className="text-xs font-semibold text-amber-800 dark:text-amber-200 flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5" />
                    Enter Backup Password to continue
                  </p>
                  <div className="flex gap-2">
                    <Input
                      data-ocid="superuser.backup_password_confirm.input"
                      type="password"
                      value={backupPasswordInput}
                      onChange={(e) => {
                        setBackupPasswordInput(e.target.value);
                        setBackupPwdError("");
                      }}
                      placeholder="Enter backup password"
                      className={`flex-1 ${backupPwdError ? "border-destructive" : ""}`}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleBackupPasswordSubmit();
                      }}
                    />
                    <Button
                      data-ocid="superuser.backup_password_submit.button"
                      onClick={handleBackupPasswordSubmit}
                      size="sm"
                      disabled={!backupPasswordInput}
                    >
                      <Download className="w-4 h-4 mr-1" />
                      Download
                    </Button>
                    <Button
                      data-ocid="superuser.backup_password_cancel.button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setShowBackupForm(false);
                        setBackupPasswordInput("");
                        setBackupPwdError("");
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                  {backupPwdError && (
                    <p
                      className="text-xs text-destructive"
                      data-ocid="superuser.backup_password.error_state"
                    >
                      {backupPwdError}
                    </p>
                  )}
                </div>
              )}
            </>
          )}

          <p className="text-xs text-muted-foreground">
            Downloads all localStorage data as a JSON file. Password-protected
            to prevent unauthorized data export.
          </p>

          {/* Backup Requests from Client Admins */}
          <div className="border-t border-border pt-4">
            <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <Timer className="w-4 h-4 text-primary" />
              Backup Requests from Clients
              {backupRequests.filter((r) => r.status === "pending").length >
                0 && (
                <span className="ml-auto text-[11px] font-bold px-2 py-0.5 rounded-full bg-destructive/10 text-destructive border border-destructive/20">
                  {backupRequests.filter((r) => r.status === "pending").length}{" "}
                  pending
                </span>
              )}
            </h4>
            {backupRequests.length === 0 ? (
              <p
                className="text-xs text-muted-foreground py-3 text-center"
                data-ocid="superuser.backup_requests.empty_state"
              >
                No backup requests yet. Clients can request a backup from
                Settings.
              </p>
            ) : (
              <div
                className="space-y-2"
                data-ocid="superuser.backup_requests.list"
              >
                {backupRequests.map((req, idx) => (
                  <div
                    key={req.id}
                    data-ocid={`superuser.backup_request.item.${idx + 1}`}
                    className={`flex items-center justify-between p-3 rounded-lg border text-sm ${
                      req.status === "pending"
                        ? "border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800"
                        : "border-border bg-muted/20"
                    }`}
                  >
                    <div>
                      <p className="font-medium text-foreground">
                        {req.requestedBy}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(req.requestedAt).toLocaleString("en-IN", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {req.status === "pending" ? (
                        <Button
                          size="sm"
                          variant="outline"
                          data-ocid={`superuser.backup_request.fulfill.button.${idx + 1}`}
                          onClick={() => markRequestFulfilled(req.id)}
                          className="text-xs h-7"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                          Mark Fulfilled
                        </Button>
                      ) : (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-success/10 text-success border border-success/20 font-medium">
                          Fulfilled
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </Section>

      {/* Subscription Renewals */}
      <Section
        icon={CalendarClock}
        title="Subscription Renewals"
        subtitle="Monitor client subscription expiry and send renewal reminders"
      >
        <div className="space-y-3">
          {RENEWAL_CLIENTS.map((client, idx) => {
            const daysLeft = Math.ceil(
              (client.expiresAt - Date.now()) / (24 * 60 * 60 * 1000),
            );
            const isCritical = daysLeft <= 3;
            const isExpiringSoon = daysLeft <= 15;

            return (
              <div
                key={client.id}
                data-ocid={`superuser.renewal.item.${idx + 1}`}
                className={`flex items-center justify-between p-3 rounded-xl border transition-colors ${
                  isCritical
                    ? "border-destructive/30 bg-destructive/5"
                    : isExpiringSoon
                      ? "border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800"
                      : "border-border bg-card"
                }`}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-medium text-sm text-foreground truncate">
                      {client.name}
                    </p>
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary font-medium flex-shrink-0">
                      {client.plan}
                    </span>
                    {isCritical && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-destructive/15 text-destructive font-bold border border-destructive/20 flex-shrink-0">
                        CRITICAL
                      </span>
                    )}
                    {!isCritical && isExpiringSoon && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 font-semibold border border-amber-200 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-800 flex-shrink-0">
                        Expiring Soon
                      </span>
                    )}
                  </div>
                  <p
                    className={`text-xs mt-0.5 ${
                      isCritical
                        ? "text-destructive font-semibold"
                        : isExpiringSoon
                          ? "text-amber-700 dark:text-amber-300"
                          : "text-muted-foreground"
                    }`}
                  >
                    Expires in {daysLeft} day{daysLeft !== 1 ? "s" : ""} —{" "}
                    {new Date(client.expiresAt).toLocaleDateString("en-IN", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant={isCritical ? "destructive" : "outline"}
                  data-ocid={`superuser.renewal.remind.button.${idx + 1}`}
                  onClick={() =>
                    toast.success(
                      `Renewal reminder queued for ${client.name}`,
                      {
                        description: `${client.plan} plan — ${daysLeft} days remaining`,
                      },
                    )
                  }
                  className="ml-3 flex-shrink-0 text-xs h-8"
                >
                  Send Reminder
                </Button>
              </div>
            );
          })}
        </div>
      </Section>

      {/* Save */}
      <div className="flex justify-end gap-3 pb-8">
        <Button
          data-ocid="superuser.save_button"
          onClick={handleSave}
          disabled={saving}
          className="min-w-[140px]"
        >
          {saving ? (
            <div className="w-4 h-4 rounded-full border-2 border-primary-foreground border-t-transparent animate-spin mr-2" />
          ) : (
            <Save className="w-4 h-4 mr-2" />
          )}
          Save All Settings
        </Button>
      </div>
    </div>
  );
}

export default function SuperuserSettingsPage() {
  const [unlocked, setUnlocked] = useState(() => isSuperUserActive());

  if (!unlocked) {
    return <PinGate onUnlocked={() => setUnlocked(true)} />;
  }

  return <SuperuserSettingsContent />;
}
