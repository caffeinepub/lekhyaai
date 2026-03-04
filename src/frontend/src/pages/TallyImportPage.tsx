import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Download,
  FileText,
  Import,
  Info,
  Loader2,
  SkipForward,
  Upload,
  X,
} from "lucide-react";
import { motion } from "motion/react";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import {
  useCreateCustomer,
  useCreateExpense,
  useCreateInvoice,
  useCreateVendor,
  useCustomers,
  useVendors,
} from "../hooks/useQueries";
import { dateStringToNs, formatINR } from "../utils/formatINR";

// ─── Types ──────────────────────────────────────────────────────────────────

type ImportType = "sales" | "purchases" | "ledger" | "customers" | "vendors";

interface TallyRow {
  id: string;
  type: ImportType;
  status: "pending" | "importing" | "done" | "skipped" | "error";
  error?: string;
  // parsed fields (all optional — used by relevant types)
  partyName?: string;
  gstin?: string;
  phone?: string;
  email?: string;
  address?: string;
  voucherNo?: string;
  date?: string; // YYYY-MM-DD
  amount?: number; // in rupees
  gstAmount?: number;
  category?: string;
  description?: string;
}

// ─── Tally XML Parsers ───────────────────────────────────────────────────────

function safeText(el: Element | null | undefined, tag: string): string {
  return el?.getElementsByTagName(tag)[0]?.textContent?.trim() ?? "";
}

function parseXmlString(text: string): Document {
  return new DOMParser().parseFromString(text, "text/xml");
}

function parseTallyXml(xmlText: string): TallyRow[] {
  const rows: TallyRow[] = [];
  const doc = parseXmlString(xmlText);

  // ── Sales vouchers (TALLYMESSAGE → VOUCHER type="Sales") ──────────
  const vouchers = doc.getElementsByTagName("VOUCHER");
  for (let i = 0; i < vouchers.length; i++) {
    const v = vouchers[i];
    const vtype = v.getAttribute("VCHTYPE") || safeText(v, "VOUCHERTYPENAME");
    const dateRaw = safeText(v, "DATE");
    const partyName =
      safeText(v, "PARTYNAME") || safeText(v, "PARTYLEDGERNAME");
    const voucherNo = safeText(v, "VOUCHERNUMBER");

    // Parse amount from ALLLEDGERENTRIES / LEDGERENTRIES
    let amount = 0;
    let gstAmount = 0;
    const ledgerEntries = v.getElementsByTagName("ALLLEDGERENTRIES.LIST");
    for (let j = 0; j < ledgerEntries.length; j++) {
      const le = ledgerEntries[j];
      const amt =
        Number.parseFloat(safeText(le, "AMOUNT").replace(/[^0-9.-]/g, "")) || 0;
      const ledName = safeText(le, "LEDGERNAME").toLowerCase();
      if (
        ledName.includes("gst") ||
        ledName.includes("cgst") ||
        ledName.includes("sgst") ||
        ledName.includes("igst")
      ) {
        gstAmount += Math.abs(amt);
      } else {
        amount += Math.abs(amt);
      }
    }

    // Fallback: try AMOUNT directly on the voucher
    if (amount === 0) {
      const directAmt = safeText(v, "AMOUNT");
      amount = Math.abs(
        Number.parseFloat(directAmt.replace(/[^0-9.-]/g, "")) || 0,
      );
    }

    const dateFormatted = parseTallyDate(dateRaw);
    if (!dateFormatted) continue;
    if (!partyName && amount === 0) continue;

    const vt = vtype.toLowerCase();
    const isSales = vt.includes("sales") || vt.includes("sale");
    const isPurchase = vt.includes("purchase") || vt.includes("purch");
    const isExpense =
      vt.includes("expense") ||
      vt.includes("journal") ||
      vt.includes("payment") ||
      vt.includes("contra");

    let type: ImportType = "ledger";
    if (isSales) type = "sales";
    else if (isPurchase) type = "purchases";
    else if (isExpense) type = "ledger";

    // Get GSTIN from party
    const gstin =
      safeText(v, "GSTREGISTRATIONNUMBER") || safeText(v, "PARTYGSTIN");

    rows.push({
      id: `xml-${i}`,
      type,
      status: "pending",
      partyName,
      gstin,
      voucherNo,
      date: dateFormatted,
      amount,
      gstAmount,
      description: `${vtype} ${voucherNo}`.trim(),
      category: isSales ? "Sales" : isPurchase ? "Purchases" : "Expense",
    });
  }

  // ── Party (Customer/Vendor) master from LEDGER ────────────────────
  const ledgers = doc.getElementsByTagName("LEDGER");
  for (let i = 0; i < ledgers.length; i++) {
    const l = ledgers[i];
    const name = l.getAttribute("NAME") || safeText(l, "NAME");
    if (!name) continue;
    const parent = safeText(l, "PARENT").toLowerCase();
    const gstin = safeText(l, "GSTREGISTRATIONNUMBER");
    const phone = safeText(l, "LEDMOBILENO");
    const email = safeText(l, "EMAIL");
    const address = safeText(l, "ADDRESS");

    const isCustomer =
      parent.includes("sundry debtor") || parent.includes("customer");
    const isVendor =
      parent.includes("sundry creditor") ||
      parent.includes("supplier") ||
      parent.includes("vendor");
    if (!isCustomer && !isVendor) continue;

    rows.push({
      id: `ledger-${i}`,
      type: isVendor ? "vendors" : "customers",
      status: "pending",
      partyName: name,
      gstin,
      phone,
      email,
      address,
    });
  }

  return rows;
}

