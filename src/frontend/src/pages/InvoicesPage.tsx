import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import {
  CreditCard,
  Loader2,
  Plus,
  ScanLine,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  type Customer,
  type Invoice,
  InvoiceStatus,
  type Product,
} from "../backend.d";
import DeleteConfirmDialog from "../components/DeleteConfirmDialog";
import OcrScanModal, {
  type NewProductFromScan,
  type OcrExtractedData,
} from "../components/OcrScanModal";
import { useBusiness } from "../context/BusinessContext";
import {
  useAddPayment,
  useCreateCustomer,
  useCreateInvoice,
  useCreateProduct,
  useCustomers,
  useDeleteInvoice,
  useInvoices,
  useProducts,
  useUpdateInvoiceStatus,
} from "../hooks/useQueries";
import {
  dateStringToNs,
  formatDate,
  formatDateInput,
  formatINR,
} from "../utils/formatINR";
import { GST_RATES } from "../utils/indianStates";

function StatusBadge({ status }: { status: InvoiceStatus }) {
  const map: Record<InvoiceStatus, { cls: string; label: string }> = {
    [InvoiceStatus.paid]: {
      cls: "bg-success/15 text-success border-success/30",
      label: "Paid",
    },
    [InvoiceStatus.sent]: {
      cls: "bg-info/15 text-info border-info/30",
      label: "Sent",
    },
    [InvoiceStatus.overdue]: {
      cls: "bg-destructive/15 text-destructive border-destructive/30",
      label: "Overdue",
    },
    [InvoiceStatus.draft]: {
      cls: "bg-muted text-muted-foreground border-border",
      label: "Draft",
    },
  };
  const { cls, label } = map[status];
  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border",
        cls,
      )}
    >
      {label}
    </span>
  );
}

// Line item for create form
interface LineItem {
  productId: string;
  productName: string;
  hsnSac: string;
  qty: string;
  unit: string;
  price: string;
  discountPct: string;
  gstRate: string;
}

function calcGst(
  items: LineItem[],
  isIntraState: boolean,
): {
  subtotal: bigint;
  cgst: bigint;
  sgst: bigint;
  igst: bigint;
  total: bigint;
} {
  let subtotalPaise = 0n;
  let gstPaise = 0n;
  for (const item of items) {
    const qty = Number.parseFloat(item.qty) || 0;
    const price = Number.parseFloat(item.price) || 0;
    const disc = Number.parseFloat(item.discountPct) || 0;
    const discountedPrice = price * (1 - disc / 100);
    const rate = Number.parseFloat(item.gstRate) || 0;
    const lineTotal = BigInt(Math.round(qty * discountedPrice * 100));
    const lineGst = BigInt(Math.round(qty * discountedPrice * rate));
    subtotalPaise += lineTotal;
    gstPaise += lineGst;
  }
  if (isIntraState) {
    const half = gstPaise / 2n;
    return {
      subtotal: subtotalPaise,
      cgst: half,
      sgst: half,
      igst: 0n,
      total: subtotalPaise + gstPaise,
    };
  }
  return {
    subtotal: subtotalPaise,
    cgst: 0n,
    sgst: 0n,
    igst: gstPaise,
    total: subtotalPaise + gstPaise,
  };
}

interface CreateInvoiceModalProps {
  open: boolean;
  onClose: () => void;
  customers: Customer[];
  products: Product[];
  businessState: string;
  nextInvoiceNumber: string;
}

