import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
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
  SheetFooter,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertTriangle,
  Building2,
  Edit,
  Plus,
  Trash2,
  Users,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

// ─── Types ─────────────────────────────────────────────────────────

interface CrmLead {
  id: string;
  formattedId: string;
  name: string;
  email: string;
  phone: string;
  companyName: string;
  stage: "enquiry" | "followup" | "onboarded";
  kycType: "india" | "overseas";
  gstin?: string;
  pan?: string;
  cin?: string;
  tinEin?: string;
  incorporationCert?: string;
  notes?: string;
  subscriptionModules: string[];
  createdAt: number;
}

// ─── Constants ─────────────────────────────────────────────────────

const LS_KEY = "lekhya_crm_leads";
const LS_ENQ = "lekhya_crm_enq_counter";
const LS_FLW = "lekhya_crm_flw_counter";
const LS_ONB = "lekhya_crm_onb_counter";

const ALL_MODULES = [
  "Accounting",
  "GST Filing",
  "Invoicing",
  "Payroll",
  "Banking",
  "Inventory",
  "Reports",
  "AI Assistant",
];

const STAGE_LABELS: Record<CrmLead["stage"], string> = {
  enquiry: "Enquiry",
  followup: "Follow-Up",
  onboarded: "Onboarded",
};

const STAGE_COLORS: Record<CrmLead["stage"], string> = {
  enquiry: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
  followup: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
  onboarded:
    "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
};

const SEED_LEADS: CrmLead[] = [
  {
    id: "crm-seed-1",
    formattedId: "ENQ-1001",
    name: "Rajesh Kumar",
    email: "rajesh@techvision.in",
    phone: "+91 98765 43210",
    companyName: "TechVision Pvt Ltd",
    stage: "enquiry",
    kycType: "india",
    gstin: "29ABCDE1234F1Z5",
    pan: "ABCDE1234F",
    cin: "U72200KA2020PTC123456",
    notes: "Interested in full accounting + GST filing suite",
    subscriptionModules: ["Accounting", "GST Filing", "Invoicing"],
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 2,
  },
  {
    id: "crm-seed-2",
    formattedId: "FLW-1001",
    name: "Priya Sharma",
    email: "priya@fabricworld.com",
    phone: "+91 87654 32109",
    companyName: "Fabric World Exports",
    stage: "followup",
    kycType: "india",
    gstin: "27FGHIJ5678G2Z1",
    pan: "FGHIJ5678G",
    notes: "Requires Payroll module. Demo scheduled for next week.",
    subscriptionModules: ["Accounting", "Invoicing", "Payroll", "Reports"],
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 5,
  },
  {
    id: "crm-seed-3",
    formattedId: "ONB-1001",
    name: "Sanjay Mehta",
    email: "sanjay@globalops.io",
    phone: "+1 415 555 0192",
    companyName: "Global Ops Inc.",
    stage: "onboarded",
    kycType: "overseas",
    tinEin: "12-3456789",
    incorporationCert: "CORP-US-2019-4521",
    notes: "Onboarded successfully. Using AI Assistant heavily.",
    subscriptionModules: ["Accounting", "AI Assistant", "Reports", "Banking"],
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 10,
  },
];

// ─── Helpers ────────────────────────────────────────────────────────

function getCounter(key: string, start = 1001): number {
  const v = localStorage.getItem(key);
  return v ? Number(v) : start;
}

function incrementCounter(key: string, start = 1001): number {
  const current = getCounter(key, start);
  const next = current + 1;
  localStorage.setItem(key, String(next));
  return current;
}

function generateFormattedId(stage: CrmLead["stage"]): string {
  if (stage === "enquiry") {
    const n = incrementCounter(LS_ENQ);
    return `ENQ-${n}`;
  }
  if (stage === "followup") {
    const n = incrementCounter(LS_FLW);
    return `FLW-${n}`;
  }
  const n = incrementCounter(LS_ONB);
  return `ONB-${n}`;
}

