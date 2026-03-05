import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import {
  ArrowLeftRight,
  CheckCircle2,
  Plus,
  Trash2,
  XCircle,
} from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import { useCustomers, useInvoices } from "../hooks/useQueries";
import { formatDate, formatINR } from "../utils/formatINR";

// ─── Types ─────────────────────────────────────────────────────────

type B2BStatus = "Pending" | "Accepted" | "Disputed";

interface ReceivedInvoice {
  id: string;
  sellerGstin: string;
  sellerName: string;
  invoiceNumber: string;
  invoiceDate: string;
  amount: string;
  description: string;
  status: B2BStatus;
  addedAt: number;
}

// ─── localStorage helpers ──────────────────────────────────────────

function loadSentStatus(): Record<string, B2BStatus> {
  try {
    const s = localStorage.getItem("b2b_sent_status");
    return s ? (JSON.parse(s) as Record<string, B2BStatus>) : {};
  } catch {
    return {};
  }
}

function saveSentStatus(m: Record<string, B2BStatus>) {
  localStorage.setItem("b2b_sent_status", JSON.stringify(m));
}

function loadReceivedInvoices(): ReceivedInvoice[] {
  try {
    const s = localStorage.getItem("b2b_received_invoices");
    return s ? (JSON.parse(s) as ReceivedInvoice[]) : [];
  } catch {
    return [];
  }
}

function saveReceivedInvoices(list: ReceivedInvoice[]) {
  localStorage.setItem("b2b_received_invoices", JSON.stringify(list));
}

function loadCustomerGstinMap(): Record<string, string> {
  try {
    const s = localStorage.getItem("customer_gstin_map");
    return s ? (JSON.parse(s) as Record<string, string>) : {};
  } catch {
    return {};
  }
}

// ─── Helpers ───────────────────────────────────────────────────────

function validateGstin(g: string): boolean {
  return /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/.test(g);
}

function StatusBadge({ status }: { status: B2BStatus }) {
  const map: Record<
    B2BStatus,
    { label: string; className: string; icon: React.ReactNode }
  > = {
    Accepted: {
      label: "Accepted",
      className: "bg-green-500/10 text-green-600 border-green-500/20",
      icon: <CheckCircle2 className="w-3 h-3" />,
    },
    Disputed: {
      label: "Disputed",
      className: "bg-red-500/10 text-red-600 border-red-500/20",
      icon: <XCircle className="w-3 h-3" />,
    },
    Pending: {
      label: "Pending",
      className: "bg-amber-500/10 text-amber-600 border-amber-500/20",
      icon: <ArrowLeftRight className="w-3 h-3" />,
    },
  };
  const cfg = map[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border",
        cfg.className,
      )}
    >
      {cfg.icon}
      {cfg.label}
    </span>
  );
}

// ─── Sent B2B Tab ─────────────────────────────────────────────────

