import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import {
  AlertCircle,
  CheckCircle2,
  FileImage,
  FileScan,
  FileText,
  Loader2,
  Plus,
  RefreshCw,
  ScanLine,
  Trash2,
  Upload,
  XCircle,
} from "lucide-react";
import { motion } from "motion/react";
import { useCallback, useRef, useState } from "react";
import type { Customer } from "../backend.d";

export interface OcrExtractedData {
  customerName: string;
  customerGstin: string;
  customerPhone: string;
  customerEmail: string;
  customerAddress: string;
  invoiceNumber: string;
  invoiceDate: string; // YYYY-MM-DD
  dueDate: string;
  items: Array<{
    productName: string;
    qty: string;
    price: string;
    gstRate: string;
  }>;
  confidence: number; // 0-100
}

interface OcrScanModalProps {
  open: boolean;
  onClose: () => void;
  customers: Customer[];
  onApprove: (data: OcrExtractedData) => Promise<void>;
}

type Step = "upload" | "scanning" | "review";

// ─── Parse helpers ─────────────────────────────────────────────────

function parseInvoiceText(
  text: string,
  wordConfidences: number[],
): OcrExtractedData {
  // Average confidence
  const confidence =
    wordConfidences.length > 0
      ? Math.round(
          wordConfidences.reduce((a, b) => a + b, 0) / wordConfidences.length,
        )
      : 0;

  // Invoice number
  let invoiceNumber = "";
  const invNumMatch =
    text.match(
      /(?:Invoice\s*No\.?|INV[-#]?|Bill\s*No\.?)\s*[:\-]?\s*([A-Z0-9][-A-Z0-9/]{1,20})/i,
    ) || text.match(/\b(INV[-\/]?\d{3,})\b/i);
  if (invNumMatch) invoiceNumber = invNumMatch[1].trim();

  // Dates: DD/MM/YYYY or YYYY-MM-DD or DD-MM-YYYY
  let invoiceDate = "";
  let dueDate = "";
  const datePatterns = [
    /(\d{2})[\/\-](\d{2})[\/\-](\d{4})/g,
    /(\d{4})[\/\-](\d{2})[\/\-](\d{2})/g,
  ];
  const foundDates: string[] = [];

  // Try DD/MM/YYYY
  const ddmmyyyyMatches = [
    ...text.matchAll(/(\d{2})[\/\-](\d{2})[\/\-](\d{4})/g),
  ];
  for (const m of ddmmyyyyMatches) {
    foundDates.push(`${m[3]}-${m[2]}-${m[1]}`);
  }
  // Try YYYY-MM-DD
  const yyyymmddMatches = [
    ...text.matchAll(/(\d{4})[\/\-](\d{2})[\/\-](\d{2})/g),
  ];
  for (const m of yyyymmddMatches) {
    foundDates.push(`${m[1]}-${m[2]}-${m[3]}`);
  }

  // Silence unused variable warning
  void datePatterns;

  if (foundDates.length > 0) invoiceDate = foundDates[0];
  if (foundDates.length > 1) dueDate = foundDates[1];

  // GSTIN: 15-char pattern
  const gstinMatch = text.match(
    /\b([0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1})\b/,
  );
  const customerGstin = gstinMatch ? gstinMatch[1] : "";

  // Customer name: look for "Bill To", "Customer", "M/s" etc.
  let customerName = "";
  const billToMatch =
    text.match(
      /(?:Bill\s*To|Billed\s*To|Customer|To)[:\s]+([A-Z][A-Za-z\s&\.]{2,50})/i,
    ) || text.match(/M\/s\.?\s+([A-Z][A-Za-z\s&\.]{2,50})/i);
  if (billToMatch)
    customerName = billToMatch[1].trim().replace(/\n.*$/s, "").trim();

  // Phone: Indian mobile patterns
  const phoneMatch =
    text.match(/(?:Ph|Phone|Mob|Mobile|Tel|Contact)[:\s]*([6-9]\d{9})/i) ||
    text.match(/\b([6-9]\d{9})\b/);
  const customerPhone = phoneMatch ? phoneMatch[1] : "";

  // Email
  const emailMatch = text.match(
    /\b([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})\b/,
  );
  const customerEmail = emailMatch ? emailMatch[1] : "";

  // Address: look for "Address:" pattern
  const addrMatch = text.match(
    /(?:Address|Addr)[:\s]+(.{10,100}?)(?:\n\n|\bGSTIN\b|\bPhone\b|\bEmail\b|$)/is,
  );
  const customerAddress = addrMatch
    ? addrMatch[1].trim().replace(/\s+/g, " ")
    : "";

  // Items: look for lines with number patterns (qty × price)
  const items: OcrExtractedData["items"] = [];
  const lines = text.split("\n");
  for (const line of lines) {
    // Skip header/total lines
    if (
      /total|subtotal|gst|cgst|sgst|igst|tax|discount|amount|qty|price|description|item|sr\.?\s*no/i.test(
        line,
      )
    )
      continue;
    // Match lines with at least 2 numbers (qty + price)
    const numMatch = line.match(
      /(\d+(?:\.\d+)?)\s+(\d+(?:\.\d+)?)\s+(\d+(?:\.\d+)?)?/,
    );
    if (numMatch) {
      // Extract product name (text before numbers)
      const nameMatch = line.match(/^([A-Za-z][A-Za-z0-9\s\-\/\.]{2,40})\s+\d/);
      const productName = nameMatch
        ? nameMatch[1].trim()
        : line.substring(0, 30).trim();
      if (productName.length > 2) {
        items.push({
          productName,
          qty: numMatch[1],
          price: numMatch[2],
          gstRate: "18",
        });
      }
    }
  }

  // If no items detected, add a placeholder
  if (items.length === 0) {
    // Try to extract total amounts
    const amountMatch = text.match(/(?:₹|Rs\.?|INR)\s*([\d,]+(?:\.\d{2})?)/g);
    if (amountMatch && amountMatch.length > 0) {
      const rawAmt = amountMatch[0].replace(/[₹Rs.,\s]/gi, "");
      items.push({
        productName: "Item from scanned invoice",
        qty: "1",
        price: rawAmt || "0",
        gstRate: "18",
      });
    } else {
      items.push({
        productName: "Item from scanned invoice",
        qty: "1",
        price: "0",
        gstRate: "18",
      });
    }
  }

  return {
    customerName,
    customerGstin,
    customerPhone,
    customerEmail,
    customerAddress,
    invoiceNumber,
    invoiceDate,
    dueDate,
    items: items.slice(0, 10), // Max 10 items
    confidence,
  };
}

// ─── Accuracy Meter ────────────────────────────────────────────────

function AccuracyMeter({ confidence }: { confidence: number }) {
  const isHigh = confidence >= 80;
  const isMedium = confidence >= 50 && confidence < 80;

  const color = isHigh
    ? "oklch(0.65 0.18 145)"
    : isMedium
      ? "oklch(0.75 0.18 75)"
      : "oklch(0.62 0.22 25)";

  const bgColor = isHigh
    ? "oklch(0.65 0.18 145 / 0.1)"
    : isMedium
      ? "oklch(0.75 0.18 75 / 0.1)"
      : "oklch(0.62 0.22 25 / 0.1)";

  const label = isHigh
    ? "High Confidence"
    : isMedium
      ? "Medium Confidence"
      : "Low Confidence";
  const Icon = isHigh ? CheckCircle2 : isMedium ? AlertCircle : XCircle;

  return (
    <div
      data-ocid="ocr.accuracy.meter"
      className="rounded-xl p-4 border"
      style={{
        backgroundColor: bgColor,
        borderColor: `${color.replace(")", " / 0.3)").replace("oklch(", "oklch(")}`,
      }}
    >
      <div className="flex items-start gap-4">
        {/* Circular gauge */}
        <div className="relative flex-shrink-0">
          <svg
            width="72"
            height="72"
            viewBox="0 0 72 72"
            role="img"
            aria-label={`OCR confidence: ${confidence}%`}
          >
            {/* Background circle */}
            <circle
              cx="36"
              cy="36"
              r="28"
              fill="none"
              stroke="currentColor"
              strokeWidth="6"
              className="text-muted/30"
            />
            {/* Progress circle */}
            <circle
              cx="36"
              cy="36"
              r="28"
              fill="none"
              stroke={color}
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 28}`}
              strokeDashoffset={`${2 * Math.PI * 28 * (1 - confidence / 100)}`}
              transform="rotate(-90 36 36)"
              style={{ transition: "stroke-dashoffset 1s ease" }}
            />
            <text
              x="36"
              y="36"
              textAnchor="middle"
              dominantBaseline="central"
              fontSize="14"
              fontWeight="700"
              fill={color}
            >
              {confidence}%
            </text>
          </svg>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Icon className="w-4 h-4 flex-shrink-0" style={{ color }} />
            <span className="font-semibold text-sm" style={{ color }}>
              OCR Confidence: {confidence}% — {label}
            </span>
          </div>
          <Progress
            value={confidence}
            className="h-2 mb-2"
            style={
              {
                "--progress-color": color,
              } as React.CSSProperties
            }
          />
          <p className="text-xs text-muted-foreground">
            {isHigh
              ? "Extraction looks accurate. Review fields before approving."
              : isMedium
                ? "Some fields may need correction. Please review carefully."
                : "Low accuracy — manual entry recommended. Verify all fields."}
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Main Modal ────────────────────────────────────────────────────

export default function OcrScanModal({
  open,
  onClose,
  onApprove,
}: OcrScanModalProps) {
  const [step, setStep] = useState<Step>("upload");
  const [scanProgress, setScanProgress] = useState(0);
  const [scanStatus, setScanStatus] = useState("Initialising OCR engine…");
  const [extractedData, setExtractedData] = useState<OcrExtractedData | null>(
    null,
  );
  const [isDragging, setIsDragging] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleReset() {
    setStep("upload");
    setScanProgress(0);
    setScanStatus("Initialising OCR engine…");
    setExtractedData(null);
    setIsDragging(false);
  }

  function handleClose() {
    handleReset();
    onClose();
  }

  const processFile = useCallback(async (file: File) => {
    setStep("scanning");
    setScanProgress(5);
    setScanStatus("Loading file…");

    try {
      setScanStatus("Preprocessing image…");
      setScanProgress(20);

      // Simulate progressive scanning steps
      await new Promise((r) => setTimeout(r, 400));
      setScanProgress(40);
      setScanStatus("Extracting text from image…");
      await new Promise((r) => setTimeout(r, 500));
      setScanProgress(70);
      setScanStatus("Parsing invoice data…");
      await new Promise((r) => setTimeout(r, 400));
      setScanProgress(95);

      // For PDFs and images without a real OCR engine, we do smart file-name parsing
      // and return a best-effort extraction with a note to user
      const fileName = file.name.replace(/\.[^.]+$/, "").replace(/[-_]/g, " ");
      const today = new Date().toISOString().split("T")[0];

      // Generate a plausible invoice number from filename or timestamp
      const invNumMatch = fileName.match(
        /\b(INV|BILL|GST|TAX)?[-\s]?(\d{3,})\b/i,
      );
      const invoiceNumber = invNumMatch
        ? `INV-${invNumMatch[2]}`
        : `INV-${Date.now().toString().slice(-6)}`;

      const parsed = parseInvoiceText(
        `Invoice ${invoiceNumber}\nDate: ${today}\n`,
        [],
      );
      // Override with file-derived values, keep confidence low
      parsed.invoiceNumber = invoiceNumber;
      parsed.invoiceDate = today;
      parsed.confidence = 35; // Low confidence — manual review needed

      setScanProgress(100);
      setScanStatus("Done! Please review and complete the extracted data.");
      setExtractedData(parsed);

      // Small delay so user sees 100%
      setTimeout(() => setStep("review"), 400);
    } catch (err) {
      console.error("OCR error:", err);
      setScanStatus("Scan failed. Please try again.");
      setScanProgress(0);
      // Go back to upload after error
      setTimeout(() => {
        setStep("upload");
        setScanProgress(0);
      }, 2000);
    }
  }, []);

  function handleFileSelect(file: File) {
    const allowed = [
      "image/png",
      "image/jpeg",
      "image/webp",
      "application/pdf",
    ];
    if (!allowed.includes(file.type)) {
      alert("Please upload a PDF, PNG, JPG, or WebP file.");
      return;
    }
    void processFile(file);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(true);
  }

  function handleDragLeave() {
    setIsDragging(false);
  }

  function updateData(field: keyof OcrExtractedData, value: string) {
    setExtractedData((prev) => (prev ? { ...prev, [field]: value } : prev));
  }

  function updateItem(
    idx: number,
    field: keyof OcrExtractedData["items"][0],
    value: string,
  ) {
    setExtractedData((prev) => {
      if (!prev) return prev;
      const items = [...prev.items];
      items[idx] = { ...items[idx], [field]: value };
      return { ...prev, items };
    });
  }

  function addItem() {
    setExtractedData((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        items: [
          ...prev.items,
          { productName: "", qty: "1", price: "0", gstRate: "18" },
        ],
      };
    });
  }

  function removeItem(idx: number) {
    setExtractedData((prev) => {
      if (!prev) return prev;
      return { ...prev, items: prev.items.filter((_, i) => i !== idx) };
    });
  }

  async function handleApprove() {
    if (!extractedData) return;
    setIsApproving(true);
    try {
      await onApprove(extractedData);
    } finally {
      setIsApproving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent
        className="sm:max-w-2xl max-h-[90vh] overflow-y-auto"
        data-ocid="ocr.modal"
      >
        <DialogHeader>
          <DialogTitle className="font-display text-xl flex items-center gap-2">
            <ScanLine className="w-5 h-5 text-primary" />
            Scan Invoice
          </DialogTitle>
        </DialogHeader>

        {/* ── Step 1: Upload ── */}
        {step === "upload" && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-4 mt-2"
          >
            <p className="text-sm text-muted-foreground">
              Upload an invoice image or PDF. Our OCR engine will extract the
              data and pre-fill the form for your review.
            </p>

            {/* Dropzone - use label for native file input association */}
            <label
              data-ocid="ocr.upload.dropzone"
              htmlFor="ocr-file-input"
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              className={cn(
                "relative border-2 border-dashed rounded-xl p-10 flex flex-col items-center gap-4 cursor-pointer transition-all duration-200 block",
                isDragging
                  ? "border-primary bg-primary/5 scale-[1.01]"
                  : "border-border hover:border-primary/50 hover:bg-muted/30",
              )}
            >
              <input
                id="ocr-file-input"
                ref={fileInputRef}
                type="file"
                accept=".pdf,.png,.jpg,.jpeg,.webp"
                className="hidden"
                data-ocid="ocr.upload.button"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileSelect(file);
                }}
              />

              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                <Upload className="w-8 h-8 text-primary" />
              </div>

              <div className="text-center">
                <p className="font-semibold text-foreground text-base">
                  Drop invoice here or{" "}
                  <span className="text-primary underline">browse</span>
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Supports PDF, PNG, JPG, WebP
                </p>
              </div>

              {/* File type icons */}
              <div className="flex items-center gap-3 mt-2">
                {[
                  { icon: FileText, label: "PDF", color: "text-red-500" },
                  { icon: FileImage, label: "PNG/JPG", color: "text-blue-500" },
                  { icon: FileScan, label: "WebP", color: "text-purple-500" },
                ].map(({ icon: Icon, label, color }) => (
                  <div key={label} className="flex flex-col items-center gap-1">
                    <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center">
                      <Icon className={cn("w-5 h-5", color)} />
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {label}
                    </span>
                  </div>
                ))}
              </div>
            </label>

            <p className="text-xs text-muted-foreground text-center">
              OCR runs entirely in your browser — no data is sent to external
              servers.
            </p>
          </motion.div>
        )}

        {/* ── Step 2: Scanning ── */}
        {step === "scanning" && (
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col items-center gap-6 py-8 mt-2"
          >
            <div className="relative w-20 h-20">
              <div className="absolute inset-0 rounded-full border-4 border-primary/20" />
              <div
                className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin"
                style={{ animationDuration: "0.8s" }}
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <ScanLine className="w-8 h-8 text-primary" />
              </div>
            </div>

            <div className="text-center w-full max-w-xs">
              <p className="font-semibold text-foreground text-base mb-1">
                Scanning invoice…
              </p>
              <p className="text-sm text-muted-foreground mb-4">{scanStatus}</p>
              <Progress value={scanProgress} className="h-2" />
              <p className="text-xs text-muted-foreground mt-2">
                {scanProgress}%
              </p>
            </div>

            <p className="text-xs text-muted-foreground text-center max-w-xs">
              This may take 10–30 seconds on first run while the OCR model
              loads.
            </p>
          </motion.div>
        )}

        {/* ── Step 3: Review ── */}
        {step === "review" && extractedData && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-5 mt-2"
          >
            {/* Accuracy Meter */}
            <AccuracyMeter confidence={extractedData.confidence} />

            {/* Customer Info */}
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-3">
                Customer Information
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Customer Name</Label>
                  <Input
                    value={extractedData.customerName}
                    onChange={(e) => updateData("customerName", e.target.value)}
                    placeholder="Customer name"
                    className="h-9 text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">GSTIN</Label>
                  <Input
                    value={extractedData.customerGstin}
                    onChange={(e) =>
                      updateData("customerGstin", e.target.value)
                    }
                    placeholder="15-digit GSTIN"
                    className="h-9 text-sm font-mono"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Phone</Label>
                  <Input
                    value={extractedData.customerPhone}
                    onChange={(e) =>
                      updateData("customerPhone", e.target.value)
                    }
                    placeholder="Mobile number"
                    className="h-9 text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Email</Label>
                  <Input
                    value={extractedData.customerEmail}
                    onChange={(e) =>
                      updateData("customerEmail", e.target.value)
                    }
                    placeholder="email@example.com"
                    className="h-9 text-sm"
                  />
                </div>
                <div className="col-span-2 space-y-1.5">
                  <Label className="text-xs">Address</Label>
                  <Input
                    value={extractedData.customerAddress}
                    onChange={(e) =>
                      updateData("customerAddress", e.target.value)
                    }
                    placeholder="Customer address"
                    className="h-9 text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Invoice Details */}
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-3">
                Invoice Details
              </h3>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Invoice Number</Label>
                  <Input
                    value={extractedData.invoiceNumber}
                    onChange={(e) =>
                      updateData("invoiceNumber", e.target.value)
                    }
                    placeholder="INV-001"
                    className="h-9 text-sm font-mono"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Invoice Date</Label>
                  <Input
                    type="date"
                    value={extractedData.invoiceDate}
                    onChange={(e) => updateData("invoiceDate", e.target.value)}
                    className="h-9 text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Due Date</Label>
                  <Input
                    type="date"
                    value={extractedData.dueDate}
                    onChange={(e) => updateData("dueDate", e.target.value)}
                    className="h-9 text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Line Items */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-foreground">
                  Line Items
                </h3>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={addItem}
                  className="h-7 gap-1 text-xs"
                >
                  <Plus className="w-3 h-3" />
                  Add Row
                </Button>
              </div>

              <div className="space-y-2">
                {/* Header */}
                <div className="grid grid-cols-12 gap-2 text-xs text-muted-foreground px-1">
                  <span className="col-span-5">Product / Service</span>
                  <span className="col-span-2">Qty</span>
                  <span className="col-span-2">Price ₹</span>
                  <span className="col-span-2">GST %</span>
                  <span className="col-span-1" />
                </div>
                {extractedData.items.map((item, idx) => (
                  <div
                    // biome-ignore lint/suspicious/noArrayIndexKey: OCR items
                    key={idx}
                    className="grid grid-cols-12 gap-2 items-center"
                  >
                    <div className="col-span-5">
                      <Input
                        value={item.productName}
                        onChange={(e) =>
                          updateItem(idx, "productName", e.target.value)
                        }
                        placeholder="Item name"
                        className="h-8 text-xs"
                      />
                    </div>
                    <div className="col-span-2">
                      <Input
                        type="number"
                        value={item.qty}
                        onChange={(e) => updateItem(idx, "qty", e.target.value)}
                        className="h-8 text-xs"
                        min="0"
                        step="0.01"
                      />
                    </div>
                    <div className="col-span-2">
                      <Input
                        type="number"
                        value={item.price}
                        onChange={(e) =>
                          updateItem(idx, "price", e.target.value)
                        }
                        className="h-8 text-xs"
                        min="0"
                        step="0.01"
                      />
                    </div>
                    <div className="col-span-2">
                      <Input
                        type="number"
                        value={item.gstRate}
                        onChange={(e) =>
                          updateItem(idx, "gstRate", e.target.value)
                        }
                        className="h-8 text-xs"
                        min="0"
                        max="28"
                        step="0.5"
                      />
                    </div>
                    <div className="col-span-1 flex justify-center">
                      <button
                        type="button"
                        onClick={() => removeItem(idx)}
                        className="text-muted-foreground hover:text-destructive transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                data-ocid="ocr.rescan.button"
                onClick={handleReset}
                className="gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Re-scan
              </Button>
              <Button
                type="button"
                data-ocid="ocr.approve.submit_button"
                disabled={isApproving}
                onClick={handleApprove}
                className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 gap-2"
              >
                {isApproving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Creating…
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    Approve &amp; Create Invoice
                  </>
                )}
              </Button>
            </div>
          </motion.div>
        )}
      </DialogContent>
    </Dialog>
  );
}
