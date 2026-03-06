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
  Database,
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
import { useState } from "react";
import { toast } from "sonner";
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

  function handlePinChange() {
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
      const ok = changeSuperUserPin(oldPin, newPin);
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
          placeholder="Secret key"
          ocid="superuser.payment_secret.input"
        />
        <div className="bg-muted/50 rounded-lg p-3 text-xs text-muted-foreground">
          Supports Razorpay and Stripe format keys. The checkout UI
          automatically detects the provider from the key prefix (rzp_ =
          Razorpay, pk_ = Stripe).
        </div>
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
