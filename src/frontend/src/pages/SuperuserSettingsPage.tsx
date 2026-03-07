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
  CreditCard,
  Database,
  Download,
  Eye,
  EyeOff,
  KeyRound,
  Lock,
  Mail,
  MessageSquare,
  Save,
  ServerCog,
  Shield,
  Smartphone,
} from "lucide-react";
import { useEffect, useState } from "react";
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
  changeSuperUserPin,
  deactivateSuperUser,
  getSuperUserConfig,
  saveSuperUserConfig,
} from "../utils/superuser";

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

export default function SuperuserSettingsPage() {
  const [config, setConfig] = useState<SuperUserConfig>(() =>
    getSuperUserConfig(),
  );
  const [saving, setSaving] = useState(false);

  // Stripe backend status
  const { actor, isFetching: actorFetching } = useActor();
  const [stripeConfigured, setStripeConfigured] = useState<boolean | null>(
    null,
  );
  const [stripeSaving, setStripeSaving] = useState(false);

  useEffect(() => {
    if (!actor || actorFetching) return;
    actor
      .isStripeConfigured()
      .then((v) => setStripeConfigured(v))
      .catch(() => setStripeConfigured(false));
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
        subtitle="Export all account data as a JSON file"
      >
        <div className="space-y-3">
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

          <Button
            data-ocid="superuser.backup_now.button"
            onClick={() => {
              exportAllDataAsJSON();
              toast.success("Backup downloaded successfully");
            }}
            variant="outline"
            className="gap-2"
          >
            <Download className="w-4 h-4" />
            Download Backup Now
          </Button>

          <p className="text-xs text-muted-foreground">
            Downloads all localStorage data as a JSON file. Store it securely
            for data recovery.
          </p>
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
