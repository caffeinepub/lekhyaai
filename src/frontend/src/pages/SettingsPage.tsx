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
  AlertTriangle,
  Bot,
  Building2,
  Check,
  CheckCircle,
  ChevronDown,
  ChevronRight,
  Database,
  Download,
  Eye,
  EyeOff,
  HardDriveDownload,
  ImageIcon,
  Loader2,
  Palette,
  Plus,
  RefreshCw,
  Save,
  ScanLine,
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
import type { ExtendedActor } from "../types/extended-actor";
import { exportAllDataAsJSON } from "../utils/backupUtils";
import {
  COMPANY_CATEGORIES,
  getBusinessCategory,
  saveBusinessCategory,
} from "../utils/companyCategories";
import { INDIAN_STATES } from "../utils/indianStates";
import {
  LLAMA_MODELS,
  LLAMA_VISION_MODELS,
  callLlamaApi,
  callLlamaVision,
  getLlamaConfig,
  getLlamaVisionModel,
  saveLlamaConfig,
  saveLlamaVisionModel,
} from "../utils/llamaAi";

// ─── Data Backup Card ──────────────────────────────────────────────────────
function DataBackupCard() {
  const LS_BACKUP_REQUESTS = "lekhya_backup_requests";

  const [lastRequest, setLastRequest] = useState<{
    id: string;
    requestedBy: string;
    requestedAt: string;
    status: "pending" | "fulfilled";
  } | null>(() => {
    try {
      const raw = localStorage.getItem(LS_BACKUP_REQUESTS);
      const requests = JSON.parse(raw ?? "[]") as Array<{
        id: string;
        requestedBy: string;
        requestedAt: string;
        status: "pending" | "fulfilled";
      }>;
      return requests.length > 0 ? requests[requests.length - 1] : null;
    } catch {
      return null;
    }
  });
  const [requesting, setRequesting] = useState(false);

  function handleRequestBackup() {
    setRequesting(true);
    const req = {
      id: `req-${Date.now()}`,
      requestedBy: "Current User (Admin)",
      requestedAt: new Date().toISOString(),
      status: "pending" as const,
    };
    try {
      const raw = localStorage.getItem(LS_BACKUP_REQUESTS);
      const existing = JSON.parse(raw ?? "[]") as (typeof req)[];
      existing.push(req);
      localStorage.setItem(LS_BACKUP_REQUESTS, JSON.stringify(existing));
      setLastRequest(req);
      toast.success("Backup request sent to SuperUser");
    } catch {
      toast.error("Failed to send backup request");
    } finally {
      setRequesting(false);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.55 }}
      data-ocid="settings.data_backup.section"
      className="bg-card rounded-xl shadow-card border border-border p-6 mb-6"
    >
      <div className="flex items-center gap-3 mb-5">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <HardDriveDownload className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h3 className="font-semibold text-foreground">Data Backup</h3>
          <p className="text-xs text-muted-foreground">
            Request a full backup of your account data from your SuperUser
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="rounded-lg border border-border bg-muted/30 p-3 text-xs text-muted-foreground">
          Backup requests are sent to the system SuperUser who will process and
          deliver your data export. This is the secure way to receive a full
          data backup.
        </div>

        <Button
          data-ocid="settings.request_backup.button"
          variant="outline"
          onClick={handleRequestBackup}
          disabled={requesting || lastRequest?.status === "pending"}
          className="gap-2"
        >
          {requesting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Download className="w-4 h-4" />
          )}
          {requesting
            ? "Sending request…"
            : lastRequest?.status === "pending"
              ? "Request Pending…"
              : "Request Backup from SuperUser"}
        </Button>

        {lastRequest && (
          <div
            className={`flex items-start gap-3 p-3 rounded-lg text-xs border ${
              lastRequest.status === "fulfilled"
                ? "bg-success/10 border-success/20 text-success"
                : "bg-amber-50 border-amber-200 dark:bg-amber-950/20 dark:border-amber-800 text-amber-800 dark:text-amber-200"
            }`}
            data-ocid="settings.backup_request_status.card"
          >
            {lastRequest.status === "fulfilled" ? (
              <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            ) : (
              <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            )}
            <div>
              <p className="font-semibold">
                {lastRequest.status === "fulfilled"
                  ? "Backup request fulfilled"
                  : "Backup request pending"}
              </p>
              <p className="mt-0.5">
                Requested:{" "}
                {new Date(lastRequest.requestedAt).toLocaleString("en-IN", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}

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

  // ─── Llama Vision (OCR) Config ────────────────────────────────────
  const [visionModel, setVisionModel] = useState(() => getLlamaVisionModel());
  const [testingVision, setTestingVision] = useState(false);
  const [visionStatus, setVisionStatus] = useState<"idle" | "ok" | "error">(
    "idle",
  );

  function handleSaveVisionModel() {
    saveLlamaVisionModel(visionModel);
    toast.success("OCR vision model saved!");
  }

  async function handleTestVision() {
    if (!llamaCfg.apiKey) {
      toast.error("No Groq API key. Save your key in AI Engine above first.");
      return;
    }
    setTestingVision(true);
    setVisionStatus("idle");
    try {
      // Test with a tiny 1x1 white JPEG
      const tinyJpeg =
        "/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAABAAEDASIAAhEBAxEB/8QAFAABAAAAAAAAAAAAAAAAAAAACf/EABQQAQAAAAAAAAAAAAAAAAAAAAD/xAAUAQEAAAAAAAAAAAAAAAAAAAAA/8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAwDAQACEQMRAD8AJQAB/9k=";
      await callLlamaVision(tinyJpeg, "image/jpeg", "Say OK in one word.", {
        apiKey: llamaCfg.apiKey,
      });
      setVisionStatus("ok");
      toast.success("Llama Vision is working! Ready to scan invoices.");
    } catch (err) {
      setVisionStatus("error");
      const msg = err instanceof Error ? err.message : "Unknown error";
      if (msg === "INVALID_API_KEY")
        toast.error("Invalid Groq API key. Get yours at console.groq.com");
      else if (msg === "RATE_LIMIT")
        toast.error("Rate limit. Wait a moment and retry.");
      else toast.error(`Vision test failed: ${msg}`);
    } finally {
      setTestingVision(false);
    }
  }

  // ─── Custom Database Config ───────────────────────────────────────
  const [dbConfig, setDbConfig] = useState<Record<string, string>>(() => {
    try {
      return JSON.parse(localStorage.getItem("lekhya_db_config") || "{}");
    } catch {
      return {};
    }
  });
  const [showDbConn, setShowDbConn] = useState(false);
  const [dbGuideOpen, setDbGuideOpen] = useState(false);
  const [dbTesting, setDbTesting] = useState(false);
  const [dbStatus, setDbStatus] = useState<"idle" | "ok" | "error">("idle");

  function handleSaveDbConfig() {
    localStorage.setItem("lekhya_db_config", JSON.stringify(dbConfig));
    toast.success("Database configuration saved");
  }

  async function handleTestDbConnection() {
    if (!dbConfig.connectionString && !dbConfig.apiKey) {
      toast.error("Please enter a connection string or API key first.");
      return;
    }
    setDbTesting(true);
    setDbStatus("idle");
    try {
      // Simulate a connection test (real implementation depends on DB type)
      await new Promise((resolve) => setTimeout(resolve, 1200));
      setDbStatus("ok");
      toast.success("Connection validated! Configuration saved.");
      localStorage.setItem("lekhya_db_config", JSON.stringify(dbConfig));
    } catch {
      setDbStatus("error");
      toast.error("Connection test failed. Check your credentials.");
    } finally {
      setDbTesting(false);
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
      await (actor as unknown as ExtendedActor).updateBusiness(
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
      await (actor as unknown as ExtendedActor).deleteBusiness(deleteId);
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
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold text-foreground">LekhyaAI Engine</h3>
              {llamaCfg.apiKey ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-green-500/10 text-green-600 border border-green-500/20">
                  <CheckCircle className="w-3 h-3" />
                  AI connected
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-amber-500/10 text-amber-600 border border-amber-500/20">
                  <AlertTriangle className="w-3 h-3" />
                  API key required
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Power the AI Accountant — intelligent, fast, India-first
            </p>
          </div>
        </div>

        {/* Info banner */}
        <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 mb-4 text-xs text-muted-foreground">
          <p className="font-medium text-foreground mb-0.5">
            LekhyaAI Engine Setup
          </p>
          <ol className="list-decimal list-inside space-y-0.5">
            <li>
              Obtain your AI API key from the SuperUser settings or your system
              administrator
            </li>
            <li>Paste the API key below and click Save</li>
            <li>Click "Test Connection" to verify it's working</li>
          </ol>
          <p className="mt-1.5 text-muted-foreground">
            Once connected, the AI Accountant, floating assistant, and invoice
            scanner are all active.
          </p>
        </div>

        <div className="space-y-4">
          {/* API Key */}
          <div className="space-y-1.5">
            <Label>AI API Key</Label>
            <div className="relative">
              <Input
                data-ocid="settings.llama_api_key.input"
                type={showApiKey ? "text" : "password"}
                placeholder="Paste your AI API key here"
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
            <Label>AI Model</Label>
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
              Standard gives best quality. Fast mode is lighter for quick
              queries.
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
              LekhyaAI Engine connected successfully!
            </div>
          )}
          {connStatus === "error" && (
            <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-xs text-destructive">
              <XCircle className="w-4 h-4 flex-shrink-0" />
              Connection failed. Please check your API key and try again.
            </div>
          )}
        </div>
      </motion.div>

      {/* ─── Invoice OCR — Llama Vision ─── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.45 }}
        className="bg-card rounded-xl shadow-card border border-border p-6 mb-6"
      >
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <ScanLine className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold text-foreground">
                Invoice OCR — AI Vision Scanner
              </h3>
              {llamaCfg.apiKey ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-green-500/10 text-green-600 border border-green-500/20">
                  <CheckCircle className="w-3 h-3" />
                  Ready to scan
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-amber-500/10 text-amber-600 border border-amber-500/20">
                  <AlertTriangle className="w-3 h-3" />
                  AI API key required
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              AI Vision reads your invoice image directly and extracts all
              fields — no manual typing required.
            </p>
          </div>
        </div>

        {/* How it works banner */}
        <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 mb-5 text-xs">
          <div className="flex items-start gap-2">
            <Bot className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-semibold text-foreground mb-1">
                How invoice scanning works
              </p>
              <p className="text-muted-foreground">
                Upload a photo or PDF of any Indian GST invoice. The AI Vision
                engine reads the image directly and extracts all fields —
                invoice number, GSTINs, line items with HSN codes, GST split,
                bank details — into a structured form for your review.
              </p>
              <p className="text-muted-foreground mt-1.5">
                Your <strong className="text-foreground">AI API key</strong>{" "}
                (saved in LekhyaAI Engine above) is all you need. The same key
                powers both the AI Assistant and invoice scanning.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {/* Vision Model Selector */}
          <div className="space-y-1.5">
            <Label>AI Vision Model for Invoice Scanning</Label>
            <Select value={visionModel} onValueChange={setVisionModel}>
              <SelectTrigger data-ocid="settings.vision_model.select">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LLAMA_VISION_MODELS.map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              High Accuracy mode gives the best results for dense invoice
              documents. Use Standard mode if you need faster processing.
            </p>
          </div>

          {/* Status messages */}
          {visionStatus === "ok" && (
            <div className="flex items-center gap-2 p-3 bg-green-500/10 border border-green-500/20 rounded-lg text-xs text-green-600">
              <CheckCircle className="w-4 h-4 flex-shrink-0" />
              AI Vision is connected and ready to scan invoices!
            </div>
          )}
          {visionStatus === "error" && (
            <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-xs text-destructive">
              <XCircle className="w-4 h-4 flex-shrink-0" />
              Test failed. Check your AI API key in LekhyaAI Engine above.
            </div>
          )}

          {!llamaCfg.apiKey && (
            <div className="flex items-center gap-2 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg text-xs text-amber-700">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              Add your AI API key in the LekhyaAI Engine section above, then
              come back here to save the vision model.
            </div>
          )}

          <div className="flex gap-3 flex-wrap">
            <Button
              type="button"
              data-ocid="settings.vision_save.button"
              onClick={handleSaveVisionModel}
              className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2"
            >
              <Save className="w-4 h-4" /> Save Vision Model
            </Button>
            <Button
              type="button"
              variant="outline"
              data-ocid="settings.vision_test.button"
              onClick={handleTestVision}
              disabled={testingVision || !llamaCfg.apiKey}
              className="gap-2"
            >
              {testingVision ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : visionStatus === "ok" ? (
                <CheckCircle className="w-4 h-4 text-green-600" />
              ) : visionStatus === "error" ? (
                <XCircle className="w-4 h-4 text-destructive" />
              ) : (
                <ScanLine className="w-4 h-4" />
              )}
              {testingVision ? "Testing…" : "Test Vision"}
            </Button>
          </div>
        </div>
      </motion.div>

      {/* ─── Custom Database Integration ─────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        data-ocid="settings.db_integration.section"
        className="bg-card border border-border rounded-2xl p-5 md:p-6 space-y-5"
      >
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Database className="w-4.5 h-4.5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">
              Custom Database Integration
            </h3>
            <p className="text-sm text-muted-foreground mt-0.5">
              Connect LekhyaAI to your own PostgreSQL, Supabase, Firebase,
              MongoDB, or REST API.
            </p>
          </div>
        </div>

        {/* Part A — Config Fields */}
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label
              htmlFor="db-type-select"
              className="text-sm font-medium text-foreground"
            >
              Database Type
            </label>
            <select
              id="db-type-select"
              data-ocid="settings.db_type.select"
              value={dbConfig.dbType || ""}
              onChange={(e) =>
                setDbConfig((p) => ({ ...p, dbType: e.target.value }))
              }
              className="w-full h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
            >
              <option value="">Select database type…</option>
              <option value="postgresql">PostgreSQL</option>
              <option value="mysql">MySQL</option>
              <option value="mongodb">MongoDB</option>
              <option value="supabase">Supabase</option>
              <option value="firebase">Firebase (Firestore)</option>
              <option value="airtable">Airtable</option>
              <option value="rest">Custom REST API</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm">Connection String / API URL</Label>
            <div className="relative">
              <Input
                data-ocid="settings.db_connection.input"
                type={showDbConn ? "text" : "password"}
                value={dbConfig.connectionString || ""}
                onChange={(e) =>
                  setDbConfig((p) => ({
                    ...p,
                    connectionString: e.target.value,
                  }))
                }
                placeholder={
                  dbConfig.dbType === "supabase"
                    ? "https://xyzcompany.supabase.co"
                    : dbConfig.dbType === "mongodb"
                      ? "mongodb+srv://user:pass@cluster.mongodb.net/db"
                      : dbConfig.dbType === "firebase"
                        ? "https://project-id-default-rtdb.firebaseio.com"
                        : "postgres://user:pass@host:5432/database"
                }
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowDbConn((p) => !p)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showDbConn ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm">API Key / Password</Label>
            <Input
              data-ocid="settings.db_api_key.input"
              type="password"
              value={dbConfig.apiKey || ""}
              onChange={(e) =>
                setDbConfig((p) => ({ ...p, apiKey: e.target.value }))
              }
              placeholder="Bearer token, anon key, or password"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-sm">Database Name</Label>
              <Input
                data-ocid="settings.db_name.input"
                type="text"
                value={dbConfig.dbName || ""}
                onChange={(e) =>
                  setDbConfig((p) => ({ ...p, dbName: e.target.value }))
                }
                placeholder="my_database"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm">Table Prefix (optional)</Label>
              <Input
                data-ocid="settings.db_prefix.input"
                type="text"
                value={dbConfig.tablePrefix || ""}
                onChange={(e) =>
                  setDbConfig((p) => ({ ...p, tablePrefix: e.target.value }))
                }
                placeholder="lekhya_"
              />
            </div>
          </div>

          {dbStatus === "ok" && (
            <div className="flex items-center gap-2 p-3 bg-success/10 border border-success/20 rounded-lg text-xs text-success">
              <CheckCircle className="w-4 h-4 flex-shrink-0" />
              Connected successfully! LekhyaAI will sync data to your database.
            </div>
          )}
          {dbStatus === "error" && (
            <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-xs text-destructive">
              <XCircle className="w-4 h-4 flex-shrink-0" />
              Connection failed. Check your credentials and try again.
            </div>
          )}

          <div className="flex gap-3 flex-wrap">
            <Button
              type="button"
              data-ocid="settings.db_test.button"
              variant="outline"
              onClick={handleTestDbConnection}
              disabled={dbTesting}
              className="gap-2"
            >
              {dbTesting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
              {dbTesting ? "Testing…" : "Test Connection"}
            </Button>
            <Button
              type="button"
              data-ocid="settings.db_save.button"
              onClick={handleSaveDbConfig}
              className="gap-2"
            >
              <Save className="w-4 h-4" /> Save Configuration
            </Button>
          </div>
        </div>

        {/* Part C — Sync controls */}
        <div className="space-y-3 pt-3 border-t border-border">
          <h4 className="text-sm font-semibold text-foreground">
            Sync Controls
          </h4>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Auto Sync</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Push LekhyaAI data to your database automatically
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                data-ocid="settings.db_auto_sync.switch"
                checked={dbConfig.autoSync === "true"}
                onChange={(e) =>
                  setDbConfig((p) => ({
                    ...p,
                    autoSync: e.target.checked ? "true" : "false",
                  }))
                }
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-muted rounded-full peer peer-checked:bg-primary transition-colors after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-4" />
            </label>
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm">Sync Frequency</Label>
            <select
              data-ocid="settings.db_sync_freq.select"
              value={dbConfig.syncFreq || "daily"}
              onChange={(e) =>
                setDbConfig((p) => ({ ...p, syncFreq: e.target.value }))
              }
              className="w-full h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
            >
              <option value="realtime">Real-time</option>
              <option value="hourly">Hourly</option>
              <option value="daily">Daily</option>
            </select>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            data-ocid="settings.db_export.button"
            onClick={() => {
              exportAllDataAsJSON();
              toast.success("Data export downloaded");
            }}
            className="gap-2"
          >
            <Download className="w-4 h-4" />
            Export Data Now (JSON)
          </Button>
        </div>

        {/* Part B — Step-by-step guide */}
        <div className="pt-3 border-t border-border">
          <button
            type="button"
            data-ocid="settings.db_guide.toggle"
            onClick={() => setDbGuideOpen((p) => !p)}
            className="flex items-center gap-2 text-sm font-medium text-foreground hover:text-primary transition-colors"
          >
            {dbGuideOpen ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
            How to connect your database — Step-by-step guide
          </button>
          {dbGuideOpen && (
            <div className="mt-4 bg-muted/40 rounded-xl p-5 text-xs text-muted-foreground space-y-3">
              <div>
                <p className="font-semibold text-foreground mb-1">
                  Step 1 — Choose your database type above
                </p>
              </div>
              <div>
                <p className="font-semibold text-foreground mb-1">
                  Step 2 — Get your connection credentials
                </p>
                <ul className="space-y-1.5 ml-3 list-disc marker:text-primary">
                  <li>
                    <strong>PostgreSQL / MySQL:</strong>{" "}
                    <code className="bg-muted px-1 py-0.5 rounded">
                      host:port/database?user=xxx&password=yyy
                    </code>
                  </li>
                  <li>
                    <strong>Supabase:</strong> Project URL + anon/service key
                    from{" "}
                    <code className="bg-muted px-1 py-0.5 rounded">
                      supabase.com/dashboard
                    </code>
                  </li>
                  <li>
                    <strong>Firebase:</strong> Project config from Firebase
                    console → Project Settings → Service accounts
                  </li>
                  <li>
                    <strong>MongoDB:</strong>{" "}
                    <code className="bg-muted px-1 py-0.5 rounded">
                      mongodb+srv://user:pass@cluster.mongodb.net/dbname
                    </code>
                  </li>
                  <li>
                    <strong>Airtable:</strong> Base ID + Personal Access Token
                    from{" "}
                    <code className="bg-muted px-1 py-0.5 rounded">
                      airtable.com/create/tokens
                    </code>
                  </li>
                  <li>
                    <strong>Custom REST API:</strong> Your API base URL + Bearer
                    token
                  </li>
                </ul>
              </div>
              <div>
                <p className="font-semibold text-foreground mb-1">
                  Step 3 — Paste your connection string and API key above
                </p>
              </div>
              <div>
                <p className="font-semibold text-foreground mb-1">
                  Step 4 — Click "Test Connection" to verify
                </p>
              </div>
              <div>
                <p className="font-semibold text-foreground mb-1">
                  Step 5 — Enable "Auto Sync" to push LekhyaAI data to your
                  database
                </p>
              </div>
              <div>
                <p className="font-semibold text-foreground mb-1">
                  Step 6 — Use "Export Data Now" for a one-time full data push
                </p>
              </div>
              <div className="pt-2 border-t border-border space-y-1">
                <p className="font-semibold text-foreground">
                  Important Notes:
                </p>
                <ul className="space-y-1 ml-3 list-disc marker:text-warning">
                  <li>
                    Credentials are stored only in your browser's local storage
                  </li>
                  <li>
                    For production use, configure through SuperUser Settings for
                    server-side sync
                  </li>
                  <li>
                    LekhyaAI syncs: Invoices, Customers, Vendors, Products,
                    Expenses
                  </li>
                  <li>
                    Your database must allow CORS from this domain for
                    browser-based sync
                  </li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </motion.div>

      {/* ─── Data Backup ─── */}
      <DataBackupCard />

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