// Tally date format: YYYYMMDD
function parseTallyDate(raw: string): string {
  if (!raw) return "";
  const s = raw.replace(/[^0-9]/g, "");
  if (s.length === 8) {
    return `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}`;
  }
  // Try DD/MM/YYYY or DD-MM-YYYY
  const m = raw.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (m) return `${m[3]}-${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")}`;
  return "";
}

// ─── CSV Parser ──────────────────────────────────────────────────────────────

function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  for (const char of line) {
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

function parseTallyCsv(text: string): TallyRow[] {
  const rows: TallyRow[] = [];
  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  if (lines.length < 2) return rows;

  const headers = parseCsvLine(lines[0]).map((h) =>
    h.toLowerCase().replace(/[^a-z0-9]/g, "_"),
  );

  const idx = (names: string[]): number => {
    for (const n of names) {
      const i = headers.findIndex((h) => h.includes(n));
      if (i !== -1) return i;
    }
    return -1;
  };

  const iDate = idx(["date", "voucher_date", "txn_date"]);
  const iParty = idx(["party_name", "party", "customer", "vendor", "name"]);
  const iAmt = idx(["amount", "total", "net_amount", "value"]);
  const iGst = idx(["gst_amount", "gst", "tax_amount", "tax"]);
  const iVno = idx(["voucher_no", "invoice_no", "voucher_number", "inv_no"]);
  const iDesc = idx(["description", "narration", "remarks", "particulars"]);
  const iType = idx(["voucher_type", "type", "category"]);
  const iGstin = idx(["gstin", "gst_no", "gst_reg"]);
  const iPhone = idx(["phone", "mobile", "contact"]);
  const iEmail = idx(["email", "e_mail"]);
  const iAddr = idx(["address", "addr"]);

  for (let i = 1; i < lines.length; i++) {
    const cols = parseCsvLine(lines[i]);
    const get = (j: number) => (j >= 0 ? (cols[j] ?? "") : "");

    const partyName = get(iParty);
    const dateRaw = get(iDate);
    const amtRaw = get(iAmt).replace(/[,₹\s]/g, "");
    const gstRaw = get(iGst).replace(/[,₹\s]/g, "");
    const voucherType = get(iType).toLowerCase();

    const amount = Math.abs(Number.parseFloat(amtRaw) || 0);
    const gstAmount = Math.abs(Number.parseFloat(gstRaw) || 0);
    const dateFormatted = parseTallyDate(dateRaw) || dateRaw;

    if (!partyName && amount === 0) continue;

    const isSales =
      voucherType.includes("sales") || voucherType.includes("sale");
    const isPurchase =
      voucherType.includes("purchase") || voucherType.includes("purch");
    const isCustomer =
      voucherType.includes("customer") || voucherType.includes("debtor");
    const isVendor =
      voucherType.includes("vendor") ||
      voucherType.includes("creditor") ||
      voucherType.includes("supplier");

    let type: ImportType = "ledger";
    if (isSales) type = "sales";
    else if (isPurchase) type = "purchases";
    else if (isCustomer) type = "customers";
    else if (isVendor) type = "vendors";

    rows.push({
      id: `csv-${i}`,
      type,
      status: "pending",
      partyName,
      gstin: get(iGstin),
      phone: get(iPhone),
      email: get(iEmail),
      address: get(iAddr),
      voucherNo: get(iVno),
      date: dateFormatted,
      amount,
      gstAmount,
      category: isSales ? "Sales" : isPurchase ? "Purchases" : "Expense",
      description: get(iDesc) || `Tally import ${get(iVno)}`.trim(),
    });
  }

  return rows;
}

// ─── Stat card ───────────────────────────────────────────────────────────────
function StatCard({
  label,
  value,
  color,
}: { label: string; value: number; color: string }) {
  return (
    <div className={cn("rounded-xl p-4 border", color)}>
      <p className="text-2xl font-bold tabular-nums">{value}</p>
      <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
    </div>
  );
}

// ─── Row badge ───────────────────────────────────────────────────────────────
function TypeBadge({ type }: { type: ImportType }) {
  const map: Record<ImportType, { cls: string; label: string }> = {
    sales: {
      cls: "bg-success/10 text-success border-success/20",
      label: "Sale",
    },
    purchases: {
      cls: "bg-info/10 text-info border-info/20",
      label: "Purchase",
    },
    ledger: {
      cls: "bg-warning/10 text-warning border-warning/20",
      label: "Ledger",
    },
    customers: {
      cls: "bg-primary/10 text-primary border-primary/20",
      label: "Customer",
    },
    vendors: {
      cls: "bg-purple-500/10 text-purple-600 border-purple-500/20",
      label: "Vendor",
    },
  };
  const { cls, label } = map[type];
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border",
        cls,
      )}
    >
      {label}
    </span>
  );
}