function CreateInvoiceModal({
  open,
  onClose,
  customers,
  products,
  businessState,
  nextInvoiceNumber,
}: CreateInvoiceModalProps) {
  const createInvoice = useCreateInvoice();
  const [form, setForm] = useState({
    customerId: "",
    invoiceNumber: nextInvoiceNumber,
    invoiceDate: new Date().toISOString().split("T")[0],
    dueDate: "",
  });
  const [items, setItems] = useState<LineItem[]>([
    {
      productId: "",
      productName: "",
      hsnSac: "",
      qty: "1",
      unit: "Pcs",
      price: "",
      discountPct: "0",
      gstRate: "18",
    },
  ]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Reset form when modal opens or next invoice number changes
  useEffect(() => {
    if (open) {
      setForm({
        customerId: "",
        invoiceNumber: nextInvoiceNumber,
        invoiceDate: new Date().toISOString().split("T")[0],
        dueDate: "",
      });
      setItems([
        {
          productId: "",
          productName: "",
          hsnSac: "",
          qty: "1",
          unit: "Pcs",
          price: "",
          discountPct: "0",
          gstRate: "18",
        },
      ]);
      setErrors({});
    }
  }, [open, nextInvoiceNumber]);

  const selectedCustomer = customers.find(
    (c) => c.id.toString() === form.customerId,
  );

  // Get customer state from localStorage (stored there since backend doesn't have state field yet)
  const customerStateMap = JSON.parse(
    localStorage.getItem("customer_states") || "{}",
  ) as Record<string, string>;
  const customerState = selectedCustomer
    ? (customerStateMap[selectedCustomer.id.toString()] ?? "")
    : "";
  const isIntraState =
    !!customerState && !!businessState && customerState === businessState;

  const { subtotal, cgst, sgst, igst, total } = calcGst(items, isIntraState);

  function addItem() {
    setItems((p) => [
      ...p,
      {
        productId: "",
        productName: "",
        hsnSac: "",
        qty: "1",
        unit: "Pcs",
        price: "",
        discountPct: "0",
        gstRate: "18",
      },
    ]);
  }

  function removeItem(idx: number) {
    setItems((p) => p.filter((_, i) => i !== idx));
  }

  function updateItem(idx: number, field: keyof LineItem, value: string) {
    setItems((p) => {
      const next = [...p];
      next[idx] = { ...next[idx], [field]: value };
      if (field === "productId") {
        const prod = products.find((p) => p.id.toString() === value);
        if (prod) {
          next[idx].productName = prod.name;
          next[idx].hsnSac = prod.hsnCode ?? "";
          next[idx].price = (Number(prod.sellingPrice) / 100).toString();
          next[idx].gstRate = prod.gstRate.toString();
        }
      }
      return next;
    });
  }

  function validate() {
    const errs: Record<string, string> = {};
    if (!form.customerId) errs.customerId = "Select a customer";
    if (!form.invoiceNumber.trim())
      errs.invoiceNumber = "Invoice number required";
    if (!form.invoiceDate) errs.invoiceDate = "Invoice date required";
    if (items.length === 0) errs.items = "Add at least one item";
    items.forEach((item, i) => {
      if (!item.productName.trim())
        errs[`item_name_${i}`] = "Item name required";
      if (!item.qty || Number.parseFloat(item.qty) <= 0)
        errs[`item_qty_${i}`] = "Valid qty required";
      if (!item.price || Number.parseFloat(item.price) <= 0)
        errs[`item_price_${i}`] = "Valid price required";
    });
    return errs;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    const invoiceItems: Array<[bigint, string, bigint, bigint, bigint]> =
      items.map((item) => [
        item.productId ? BigInt(item.productId) : 0n,
        item.productName,
        BigInt(Math.round(Number.parseFloat(item.qty) || 0)),
        BigInt(Math.round((Number.parseFloat(item.price) || 0) * 100)),
        BigInt(Math.round(Number.parseFloat(item.gstRate) || 0)),
      ]);

    try {
      await createInvoice.mutateAsync({
        customerId: BigInt(form.customerId),
        invoiceNumber: form.invoiceNumber,
        invoiceDate: dateStringToNs(form.invoiceDate),
        dueDate: form.dueDate
          ? dateStringToNs(form.dueDate)
          : dateStringToNs(form.invoiceDate),
        items: invoiceItems,
      });
      toast.success("Invoice created successfully!");
      onClose();
    } catch {
      toast.error("Failed to create invoice.");
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent
        className="sm:max-w-2xl max-h-[90vh] overflow-y-auto"
        data-ocid="invoice_create.dialog"
      >
        <DialogHeader>
          <DialogTitle className="font-display text-xl">
            Create Invoice
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-5 mt-2">
          {/* Customer + Invoice Number */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>
                Customer <span className="text-destructive">*</span>
              </Label>
              <Select
                value={form.customerId}
                onValueChange={(v) => {
                  setForm((p) => ({ ...p, customerId: v }));
                  setErrors((p) => ({ ...p, customerId: "" }));
                }}
              >
                <SelectTrigger data-ocid="invoice_create.customer_select">
                  <SelectValue placeholder="Select customer" />
                </SelectTrigger>
                <SelectContent>
                  {customers.map((c) => (
                    <SelectItem key={c.id.toString()} value={c.id.toString()}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.customerId && (
                <p className="text-destructive text-xs">{errors.customerId}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label>
                Invoice # <span className="text-destructive">*</span>
              </Label>
              <Input
                data-ocid="invoice_create.number_input"
                value={form.invoiceNumber}
                onChange={(e) =>
                  setForm((p) => ({ ...p, invoiceNumber: e.target.value }))
                }
              />
              {errors.invoiceNumber && (
                <p className="text-destructive text-xs">
                  {errors.invoiceNumber}
                </p>
              )}
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>
                Invoice Date <span className="text-destructive">*</span>
              </Label>
              <Input
                type="date"
                data-ocid="invoice_create.date_input"
                value={form.invoiceDate}
                onChange={(e) =>
                  setForm((p) => ({ ...p, invoiceDate: e.target.value }))
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label>Due Date</Label>
              <Input
                type="date"
                data-ocid="invoice_create.due_date_input"
                value={form.dueDate}
                onChange={(e) =>
                  setForm((p) => ({ ...p, dueDate: e.target.value }))
                }
              />
            </div>
          </div>

          {/* GST type indicator */}
          {form.customerId && (
            <div
              className={cn(
                "flex items-center gap-2 p-3 rounded-lg text-sm",
                isIntraState
                  ? "bg-success/10 text-success"
                  : "bg-info/10 text-info",
              )}
            >
              <span className="font-medium">
                {isIntraState
                  ? "Intra-State → CGST + SGST"
                  : "Inter-State → IGST"}
              </span>
            </div>
          )}

          {/* Line items */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label>Line Items</Label>
              <Button
                type="button"
                size="sm"
                variant="outline"
                data-ocid="invoice_create.add_item_button"
                onClick={addItem}
                className="h-7 gap-1 text-xs"
              >
                <Plus className="w-3 h-3" />
                Add Row
              </Button>
            </div>

            <div className="space-y-2 overflow-x-auto">
              {/* Column headers */}
              <div className="grid grid-cols-12 gap-1.5 text-xs text-muted-foreground px-1 min-w-[640px]">
                <span className="col-span-3">Product / Description</span>
                <span className="col-span-2">HSN/SAC</span>
                <span className="col-span-1">Qty</span>
                <span className="col-span-1">Unit</span>
                <span className="col-span-2">Rate ₹</span>
                <span className="col-span-1">Disc%</span>
                <span className="col-span-1">GST%</span>
                <span className="col-span-1" />
              </div>
              {items.map((item, idx) => (
                <div
                  // biome-ignore lint/suspicious/noArrayIndexKey: line items order is user-defined
                  key={idx}
                  className="grid grid-cols-12 gap-1.5 items-start min-w-[640px]"
                  data-ocid={`invoice_create.item.${idx + 1}`}
                >
                  {/* Product */}
                  <div className="col-span-3">
                    <Select
                      value={item.productId}
                      onValueChange={(v) => updateItem(idx, "productId", v)}
                    >
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue placeholder="Product" />
                      </SelectTrigger>
                      <SelectContent>
                        {products.map((p) => (
                          <SelectItem
                            key={p.id.toString()}
                            value={p.id.toString()}
                          >
                            {p.name}
                          </SelectItem>
                        ))}
                        <SelectItem value="custom">Custom Item</SelectItem>
                      </SelectContent>
                    </Select>
                    {item.productId === "custom" || !item.productId ? (
                      <Input
                        className="h-8 mt-1 text-xs"
                        placeholder="Item name"
                        value={item.productName}
                        onChange={(e) =>
                          updateItem(idx, "productName", e.target.value)
                        }
                      />
                    ) : null}
                  </div>
                  {/* HSN/SAC */}
                  <div className="col-span-2">
                    <Input
                      className="h-8 text-xs font-mono"
                      placeholder="HSN/SAC"
                      value={item.hsnSac}
                      onChange={(e) =>
                        updateItem(idx, "hsnSac", e.target.value)
                      }
                    />
                  </div>
                  {/* Qty */}
                  <div className="col-span-1">
                    <Input
                      className="h-8 text-xs"
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="Qty"
                      value={item.qty}
                      onChange={(e) => updateItem(idx, "qty", e.target.value)}
                    />
                  </div>
                  {/* Unit */}
                  <div className="col-span-1">
                    <Input
                      className="h-8 text-xs"
                      placeholder="Pcs"
                      value={item.unit}
                      onChange={(e) => updateItem(idx, "unit", e.target.value)}
                    />
                  </div>
                  {/* Price (rupees) */}
                  <div className="col-span-2">
                    <Input
                      className="h-8 text-xs"
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="Rate ₹"
                      value={item.price}
                      onChange={(e) => updateItem(idx, "price", e.target.value)}
                    />
                  </div>
                  {/* Discount % */}
                  <div className="col-span-1">
                    <Input
                      className="h-8 text-xs"
                      type="number"
                      min="0"
                      max="100"
                      step="0.01"
                      placeholder="0"
                      value={item.discountPct}
                      onChange={(e) =>
                        updateItem(idx, "discountPct", e.target.value)
                      }
                    />
                  </div>
                  {/* GST Rate */}
                  <div className="col-span-1">
                    <Select
                      value={item.gstRate}
                      onValueChange={(v) => updateItem(idx, "gstRate", v)}
                    >
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {GST_RATES.map((r) => (
                          <SelectItem key={r} value={r.toString()}>
                            {r}%
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {/* Remove */}
                  <div className="col-span-1 flex justify-center">
                    <button
                      type="button"
                      data-ocid={`invoice_create.remove_item.${idx + 1}`}
                      onClick={() => removeItem(idx)}
                      className="text-muted-foreground hover:text-destructive mt-2 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Totals */}
          <div className="bg-muted/40 rounded-xl p-4 space-y-1.5 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="tabular-nums">{formatINR(subtotal)}</span>
            </div>
            {isIntraState ? (
              <>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">CGST</span>
                  <span className="tabular-nums">{formatINR(cgst)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">SGST</span>
                  <span className="tabular-nums">{formatINR(sgst)}</span>
                </div>
              </>
            ) : (
              <div className="flex justify-between">
                <span className="text-muted-foreground">IGST</span>
                <span className="tabular-nums">{formatINR(igst)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold border-t border-border pt-1.5 text-base">
              <span>Total</span>
              <span className="tabular-nums text-primary">
                {formatINR(total)}
              </span>
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              data-ocid="invoice_create.cancel_button"
              onClick={onClose}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              data-ocid="invoice_create.submit_button"
              disabled={createInvoice.isPending}
              className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {createInvoice.isPending && (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              )}
              Create Invoice
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

interface PaymentModalProps {
  open: boolean;
  invoiceId: bigint | null;
  onClose: () => void;
}

function PaymentModal({ open, invoiceId, onClose }: PaymentModalProps) {
  const addPayment = useAddPayment();
  const [form, setForm] = useState({
    amount: "",
    paymentDate: new Date().toISOString().split("T")[0],
    paymentMode: "UPI",
    referenceNo: "",
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!invoiceId) return;
    try {
      await addPayment.mutateAsync({
        invoiceId,
        amount: BigInt(Math.round(Number.parseFloat(form.amount || "0") * 100)),
        paymentDate: dateStringToNs(form.paymentDate),
        paymentMode: form.paymentMode,
        referenceNo: form.referenceNo,
      });
      toast.success("Payment recorded!");
      onClose();
    } catch {
      toast.error("Failed to record payment.");
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-sm" data-ocid="payment.dialog">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">
            Record Payment
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-1.5">
            <Label>Amount (₹)</Label>
            <Input
              type="number"
              min="0"
              step="0.01"
              data-ocid="payment.amount_input"
              placeholder="0.00"
              value={form.amount}
              onChange={(e) =>
                setForm((p) => ({ ...p, amount: e.target.value }))
              }
            />
          </div>
          <div className="space-y-1.5">
            <Label>Payment Mode</Label>
            <Select
              value={form.paymentMode}
              onValueChange={(v) => setForm((p) => ({ ...p, paymentMode: v }))}
            >
              <SelectTrigger data-ocid="payment.mode_select">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {["Cash", "UPI", "NEFT", "RTGS", "Cheque"].map((m) => (
                  <SelectItem key={m} value={m}>
                    {m}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Payment Date</Label>
            <Input
              type="date"
              data-ocid="payment.date_input"
              value={form.paymentDate}
              onChange={(e) =>
                setForm((p) => ({ ...p, paymentDate: e.target.value }))
              }
            />
          </div>
          <div className="space-y-1.5">
            <Label>Reference No.</Label>
            <Input
              data-ocid="payment.reference_input"
              placeholder="UTR / Cheque No."
              value={form.referenceNo}
              onChange={(e) =>
                setForm((p) => ({ ...p, referenceNo: e.target.value }))
              }
            />
          </div>
          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              data-ocid="payment.cancel_button"
              onClick={onClose}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              data-ocid="payment.submit_button"
              disabled={addPayment.isPending}
              className="flex-1 bg-primary text-primary-foreground"
            >
              {addPayment.isPending && (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              )}
              Record Payment
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

const STATUS_FILTERS = ["all", "draft", "sent", "paid", "overdue"] as const;
type StatusFilter = (typeof STATUS_FILTERS)[number];

export default function InvoicesPage() {
  const { activeBusiness } = useBusiness();
  const { data: invoices = [], isLoading } = useInvoices();
  const { data: customers = [] } = useCustomers();
  const { data: products = [] } = useProducts();
  const updateStatus = useUpdateInvoiceStatus();
  const deleteInvoice = useDeleteInvoice();
  const createInvoice = useCreateInvoice();
  const createCustomer = useCreateCustomer();
  const createProduct = useCreateProduct();

  const [createOpen, setCreateOpen] = useState(false);
  const [ocrOpen, setOcrOpen] = useState(false);
  const [paymentInvoiceId, setPaymentInvoiceId] = useState<bigint | null>(null);
  const [deleteId, setDeleteId] = useState<bigint | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  const customerMap = new Map(customers.map((c) => [c.id.toString(), c]));

  const filtered = invoices.filter((inv) => {
    const cust = customerMap.get(inv.customerId.toString());
    const matchesSearch =
      inv.invoiceNumber.toLowerCase().includes(search.toLowerCase()) ||
      (cust?.name ?? "").toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || inv.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Next invoice number
  const nextNum = invoices.length + 1;
  const nextInvoiceNumber = `INV-${String(nextNum).padStart(3, "0")}`;

  async function handleStatusChange(id: bigint, status: InvoiceStatus) {
    try {
      await updateStatus.mutateAsync({ id, status });
      toast.success(`Invoice marked as ${status}`);
    } catch {
      toast.error("Failed to update status");
    }
  }

  async function handleOcrApprove(
    data: OcrExtractedData,
    newProducts: NewProductFromScan[],
  ) {
    // Step 1: Find or create customer
    let customerId: bigint;
    const existingCustomer = customers.find(
      (c) =>
        c.name.toLowerCase().trim() === data.customerName.toLowerCase().trim(),
    );
    if (existingCustomer) {
      customerId = existingCustomer.id;
    } else if (data.customerName.trim()) {
      // Auto-create customer with state info
      customerId = await createCustomer.mutateAsync({
        name: data.customerName,
        gstin: data.customerGstin,
        phone: data.customerPhone,
        email: data.customerEmail,
        address: data.customerAddress,
        state: data.customerState,
      });
      toast.success(`Customer "${data.customerName}" added automatically`);
    } else {
      toast.error("Customer name required. Please fill in the customer name.");
      return;
    }

    // Step 2: Auto-add selected new products to the catalog
    if (newProducts.length > 0) {
      let addedCount = 0;
      for (const prod of newProducts) {
        // Check if a product with this HSN already exists
        const alreadyExists = products.some(
          (p) =>
            p.hsnCode === prod.hsnSac ||
            p.name.toLowerCase().trim() ===
              prod.productName.toLowerCase().trim(),
        );
        if (!alreadyExists) {
          try {
            const sellingPricePaise = BigInt(
              Math.round((Number.parseFloat(prod.rate) || 0) * 100),
            );
            await createProduct.mutateAsync({
              name: prod.productName,
              hsnCode: prod.hsnSac,
              gstRate: BigInt(Math.round(Number.parseFloat(prod.gstRate) || 5)),
              purchasePrice: sellingPricePaise,
              sellingPrice: sellingPricePaise,
              stockQuantity: 0n,
            });
            addedCount++;
          } catch {
            // Non-fatal, continue
          }
        }
      }
      if (addedCount > 0) {
        toast.success(
          `${addedCount} product${addedCount > 1 ? "s" : ""} added to your catalog`,
        );
      }
    }

    // Step 3: Create invoice — apply discount to price before storing
    const today = new Date().toISOString().split("T")[0];
    const invoiceItems: Array<[bigint, string, bigint, bigint, bigint]> =
      data.items.map((item) => {
        const price =
          Number.parseFloat(item.rate) || Number.parseFloat(item.amount) || 0;
        const disc = Number.parseFloat(item.discountPct) || 0;
        const discountedPrice = price * (1 - disc / 100);
        const label = item.hsnSac
          ? `${item.productName} [HSN: ${item.hsnSac}]`
          : item.productName;
        return [
          0n, // no productId (by-name line item)
          label,
          BigInt(Math.round(Number.parseFloat(item.qty) || 1)),
          BigInt(Math.round(discountedPrice * 100)),
          BigInt(Math.round(Number.parseFloat(item.gstRate) || 5)),
        ];
      });

    await createInvoice.mutateAsync({
      customerId,
      invoiceNumber: data.invoiceNumber || nextInvoiceNumber,
      invoiceDate: dateStringToNs(data.invoiceDate || today),
      dueDate: dateStringToNs(data.dueDate || data.invoiceDate || today),
      items:
        invoiceItems.length > 0
          ? invoiceItems
          : [[0n, "Item from scanned invoice", 1n, 0n, 5n]],
    });

    toast.success("Invoice created from scanned document!");
    setOcrOpen(false);
  }

  async function handleDelete() {
    if (!deleteId) return;
    try {
      await deleteInvoice.mutateAsync(deleteId);
      toast.success("Invoice deleted");
      setDeleteId(null);
    } catch {
      toast.error("Failed to delete invoice");
    }
  }

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl md:text-3xl text-foreground">
            Invoices
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {invoices.length} invoice{invoices.length !== 1 ? "s" : ""} total
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            data-ocid="invoices.scan.open_modal_button"
            onClick={() => setOcrOpen(true)}
            className="gap-2"
          >
            <ScanLine className="w-4 h-4" />
            <span className="hidden sm:inline">Scan Invoice</span>
          </Button>
          <Button
            data-ocid="invoices.create.open_modal_button"
            onClick={() => setCreateOpen(true)}
            className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">New Invoice</span>
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            data-ocid="invoices.search_input"
            className="pl-9"
            placeholder="Search by invoice # or customer…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {STATUS_FILTERS.map((f) => (
            <button
              type="button"
              key={f}
              data-ocid={`invoices.filter_${f}.tab`}
              onClick={() => setStatusFilter(f)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-medium transition-colors capitalize",
                statusFilter === f
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/70",
              )}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-card rounded-xl shadow-card border border-border overflow-hidden">
        {isLoading ? (
          <div className="p-5 space-y-3">
            {[1, 2, 3, 4].map((n) => (
              <Skeleton key={n} className="h-12 w-full" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div
            className="flex flex-col items-center gap-3 py-14"
            data-ocid="invoices.empty_state"
          >
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
              <CreditCard className="w-6 h-6 text-muted-foreground/50" />
            </div>
            <p className="text-muted-foreground text-sm">
              {search || statusFilter !== "all"
                ? "No invoices match your filters"
                : "No invoices yet"}
            </p>
            {!search && statusFilter === "all" && (
              <Button
                size="sm"
                onClick={() => setCreateOpen(true)}
                variant="outline"
              >
                <Plus className="w-4 h-4 mr-1" />
                Create first invoice
              </Button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm" data-ocid="invoices.table">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground">
                    Invoice #
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">
                    Customer
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground hidden md:table-cell">
                    Date
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground hidden lg:table-cell">
                    Due Date
                  </th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground">
                    Amount
                  </th>
                  <th className="text-center px-4 py-3 text-xs font-medium text-muted-foreground">
                    Status
                  </th>
                  <th className="text-center px-4 py-3 text-xs font-medium text-muted-foreground">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((inv, idx) => {
                  const cust = customerMap.get(inv.customerId.toString());
                  return (
                    <tr
                      key={inv.id.toString()}
                      className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors"
                      data-ocid={`invoices.item.${idx + 1}`}
                    >
                      <td className="px-5 py-3.5 font-mono text-xs text-primary font-semibold">
                        {inv.invoiceNumber}
                      </td>
                      <td className="px-4 py-3.5 text-foreground font-medium">
                        {cust?.name ?? `#${inv.customerId}`}
                      </td>
                      <td className="px-4 py-3.5 text-muted-foreground hidden md:table-cell">
                        {formatDate(inv.invoiceDate)}
                      </td>
                      <td className="px-4 py-3.5 text-muted-foreground hidden lg:table-cell">
                        {formatDate(inv.dueDate)}
                      </td>
                      <td className="px-4 py-3.5 text-right font-bold tabular-nums">
                        {formatINR(inv.totalAmount)}
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <StatusBadge status={inv.status} />
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center justify-center gap-1.5">
                          {inv.status !== InvoiceStatus.paid && (
                            <button
                              type="button"
                              data-ocid={`invoices.payment.open_modal_button.${idx + 1}`}
                              onClick={() => setPaymentInvoiceId(inv.id)}
                              className="text-xs px-2 py-1 rounded bg-success/10 text-success hover:bg-success/20 transition-colors font-medium whitespace-nowrap"
                            >
                              Pay
                            </button>
                          )}
                          {inv.status === InvoiceStatus.draft && (
                            <button
                              type="button"
                              data-ocid={`invoices.mark_sent.button.${idx + 1}`}
                              onClick={() =>
                                handleStatusChange(inv.id, InvoiceStatus.sent)
                              }
                              className="text-xs px-2 py-1 rounded bg-info/10 text-info hover:bg-info/20 transition-colors font-medium"
                            >
                              Send
                            </button>
                          )}
                          <button
                            type="button"
                            data-ocid={`invoices.delete_button.${idx + 1}`}
                            onClick={() => setDeleteId(inv.id)}
                            className="text-muted-foreground hover:text-destructive transition-colors p-1 rounded"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <CreateInvoiceModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        customers={customers}
        products={products}
        businessState={activeBusiness?.state ?? ""}
        nextInvoiceNumber={nextInvoiceNumber}
      />
      <OcrScanModal
        open={ocrOpen}
        onClose={() => setOcrOpen(false)}
        customers={customers}
        onApprove={(data, newProds) => handleOcrApprove(data, newProds)}
      />
      <PaymentModal
        open={paymentInvoiceId !== null}
        invoiceId={paymentInvoiceId}
        onClose={() => setPaymentInvoiceId(null)}
      />
      <DeleteConfirmDialog
        open={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Invoice?"
        description="This will permanently delete the invoice and cannot be undone."
        ocidPrefix="invoices.delete"
      />
    </div>
  );
}