function loadLeads(): CrmLead[] {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) return JSON.parse(raw) as CrmLead[];
  } catch {
    // ignore
  }
  // First load: seed
  localStorage.setItem(LS_KEY, JSON.stringify(SEED_LEADS));
  // init counters so next ones are 1002+
  localStorage.setItem(LS_ENQ, "1002");
  localStorage.setItem(LS_FLW, "1002");
  localStorage.setItem(LS_ONB, "1002");
  return SEED_LEADS;
}

function saveLeads(leads: CrmLead[]) {
  localStorage.setItem(LS_KEY, JSON.stringify(leads));
}

// ─── Lead Form ──────────────────────────────────────────────────────

interface LeadFormData {
  name: string;
  email: string;
  phone: string;
  companyName: string;
  stage: CrmLead["stage"];
  kycType: CrmLead["kycType"];
  gstin: string;
  pan: string;
  cin: string;
  tinEin: string;
  incorporationCert: string;
  notes: string;
  subscriptionModules: string[];
}

const EMPTY_FORM: LeadFormData = {
  name: "",
  email: "",
  phone: "",
  companyName: "",
  stage: "enquiry",
  kycType: "india",
  gstin: "",
  pan: "",
  cin: "",
  tinEin: "",
  incorporationCert: "",
  notes: "",
  subscriptionModules: [],
};

function leadToForm(lead: CrmLead): LeadFormData {
  return {
    name: lead.name,
    email: lead.email,
    phone: lead.phone,
    companyName: lead.companyName,
    stage: lead.stage,
    kycType: lead.kycType,
    gstin: lead.gstin ?? "",
    pan: lead.pan ?? "",
    cin: lead.cin ?? "",
    tinEin: lead.tinEin ?? "",
    incorporationCert: lead.incorporationCert ?? "",
    notes: lead.notes ?? "",
    subscriptionModules: [...lead.subscriptionModules],
  };
}

// ─── Lead Sheet Form ────────────────────────────────────────────────