function StatusIcon({ status }: { status: TallyRow["status"] }) {
  if (status === "done")
    return <CheckCircle2 className="w-4 h-4 text-success" />;
  if (status === "error")
    return <AlertCircle className="w-4 h-4 text-destructive" />;
  if (status === "skipped")
    return <SkipForward className="w-4 h-4 text-muted-foreground" />;
  if (status === "importing")
    return <Loader2 className="w-4 h-4 text-primary animate-spin" />;
  return (
    <div className="w-4 h-4 rounded-full border-2 border-muted-foreground/30" />
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function TallyImportPage() {
  const [rows, setRows] = useState<TallyRow[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<ImportType | "all">("all");

  const { data: customers = [] } = useCustomers();
  const { data: vendors = [] } = useVendors();
  const createCustomer = useCreateCustomer();
  const createVendor = useCreateVendor();
  const createInvoice = useCreateInvoice();
  const createExpense = useCreateExpense();

  const stats = {
    total: rows.length,
    pending: rows.filter((r) => r.status === "pending").length,
    done: rows.filter((r) => r.status === "done").length,
    skipped: rows.filter((r) => r.status === "skipped").length,
    errors: rows.filter((r) => r.status === "error").length,
  };

  const filtered =
    filterType === "all" ? rows : rows.filter((r) => r.type === filterType);

  const parseFile = useCallback(async (file: File) => {
    setIsParsing(true);
    setRows([]);
    try {
      const text = await file.text();
      let parsed: TallyRow[];
      if (
        file.name.endsWith(".xml") ||
        file.type === "text/xml" ||
        file.type === "application/xml"
      ) {
        parsed = parseTallyXml(text);
      } else {
        parsed = parseTallyCsv(text);
      }
      if (parsed.length === 0) {
        toast.error(
          "No importable records found. Please check your Tally export format.",
        );
      } else {
        toast.success(`Found ${parsed.length} records ready to review`);
        setRows(parsed);
      }
    } catch {
      toast.error("Failed to parse file. Please try a different export.");
    } finally {
      setIsParsing(false);
    }
  }, []);

  function handleFiles(files: FileList | null) {
    const file = files?.[0];
    if (!file) return;
    const allowed = [".xml", ".csv", ".txt"];
    const ext = `.${file.name.split(".").pop()?.toLowerCase()}`;
    if (
      !allowed.includes(ext) &&
      !file.type.includes("xml") &&
      !file.type.includes("csv") &&
      !file.type.includes("text")
    ) {
      toast.error("Please upload a Tally XML or CSV file.");
      return;
    }
    void parseFile(file);
  }

  function skipRow(id: string) {
    setRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: "skipped" } : r)),
    );
  }

  function skipAll() {
    setRows((prev) =>
      prev.map((r) =>
        r.status === "pending" ? { ...r, status: "skipped" } : r,
      ),
    );
  }

  async function importRow(row: TallyRow): Promise<void> {
    const today = new Date().toISOString().split("T")[0];
    const dateStr = row.date || today;

    try {
      if (row.type === "customers") {
        const existing = customers.find(
          (c) =>
            c.name.toLowerCase().trim() ===
            (row.partyName ?? "").toLowerCase().trim(),
        );
        if (!existing) {
          await createCustomer.mutateAsync({
            name: row.partyName ?? "Unknown Customer",
            gstin: row.gstin ?? "",
            phone: row.phone ?? "",
            email: row.email ?? "",
            address: row.address ?? "",
          });
        }
        return;
      }

      if (row.type === "vendors") {
        const existing = vendors.find(
          (v) =>
            v.name.toLowerCase().trim() ===
            (row.partyName ?? "").toLowerCase().trim(),
        );
        if (!existing) {
          await createVendor.mutateAsync({
            name: row.partyName ?? "Unknown Vendor",
            gstin: row.gstin ?? "",
            phone: row.phone ?? "",
            email: row.email ?? "",
            address: row.address ?? "",
          });
        }
        return;
      }

      if (row.type === "sales") {
        // Find or create customer first
        let customerId: bigint;
        const existingCust = customers.find(
          (c) =>
            c.name.toLowerCase().trim() ===
            (row.partyName ?? "").toLowerCase().trim(),
        );
        if (existingCust) {
          customerId = existingCust.id;
        } else {
          customerId = await createCustomer.mutateAsync({
            name: row.partyName ?? "Tally Customer",
            gstin: row.gstin ?? "",
            phone: "",
            email: "",
            address: "",
          });
        }
        const pricePerUnit = BigInt(Math.round((row.amount ?? 0) * 100));
        await createInvoice.mutateAsync({
          customerId,
          invoiceNumber: row.voucherNo || `TALLY-${Date.now()}`,
          invoiceDate: dateStringToNs(dateStr),
          dueDate: dateStringToNs(dateStr),
          items: [
            [0n, row.description ?? "Tally import", 1n, pricePerUnit, 0n],
          ],
        });
        return;
      }

      if (row.type === "purchases" || row.type === "ledger") {
        const amount = BigInt(Math.round((row.amount ?? 0) * 100));
        const gstAmount = BigInt(Math.round((row.gstAmount ?? 0) * 100));
        await createExpense.mutateAsync({
          vendorId: null,
          category: row.category ?? "Purchases",
          amount,
          gstAmount,
          expenseDate: dateStringToNs(dateStr),
          description: row.description ?? row.partyName ?? "Tally import",
        });
      }
    } catch (err) {
      throw new Error(`${err}`);
    }
  }

  async function handleImportAll() {
    const pending = rows.filter((r) => r.status === "pending");
    if (pending.length === 0) {
      toast.info("No pending rows to import.");
      return;
    }
    setIsImporting(true);
    let done = 0;
    let errors = 0;
    for (const row of pending) {
      setRows((prev) =>
        prev.map((r) => (r.id === row.id ? { ...r, status: "importing" } : r)),
      );
      try {
        await importRow(row);
        setRows((prev) =>
          prev.map((r) => (r.id === row.id ? { ...r, status: "done" } : r)),
        );
        done++;
      } catch (err) {
        setRows((prev) =>
          prev.map((r) =>
            r.id === row.id ? { ...r, status: "error", error: `${err}` } : r,
          ),
        );
        errors++;
      }
    }
    setIsImporting(false);
    if (errors === 0) {
      toast.success(`${done} records imported successfully!`);
    } else {
      toast.warning(`${done} imported, ${errors} failed. Check error rows.`);
    }
  }

  const TYPE_FILTERS: Array<{ value: ImportType | "all"; label: string }> = [
    { value: "all", label: "All" },
    { value: "sales", label: "Sales" },
    { value: "purchases", label: "Purchases" },
    { value: "customers", label: "Customers" },
    { value: "vendors", label: "Vendors" },
    { value: "ledger", label: "Ledger" },
  ];

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="font-display text-2xl md:text-3xl text-foreground">
          Tally Import
        </h1>
        <p className="text-muted-foreground text-sm mt-0.5">
          Import your Tally data — sales, purchases, ledger entries, customers
          and vendors — directly into LekhyaAI.
        </p>
      </div>

      {/* Upload zone (only when no data) */}
      {rows.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-5"
        >
          {/* Instructions */}
          <div className="bg-info/5 border border-info/20 rounded-xl p-4 flex gap-3">
            <Info className="w-4 h-4 text-info mt-0.5 flex-shrink-0" />
            <div className="text-sm text-muted-foreground space-y-1">
              <p className="font-medium text-foreground">
                How to export from Tally ERP / Prime
              </p>
              <ol className="list-decimal list-inside space-y-0.5 text-xs">
                <li>
                  Open Tally &gt; Gateway of Tally &gt; Display &gt; Daybook or
                  Sales Register
                </li>
                <li>
                  Press{" "}
                  <kbd className="px-1 py-0.5 bg-muted rounded text-xs">
                    Alt+E
                  </kbd>{" "}
                  to Export
                </li>
                <li>
                  Choose format: <strong>XML</strong> (recommended) or{" "}
                  <strong>CSV</strong>
                </li>
                <li>Select the date range and save the file</li>
                <li>Upload that file here</li>
              </ol>
              <p className="text-xs mt-2">
                Supported: Tally ERP 9, Tally Prime, TallyShop XML / CSV exports
              </p>
            </div>
          </div>

          {/* Drop zone */}
          <label
            data-ocid="tally.upload.dropzone"
            htmlFor="tally-file-input"
            onDrop={(e) => {
              e.preventDefault();
              setIsDragging(false);
              handleFiles(e.dataTransfer.files);
            }}
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            className={cn(
              "relative border-2 border-dashed rounded-xl p-12 flex flex-col items-center gap-4 cursor-pointer transition-all duration-200 block text-center",
              isDragging
                ? "border-primary bg-primary/5 scale-[1.01]"
                : "border-border hover:border-primary/50 hover:bg-muted/20",
            )}
          >
            <input
              id="tally-file-input"
              type="file"
              accept=".xml,.csv,.txt"
              className="hidden"
              data-ocid="tally.upload.button"
              onChange={(e) => handleFiles(e.target.files)}
            />
            {isParsing ? (
              <Loader2 className="w-12 h-12 text-primary animate-spin" />
            ) : (
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                <Upload className="w-8 h-8 text-primary" />
              </div>
            )}
            <div>
              <p className="font-semibold text-foreground text-base">
                {isParsing
                  ? "Parsing file…"
                  : "Drop Tally export here or browse"}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Supports Tally XML and CSV exports
              </p>
            </div>
            <div className="flex gap-3">
              {[
                { label: "Tally XML", color: "text-orange-500" },
                { label: "Tally CSV", color: "text-green-500" },
              ].map(({ label, color }) => (
                <div
                  key={label}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-muted rounded-lg"
                >
                  <FileText className={cn("w-4 h-4", color)} />
                  <span className="text-xs text-muted-foreground">{label}</span>
                </div>
              ))}
            </div>
          </label>

          {/* Sample download */}
          <div className="flex items-center gap-2 p-4 rounded-xl border border-border bg-card">
            <Download className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">Don't have a Tally export?</p>
              <p className="text-xs text-muted-foreground">
                Download a sample CSV to test the import flow
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              data-ocid="tally.sample.button"
              onClick={() => {
                const csvLines = [
                  "Voucher Type,Party Name,Voucher No,Date,Amount,GST Amount,Description,GSTIN",
                  "Sales,Ravi Textiles,TYS001,20240101,50000,9000,Fabric sale,27AABCR1234M1Z5",
                  "Sales,Mehta Enterprises,TYS002,20240105,25000,4500,Saree export,24AABCM5678N1Z3",
                  "Purchases,Yarn Suppliers Ltd,PO001,20240110,30000,5400,Raw yarn purchase,27AABCY9876K1Z1",
                  "Expense,Electricity Board,,20240115,3500,630,Monthly electricity,",
                ];
                const csv = `${csvLines.join("\n")}\n`;
                const blob = new Blob([csv], { type: "text/csv" });
                const a = document.createElement("a");
                a.href = URL.createObjectURL(blob);
                a.download = "tally_sample_export.csv";
                a.click();
              }}
            >
              Download Sample
            </Button>
          </div>
        </motion.div>
      )}

      {/* Data loaded state */}
      {rows.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-5"
        >
          {/* Stats bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatCard
              label="Total Records"
              value={stats.total}
              color="border-border bg-card"
            />
            <StatCard
              label="Pending"
              value={stats.pending}
              color="border-warning/30 bg-warning/5"
            />
            <StatCard
              label="Imported"
              value={stats.done}
              color="border-success/30 bg-success/5"
            />
            <StatCard
              label="Skipped / Error"
              value={stats.skipped + stats.errors}
              color="border-muted bg-muted/20"
            />
          </div>

          {/* Action bar */}
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
            <div className="flex gap-1.5 flex-wrap">
              {TYPE_FILTERS.map((f) => (
                <button
                  type="button"
                  key={f.value}
                  data-ocid={`tally.filter_${f.value}.tab`}
                  onClick={() => setFilterType(f.value as ImportType | "all")}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-medium transition-colors capitalize",
                    filterType === f.value
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:bg-muted/70",
                  )}
                >
                  {f.label}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                data-ocid="tally.skip_all.button"
                onClick={skipAll}
                disabled={isImporting || stats.pending === 0}
                className="gap-1.5"
              >
                <SkipForward className="w-3.5 h-3.5" />
                Skip All
              </Button>
              <Button
                variant="outline"
                size="sm"
                data-ocid="tally.reset.button"
                onClick={() => setRows([])}
                disabled={isImporting}
                className="gap-1.5"
              >
                <X className="w-3.5 h-3.5" />
                New Import
              </Button>
              <Button
                size="sm"
                data-ocid="tally.import_all.button"
                onClick={handleImportAll}
                disabled={isImporting || stats.pending === 0}
                className="bg-primary text-primary-foreground hover:bg-primary/90 gap-1.5"
              >
                {isImporting ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Import className="w-3.5 h-3.5" />
                )}
                Import {stats.pending} Records
              </Button>
            </div>
          </div>

          {/* Table */}
          <div className="bg-card rounded-xl border border-border overflow-hidden shadow-card">
            {filtered.length === 0 ? (
              <div
                className="flex flex-col items-center gap-3 py-12"
                data-ocid="tally.empty_state"
              >
                <FileText className="w-10 h-10 text-muted-foreground/30" />
                <p className="text-muted-foreground text-sm">
                  No records for this filter
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm" data-ocid="tally.table">
                  <thead>
                    <tr className="border-b border-border bg-muted/30">
                      <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground w-8" />
                      <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">
                        Type
                      </th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">
                        Party / Description
                      </th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground hidden md:table-cell">
                        Voucher No
                      </th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground hidden sm:table-cell">
                        Date
                      </th>
                      <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground">
                        Amount
                      </th>
                      <th className="text-center px-4 py-3 text-xs font-medium text-muted-foreground">
                        Status
                      </th>
                      <th className="text-center px-4 py-3 text-xs font-medium text-muted-foreground">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((row, idx) => (
                      <>
                        <tr
                          key={row.id}
                          data-ocid={`tally.item.${idx + 1}`}
                          className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors"
                        >
                          <td className="px-4 py-3">
                            <button
                              type="button"
                              data-ocid={`tally.expand.${idx + 1}`}
                              onClick={() =>
                                setExpandedId(
                                  expandedId === row.id ? null : row.id,
                                )
                              }
                              className="text-muted-foreground hover:text-foreground transition-colors"
                            >
                              {expandedId === row.id ? (
                                <ChevronUp className="w-4 h-4" />
                              ) : (
                                <ChevronDown className="w-4 h-4" />
                              )}
                            </button>
                          </td>
                          <td className="px-4 py-3">
                            <TypeBadge type={row.type} />
                          </td>
                          <td className="px-4 py-3">
                            <span className="font-medium text-foreground">
                              {row.partyName || "—"}
                            </span>
                            {row.description &&
                              row.description !== row.partyName && (
                                <p className="text-xs text-muted-foreground mt-0.5 truncate max-w-[180px]">
                                  {row.description}
                                </p>
                              )}
                          </td>
                          <td className="px-4 py-3 text-muted-foreground font-mono text-xs hidden md:table-cell">
                            {row.voucherNo || "—"}
                          </td>
                          <td className="px-4 py-3 text-muted-foreground text-xs hidden sm:table-cell">
                            {row.date || "—"}
                          </td>
                          <td className="px-4 py-3 text-right font-bold tabular-nums">
                            {row.amount
                              ? formatINR(BigInt(Math.round(row.amount * 100)))
                              : "—"}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <StatusIcon status={row.status} />
                              {row.status === "error" && row.error && (
                                <span
                                  className="text-xs text-destructive"
                                  title={row.error}
                                >
                                  !
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-center">
                            {row.status === "pending" && (
                              <button
                                type="button"
                                data-ocid={`tally.skip.${idx + 1}`}
                                onClick={() => skipRow(row.id)}
                                className="text-xs px-2 py-1 rounded bg-muted text-muted-foreground hover:bg-muted/70 transition-colors"
                              >
                                Skip
                              </button>
                            )}
                          </td>
                        </tr>
                        {expandedId === row.id && (
                          <tr key={`${row.id}-exp`} className="bg-muted/10">
                            <td colSpan={8} className="px-6 py-3">
                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                                {row.gstin && (
                                  <div>
                                    <span className="text-muted-foreground">
                                      GSTIN:{" "}
                                    </span>
                                    <span className="font-mono">
                                      {row.gstin}
                                    </span>
                                  </div>
                                )}
                                {row.phone && (
                                  <div>
                                    <span className="text-muted-foreground">
                                      Phone:{" "}
                                    </span>
                                    {row.phone}
                                  </div>
                                )}
                                {row.email && (
                                  <div>
                                    <span className="text-muted-foreground">
                                      Email:{" "}
                                    </span>
                                    {row.email}
                                  </div>
                                )}
                                {row.gstAmount && row.gstAmount > 0 && (
                                  <div>
                                    <span className="text-muted-foreground">
                                      GST Amt:{" "}
                                    </span>
                                    {formatINR(
                                      BigInt(Math.round(row.gstAmount * 100)),
                                    )}
                                  </div>
                                )}
                                {row.category && (
                                  <div>
                                    <span className="text-muted-foreground">
                                      Category:{" "}
                                    </span>
                                    {row.category}
                                  </div>
                                )}
                                {row.error && (
                                  <div className="col-span-2 text-destructive">
                                    Error: {row.error}
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        )}
                      </>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Progress footer */}
          {isImporting && (
            <div className="flex items-center gap-3 p-4 rounded-xl bg-primary/5 border border-primary/20">
              <Loader2 className="w-4 h-4 text-primary animate-spin flex-shrink-0" />
              <p className="text-sm text-foreground">
                Importing {stats.pending} records… please do not close this
                page.
              </p>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}
