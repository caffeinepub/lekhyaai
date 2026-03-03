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
import { cn } from "@/lib/utils";
import { useQueryClient } from "@tanstack/react-query";
import {
  Building2,
  Check,
  ImageIcon,
  Loader2,
  Palette,
  Plus,
  Save,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import CreateBusinessModal from "../components/CreateBusinessModal";
import DeleteConfirmDialog from "../components/DeleteConfirmDialog";
import { useBusiness } from "../context/BusinessContext";
import { THEMES, useTheme } from "../context/ThemeContext";
import { useActor } from "../hooks/useActor";
import { INDIAN_STATES } from "../utils/indianStates";

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