function SentB2BTab() {
  const { data: invoices = [] } = useInvoices();
  const { data: customers = [] } = useCustomers();
  const [sentStatus, setSentStatus] = useState<Record<string, B2BStatus>>(() =>
    loadSentStatus(),
  );

  // Build customer map + gstin map
  const customerMap = Object.fromEntries(
    customers.map((c) => [c.id.toString(), c]),
  );
  // Use backend GSTIN and also check localStorage map for overrides
  const gstinMap = loadCustomerGstinMap();

  // Filter invoices where customer has a GSTIN
  const b2bInvoices = invoices.filter((inv) => {
    const custId = inv.customerId.toString();
    const cust = customerMap[custId];
    const gstin = cust?.gstin ?? gstinMap[custId] ?? "";
    return gstin.length === 15 || validateGstin(gstin);
  });

  function updateStatus(invoiceId: string, status: B2BStatus) {
    setSentStatus((prev) => {
      const updated = { ...prev, [invoiceId]: status };
      saveSentStatus(updated);
      return updated;
    });
  }

  const totals = {
    total: b2bInvoices.length,
    accepted: b2bInvoices.filter(
      (i) => sentStatus[i.id.toString()] === "Accepted",
    ).length,
    disputed: b2bInvoices.filter(
      (i) => sentStatus[i.id.toString()] === "Disputed",
    ).length,
    pending: b2bInvoices.filter(
      (i) =>
        !sentStatus[i.id.toString()] ||
        sentStatus[i.id.toString()] === "Pending",
    ).length,
  };

  return (
    <div className="space-y-5">
      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          {
            label: "Total B2B",
            count: totals.total,
            color: "text-foreground",
            bg: "bg-muted/30",
          },
          {
            label: "Accepted",
            count: totals.accepted,
            color: "text-green-600",
            bg: "bg-green-500/10",
          },
          {
            label: "Disputed",
            count: totals.disputed,
            color: "text-red-600",
            bg: "bg-red-500/10",
          },
          {
            label: "Pending",
            count: totals.pending,
            color: "text-amber-600",
            bg: "bg-amber-500/10",
          },
        ].map((s) => (
          <div
            key={s.label}
            className={cn("rounded-xl p-4 border border-border", s.bg)}
          >
            <p className={cn("text-2xl font-bold", s.color)}>{s.count}</p>
            <p className="text-xs text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      {b2bInvoices.length === 0 ? (
        <div
          className="flex flex-col items-center gap-3 py-16 text-center"
          data-ocid="b2b_sent.empty_state"
        >
          <ArrowLeftRight className="w-10 h-10 text-muted-foreground/30" />
          <p className="text-muted-foreground text-sm">
            No B2B invoices found.
          </p>
          <p className="text-xs text-muted-foreground max-w-xs">
            B2B invoices are invoices raised to customers with a valid 15-digit
            GSTIN. Add GSTIN to your customers in the Customers page.
          </p>
        </div>
      ) : (
        <div
          className="rounded-xl border border-border overflow-hidden"
          data-ocid="b2b_sent.table"
        >
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30">
                  <TableHead>Invoice #</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>GSTIN</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {b2bInvoices.map((inv, idx) => {
                  const custId = inv.customerId.toString();
                  const cust = customerMap[custId];
                  const gstin = cust?.gstin ?? gstinMap[custId] ?? "";
                  const invId = inv.id.toString();
                  const currentStatus = sentStatus[invId] ?? "Pending";
                  return (
                    <TableRow key={invId} data-ocid={`b2b_sent.row.${idx + 1}`}>
                      <TableCell className="font-mono text-xs">
                        {inv.invoiceNumber}
                      </TableCell>
                      <TableCell className="font-medium text-sm">
                        {cust?.name ?? `Customer ${custId}`}
                      </TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {gstin}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {formatDate(inv.invoiceDate)}
                      </TableCell>
                      <TableCell className="text-right font-semibold text-sm">
                        {formatINR(inv.totalAmount)}
                      </TableCell>
                      <TableCell>
                        <Select
                          value={currentStatus}
                          onValueChange={(v) =>
                            updateStatus(invId, v as B2BStatus)
                          }
                        >
                          <SelectTrigger
                            className="w-28 h-7 text-xs"
                            data-ocid={`b2b_sent.status.select.${idx + 1}`}
                          >
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Pending">Pending</SelectItem>
                            <SelectItem value="Accepted">Accepted</SelectItem>
                            <SelectItem value="Disputed">Disputed</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Add Received Invoice Dialog ─────────────────────────────────

interface AddReceivedDialogProps {
  onAdd: (inv: ReceivedInvoice) => void;
}

function AddReceivedDialog({ onAdd }: AddReceivedDialogProps) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    sellerGstin: "",
    sellerName: "",
    invoiceNumber: "",
    invoiceDate: "",
    amount: "",
    description: "",
    status: "Pending" as B2BStatus,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  function validate() {
    const e: Record<string, string> = {};
    if (!form.sellerGstin) e.sellerGstin = "Required";
    else if (!validateGstin(form.sellerGstin.toUpperCase()))
      e.sellerGstin = "Must be 15-character valid GSTIN";
    if (!form.sellerName.trim()) e.sellerName = "Required";
    if (!form.invoiceNumber.trim()) e.invoiceNumber = "Required";
    if (!form.invoiceDate) e.invoiceDate = "Required";
    if (!form.amount || Number.isNaN(Number(form.amount)))
      e.amount = "Enter a valid amount";
    return e;
  }

  function handleSubmit() {
    const e = validate();
    if (Object.keys(e).length > 0) {
      setErrors(e);
      return;
    }
    onAdd({
      id: `rcv_${Date.now()}`,
      sellerGstin: form.sellerGstin.toUpperCase(),
      sellerName: form.sellerName.trim(),
      invoiceNumber: form.invoiceNumber.trim(),
      invoiceDate: form.invoiceDate,
      amount: form.amount,
      description: form.description.trim(),
      status: form.status,
      addedAt: Date.now(),
    });
    setForm({
      sellerGstin: "",
      sellerName: "",
      invoiceNumber: "",
      invoiceDate: "",
      amount: "",
      description: "",
      status: "Pending",
    });
    setErrors({});
    setOpen(false);
    toast.success("Received invoice added");
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          size="sm"
          data-ocid="b2b_received.open_modal_button"
          className="gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Received Invoice
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md" data-ocid="b2b_received.dialog">
        <DialogHeader>
          <DialogTitle>Add Received Invoice</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          {/* Seller GSTIN */}
          <div className="space-y-1.5">
            <Label>
              Seller GSTIN <span className="text-destructive">*</span>
            </Label>
            <Input
              data-ocid="b2b_received.seller_gstin.input"
              maxLength={15}
              value={form.sellerGstin}
              onChange={(e) => {
                setForm((p) => ({
                  ...p,
                  sellerGstin: e.target.value.toUpperCase(),
                }));
                setErrors((p) => ({ ...p, sellerGstin: "" }));
              }}
              placeholder="22AAAAA0000A1Z5"
              className="font-mono"
            />
            {errors.sellerGstin && (
              <p
                className="text-destructive text-xs"
                data-ocid="b2b_received.seller_gstin.error_state"
              >
                {errors.sellerGstin}
              </p>
            )}
          </div>

          {/* Seller Name */}
          <div className="space-y-1.5">
            <Label>
              Seller Name <span className="text-destructive">*</span>
            </Label>
            <Input
              data-ocid="b2b_received.seller_name.input"
              value={form.sellerName}
              onChange={(e) => {
                setForm((p) => ({ ...p, sellerName: e.target.value }));
                setErrors((p) => ({ ...p, sellerName: "" }));
              }}
            />
            {errors.sellerName && (
              <p className="text-destructive text-xs">{errors.sellerName}</p>
            )}
          </div>

          {/* Invoice Number */}
          <div className="space-y-1.5">
            <Label>
              Invoice Number <span className="text-destructive">*</span>
            </Label>
            <Input
              data-ocid="b2b_received.invoice_number.input"
              value={form.invoiceNumber}
              onChange={(e) => {
                setForm((p) => ({ ...p, invoiceNumber: e.target.value }));
                setErrors((p) => ({ ...p, invoiceNumber: "" }));
              }}
            />
            {errors.invoiceNumber && (
              <p className="text-destructive text-xs">{errors.invoiceNumber}</p>
            )}
          </div>

          {/* Date + Amount */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>
                Invoice Date <span className="text-destructive">*</span>
              </Label>
              <Input
                type="date"
                data-ocid="b2b_received.invoice_date.input"
                value={form.invoiceDate}
                onChange={(e) => {
                  setForm((p) => ({ ...p, invoiceDate: e.target.value }));
                  setErrors((p) => ({ ...p, invoiceDate: "" }));
                }}
              />
              {errors.invoiceDate && (
                <p className="text-destructive text-xs">{errors.invoiceDate}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label>
                Amount (₹) <span className="text-destructive">*</span>
              </Label>
              <Input
                type="number"
                data-ocid="b2b_received.amount.input"
                value={form.amount}
                onChange={(e) => {
                  setForm((p) => ({ ...p, amount: e.target.value }));
                  setErrors((p) => ({ ...p, amount: "" }));
                }}
                placeholder="0.00"
              />
              {errors.amount && (
                <p className="text-destructive text-xs">{errors.amount}</p>
              )}
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label>Description / Narration</Label>
            <Input
              data-ocid="b2b_received.description.input"
              value={form.description}
              onChange={(e) =>
                setForm((p) => ({ ...p, description: e.target.value }))
              }
              placeholder="Optional notes"
            />
          </div>

          {/* Status */}
          <div className="space-y-1.5">
            <Label>Action</Label>
            <Select
              value={form.status}
              onValueChange={(v) =>
                setForm((p) => ({ ...p, status: v as B2BStatus }))
              }
            >
              <SelectTrigger data-ocid="b2b_received.status.select">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Pending">Pending</SelectItem>
                <SelectItem value="Accepted">Accept</SelectItem>
                <SelectItem value="Disputed">Dispute</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            data-ocid="b2b_received.cancel_button"
            onClick={() => setOpen(false)}
          >
            Cancel
          </Button>
          <Button data-ocid="b2b_received.submit_button" onClick={handleSubmit}>
            Add Invoice
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Received Tab ─────────────────────────────────────────────────

function ReceivedTab() {
  const [invoices, setInvoices] = useState<ReceivedInvoice[]>(() =>
    loadReceivedInvoices(),
  );

  function handleAdd(inv: ReceivedInvoice) {
    setInvoices((prev) => {
      const updated = [inv, ...prev];
      saveReceivedInvoices(updated);
      return updated;
    });
  }

  function handleDelete(id: string) {
    setInvoices((prev) => {
      const updated = prev.filter((i) => i.id !== id);
      saveReceivedInvoices(updated);
      return updated;
    });
    toast.success("Invoice removed");
  }

  function handleStatusChange(id: string, status: B2BStatus) {
    setInvoices((prev) => {
      const updated = prev.map((i) => (i.id === id ? { ...i, status } : i));
      saveReceivedInvoices(updated);
      return updated;
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <AddReceivedDialog onAdd={handleAdd} />
      </div>

      {invoices.length === 0 ? (
        <div
          className="flex flex-col items-center gap-3 py-16 text-center"
          data-ocid="b2b_received.empty_state"
        >
          <ArrowLeftRight className="w-10 h-10 text-muted-foreground/30" />
          <p className="text-muted-foreground text-sm">
            No received invoices yet.
          </p>
          <p className="text-xs text-muted-foreground max-w-xs">
            Add invoices you received from other GST-registered businesses for
            input tax credit reconciliation.
          </p>
        </div>
      ) : (
        <div
          className="rounded-xl border border-border overflow-hidden"
          data-ocid="b2b_received.table"
        >
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30">
                  <TableHead>Invoice #</TableHead>
                  <TableHead>Seller</TableHead>
                  <TableHead>GSTIN</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.map((inv, idx) => (
                  <TableRow
                    key={inv.id}
                    data-ocid={`b2b_received.row.${idx + 1}`}
                  >
                    <TableCell className="font-mono text-xs">
                      {inv.invoiceNumber}
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium text-sm">{inv.sellerName}</p>
                        {inv.description && (
                          <p className="text-xs text-muted-foreground truncate max-w-[160px]">
                            {inv.description}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {inv.sellerGstin}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {new Date(inv.invoiceDate).toLocaleDateString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </TableCell>
                    <TableCell className="text-right font-semibold text-sm">
                      ₹{Number(inv.amount).toLocaleString("en-IN")}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <StatusBadge status={inv.status} />
                        <div className="flex gap-1">
                          <button
                            type="button"
                            data-ocid={`b2b_received.accept_button.${idx + 1}`}
                            onClick={() =>
                              handleStatusChange(inv.id, "Accepted")
                            }
                            className={cn(
                              "w-6 h-6 rounded flex items-center justify-center transition-colors",
                              inv.status === "Accepted"
                                ? "bg-green-500 text-white"
                                : "bg-green-500/10 text-green-600 hover:bg-green-500/20",
                            )}
                            title="Accept"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            data-ocid={`b2b_received.dispute_button.${idx + 1}`}
                            onClick={() =>
                              handleStatusChange(inv.id, "Disputed")
                            }
                            className={cn(
                              "w-6 h-6 rounded flex items-center justify-center transition-colors",
                              inv.status === "Disputed"
                                ? "bg-red-500 text-white"
                                : "bg-red-500/10 text-red-600 hover:bg-red-500/20",
                            )}
                            title="Dispute"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <button
                        type="button"
                        data-ocid={`b2b_received.delete_button.${idx + 1}`}
                        onClick={() => handleDelete(inv.id)}
                        className="w-7 h-7 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 flex items-center justify-center transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────

export default function B2bReconciliationPage() {
  return (
    <div
      className="p-4 md:p-6 max-w-5xl mx-auto"
      data-ocid="b2b_reconciliation.page"
    >
      {/* Header */}
      <div className="mb-6">
        <h1 className="font-display text-2xl md:text-3xl text-foreground flex items-center gap-2">
          <ArrowLeftRight className="w-7 h-7 text-primary" />
          B2B Invoice Reconciliation
        </h1>
        <p className="text-muted-foreground text-sm mt-0.5">
          Track and reconcile B2B invoices raised to GST-registered businesses
        </p>
      </div>

      <Tabs defaultValue="sent" className="w-full">
        <TabsList className="mb-5" data-ocid="b2b_reconciliation.tabs">
          <TabsTrigger value="sent" data-ocid="b2b_reconciliation.sent.tab">
            Sent (B2B)
          </TabsTrigger>
          <TabsTrigger
            value="received"
            data-ocid="b2b_reconciliation.received.tab"
          >
            Received Invoices
          </TabsTrigger>
        </TabsList>

        <TabsContent value="sent">
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <SentB2BTab />
          </motion.div>
        </TabsContent>

        <TabsContent value="received">
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <ReceivedTab />
          </motion.div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
