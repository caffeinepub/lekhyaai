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
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { useQueryClient } from "@tanstack/react-query";
import {
  Bot,
  Building2,
  Check,
  CheckCircle,
  Eye,
  EyeOff,
  ImageIcon,
  Loader2,
  Palette,
  Plus,
  Save,
  Tag,
  Trash2,
  Upload,
  X,
  XCircle,
} from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import CreateBusinessModal from "../components/CreateBusinessModal";
import DeleteConfirmDialog from "../components/DeleteConfirmDialog";
import { useBusiness } from "../context/BusinessContext";
import { THEMES, useTheme } from "../context/ThemeContext";
import { useActor } from "../hooks/useActor";
import {
  COMPANY_CATEGORIES,
  getBusinessCategory,
  saveBusinessCategory,
} from "../utils/companyCategories";
import { INDIAN_STATES } from "../utils/indianStates";
import {
  LLAMA_MODELS,
  callLlamaApi,
  getLlamaConfig,
  saveLlamaConfig,
} from "../utils/llamaAi";

export default function SettingsPage() {
  const { actor } = useActor();
  const { businesses, activeBusiness, setActiveBusinessId, refetchBusinesses } =
    useBusiness();
  const qc = useQueryClient();
  const [saving, setSaving] = useState(false);
  const [createBizOpen, setCreateBizOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<bigint | null>(null);

  const {
    theme,
    isDark,
    logoUrl,
    signatureUrl,
    setTheme,
    toggleDark,
    setLogo,
    setSignature,
  } = useTheme();

  // ─── Llama AI Config ───────────────────────────────────────────────
  const [llamaCfg, setLlamaCfg] = useState(() => getLlamaConfig());
  const [showApiKey, setShowApiKey] = useState(false);
  const [testingConn, setTestingConn] = useState(false);
  const [connStatus, setConnStatus] = useState<"idle" | "ok" | "error">("idle");

  function handleSaveLlama() {
    saveLlamaConfig(llamaCfg);
    toast.success("AI settings saved!");
  }

  async function handleTestConnection() {
    if (!llamaCfg.apiKey) {
      toast.error("Please enter your Groq API key first.");
      return;
    }
    setTestingConn(true);
    setConnStatus("idle");
    try {
      const reply = await callLlamaApi(
        [{ role: "user", content: "Say hello in one word" }],
        llamaCfg,
      );
      setConnStatus("ok");
      toast.success(`Connected to Llama AI! Response: ${reply.slice(0, 60)}`);
    } catch (err: unknown) {
      setConnStatus("error");
      const msg = err instanceof Error ? err.message : "Unknown error";
      if (msg === "NO_API_KEY") toast.error("No API key configured.");
      else if (msg === "INVALID_API_KEY")
        toast.error("Invalid Groq API key. Get yours at console.groq.com");
      else if (msg === "CORS_ERROR")
        toast.error("Network error — check your connection.");
      else if (msg === "RATE_LIMIT")
        toast.error("Rate limit reached. Wait a moment and try again.");
      else toast.error(`Connection failed: ${msg}`);
    } finally {
      setTestingConn(false);
    }
  }

  // ─── Business Category ────────────────────────────────────────────
  const bizIdStr = activeBusiness?.id.toString() ?? "";
  const [bizCategory, setBizCategory] = useState(() =>
    bizIdStr ? getBusinessCategory(bizIdStr) : "",
  );

  // Sync when business changes
  useEffect(() => {
    if (bizIdStr) {
      setBizCategory(getBusinessCategory(bizIdStr));
    }
  }, [bizIdStr]);

  const logoInputRef = useRef<HTMLInputElement>(null);
  const signatureInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    name: "",
    gstin: "",
    state: "",
    address: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (activeBusiness) {
      setForm({
        name: activeBusiness.name,
        gstin: activeBusiness.gstin,
        state: activeBusiness.state,
        address: activeBusiness.address,
      });
      setErrors({});
    }
  }, [activeBusiness]);

  function validate() {
    const errs: Record<string, string> = {};
    if (!form.name.trim()) errs.name = "Business name is required";
    if (form.gstin && form.gstin.length !== 15)
      errs.gstin = "GSTIN must be exactly 15 characters";
    if (!form.state) errs.state = "State is required";
    return errs;
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    if (!actor || !activeBusiness) return;
    setSaving(true);
    try {
      await actor.updateBusiness(
        activeBusiness.id,
        form.name,
        form.gstin,
        form.state,
        form.address,
      );
      toast.success("Business settings saved!");
      await qc.invalidateQueries({ queryKey: ["businesses"] });
      refetchBusinesses();
    } catch {
      toast.error("Failed to save settings.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteBusiness() {
    if (!deleteId || !actor) return;
    try {
      await actor.deleteBusiness(deleteId);
      toast.success("Business deleted.");
      setDeleteId(null);
      await qc.invalidateQueries({ queryKey: ["businesses"] });
      refetchBusinesses();
    } catch {
      toast.error("Failed to delete business.");
    }
  }

  function handleFileUpload(
    file: File,
    maxSizeMB: number,
    onSuccess: (dataUrl: string) => void,
  ) {
    if (file.size > maxSizeMB * 1024 * 1024) {
      toast.error(`File must be smaller than ${maxSizeMB}MB`);
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = ev.target?.result;
      if (typeof result === "string") {
        onSuccess(result);
        toast.success("Uploaded successfully!");
      }
    };
    reader.readAsDataURL(file);
  }

  function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    handleFileUpload(file, 2, setLogo);
    e.target.value = "";
  }

  function handleSignatureChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    handleFileUpload(file, 1, setSignature);
    e.target.value = "";
  }

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="font-display text-2xl md:text-3xl text-foreground">
          Settings
        </h1>
        <p className="text-muted-foreground text-sm mt-0.5">
          Manage your business profile and preferences
        </p>
      </div>

      {/* Business edit form */}
      {activeBusiness && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card rounded-xl shadow-card border border-border p-6 mb-6"
        >
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Building2 className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">
                Business Profile
              </h3>
              <p className="text-xs text-muted-foreground">
                Edit your active business details
              </p>
            </div>
          </div>

          <form onSubmit={handleSave} className="space-y-4">
            <div className="space-y-1.5">
              <Label>
                Business Name <span className="text-destructive">*</span>
              </Label>
              <Input
                data-ocid="settings.business_name_input"
                value={form.name}
                onChange={(e) => {
                  setForm((p) => ({ ...p, name: e.target.value }));
                  setErrors((p) => ({ ...p, name: "" }));
                }}
              />
              {errors.name && (
                <p className="text-destructive text-xs">{errors.name}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>GSTIN</Label>
                <Input
                  placeholder="15-character GSTIN"
                  maxLength={15}
                  value={form.gstin}
                  onChange={(e) => {
                    setForm((p) => ({
                      ...p,
                      gstin: e.target.value.toUpperCase(),
                    }));
                    setErrors((p) => ({ ...p, gstin: "" }));
                  }}
                />
                {errors.gstin && (
                  <p className="text-destructive text-xs">{errors.gstin}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label>
                  State <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={form.state}
                  onValueChange={(v) => {
                    setForm((p) => ({ ...p, state: v }));
                    setErrors((p) => ({ ...p, state: "" }));
                  }}
                >
                  <SelectTrigger data-ocid="settings.state_select">
                    <SelectValue placeholder="Select state" />
                  </SelectTrigger>
                  <SelectContent>
                    {INDIAN_STATES.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.state && (
                  <p className="text-destructive text-xs">{errors.state}</p>
                )}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Address</Label>
              <Textarea
                rows={3}
                value={form.address}
                onChange={(e) =>
                  setForm((p) => ({ ...p, address: e.target.value }))
                }
              />
            </div>

            <Button
              type="submit"
              data-ocid="settings.save_button"
              disabled={saving}
              className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Saving…
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" /> Save Changes
                </>
              )}
            </Button>
          </form>
        </motion.div>
      )}

      {/* My Businesses */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-card rounded-xl shadow-card border border-border p-6 mb-6"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-foreground">My Businesses</h3>
          <Button
            size="sm"
            variant="outline"
            data-ocid="settings.add_business.open_modal_button"
            onClick={() => setCreateBizOpen(true)}
            className="gap-1 text-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Business
          </Button>
        </div>

        <div className="space-y-2" data-ocid="settings.businesses_list">
          {businesses.map((biz, idx) => (
            <button
              type="button"
              key={biz.id.toString()}
              className={cn(
                "flex w-full items-center justify-between p-3 rounded-lg border transition-colors cursor-pointer text-left",
                biz.id === activeBusiness?.id
                  ? "border-primary/30 bg-primary/5"
                  : "border-border hover:border-border/80 hover:bg-muted/30",
              )}
              onClick={() => setActiveBusinessId(biz.id)}
              data-ocid={`settings.business.item.${idx + 1}`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={cn(
                    "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0",
                    biz.id === activeBusiness?.id ? "bg-primary" : "bg-muted",
                  )}
                >
                  <Building2
                    className={cn(
                      "w-4 h-4",
                      biz.id === activeBusiness?.id
                        ? "text-primary-foreground"
                        : "text-muted-foreground",
                    )}
                  />
                </div>
                <div className="min-w-0">
                  <p className="font-medium text-sm text-foreground truncate">
                    {biz.name}
                  </p>
                  {biz.gstin && (
                    <p className="text-xs font-mono text-muted-foreground">
                      {biz.gstin}
                    </p>
                  )}
                  {biz.state && (
                    <p className="text-xs text-muted-foreground">{biz.state}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {biz.id === activeBusiness?.id && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                    Active
                  </span>
                )}
                {businesses.length > 1 && (
                  <button
                    type="button"
                    data-ocid={`settings.business.delete_button.${idx + 1}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteId(biz.id);
                    }}
                    className="text-muted-foreground hover:text-destructive transition-colors p-1.5 rounded hover:bg-destructive/10"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </button>
          ))}
        </div>
      </motion.div>

      {/* ─── Color Themes & Appearance ─── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-card rounded-xl shadow-card border border-border p-6 mb-6"
      >
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Palette className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">
              Color Themes &amp; Appearance
            </h3>
            <p className="text-xs text-muted-foreground">
              Customize the look of your workspace
            </p>
          </div>
        </div>

        {/* Dark Mode Toggle */}
        <div className="flex items-center justify-between mb-5 p-3 rounded-lg bg-muted/30 border border-border">
          <div>
            <p className="text-sm font-medium text-foreground">Dark Mode</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Switch between light and dark interface
            </p>
          </div>
          <Switch
            data-ocid="settings.dark_mode.toggle"
            checked={isDark}
            onCheckedChange={toggleDark}
            aria-label="Toggle dark mode"
          />
        </div>

        {/* Theme Swatches */}
        <div>
          <p className="text-sm font-medium text-foreground mb-3">
            Color Theme
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {THEMES.map((t, idx) => {
              const isActive = theme === t.name;
              const [l, c, h] = t.primary.split(" ");
              const swatchColor = `oklch(${l} ${c} ${h})`;
              const sidebarColor = `oklch(${t.sidebar.split(" ").join(" ")})`;
              return (
                <button
                  key={t.name}
                  type="button"
                  data-ocid={`settings.theme.item.${idx + 1}`}
                  onClick={() => setTheme(t.name)}
                  className={cn(
                    "relative flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all duration-200 cursor-pointer hover:shadow-card-hover",
                    isActive
                      ? "border-primary shadow-card bg-primary/5"
                      : "border-border hover:border-primary/40 bg-background",
                  )}
                  aria-pressed={isActive}
                  aria-label={`Select ${t.label} theme`}
                >
                  {/* Swatch preview */}
                  <div className="flex gap-1.5 items-center">
                    {/* Sidebar preview */}
                    <div
                      className="w-8 h-10 rounded-md flex-shrink-0"
                      style={{ backgroundColor: sidebarColor }}
                    />
                    {/* Primary preview */}
                    <div className="flex flex-col gap-1 flex-1">
                      <div
                        className="w-full h-5 rounded-sm"
                        style={{ backgroundColor: swatchColor }}
                      />
                      <div
                        className="w-3/4 h-3 rounded-sm opacity-50"
                        style={{ backgroundColor: swatchColor }}
                      />
                      <div
                        className="w-1/2 h-2 rounded-sm opacity-25"
                        style={{ backgroundColor: swatchColor }}
                      />
                    </div>
                  </div>
                  <span className="text-xs font-medium text-foreground">
                    {t.label}
                  </span>
                  {/* Active checkmark */}
                  {isActive && (
                    <div
                      className="absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: swatchColor }}
                    >
                      <Check className="w-3 h-3 text-white" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </motion.div>

      {/* ─── Branding ─── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-card rounded-xl shadow-card border border-border p-6"
      >
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <ImageIcon className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Branding</h3>
            <p className="text-xs text-muted-foreground">
              Upload your company logo and signature for invoices
            </p>
          </div>
        </div>

        <div className="space-y-6">
          {/* Company Logo */}
          <div>
            <p className="text-sm font-medium text-foreground mb-1">
              Company Logo
            </p>
            <p className="text-xs text-muted-foreground mb-3">
              Appears in the sidebar and on generated invoices. PNG, JPG, or
              SVG, max 2MB.
            </p>

            <div className="flex items-start gap-4">
              {/* Preview */}
              <div className="w-24 h-24 rounded-xl border-2 border-dashed border-border bg-muted/30 flex items-center justify-center overflow-hidden flex-shrink-0">
                {logoUrl ? (
                  <img
                    src={logoUrl}
                    alt="Company logo"
                    className="w-full h-full object-contain p-2"
                  />
                ) : (
                  <div className="flex flex-col items-center gap-1 text-muted-foreground">
                    <Building2 className="w-8 h-8 opacity-40" />
                    <span className="text-[10px]">No logo</span>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex flex-col gap-2">
                <input
                  type="file"
                  ref={logoInputRef}
                  accept="image/png,image/jpeg,image/svg+xml"
                  className="hidden"
                  onChange={handleLogoChange}
                  aria-label="Upload company logo"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  data-ocid="settings.logo.upload_button"
                  onClick={() => logoInputRef.current?.click()}
                  className="gap-2 text-xs"
                >
                  <Upload className="w-3.5 h-3.5" />
                  {logoUrl ? "Replace Logo" : "Upload Logo"}
                </Button>
                {logoUrl && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    data-ocid="settings.logo.delete_button"
                    onClick={() => setLogo(null)}
                    className="gap-2 text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    <X className="w-3.5 h-3.5" />
                    Remove
                  </Button>
                )}
              </div>
            </div>
          </div>

          <div className="border-t border-border" />

          {/* Signature */}
          <div>
            <p className="text-sm font-medium text-foreground mb-1">
              Signature
            </p>
            <p className="text-xs text-muted-foreground mb-3">
              Appears at the bottom of invoices. PNG or JPG, max 1MB.
            </p>

            <div className="flex items-start gap-4">
              {/* Preview */}
              <div className="w-40 h-20 rounded-xl border-2 border-dashed border-border bg-muted/30 flex items-center justify-center overflow-hidden flex-shrink-0">
                {signatureUrl ? (
                  <img
                    src={signatureUrl}
                    alt="Signature"
                    className="w-full h-full object-contain p-2"
                  />
                ) : (
                  <div className="flex flex-col items-center gap-1 text-muted-foreground">
                    <ImageIcon className="w-6 h-6 opacity-40" />
                    <span className="text-[10px]">No signature</span>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex flex-col gap-2">
                <input
                  type="file"
                  ref={signatureInputRef}
                  accept="image/png,image/jpeg"
                  className="hidden"
                  onChange={handleSignatureChange}
                  aria-label="Upload signature"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  data-ocid="settings.signature.upload_button"
                  onClick={() => signatureInputRef.current?.click()}
                  className="gap-2 text-xs"
                >
                  <Upload className="w-3.5 h-3.5" />
                  {signatureUrl ? "Replace Signature" : "Upload Signature"}
                </Button>
                {signatureUrl && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    data-ocid="settings.signature.delete_button"
                    onClick={() => setSignature(null)}
                    className="gap-2 text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    <X className="w-3.5 h-3.5" />
                    Remove
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ─── Business Category ─── */}
      {activeBusiness && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="bg-card rounded-xl shadow-card border border-border p-6 mb-6"
        >
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Tag className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">
                Business Category
              </h3>
              <p className="text-xs text-muted-foreground">
                Helps auto-suggest GST rates for your products
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <Label>Company Category</Label>
            <Select
              value={bizCategory}
              onValueChange={(val) => {
                setBizCategory(val);
                if (bizIdStr) {
                  saveBusinessCategory(bizIdStr, val);
                  toast.success(
                    "Category updated. Products page will now suggest GST rates for your category.",
                  );
                }
              }}
            >
              <SelectTrigger data-ocid="settings.biz_category.select">
                <SelectValue placeholder="Select your business category" />
              </SelectTrigger>
              <SelectContent>
                {COMPANY_CATEGORIES.map((cat) => (
                  <SelectItem key={cat.id} value={cat.name}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {bizCategory && (
              <p className="text-xs text-muted-foreground">
                Default GST slab for{" "}
                <span className="font-medium text-primary">{bizCategory}</span>:{" "}
                {
                  COMPANY_CATEGORIES.find((c) => c.name === bizCategory)
                    ?.defaultGstSlab
                }
                %
              </p>
            )}
          </div>
        </motion.div>
      )}

      {/* ─── AI Engine (Llama via Groq) ─── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-card rounded-xl shadow-card border border-border p-6 mb-6"
      >
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Bot className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">
              AI Engine — Meta Llama (via Groq)
            </h3>
            <p className="text-xs text-muted-foreground">
              Power the AI Accountant with Meta Llama 3 — free, fast, no credit
              card needed
            </p>
          </div>
        </div>

        {/* Groq info banner */}
        <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 mb-4 text-xs text-muted-foreground">
          <p className="font-medium text-foreground mb-0.5">
            How to get a free Groq API key:
          </p>
          <ol className="list-decimal list-inside space-y-0.5">
            <li>
              Go to{" "}
              <a
                href="https://console.groq.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline font-medium"
              >
                console.groq.com
              </a>
            </li>
            <li>Sign up for free (no credit card)</li>
            <li>Create an API key and paste it below</li>
          </ol>
          <p className="mt-1.5 text-muted-foreground">
            Free tier: 30 requests/min, 14,400/day — plenty for daily accounting
            use.
          </p>
        </div>

        <div className="space-y-4">
          {/* API Key */}
          <div className="space-y-1.5">
            <Label>Groq API Key</Label>
            <div className="relative">
              <Input
                data-ocid="settings.llama_api_key.input"
                type={showApiKey ? "text" : "password"}
                placeholder="gsk_xxxxxxxxxxxxxxxxxxxxxxxx"
                value={llamaCfg.apiKey}
                onChange={(e) =>
                  setLlamaCfg((p) => ({ ...p, apiKey: e.target.value }))
                }
                className="pr-10 font-mono text-sm"
              />
              <button
                type="button"
                onClick={() => setShowApiKey((p) => !p)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showApiKey ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {/* Model */}
          <div className="space-y-1.5">
            <Label>Llama Model</Label>
            <Select
              value={llamaCfg.model}
              onValueChange={(v) => setLlamaCfg((p) => ({ ...p, model: v }))}
            >
              <SelectTrigger data-ocid="settings.llama_model.select">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LLAMA_MODELS.map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Llama 3 8B is fastest. Llama 3 70B gives best quality responses.
            </p>
          </div>

          {/* Temperature */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Temperature</Label>
              <span className="text-xs font-mono text-muted-foreground">
                {llamaCfg.temperature.toFixed(1)}
              </span>
            </div>
            <Slider
              min={0}
              max={1}
              step={0.1}
              value={[llamaCfg.temperature]}
              onValueChange={([v]) =>
                setLlamaCfg((p) => ({ ...p, temperature: v ?? 0.7 }))
              }
              data-ocid="settings.llama_temperature.input"
            />
            <div className="flex justify-between text-[10px] text-muted-foreground">
              <span>Precise (0.0)</span>
              <span>Creative (1.0)</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 flex-wrap">
            <Button
              type="button"
              data-ocid="settings.llama_save.button"
              onClick={handleSaveLlama}
              className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2"
            >
              <Save className="w-4 h-4" /> Save AI Settings
            </Button>
            <Button
              type="button"
              variant="outline"
              data-ocid="settings.llama_test.button"
              onClick={handleTestConnection}
              disabled={testingConn || !llamaCfg.apiKey}
              className="gap-2"
            >
              {testingConn ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : connStatus === "ok" ? (
                <CheckCircle className="w-4 h-4 text-success" />
              ) : connStatus === "error" ? (
                <XCircle className="w-4 h-4 text-destructive" />
              ) : (
                <Bot className="w-4 h-4" />
              )}
              {testingConn ? "Testing…" : "Test Connection"}
            </Button>
          </div>

          {connStatus === "ok" && (
            <div className="flex items-center gap-2 p-3 bg-success/10 border border-success/20 rounded-lg text-xs text-success">
              <CheckCircle className="w-4 h-4 flex-shrink-0" />
              Connected to Meta Llama via Groq successfully!
            </div>
          )}
          {connStatus === "error" && (
            <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-xs text-destructive">
              <XCircle className="w-4 h-4 flex-shrink-0" />
              Connection failed. Get your free key at console.groq.com
            </div>
          )}
        </div>
      </motion.div>

      <CreateBusinessModal
        open={createBizOpen}
        onClose={() => setCreateBizOpen(false)}
      />
      <DeleteConfirmDialog
        open={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDeleteBusiness}
        title="Delete Business?"
        description="This will permanently delete the business and all its data."
        ocidPrefix="settings.delete_business"
      />
    </div>
  );
}
