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
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import {
  Building2,
  Edit3,
  KeyRound,
  Loader2,
  Plus,
  RefreshCw,
  Shield,
  Sparkles,
  Trash2,
  Users,
} from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import { COMPANY_CATEGORIES } from "../utils/companyCategories";
import { formatINRNumber } from "../utils/formatINR";
import { INDIAN_STATES } from "../utils/indianStates";
import { callLlamaApi, getLlamaConfig } from "../utils/llamaAi";
import { getPricingConfig } from "../utils/pricingConfig";
import { isSuperUserActive } from "../utils/superuser";

const LS_KEY = "lekhya_onboard_clients";

type ClientStatus = "active" | "trial" | "suspended";
type ClientPlan = "starter" | "professional" | "enterprise";

interface OnboardClient {
  id: string;
  businessName: string;
  contactPerson: string;
  phone: string;
  email: string;
  gstin: string;
  state: string;
  industry: string;
  address: string;
  plan: ClientPlan;
  subscriptionStart: string;
  subscriptionEnd: string;
  status: ClientStatus;
  notes: string;
  accessToken: string;
  userCount: number;
  createdAt: string;
}

function loadClients(): OnboardClient[] {
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? (JSON.parse(raw) as OnboardClient[]) : [];
  } catch {
    return [];
  }
}

function saveClients(clients: OnboardClient[]) {
  localStorage.setItem(LS_KEY, JSON.stringify(clients));
}

function generateToken(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from({ length: 12 }, () =>
    chars.charAt(Math.floor(Math.random() * chars.length)),
  ).join("");
}

const STATUS_CONFIG: Record<ClientStatus, { label: string; cls: string }> = {
  active: {
    label: "Active",
    cls: "bg-success/15 text-success border-success/30",
  },
  trial: {
    label: "Trial",
    cls: "bg-info/15 text-info border-info/30",
  },
  suspended: {
    label: "Suspended",
    cls: "bg-destructive/15 text-destructive border-destructive/30",
  },
};

const PLAN_LABELS: Record<ClientPlan, string> = {
  starter: "Starter",
  professional: "Professional",
  enterprise: "Enterprise",
};

const EMPTY_FORM: Omit<OnboardClient, "id" | "accessToken" | "createdAt"> = {
  businessName: "",
  contactPerson: "",
  phone: "",
  email: "",
  gstin: "",
  state: "",
  industry: "",
  address: "",
  plan: "starter",
  subscriptionStart: new Date().toISOString().split("T")[0],
  subscriptionEnd: "",
  status: "trial",
  notes: "",
  userCount: 1,
};