function LeadSheet({
  open,
  onClose,
  editLead,
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  editLead: CrmLead | null;
  onSave: (form: LeadFormData, lead: CrmLead | null) => void;
}) {
  const [form, setForm] = useState<LeadFormData>(
    editLead ? leadToForm(editLead) : EMPTY_FORM,
  );

  // biome-ignore lint/correctness/useExhaustiveDependencies: reset form when sheet opens/closes
  useEffect(() => {
    setForm(editLead ? leadToForm(editLead) : EMPTY_FORM);
  }, [editLead, open]);

  function toggleModule(mod: string) {
    setForm((f) => ({
      ...f,
      subscriptionModules: f.subscriptionModules.includes(mod)
        ? f.subscriptionModules.filter((m) => m !== mod)
        : [...f.subscriptionModules, mod],
    }));
  }

  function handleSubmit() {
    if (
      !form.name.trim() ||
      !form.email.trim() ||
      !form.phone.trim() ||
      !form.companyName.trim()
    ) {
      toast.error("Please fill in all required fields");
      return;
    }
    onSave(form, editLead);
  }

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent
        side="right"
        data-ocid="crm.lead.sheet"
        className="w-full sm:max-w-lg overflow-y-auto"
      >
        <SheetHeader>
          <SheetTitle>{editLead ? "Edit Lead" : "Add New Lead"}</SheetTitle>
        </SheetHeader>

        <div className="space-y-4 py-4 px-1">
          {/* Basic info */}
          <div className="grid grid-cols-1 gap-3">
            <div>
              <Label htmlFor="lead-name">
                Full Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="lead-name"
                value={form.name}
                onChange={(e) =>
                  setForm((f) => ({ ...f, name: e.target.value }))
                }
                placeholder="Contact person name"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="lead-company">
                Company Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="lead-company"
                value={form.companyName}
                onChange={(e) =>
                  setForm((f) => ({ ...f, companyName: e.target.value }))
                }
                placeholder="Organisation name"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="lead-email">
                Email <span className="text-destructive">*</span>
              </Label>
              <Input
                id="lead-email"
                type="email"
                value={form.email}
                onChange={(e) =>
                  setForm((f) => ({ ...f, email: e.target.value }))
                }
                placeholder="business@email.com"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="lead-phone">
                Phone <span className="text-destructive">*</span>
              </Label>
              <Input
                id="lead-phone"
                value={form.phone}
                onChange={(e) =>
                  setForm((f) => ({ ...f, phone: e.target.value }))
                }
                placeholder="+91 98765 43210"
                className="mt-1"
              />
            </div>
          </div>

          {/* Stage */}
          <div>
            <Label>Stage</Label>
            <Select
              value={form.stage}
              onValueChange={(v) =>
                setForm((f) => ({ ...f, stage: v as CrmLead["stage"] }))
              }
            >
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="enquiry">Enquiry</SelectItem>
                <SelectItem value="followup">Follow-Up</SelectItem>
                <SelectItem value="onboarded">Onboarded</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* KYC Type */}
          <div>
            <Label>KYC Type</Label>
            <div className="flex gap-3 mt-2">
              {(["india", "overseas"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, kycType: t }))}
                  className={`flex-1 py-2 rounded-lg border text-sm font-medium transition-colors ${
                    form.kycType === t
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border text-muted-foreground hover:bg-muted"
                  }`}
                >
                  {t === "india" ? "🇮🇳 India" : "🌐 Overseas"}
                </button>
              ))}
            </div>
          </div>

          {/* India KYC fields */}
          {form.kycType === "india" && (
            <div className="space-y-3 p-3 rounded-lg bg-muted/40 border border-border">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                India KYC
              </p>
              <div>
                <Label htmlFor="lead-gstin">GSTIN</Label>
                <Input
                  id="lead-gstin"
                  value={form.gstin}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, gstin: e.target.value }))
                  }
                  placeholder="22AAAAA0000A1Z5"
                  className="mt-1 font-mono text-sm"
                  maxLength={15}
                />
              </div>
              <div>
                <Label htmlFor="lead-pan">PAN</Label>
                <Input
                  id="lead-pan"
                  value={form.pan}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      pan: e.target.value.toUpperCase(),
                    }))
                  }
                  placeholder="ABCDE1234F"
                  className="mt-1 font-mono text-sm"
                  maxLength={10}
                />
              </div>
              <div>
                <Label htmlFor="lead-cin">CIN</Label>
                <Input
                  id="lead-cin"
                  value={form.cin}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, cin: e.target.value }))
                  }
                  placeholder="U72200KA2020PTC123456"
                  className="mt-1 font-mono text-sm"
                />
              </div>
            </div>
          )}

          {/* Overseas KYC fields */}
          {form.kycType === "overseas" && (
            <div className="space-y-3 p-3 rounded-lg bg-muted/40 border border-border">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Overseas KYC
              </p>
              <div>
                <Label htmlFor="lead-tin">TIN / EIN</Label>
                <Input
                  id="lead-tin"
                  value={form.tinEin}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, tinEin: e.target.value }))
                  }
                  placeholder="12-3456789"
                  className="mt-1 font-mono text-sm"
                />
              </div>
              <div>
                <Label htmlFor="lead-cert">Incorporation Certificate No.</Label>
                <Input
                  id="lead-cert"
                  value={form.incorporationCert}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      incorporationCert: e.target.value,
                    }))
                  }
                  placeholder="CORP-US-2019-4521"
                  className="mt-1"
                />
              </div>
            </div>
          )}

          {/* Subscription Modules */}
          <div>
            <Label>Subscription Modules</Label>
            <div className="grid grid-cols-2 gap-2 mt-2">
              {ALL_MODULES.map((mod) => (
                <div key={mod} className="flex items-center gap-2">
                  <Checkbox
                    id={`mod-${mod}`}
                    checked={form.subscriptionModules.includes(mod)}
                    onCheckedChange={() => toggleModule(mod)}
                  />
                  <label
                    htmlFor={`mod-${mod}`}
                    className="text-sm cursor-pointer"
                  >
                    {mod}
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <Label htmlFor="lead-notes">Notes</Label>
            <Textarea
              id="lead-notes"
              value={form.notes}
              onChange={(e) =>
                setForm((f) => ({ ...f, notes: e.target.value }))
              }
              placeholder="Internal notes about this lead…"
              rows={3}
              className="mt-1"
            />
          </div>
        </div>

        <SheetFooter className="flex gap-2">
          <Button variant="outline" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button
            data-ocid="crm.lead.submit_button"
            onClick={handleSubmit}
            className="flex-1"
          >
            {editLead ? "Save Changes" : "Add Lead"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

// ─── Kanban Card ────────────────────────────────────────────────────

function LeadCard({
  lead,
  index,
  onEdit,
  onDelete,
  onMove,
}: {
  lead: CrmLead;
  index: number;
  onEdit: (lead: CrmLead) => void;
  onDelete: (id: string) => void;
  onMove: (id: string, stage: CrmLead["stage"]) => void;
}) {
  return (
    <Card
      data-ocid={`crm.lead.item.${index}`}
      className="mb-3 shadow-sm hover:shadow-md transition-shadow"
    >
      <CardContent className="p-3">
        <div className="flex items-start justify-between gap-2 mb-2">
          <Badge
            variant="outline"
            className="font-mono text-[10px] px-1.5 py-0.5"
          >
            {lead.formattedId}
          </Badge>
          <span className="text-[10px] text-muted-foreground">
            {lead.kycType === "india" ? "🇮🇳 India" : "🌐 Overseas"}
          </span>
        </div>
        <p className="font-semibold text-sm text-foreground truncate">
          {lead.companyName}
        </p>
        <p className="text-xs text-muted-foreground">{lead.name}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{lead.phone}</p>
        {lead.subscriptionModules.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {lead.subscriptionModules.slice(0, 3).map((m) => (
              <span
                key={m}
                className="text-[9px] px-1.5 py-0.5 rounded bg-primary/10 text-primary font-medium"
              >
                {m}
              </span>
            ))}
            {lead.subscriptionModules.length > 3 && (
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                +{lead.subscriptionModules.length - 3}
              </span>
            )}
          </div>
        )}
        <div className="flex items-center gap-1.5 mt-3">
          <Button
            variant="outline"
            size="sm"
            data-ocid={`crm.lead.edit_button.${index}`}
            onClick={() => onEdit(lead)}
            className="flex-1 h-7 text-xs"
          >
            <Edit className="w-3 h-3 mr-1" />
            Edit
          </Button>
          <Select
            value={lead.stage}
            onValueChange={(v) => onMove(lead.id, v as CrmLead["stage"])}
          >
            <SelectTrigger className="h-7 text-xs flex-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="enquiry">Enquiry</SelectItem>
              <SelectItem value="followup">Follow-Up</SelectItem>
              <SelectItem value="onboarded">Onboarded</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="ghost"
            size="icon"
            data-ocid={`crm.lead.delete_button.${index}`}
            onClick={() => {
              if (confirm("Delete this lead?")) onDelete(lead.id);
            }}
            className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Main Page ──────────────────────────────────────────────────────

export default function CrmPage() {
  const [leads, setLeads] = useState<CrmLead[]>(() => loadLeads());
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editLead, setEditLead] = useState<CrmLead | null>(null);

  function persistLeads(updated: CrmLead[]) {
    setLeads(updated);
    saveLeads(updated);
  }

  function handleSave(form: LeadFormData, existing: CrmLead | null) {
    if (existing) {
      // If stage changed, regenerate formattedId
      let formattedId = existing.formattedId;
      if (form.stage !== existing.stage) {
        formattedId = generateFormattedId(form.stage);
      }
      const updated = leads.map((l) =>
        l.id === existing.id
          ? {
              ...l,
              ...form,
              formattedId,
              gstin: form.gstin || undefined,
              pan: form.pan || undefined,
              cin: form.cin || undefined,
              tinEin: form.tinEin || undefined,
              incorporationCert: form.incorporationCert || undefined,
              notes: form.notes || undefined,
            }
          : l,
      );
      persistLeads(updated);
      toast.success("Lead updated");
    } else {
      const newLead: CrmLead = {
        id: `crm-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        formattedId: generateFormattedId(form.stage),
        ...form,
        gstin: form.gstin || undefined,
        pan: form.pan || undefined,
        cin: form.cin || undefined,
        tinEin: form.tinEin || undefined,
        incorporationCert: form.incorporationCert || undefined,
        notes: form.notes || undefined,
        createdAt: Date.now(),
      };
      persistLeads([newLead, ...leads]);
      toast.success(`Lead ${newLead.formattedId} added`);
    }
    setSheetOpen(false);
    setEditLead(null);
  }

  function handleEdit(lead: CrmLead) {
    setEditLead(lead);
    setSheetOpen(true);
  }

  function handleDelete(id: string) {
    persistLeads(leads.filter((l) => l.id !== id));
    toast.success("Lead deleted");
  }

  function handleMove(id: string, stage: CrmLead["stage"]) {
    const formattedId = generateFormattedId(stage);
    const updated = leads.map((l) =>
      l.id === id ? { ...l, stage, formattedId } : l,
    );
    persistLeads(updated);
    toast.success(`Moved to ${STAGE_LABELS[stage]}`);
  }

  const enquiries = leads.filter((l) => l.stage === "enquiry");
  const followups = leads.filter((l) => l.stage === "followup");
  const onboarded = leads.filter((l) => l.stage === "onboarded");

  const kycStatus = (lead: CrmLead) => {
    if (lead.kycType === "india") {
      return lead.gstin && lead.pan ? "Complete" : "Incomplete";
    }
    return lead.tinEin ? "Complete" : "Incomplete";
  };

  return (
    <div data-ocid="crm.page" className="p-4 md:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="font-display text-2xl md:text-3xl text-foreground">
            Client CRM
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Lead Management &amp; KYC
          </p>
        </div>
        <Button
          data-ocid="crm.add_lead.open_modal_button"
          onClick={() => {
            setEditLead(null);
            setSheetOpen(true);
          }}
          className="gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Lead
        </Button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          {
            label: "Enquiries",
            count: enquiries.length,
            color: "text-blue-600",
            bg: "bg-blue-50 dark:bg-blue-950/40",
          },
          {
            label: "Follow-Up",
            count: followups.length,
            color: "text-amber-600",
            bg: "bg-amber-50 dark:bg-amber-950/40",
          },
          {
            label: "Onboarded",
            count: onboarded.length,
            color: "text-emerald-600",
            bg: "bg-emerald-50 dark:bg-emerald-950/40",
          },
        ].map((s) => (
          <Card key={s.label} className={`${s.bg} border-0`}>
            <CardContent className="p-4 text-center">
              <p className={`text-2xl font-bold ${s.color}`}>{s.count}</p>
              <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tabs */}
      <Tabs defaultValue="kanban">
        <TabsList className="mb-4">
          <TabsTrigger value="kanban" data-ocid="crm.kanban.tab">
            Kanban View
          </TabsTrigger>
          <TabsTrigger value="table" data-ocid="crm.table.tab">
            Table View
          </TabsTrigger>
        </TabsList>

        {/* Kanban */}
        <TabsContent value="kanban" data-ocid="crm.kanban.panel">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Enquiries Column */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                <h3 className="font-semibold text-sm text-foreground">
                  Enquiries
                </h3>
                <Badge variant="secondary" className="text-xs ml-auto">
                  {enquiries.length}
                </Badge>
              </div>
              {enquiries.length === 0 ? (
                <div className="rounded-lg border-2 border-dashed border-border p-6 text-center text-muted-foreground text-sm">
                  No enquiries yet
                </div>
              ) : (
                enquiries.map((lead, i) => (
                  <LeadCard
                    key={lead.id}
                    lead={lead}
                    index={i + 1}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onMove={handleMove}
                  />
                ))
              )}
            </div>

            {/* Follow-Up Column */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                <h3 className="font-semibold text-sm text-foreground">
                  Follow-Up
                </h3>
                <Badge variant="secondary" className="text-xs ml-auto">
                  {followups.length}
                </Badge>
              </div>
              {followups.length === 0 ? (
                <div className="rounded-lg border-2 border-dashed border-border p-6 text-center text-muted-foreground text-sm">
                  No follow-ups yet
                </div>
              ) : (
                followups.map((lead, i) => (
                  <LeadCard
                    key={lead.id}
                    lead={lead}
                    index={i + 1}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onMove={handleMove}
                  />
                ))
              )}
            </div>

            {/* Onboarded Column */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <h3 className="font-semibold text-sm text-foreground">
                  Onboarded
                </h3>
                <Badge variant="secondary" className="text-xs ml-auto">
                  {onboarded.length}
                </Badge>
              </div>
              {onboarded.length === 0 ? (
                <div className="rounded-lg border-2 border-dashed border-border p-6 text-center text-muted-foreground text-sm">
                  No clients onboarded yet
                </div>
              ) : (
                onboarded.map((lead, i) => (
                  <LeadCard
                    key={lead.id}
                    lead={lead}
                    index={i + 1}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onMove={handleMove}
                  />
                ))
              )}
            </div>
          </div>
        </TabsContent>

        {/* Table View */}
        <TabsContent value="table">
          <div className="rounded-xl border border-border overflow-hidden">
            <Table data-ocid="crm.table.table">
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead className="hidden md:table-cell">Email</TableHead>
                  <TableHead className="hidden md:table-cell">Phone</TableHead>
                  <TableHead>Stage</TableHead>
                  <TableHead className="hidden lg:table-cell">
                    Modules
                  </TableHead>
                  <TableHead className="hidden lg:table-cell">KYC</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leads.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={9}
                      className="text-center py-12 text-muted-foreground"
                    >
                      <Users className="w-8 h-8 mx-auto mb-2 opacity-30" />
                      No leads yet. Add your first lead.
                    </TableCell>
                  </TableRow>
                ) : (
                  leads.map((lead, i) => (
                    <TableRow key={lead.id}>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className="font-mono text-xs whitespace-nowrap"
                        >
                          {lead.formattedId}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <Building2 className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                          <span className="truncate max-w-[140px]">
                            {lead.companyName}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">{lead.name}</TableCell>
                      <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                        {lead.email}
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                        {lead.phone}
                      </TableCell>
                      <TableCell>
                        <span
                          className={`text-xs px-2 py-1 rounded-full font-medium ${STAGE_COLORS[lead.stage]}`}
                        >
                          {STAGE_LABELS[lead.stage]}
                        </span>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <div className="flex flex-wrap gap-1">
                          {lead.subscriptionModules.slice(0, 2).map((m) => (
                            <span
                              key={m}
                              className="text-[9px] px-1.5 py-0.5 rounded bg-primary/10 text-primary"
                            >
                              {m}
                            </span>
                          ))}
                          {lead.subscriptionModules.length > 2 && (
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                              +{lead.subscriptionModules.length - 2}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <span
                          className={`text-xs px-2 py-1 rounded-full font-medium ${
                            kycStatus(lead) === "Complete"
                              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                              : "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300"
                          }`}
                        >
                          {kycStatus(lead)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            data-ocid={`crm.lead.edit_button.${i + 1}`}
                            onClick={() => handleEdit(lead)}
                            className="h-7 w-7"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            data-ocid={`crm.lead.delete_button.${i + 1}`}
                            onClick={() => {
                              if (confirm("Delete this lead?"))
                                handleDelete(lead.id);
                            }}
                            className="h-7 w-7 text-destructive hover:text-destructive"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>

      {/* Sheet for add/edit */}
      <LeadSheet
        open={sheetOpen}
        onClose={() => {
          setSheetOpen(false);
          setEditLead(null);
        }}
        editLead={editLead}
        onSave={handleSave}
      />
    </div>
  );
}