function ClientFormSheet({
  open,
  onClose,
  editing,
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  editing: OnboardClient | null;
  onSave: (
    data: Omit<OnboardClient, "id" | "accessToken" | "createdAt">,
  ) => void;
}) {
  const [form, setForm] = useState<
    Omit<OnboardClient, "id" | "accessToken" | "createdAt">
  >(editing ? { ...editing } : { ...EMPTY_FORM });
  const [aiLoading, setAiLoading] = useState(false);
  const [token, setToken] = useState(editing?.accessToken ?? "");
  const pricing = getPricingConfig();

  function setField<K extends keyof typeof form>(
    key: K,
    value: (typeof form)[K],
  ) {
    setForm((p) => ({ ...p, [key]: value }));
  }

  async function handleAiSuggest() {
    const cfg = getLlamaConfig();
    if (!cfg.apiKey) {
      toast.error("Configure your AI API key in SuperUser Settings first");
      return;
    }
    if (!form.industry) {
      toast.error("Please select an Industry first");
      return;
    }
    setAiLoading(true);
    try {
      const response = await callLlamaApi(
        [
          {
            role: "system",
            content:
              "You are an expert Indian business consultant. Generate concise onboarding notes for a new LekhyaAI client in 3-4 bullet points. Include key accounting needs, GST compliance requirements, and recommended features for their industry.",
          },
          {
            role: "user",
            content: `Generate onboarding notes for a ${form.industry} business named "${form.businessName || "a new client"}" in ${form.state || "India"}.`,
          },
        ],
        cfg,
      );
      setField("notes", response.trim());
      toast.success("AI suggestions added to notes");
    } catch {
      toast.error("AI suggestion failed — check your API key");
    } finally {
      setAiLoading(false);
    }
  }

  const planPrice = pricing[form.plan].monthly;

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-lg overflow-y-auto"
        data-ocid="onboard.client.sheet"
      >
        <SheetHeader className="mb-6">
          <SheetTitle className="font-display text-xl flex items-center gap-2">
            <Building2 className="w-5 h-5 text-primary" />
            {editing ? "Edit Client" : "Add New Client"}
          </SheetTitle>
          <SheetDescription>
            {editing
              ? "Update client details and subscription"
              : "Onboard a new LekhyaAI client"}
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-4">
          {/* Business Info */}
          <div className="space-y-1.5">
            <Label>
              Business Name <span className="text-destructive">*</span>
            </Label>
            <Input
              data-ocid="onboard.business_name.input"
              value={form.businessName}
              onChange={(e) => setField("businessName", e.target.value)}
              placeholder="e.g. Sharma Enterprises Pvt Ltd"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Contact Person</Label>
              <Input
                data-ocid="onboard.contact_person.input"
                value={form.contactPerson}
                onChange={(e) => setField("contactPerson", e.target.value)}
                placeholder="Full name"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Phone</Label>
              <Input
                data-ocid="onboard.phone.input"
                value={form.phone}
                onChange={(e) => setField("phone", e.target.value)}
                placeholder="+91 98765 43210"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Email</Label>
            <Input
              data-ocid="onboard.email.input"
              type="email"
              value={form.email}
              onChange={(e) => setField("email", e.target.value)}
              placeholder="contact@business.com"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>GSTIN</Label>
              <Input
                data-ocid="onboard.gstin.input"
                value={form.gstin}
                onChange={(e) =>
                  setField("gstin", e.target.value.toUpperCase())
                }
                placeholder="27AAAAA0000A1Z5"
                className="font-mono text-xs uppercase"
                maxLength={15}
              />
            </div>
            <div className="space-y-1.5">
              <Label>State</Label>
              <Select
                value={form.state}
                onValueChange={(v) => setField("state", v)}
              >
                <SelectTrigger data-ocid="onboard.state.select">
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
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Industry</Label>
            <Select
              value={form.industry}
              onValueChange={(v) => setField("industry", v)}
            >
              <SelectTrigger data-ocid="onboard.industry.select">
                <SelectValue placeholder="Select industry" />
              </SelectTrigger>
              <SelectContent>
                {COMPANY_CATEGORIES.map((c) => (
                  <SelectItem key={c.id} value={c.name}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Address</Label>
            <Textarea
              data-ocid="onboard.address.textarea"
              value={form.address}
              onChange={(e) => setField("address", e.target.value)}
              placeholder="Full business address"
              rows={2}
              className="resize-none"
            />
          </div>

          {/* Subscription */}
          <div className="border-t border-border pt-4 space-y-3">
            <p className="text-sm font-semibold text-foreground">
              Subscription
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Plan</Label>
                <Select
                  value={form.plan}
                  onValueChange={(v) => setField("plan", v as ClientPlan)}
                >
                  <SelectTrigger data-ocid="onboard.plan.select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="starter">
                      Starter — ₹{pricing.starter.monthly}/mo
                    </SelectItem>
                    <SelectItem value="professional">
                      Professional — ₹{pricing.professional.monthly}/mo
                    </SelectItem>
                    <SelectItem value="enterprise">
                      Enterprise — ₹{pricing.enterprise.monthly}/mo
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Status</Label>
                <Select
                  value={form.status}
                  onValueChange={(v) => setField("status", v as ClientStatus)}
                >
                  <SelectTrigger data-ocid="onboard.status.select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="trial">Trial</SelectItem>
                    <SelectItem value="suspended">Suspended</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Start Date</Label>
                <Input
                  data-ocid="onboard.sub_start.input"
                  type="date"
                  value={form.subscriptionStart}
                  onChange={(e) =>
                    setField("subscriptionStart", e.target.value)
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label>End Date</Label>
                <Input
                  data-ocid="onboard.sub_end.input"
                  type="date"
                  value={form.subscriptionEnd}
                  onChange={(e) => setField("subscriptionEnd", e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Number of Users</Label>
              <Input
                data-ocid="onboard.user_count.input"
                type="number"
                min={1}
                value={form.userCount}
                onChange={(e) =>
                  setField("userCount", Number(e.target.value) || 1)
                }
              />
            </div>
            <div className="bg-muted/40 rounded-lg p-3 text-xs text-muted-foreground">
              Plan:{" "}
              <span className="font-semibold text-foreground">
                {PLAN_LABELS[form.plan]}
              </span>{" "}
              — ₹{formatINRNumber(planPrice)}/month +{" "}
              {form.userCount > 1
                ? `₹${formatINRNumber(
                    (form.userCount - 1) * getPricingConfig().perUser,
                  )}/month for ${form.userCount - 1} additional user(s)`
                : "1 user included"}
            </div>
          </div>

          {/* Access Token */}
          <div className="border-t border-border pt-4 space-y-2">
            <Label>Access Token</Label>
            <div className="flex gap-2">
              <Input
                data-ocid="onboard.access_token.input"
                value={token || editing?.accessToken || ""}
                readOnly
                placeholder="Click Generate to create token"
                className="font-mono text-xs"
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                data-ocid="onboard.generate_token.button"
                onClick={() => {
                  const t = generateToken();
                  setToken(t);
                  toast.success("New access token generated");
                }}
              >
                <RefreshCw className="w-4 h-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Share this token with the client for their initial login
            </p>
          </div>

          {/* Notes with AI assist */}
          <div className="border-t border-border pt-4 space-y-2">
            <div className="flex items-center justify-between">
              <Label>Notes</Label>
              <Button
                type="button"
                size="sm"
                variant="outline"
                data-ocid="onboard.ai_suggest.button"
                onClick={handleAiSuggest}
                disabled={aiLoading}
                className="h-7 text-xs gap-1"
              >
                {aiLoading ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <Sparkles className="w-3 h-3 text-primary" />
                )}
                AI Suggest
              </Button>
            </div>
            <Textarea
              data-ocid="onboard.notes.textarea"
              value={form.notes}
              onChange={(e) => setField("notes", e.target.value)}
              placeholder="Onboarding notes, requirements, special instructions..."
              rows={4}
              className="resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2 pb-4">
            <Button
              variant="outline"
              data-ocid="onboard.cancel.button"
              onClick={onClose}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              data-ocid="onboard.save.button"
              onClick={() => {
                if (!form.businessName.trim()) {
                  toast.error("Business name is required");
                  return;
                }
                onSave({ ...form });
              }}
              className="flex-1 bg-primary text-primary-foreground"
            >
              {editing ? "Update Client" : "Add Client"}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

export default function OnboardingPortalPage() {
  const isSuperUser = isSuperUserActive();
  const [clients, setClients] = useState<OnboardClient[]>(loadClients);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<OnboardClient | null>(
    null,
  );
  const [viewingClient, setViewingClient] = useState<OnboardClient | null>(
    null,
  );

  if (!isSuperUser) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 p-6">
        <Shield className="w-12 h-12 text-muted-foreground/30" />
        <h2 className="font-display text-xl text-foreground">
          SuperUser Access Required
        </h2>
        <p className="text-muted-foreground text-sm text-center max-w-sm">
          The Onboarding Portal is only accessible in Developer Mode. Enter your
          PIN to activate.
        </p>
      </div>
    );
  }

  function handleSave(
    data: Omit<OnboardClient, "id" | "accessToken" | "createdAt">,
  ) {
    if (editingClient) {
      const updated = clients.map((c) =>
        c.id === editingClient.id ? { ...editingClient, ...data } : c,
      );
      setClients(updated);
      saveClients(updated);
      toast.success("Client updated");
    } else {
      const newClient: OnboardClient = {
        ...data,
        id: crypto.randomUUID(),
        accessToken: generateToken(),
        createdAt: new Date().toISOString(),
      };
      const updated = [...clients, newClient];
      setClients(updated);
      saveClients(updated);
      toast.success("Client onboarded successfully");
    }
    setSheetOpen(false);
    setEditingClient(null);
  }

  function handleDeactivate(client: OnboardClient) {
    if (!confirm(`Suspend ${client.businessName}?`)) return;
    const updated = clients.map((c) =>
      c.id === client.id ? { ...c, status: "suspended" as ClientStatus } : c,
    );
    setClients(updated);
    saveClients(updated);
    toast.success("Client suspended");
  }

  function handleDelete(client: OnboardClient) {
    if (!confirm(`Permanently delete ${client.businessName}?`)) return;
    const updated = clients.filter((c) => c.id !== client.id);
    setClients(updated);
    saveClients(updated);
    toast.success("Client removed");
  }

  const activeCount = clients.filter((c) => c.status === "active").length;
  const trialCount = clients.filter((c) => c.status === "trial").length;

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <motion.h1
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="font-display text-2xl md:text-3xl text-foreground flex items-center gap-2"
          >
            <Building2 className="w-7 h-7 text-primary/80" />
            Client Onboarding Portal
          </motion.h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Manage LekhyaAI client deployments
          </p>
        </div>
        <Button
          data-ocid="onboard.add_client.button"
          onClick={() => {
            setEditingClient(null);
            setSheetOpen(true);
          }}
          className="bg-primary text-primary-foreground gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Client
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          {
            label: "Total Clients",
            value: clients.length,
            cls: "text-foreground",
          },
          {
            label: "Active",
            value: activeCount,
            cls: "text-success",
          },
          {
            label: "Trial",
            value: trialCount,
            cls: "text-info",
          },
        ].map(({ label, value, cls }) => (
          <div
            key={label}
            className="bg-card border border-border rounded-xl p-4"
          >
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className={`text-2xl font-bold mt-0.5 ${cls}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Client Table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        {clients.length === 0 ? (
          <div
            className="flex flex-col items-center justify-center py-16 gap-3"
            data-ocid="onboard.clients.empty_state"
          >
            <Building2 className="w-12 h-12 text-muted-foreground/30" />
            <p className="text-muted-foreground font-medium">
              No clients onboarded yet
            </p>
            <p className="text-sm text-muted-foreground/70">
              Click "Add Client" to onboard your first client
            </p>
          </div>
        ) : (
          <Table data-ocid="onboard.clients.table">
            <TableHeader>
              <TableRow>
                <TableHead>Business</TableHead>
                <TableHead className="hidden md:table-cell">Contact</TableHead>
                <TableHead className="hidden lg:table-cell">GSTIN</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden md:table-cell">Users</TableHead>
                <TableHead className="text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clients.map((client, idx) => (
                <TableRow
                  key={client.id}
                  data-ocid={`onboard.clients.item.${idx + 1}`}
                  className="cursor-pointer hover:bg-muted/20"
                  onClick={() => setViewingClient(client)}
                >
                  <TableCell>
                    <div>
                      <p className="font-medium text-foreground">
                        {client.businessName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {client.industry}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <div>
                      <p className="text-sm">{client.contactPerson}</p>
                      <p className="text-xs text-muted-foreground">
                        {client.phone}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-xs hidden lg:table-cell">
                    {client.gstin || "—"}
                  </TableCell>
                  <TableCell>
                    <span className="text-xs font-medium capitalize">
                      {PLAN_LABELS[client.plan]}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={`text-xs ${STATUS_CONFIG[client.status].cls}`}
                    >
                      {STATUS_CONFIG[client.status].label}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-center">
                    <span className="flex items-center justify-center gap-1 text-xs">
                      <Users className="w-3.5 h-3.5" />
                      {client.userCount}
                    </span>
                  </TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-center gap-1">
                      <button
                        type="button"
                        data-ocid={`onboard.client.edit_button.${idx + 1}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingClient(client);
                          setSheetOpen(true);
                        }}
                        className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      {client.status !== "suspended" && (
                        <button
                          type="button"
                          data-ocid={`onboard.client.delete_button.${idx + 1}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeactivate(client);
                          }}
                          className="p-1.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Client Detail View */}
      {viewingClient && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6 bg-card border border-border rounded-xl p-5"
          data-ocid="onboard.client.panel"
        >
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="font-display text-lg text-foreground">
                {viewingClient.businessName}
              </h3>
              <p className="text-sm text-muted-foreground">
                {viewingClient.industry} · {viewingClient.state}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setViewingClient(null)}
              className="text-muted-foreground hover:text-foreground p-1"
            >
              ✕
            </button>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Contact Details
              </p>
              <div className="space-y-1.5 text-sm">
                <div className="flex gap-2">
                  <span className="text-muted-foreground w-24">Contact:</span>
                  <span>{viewingClient.contactPerson || "—"}</span>
                </div>
                <div className="flex gap-2">
                  <span className="text-muted-foreground w-24">Phone:</span>
                  <span>{viewingClient.phone || "—"}</span>
                </div>
                <div className="flex gap-2">
                  <span className="text-muted-foreground w-24">Email:</span>
                  <span className="break-all">
                    {viewingClient.email || "—"}
                  </span>
                </div>
                <div className="flex gap-2">
                  <span className="text-muted-foreground w-24">GSTIN:</span>
                  <span className="font-mono">
                    {viewingClient.gstin || "—"}
                  </span>
                </div>
                <div className="flex gap-2">
                  <span className="text-muted-foreground w-24">Address:</span>
                  <span>{viewingClient.address || "—"}</span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Subscription
              </p>
              <div className="space-y-1.5 text-sm">
                <div className="flex gap-2">
                  <span className="text-muted-foreground w-24">Plan:</span>
                  <span className="font-medium">
                    {PLAN_LABELS[viewingClient.plan]}
                  </span>
                </div>
                <div className="flex gap-2">
                  <span className="text-muted-foreground w-24">Status:</span>
                  <Badge
                    variant="outline"
                    className={`text-xs ${STATUS_CONFIG[viewingClient.status].cls}`}
                  >
                    {STATUS_CONFIG[viewingClient.status].label}
                  </Badge>
                </div>
                <div className="flex gap-2">
                  <span className="text-muted-foreground w-24">Users:</span>
                  <span>{viewingClient.userCount}</span>
                </div>
                <div className="flex gap-2">
                  <span className="text-muted-foreground w-24">Start:</span>
                  <span>{viewingClient.subscriptionStart || "—"}</span>
                </div>
                <div className="flex gap-2">
                  <span className="text-muted-foreground w-24">Expires:</span>
                  <span>{viewingClient.subscriptionEnd || "—"}</span>
                </div>
              </div>

              <div className="pt-2 space-y-1.5">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Access Token
                </p>
                <div className="flex items-center gap-2 bg-muted/40 rounded-lg p-2.5">
                  <KeyRound className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                  <code className="font-mono text-xs flex-1">
                    {viewingClient.accessToken}
                  </code>
                </div>
              </div>
            </div>
          </div>

          {viewingClient.notes && (
            <div className="mt-4 pt-4 border-t border-border">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                Notes
              </p>
              <p className="text-sm text-muted-foreground whitespace-pre-line">
                {viewingClient.notes}
              </p>
            </div>
          )}

          <div className="flex gap-3 mt-4 pt-4 border-t border-border">
            <Button
              size="sm"
              variant="outline"
              data-ocid="onboard.client.view.edit_button"
              onClick={() => {
                setEditingClient(viewingClient);
                setSheetOpen(true);
                setViewingClient(null);
              }}
            >
              <Edit3 className="w-3.5 h-3.5 mr-1.5" />
              Edit
            </Button>
            <Button
              size="sm"
              variant="outline"
              data-ocid="onboard.client.view.delete_button"
              className="text-destructive border-destructive/30 hover:bg-destructive/10"
              onClick={() => {
                handleDelete(viewingClient);
                setViewingClient(null);
              }}
            >
              <Trash2 className="w-3.5 h-3.5 mr-1.5" />
              Delete
            </Button>
          </div>
        </motion.div>
      )}

      <ClientFormSheet
        open={sheetOpen}
        onClose={() => {
          setSheetOpen(false);
          setEditingClient(null);
        }}
        editing={editingClient}
        onSave={handleSave}
      />
    </div>
  );
}
