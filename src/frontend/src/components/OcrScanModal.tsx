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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  AlertCircle,
  Building2,
  CheckCircle2,
  Eye,
  FileImage,
  FileScan,
  FileText,
  Info,
  Loader2,
  Package,
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
import { amountToWordsIN } from "../utils/formatINR";
import { GST_RATES } from "../utils/indianStates";

export interface OcrExtractedData {
  // Seller / From
  sellerName: string;
  sellerGstin: string;
  sellerAddress: string;
  sellerState: string;
  sellerStateCode: string;
  sellerEmail: string;

  // Buyer / Bill To
  customerName: string;
  customerGstin: string;
  customerPhone: string;
  customerEmail: string;
  customerAddress: string;
  customerState: string;
  customerStateCode: string;
  customerDepartment: string;

  // Invoice header
  invoiceNumber: string;
  invoiceDate: string; // YYYY-MM-DD
  dueDate: string;
  deliveryNote: string;
  modeOfPayment: string;
  referenceNo: string;
  buyerOrderNo: string;
  buyerOrderDate: string;
  dispatchDocNo: string;
  deliveryNoteDate: string;
  dispatchedThrough: string;
  destination: string;
  termsOfDelivery: string;

  // Line items
  items: Array<{
    srNo: string;
    productName: string;
    hsnSac: string;
    qty: string;
    unit: string;
    rateInclTax: string;
    rate: string;
    discountPct: string;
    gstRate: string;
    amount: string;
  }>;

  // Totals & tax
  taxableValue: string;
  cgstRate: string;
  cgstAmount: string;
  sgstRate: string;
  sgstAmount: string;
  igstRate: string;
  igstAmount: string;
  roundOff: string;
  totalAmount: string;
  amountInWords: string;
  taxAmountInWords: string;

  // Bank details
  bankName: string;
  bankAccountNo: string;
  bankIfscCode: string;
  bankBranch: string;

  // Declaration
  declaration: string;

  confidence: number; // 0-100
}

// New products to be added to the catalog
export interface NewProductFromScan {
  productName: string;
  hsnSac: string;
  gstRate: string;
  rate: string; // selling price
  unit: string;
  selected: boolean;
}

interface OcrScanModalProps {
  open: boolean;
  onClose: () => void;
  customers: Customer[];
  onApprove: (
    data: OcrExtractedData,
    newProducts: NewProductFromScan[],
  ) => Promise<void>;
}

type Step = "upload" | "scanning" | "review" | "products";

// ─── State Code → State Name map (GST state codes) ─────────────────
const STATE_CODE_MAP: Record<string, string> = {
  "01": "Jammu and Kashmir",
  "02": "Himachal Pradesh",
  "03": "Punjab",
  "04": "Chandigarh",
  "05": "Uttarakhand",
  "06": "Haryana",
  "07": "Delhi",
  "08": "Rajasthan",
  "09": "Uttar Pradesh",
  "10": "Bihar",
  "11": "Sikkim",
  "12": "Arunachal Pradesh",
  "13": "Nagaland",
  "14": "Manipur",
  "15": "Mizoram",
  "16": "Tripura",
  "17": "Meghalaya",
  "18": "Assam",
  "19": "West Bengal",
  "20": "Jharkhand",
  "21": "Odisha",
  "22": "Chhattisgarh",
  "23": "Madhya Pradesh",
  "24": "Gujarat",
  "26": "Dadra and Nagar Haveli and Daman and Diu",
  "27": "Maharashtra",
  "28": "Andhra Pradesh",
  "29": "Karnataka",
  "30": "Goa",
  "31": "Lakshadweep",
  "32": "Kerala",
  "33": "Tamil Nadu",
  "34": "Puducherry",
  "35": "Andaman and Nicobar Islands",
  "36": "Telangana",
  "37": "Andhra Pradesh",
  "38": "Ladakh",
};

// ─── Parse helpers ─────────────────────────────────────────────────

function normaliseDate(input: string): string {
  if (!input) return "";
  // DD-Mon-YY or DD-Mon-YYYY e.g. 2-Mar-26
  const monMatch = input.match(
    /(\d{1,2})[-\/\s](Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[-\/\s](\d{2,4})/i,
  );
  if (monMatch) {
    const monthMap: Record<string, string> = {
      jan: "01",
      feb: "02",
      mar: "03",
      apr: "04",
      may: "05",
      jun: "06",
      jul: "07",
      aug: "08",
      sep: "09",
      oct: "10",
      nov: "11",
      dec: "12",
    };
    const d = monMatch[1].padStart(2, "0");
    const m = monthMap[monMatch[2].toLowerCase()];
    let y = monMatch[3];
    if (y.length === 2) y = `20${y}`;
    return `${y}-${m}-${d}`;
  }
  // DD/MM/YYYY or DD-MM-YYYY
  const ddmmyyyy = input.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (ddmmyyyy)
    return `${ddmmyyyy[3]}-${ddmmyyyy[2].padStart(2, "0")}-${ddmmyyyy[1].padStart(2, "0")}`;
  if (/^\d{4}-\d{2}-\d{2}$/.test(input)) return input;
  return "";
}

function extractGstins(text: string): string[] {
  const matches = text.match(
    /\b([0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z])\b/g,
  );
  return matches ? [...new Set(matches)] : [];
}

function stateFromGstin(gstin: string): { state: string; code: string } {
  const code = gstin.substring(0, 2);
  return { state: STATE_CODE_MAP[code] ?? "", code };
}

/** Strip commas and currency symbols from a number string */
function cleanNum(s: string): string {
  return s.replace(/[,₹\s]/g, "");
}

function parseInvoiceText(
  text: string,
  wordConfidences: number[],
): OcrExtractedData {
  const confidence =
    wordConfidences.length > 0
      ? Math.round(
          wordConfidences.reduce((a, b) => a + b, 0) / wordConfidences.length,
        )
      : 0;

  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  const fullText = lines.join("\n");

  // ── GSTINs ──────────────────────────────────────────────────────
  const gstins = extractGstins(fullText);
  const sellerGstin = gstins[0] ?? "";
  const customerGstin = gstins[1] ?? "";
  const sellerStateInfo = sellerGstin
    ? stateFromGstin(sellerGstin)
    : { state: "", code: "" };
  const customerStateInfo = customerGstin
    ? stateFromGstin(customerGstin)
    : { state: "", code: "" };

  // ── State from "State Name : Maharashtra, Code : 27" ────────────
  const stateNameMatches = [
    ...fullText.matchAll(
      /State\s*Name\s*[:\-]\s*([A-Za-z\s]+?)(?:,\s*Code\s*[:\-]\s*(\d+))?(?:\n|$)/gi,
    ),
  ];
  const sellerStateName =
    stateNameMatches[0]?.[1]?.trim() ?? sellerStateInfo.state;
  const customerStateName =
    stateNameMatches[1]?.[1]?.trim() ?? customerStateInfo.state;
  const sellerStateCode =
    stateNameMatches[0]?.[2]?.trim() ?? sellerStateInfo.code;
  const customerStateCode =
    stateNameMatches[1]?.[2]?.trim() ?? customerStateInfo.code;

  // ── Invoice number ───────────────────────────────────────────────
  // Strategy: try multiple patterns from most specific to least specific
  let invoiceNumber = "";

  // Pattern 1: "Invoice No." or "Invoice No" followed by a value (possibly on next line)
  const invNoPatterns = [
    /Invoice\s*No\.?\s*[:\-]?\s*\n?\s*([A-Z0-9][A-Z0-9\/\-\.]{2,30})/i,
    /Bill\s*No\.?\s*[:\-]?\s*\n?\s*([A-Z0-9][A-Z0-9\/\-\.]{2,30})/i,
    /Tax\s*Invoice\s*No\.?\s*[:\-]?\s*\n?\s*([A-Z0-9][A-Z0-9\/\-\.]{2,30})/i,
    /Inv\.?\s*No\.?\s*[:\-]?\s*\n?\s*([A-Z0-9][A-Z0-9\/\-\.]{2,30})/i,
    /Invoice\s*#\s*[:\-]?\s*\n?\s*([A-Z0-9][A-Z0-9\/\-\.]{2,30})/i,
    // Format like TYS426/25-26 — alphanumeric with slashes and dashes
    /\b([A-Z]{2,5}\d{3,6}\/\d{2,4}-\d{2,4})\b/,
    // INV-, BILL-, TAX- prefixed
    /\b((?:INV|BILL|TAX)[-#\/]?\s*[A-Z0-9\/\-]{3,20})\b/i,
  ];
  for (const pat of invNoPatterns) {
    const m = fullText.match(pat);
    if (m?.[1]) {
      const candidate = m[1].trim();
      // Exclude obvious dates (DD-MM-YYYY pattern)
      if (!/^\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4}$/.test(candidate)) {
        invoiceNumber = candidate;
        break;
      }
    }
  }

  // ── Dates ────────────────────────────────────────────────────────
  let invoiceDate = "";
  const datePats = [
    /(?:Dated?|Invoice\s*Date)[:\s]*([0-9]{1,2}[-\/][A-Za-z]{3}[-\/][0-9]{2,4})/i,
    /(?:Dated?|Invoice\s*Date)[:\s]*([0-9]{1,2}[-\/][0-9]{1,2}[-\/][0-9]{2,4})/i,
  ];
  for (const p of datePats) {
    const m = fullText.match(p);
    if (m) {
      invoiceDate = normaliseDate(m[1]);
      break;
    }
  }
  if (!invoiceDate) {
    const raw = fullText.match(/\b(\d{1,2}[-\/][A-Za-z]{3}[-\/]\d{2,4})\b/);
    if (raw) invoiceDate = normaliseDate(raw[1]);
  }
  const dueDateMatch = fullText.match(
    /(?:Due\s*Date|Payment\s*Due)[:\s]*([0-9]{1,2}[-\/][A-Za-z0-9]{2,3}[-\/][0-9]{2,4})/i,
  );
  const dueDate = dueDateMatch ? normaliseDate(dueDateMatch[1]) : "";

  // ── Misc header fields ───────────────────────────────────────────
  const deliveryNoteMatch = fullText.match(
    /Delivery\s*Note\s*(?!Date)[:\s]*([^\n]{1,40})/i,
  );
  const modeOfPaymentMatch = fullText.match(
    /Mode[\/\s]*(?:Terms\s*of\s*Payment)?[:\s]*([^\n]{1,60})/i,
  );
  const referenceMatch = fullText.match(
    /Reference\s*No\.?\s*(?:&|and)\s*Date[:\s]*([^\n]{1,60})/i,
  );
  const buyerOrderMatch = fullText.match(
    /Buyer[''s]*\s*Order\s*No\.?[:\s]*([^\n]{1,40})/i,
  );
  const buyerOrderDateMatch = fullText.match(
    /Buyer[''s]*\s*Order.*?Dated?[:\s]*([0-9]{1,2}[-\/][A-Za-z0-9]{2,3}[-\/][0-9]{2,4})/i,
  );
  const dispatchDocMatch = fullText.match(
    /Dispatch\s*Doc\.?\s*No\.?[:\s]*([^\n]{1,40})/i,
  );
  const deliveryNoteDateMatch = fullText.match(
    /Delivery\s*Note\s*Date[:\s]*([^\n]{1,40})/i,
  );
  const dispatchedThroughMatch = fullText.match(
    /Dispatched?\s*(?:Through|Via)[:\s]*([^\n]{1,60})/i,
  );
  const destinationMatch = fullText.match(/Destination[:\s]*([^\n]{1,60})/i);
  const termsOfDeliveryMatch = fullText.match(
    /Terms\s*of\s*Delivery[:\s]*([^\n]{1,80})/i,
  );

  // ── Seller info ──────────────────────────────────────────────────
  const sellerEmailMatch = fullText.match(
    /E[-\s]?Mail\s*[:\-]?\s*([\w._%+-]+@[\w.-]+\.[a-z]{2,})/i,
  );
  let sellerName = "";
  const sellerNameMatch = fullText.match(
    /^([A-Z][A-Za-z\s&\.,']{3,60}(?:Pvt\.?\s*Ltd\.?|LLP|Ltd\.?|Corp\.?|Co\.?)?)\s*\n/m,
  );
  if (sellerNameMatch) sellerName = sellerNameMatch[1].trim();

  // ── Buyer info ───────────────────────────────────────────────────
  let customerName = "";
  let customerDepartment = "";
  const billToMatch = fullText.match(
    /Buyer\s*\(?Bill\s*to\)?\s*\n([^\n]{2,80})/i,
  );
  if (billToMatch) customerName = billToMatch[1].replace(/[()]/g, "").trim();
  const deptMatch = fullText.match(
    /(?:Department|Dept\.?)[:\s]*([^\n]{2,60})/i,
  );
  if (deptMatch) customerDepartment = deptMatch[1].trim();
  if (!customerName) {
    const msMatch = fullText.match(/M\/s\.?\s+([A-Z][A-Za-z\s&\.]{2,50})/i);
    if (msMatch) customerName = msMatch[1].trim();
  }

  const phoneMatch =
    fullText.match(/(?:Ph|Phone|Mob|Mobile|Tel|Contact)[:\s]*([6-9]\d{9})/i) ||
    fullText.match(/\b([6-9]\d{9})\b/);
  const customerPhone = phoneMatch?.[1] ?? "";

  const emailMatches = fullText.match(
    /\b([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})\b/g,
  );
  const customerEmail = emailMatches?.[1] ?? "";

  // Seller address
  let sellerAddress = "";
  if (sellerGstin) {
    const beforeGstin = fullText.split(sellerGstin)[0] ?? "";
    sellerAddress = beforeGstin
      .split("\n")
      .slice(1, 5)
      .join(", ")
      .replace(/,\s*,/g, ",")
      .trim();
  }
  const addrMatch = fullText.match(
    /(?:Address|Addr\.?)[:\s]+(.{10,120}?)(?:\n\n|\bGSTIN\b|\bPhone\b|\bEmail\b|$)/is,
  );
  const customerAddress = addrMatch
    ? addrMatch[1].trim().replace(/\s+/g, " ")
    : "";

  // ── Line items ───────────────────────────────────────────────────
  // Step 1: Find table region between header and totals
  const items: OcrExtractedData["items"] = [];

  // Find table start: line containing header keywords
  let tableStartLine = -1;
  let tableEndLine = lines.length;

  for (let i = 0; i < lines.length; i++) {
    const l = lines[i].toLowerCase();
    if (
      tableStartLine === -1 &&
      /\b(description|item|product|particulars)\b/.test(l) &&
      /\b(hsn|sac|qty|quantity|rate|amount)\b/.test(l)
    ) {
      tableStartLine = i + 1; // start scanning from line after header
    }
    if (
      tableStartLine !== -1 &&
      i > tableStartLine &&
      /\b(taxable\s*value|total\s*taxable|cgst|sgst|igst|grand\s*total|sub\s*total|subtotal|round\s*off|e\s*&\s*o|authoris|declaration|bank\s*name|amount\s*chargeable)\b/.test(
        l,
      )
    ) {
      tableEndLine = i;
      break;
    }
  }

  // If no header found, try to scan entire document for item rows
  if (tableStartLine === -1) {
    tableStartLine = 0;
  }

  const tableLines = lines.slice(tableStartLine, tableEndLine);

  // Step 2: Per-line item extraction
  // Strategy: a valid item line has: a number (qty or sr.no), product text, optionally HSN
  // We look for lines with at least one number that looks like a quantity or price

  for (const line of tableLines) {
    // Skip obvious non-item lines
    if (/^\s*$/.test(line)) continue;
    if (
      /\b(total|subtotal|cgst|sgst|igst|taxable|round|discount\s*total|tax\s*amount|grand)\b/i.test(
        line,
      )
    )
      continue;
    if (
      /\b(serial|sl\.?\s*no|s\.?\s*no|sr\.?\s*no|description|hsn\s*\/\s*sac|qty|unit|rate|amount)\b/i.test(
        line,
      ) &&
      line.length < 80
    )
      continue;

    // Try full pattern: Sr No, Name, HSN, Qty, Unit, Rate, Disc%, GST%, Amount
    const fullMatch = line.match(
      /^(\d+)\s+(.{3,60}?)\s+(\d{4,8})\s+([\d,]+(?:\.\d+)?)\s*(Pcs?|KG|MTR|NOS?|EA|BOX|PKT|SET|PRS|LTR|GMS?|Unit|Nos?|Mtr?s?|Kgs?)\s+([\d,]+(?:\.\d+)?)\s*(?:([\d.]+)\s*%?)?\s*([\d.]+)\s+([\d,]+(?:\.\d+)?)/i,
    );
    if (fullMatch) {
      items.push({
        srNo: fullMatch[1],
        productName: fullMatch[2].trim(),
        hsnSac: fullMatch[3],
        qty: cleanNum(fullMatch[4]),
        unit: fullMatch[5] || "Pcs",
        rateInclTax: "",
        rate: cleanNum(fullMatch[6]),
        discountPct: fullMatch[7] ?? "0",
        gstRate: cleanNum(fullMatch[8]),
        amount: cleanNum(fullMatch[9]),
      });
      continue;
    }

    // Try pattern without unit: Sr No, Name, HSN, Qty, Rate, GST%, Amount
    const noUnitMatch = line.match(
      /^(\d+)\s+(.{3,60}?)\s+(\d{4,8})\s+([\d,]+(?:\.\d+)?)\s+([\d,]+(?:\.\d+)?)\s+([\d.]+)\s+([\d,]+(?:\.\d+)?)/i,
    );
    if (noUnitMatch) {
      items.push({
        srNo: noUnitMatch[1],
        productName: noUnitMatch[2].trim(),
        hsnSac: noUnitMatch[3],
        qty: cleanNum(noUnitMatch[4]),
        unit: "Pcs",
        rateInclTax: "",
        rate: cleanNum(noUnitMatch[5]),
        discountPct: "0",
        gstRate: cleanNum(noUnitMatch[6]),
        amount: cleanNum(noUnitMatch[7]),
      });
      continue;
    }

    // Try HSN anchor: any line with a 6-8 digit HSN-like number
    const hsnAnchor = line.match(/\b(\d{6,8})\b/);
    if (hsnAnchor) {
      const hsnCode = hsnAnchor[1];
      const hsnPos = line.indexOf(hsnCode);
      // Product name is the text before the HSN, stripped of leading number
      const namePart = line
        .substring(0, hsnPos)
        .replace(/^\d+\s*/, "")
        .trim();
      if (namePart.length < 2) continue;
      // Extract all decimal numbers from rest of line
      const restNums = [
        ...line.substring(hsnPos).matchAll(/([\d,]+(?:\.\d{1,2})?)/g),
      ]
        .map((m) => cleanNum(m[1]))
        .filter((n) => Number.parseFloat(n) > 0);
      // Try to detect qty (small number), rate (larger), amount (largest or last)
      const numVals = restNums.map((n) => Number.parseFloat(n));
      const qty =
        numVals.length > 0 ? (numVals.find((v) => v < 10000) ?? 1) : 1;
      const amount = numVals.length > 0 ? Math.max(...numVals) : 0;
      const rate =
        numVals.length > 1
          ? (numVals.find((v) => v !== qty && v !== amount) ?? amount)
          : amount;

      items.push({
        srNo: String(items.length + 1),
        productName: namePart,
        hsnSac: hsnCode,
        qty: String(qty),
        unit: "Pcs",
        rateInclTax: "",
        rate: String(rate),
        discountPct: "0",
        gstRate: "5",
        amount: String(amount),
      });
      continue;
    }

    // Last resort: numbered item line with at least product name + numbers
    const numberedLine = line.match(
      /^(\d+)\s+([A-Z][A-Za-z\s\/\-&,'.]{4,60}?)\s+([\d,]+(?:\.\d+)?)\s+([\d,]+(?:\.\d+)?)$/i,
    );
    if (numberedLine) {
      items.push({
        srNo: numberedLine[1],
        productName: numberedLine[2].trim(),
        hsnSac: "",
        qty: "1",
        unit: "Pcs",
        rateInclTax: "",
        rate: cleanNum(numberedLine[3]),
        discountPct: "0",
        gstRate: "5",
        amount: cleanNum(numberedLine[4]),
      });
    }
  }

  // Step 3: Deduplicate items by productName+hsnSac
  const seenItems = new Set<string>();
  const deduped: OcrExtractedData["items"] = [];
  for (const item of items) {
    const key = `${item.productName.toLowerCase().trim()}|${item.hsnSac}`;
    if (!seenItems.has(key)) {
      seenItems.add(key);
      deduped.push(item);
    }
  }
  const finalItems = deduped;

  // Fallback: one item with best-guess amount
  if (finalItems.length === 0) {
    const allNums = [...fullText.matchAll(/([\d,]+\.\d{2})/g)].map((m) =>
      Number.parseFloat(cleanNum(m[1])),
    );
    const maxAmt = allNums.length > 0 ? Math.max(...allNums) : 0;
    finalItems.push({
      srNo: "1",
      productName: "Item from scanned invoice",
      hsnSac: "",
      qty: "1",
      unit: "Pcs",
      rateInclTax: "",
      rate: maxAmt > 0 ? maxAmt.toString() : "0",
      discountPct: "0",
      gstRate: "5",
      amount: maxAmt > 0 ? maxAmt.toString() : "0",
    });
  }

  // ── GST rates from tax summary ───────────────────────────────────
  const cgstRateMatch = fullText.match(/CGST.*?([\d.]+)\s*%/i);
  const sgstRateMatch = fullText.match(/SGST.*?([\d.]+)\s*%/i);
  const igstRateMatch = fullText.match(/IGST.*?([\d.]+)\s*%/i);
  const cgstRate = cgstRateMatch?.[1] ?? "2.5";
  const sgstRate = sgstRateMatch?.[1] ?? "2.5";
  const igstRate = igstRateMatch?.[1] ?? "0";

  const detectedGstRate =
    igstRate !== "0"
      ? String(Number.parseFloat(igstRate))
      : String(Number.parseFloat(cgstRate) + Number.parseFloat(sgstRate));
  for (const item of finalItems) {
    if (item.gstRate === "5" || item.gstRate === "0")
      item.gstRate = detectedGstRate;
  }

  // ── Tax amounts ──────────────────────────────────────────────────
  // Use multiline approach: find "CGST" label then number on same or next line
  const cgstAmtMatch = fullText.match(/CGST[^\n]*?([\d,]+\.\d{2})/i);
  const sgstAmtMatch = fullText.match(/SGST[^\n]*?([\d,]+\.\d{2})/i);
  const igstAmtMatch = fullText.match(/IGST[^\n]*?([\d,]+\.\d{2})/i);
  const roundOffMatch = fullText.match(
    /Round\s*Off[^\n]*?([-]?\s*[\d,]+\.\d{2})/i,
  );
  const taxableMatch = fullText.match(
    /Taxable\s*(?:Value|Amount)[^₹\d]*([\d,]+\.\d{2})/i,
  );

  // Total: look for "Total" preceded by grand/invoice total context
  // Strategy: collect all labeled totals and pick the largest (most likely the grand total)
  let totalAmount = "";
  const totalPatterns = [
    /Grand\s*Total[^₹\d]*([\d,]+\.\d{2})/i,
    /Invoice\s*Total[^₹\d]*([\d,]+\.\d{2})/i,
    /Amount\s*Chargeable[^₹\d]*([\d,]+\.\d{2})/i,
    // "Total" at the end of a line followed by a number
    /\bTotal\b[^\n]*?([\d,]+\.\d{2})/i,
    // Number after Rs. near end of document
    /Rs\.?\s*([\d,]+\.\d{2})\s*(?:Only|$)/i,
  ];
  const totalCandidates: number[] = [];
  for (const pat of totalPatterns) {
    const m = fullText.match(pat);
    if (m?.[1]) {
      const v = Number.parseFloat(cleanNum(m[1]));
      if (v > 0) totalCandidates.push(v);
    }
  }
  if (totalCandidates.length > 0) {
    // Pick the largest value as grand total
    totalAmount = Math.max(...totalCandidates).toFixed(2);
  }

  // Fallback: sum items if we have them
  if (!totalAmount && items.length > 0) {
    const summedTotal = items.reduce(
      (s, it) => s + (Number.parseFloat(it.amount) || 0),
      0,
    );
    const taxFactor =
      1 + (Number.parseFloat(cgstRate) + Number.parseFloat(sgstRate)) / 100;
    totalAmount = (summedTotal * taxFactor).toFixed(2);
  }

  const amtWordsMatch = fullText.match(
    /Amount\s*Chargeable[^:]*[:\s]+\n?\s*((?:INR|Rupees)\s+.{5,150}?(?:Only|only))/i,
  );
  const taxWordsMatch = fullText.match(
    /Tax\s*Amount.*?[:\s]+\n?\s*((?:INR|Rupees)\s+.{5,150}?(?:Only|only))/i,
  );

  // ── Bank details ─────────────────────────────────────────────────
  const bankNameMatch = fullText.match(/Bank\s*Name\s*[:\-]\s*([^\n]{3,60})/i);
  const bankAccMatch = fullText.match(
    /A\/C?\s*(?:No\.?|Number)[:\-]?\s*([\d\s]{6,20})/i,
  );
  const bankIfscMatch = fullText.match(
    /(?:IFS\s*(?:Code?|C)|IFSC)[:\s]*([A-Z]{4}0[A-Z0-9]{6})/i,
  );
  const bankBranchMatch = fullText.match(
    /(?:Branch|Branch\s*&\s*IFS)[:\s]*([^\n]{3,80})/i,
  );
  const declarationMatch = fullText.match(
    /Declaration\s*\n([\s\S]{10,300}?)(?:\n\n|Authorised|$)/i,
  );

  return {
    sellerName,
    sellerGstin,
    sellerAddress,
    sellerState: sellerStateName,
    sellerStateCode,
    sellerEmail: sellerEmailMatch?.[1] ?? "",
    customerName,
    customerGstin,
    customerPhone,
    customerEmail,
    customerAddress,
    customerState: customerStateName,
    customerStateCode,
    customerDepartment,
    invoiceNumber,
    invoiceDate,
    dueDate,
    deliveryNote: deliveryNoteMatch?.[1]?.trim() ?? "",
    modeOfPayment: modeOfPaymentMatch?.[1]?.trim() ?? "",
    referenceNo: referenceMatch?.[1]?.trim() ?? "",
    buyerOrderNo: buyerOrderMatch?.[1]?.trim() ?? "",
    buyerOrderDate: buyerOrderDateMatch
      ? normaliseDate(buyerOrderDateMatch[1])
      : "",
    dispatchDocNo: dispatchDocMatch?.[1]?.trim() ?? "",
    deliveryNoteDate: deliveryNoteDateMatch?.[1]?.trim() ?? "",
    dispatchedThrough: dispatchedThroughMatch?.[1]?.trim() ?? "",
    destination: destinationMatch?.[1]?.trim() ?? "",
    termsOfDelivery: termsOfDeliveryMatch?.[1]?.trim() ?? "",
    items: finalItems,
    taxableValue: taxableMatch?.[1] ? cleanNum(taxableMatch[1]) : "",
    cgstRate,
    cgstAmount: cgstAmtMatch?.[1] ? cleanNum(cgstAmtMatch[1]) : "",
    sgstRate,
    sgstAmount: sgstAmtMatch?.[1] ? cleanNum(sgstAmtMatch[1]) : "",
    igstRate,
    igstAmount: igstAmtMatch?.[1] ? cleanNum(igstAmtMatch[1]) : "",
    roundOff: roundOffMatch?.[1] ? cleanNum(roundOffMatch[1]) : "0",
    totalAmount,
    amountInWords: amtWordsMatch?.[1]?.trim() ?? "",
    taxAmountInWords: taxWordsMatch?.[1]?.trim() ?? "",
    bankName: bankNameMatch?.[1]?.trim() ?? "",
    bankAccountNo: bankAccMatch?.[1]?.replace(/\s/g, "") ?? "",
    bankIfscCode: bankIfscMatch?.[1] ?? "",
    bankBranch: bankBranchMatch?.[1]?.trim() ?? "",
    declaration: declarationMatch?.[1]?.trim().replace(/\s+/g, " ") ?? "",
    confidence,
  };
}

// ─── Post-Processing: Normalise and clean up extracted data ────────

const VALID_GST_RATES = [0, 0.25, 1, 1.5, 3, 5, 7.5, 12, 18, 28];

function nearestGstRate(val: number): string {
  if (val <= 0) return "0";
  return String(
    VALID_GST_RATES.reduce((prev, curr) =>
      Math.abs(curr - val) < Math.abs(prev - val) ? curr : prev,
    ),
  );
}

function normaliseOcrData(data: OcrExtractedData): OcrExtractedData {
  // 1. Normalise GST rates on all items to nearest valid rate
  const items = data.items.map((it) => {
    const rateNum = Number.parseFloat(it.gstRate) || 0;
    return { ...it, gstRate: nearestGstRate(rateNum) };
  });

  // 2. Validate GSTIN format (15 alphanumeric chars)
  const gstinPattern = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;
  const sellerGstin = gstinPattern.test(data.sellerGstin)
    ? data.sellerGstin
    : data.sellerGstin
        .replace(/[^A-Z0-9]/gi, "")
        .toUpperCase()
        .slice(0, 15);
  const customerGstin = gstinPattern.test(data.customerGstin)
    ? data.customerGstin
    : data.customerGstin
        .replace(/[^A-Z0-9]/gi, "")
        .toUpperCase()
        .slice(0, 15);

  // 3. Cross-check: if items have amounts, recalculate total
  let recalcTotal = "";
  if (items.length > 0 && items[0].amount !== "0" && items[0].amount !== "") {
    const sumBase = items.reduce((s, it) => {
      const q = Number.parseFloat(it.qty) || 1;
      const r = Number.parseFloat(it.rate) || Number.parseFloat(it.amount) || 0;
      const disc = Number.parseFloat(it.discountPct) || 0;
      return s + q * r * (1 - disc / 100);
    }, 0);
    const avgGst =
      items.reduce((s, it) => s + (Number.parseFloat(it.gstRate) || 0), 0) /
      items.length;
    if (sumBase > 0) {
      recalcTotal = (sumBase * (1 + avgGst / 100)).toFixed(2);
    }
  }

  // 4. Use recalculated total only if parsed total looks wrong (0 or empty)
  const parsedTotal = Number.parseFloat(data.totalAmount) || 0;
  const recalcNum = Number.parseFloat(recalcTotal) || 0;
  const finalTotal =
    parsedTotal > 0
      ? data.totalAmount
      : recalcNum > 0
        ? recalcTotal
        : data.totalAmount;

  // 5. Clean phone number (Indian mobile: 10 digits starting 6-9)
  const phoneClean = data.customerPhone.replace(/[^0-9]/g, "");
  const customerPhone =
    phoneClean.length >= 10 ? phoneClean.slice(-10) : data.customerPhone;

  return {
    ...data,
    sellerGstin,
    customerGstin,
    customerPhone,
    totalAmount: finalTotal,
    items,
  };
}

// ─── Accuracy Meter ────────────────────────────────────────────────

function AccuracyMeter({ confidence }: { confidence: number }) {
  const isHigh = confidence >= 75;
  const isMedium = confidence >= 45 && confidence < 75;

  const color = isHigh
    ? "oklch(0.65 0.18 145)"
    : isMedium
      ? "oklch(0.75 0.18 75)"
      : "oklch(0.62 0.22 25)";

  const bgColor = isHigh
    ? "oklch(0.65 0.18 145 / 0.08)"
    : isMedium
      ? "oklch(0.75 0.18 75 / 0.08)"
      : "oklch(0.62 0.22 25 / 0.08)";

  const label = isHigh
    ? "High Confidence"
    : isMedium
      ? "Medium Confidence"
      : "Low Confidence";
  const Icon = isHigh ? CheckCircle2 : isMedium ? AlertCircle : XCircle;
  const tip = isHigh
    ? "Extraction looks accurate. Review fields and approve."
    : isMedium
      ? "Some fields may need correction. Please verify carefully."
      : "Low accuracy — manual review required. Check all fields before approving.";

  return (
    <div
      data-ocid="ocr.accuracy.meter"
      className="rounded-xl p-4 border"
      style={{
        backgroundColor: bgColor,
        borderColor: color.replace(")", " / 0.25)").replace("oklch(", "oklch("),
      }}
    >
      <div className="flex items-start gap-4">
        <div className="relative flex-shrink-0">
          <svg
            width="68"
            height="68"
            viewBox="0 0 68 68"
            role="img"
            aria-label={`OCR confidence: ${confidence}%`}
          >
            <circle
              cx="34"
              cy="34"
              r="26"
              fill="none"
              stroke="currentColor"
              strokeWidth="5"
              className="text-muted/30"
            />
            <circle
              cx="34"
              cy="34"
              r="26"
              fill="none"
              stroke={color}
              strokeWidth="5"
              strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 26}`}
              strokeDashoffset={`${2 * Math.PI * 26 * (1 - confidence / 100)}`}
              transform="rotate(-90 34 34)"
              style={{ transition: "stroke-dashoffset 1.2s ease" }}
            />
            <text
              x="34"
              y="34"
              textAnchor="middle"
              dominantBaseline="central"
              fontSize="13"
              fontWeight="700"
              fill={color}
            >
              {confidence}%
            </text>
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5">
            <Icon className="w-4 h-4 flex-shrink-0" style={{ color }} />
            <span className="font-semibold text-sm" style={{ color }}>
              OCR Accuracy: {confidence}% — {label}
            </span>
          </div>
          <Progress value={confidence} className="h-2 mb-2" />
          <p className="text-xs text-muted-foreground">{tip}</p>
        </div>
      </div>
    </div>
  );
}

function SectionHeader({
  icon: Icon,
  title,
}: { icon: React.ElementType; title: string }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <div className="w-6 h-6 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0">
        <Icon className="w-3.5 h-3.5 text-primary" />
      </div>
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
    </div>
  );
}

// ─── Image processing utilities ─────────────────────────────────────

/**
 * Preprocess image on a canvas for better OCR accuracy:
 * - Upscale small images to at least 2400px on longest side
 * - Increase contrast (helps with faded/low-contrast invoices)
 * - Convert to greyscale
 */
function preprocessImageForOcr(
  source: HTMLCanvasElement | HTMLImageElement,
): HTMLCanvasElement {
  const srcW =
    source instanceof HTMLCanvasElement ? source.width : source.naturalWidth;
  const srcH =
    source instanceof HTMLCanvasElement ? source.height : source.naturalHeight;

  const minDim = 2400;
  const scale = Math.max(1, minDim / Math.max(srcW, srcH));
  const w = Math.round(srcW * scale);
  const h = Math.round(srcH * scale);

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas;

  ctx.drawImage(source as CanvasImageSource, 0, 0, w, h);

  const imageData = ctx.getImageData(0, 0, w, h);
  const data = imageData.data;
  const contrast = 1.35;
  const intercept = 128 * (1 - contrast);
  for (let i = 0; i < data.length; i += 4) {
    const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    const adjusted = Math.min(255, Math.max(0, gray * contrast + intercept));
    data[i] = adjusted;
    data[i + 1] = adjusted;
    data[i + 2] = adjusted;
  }
  ctx.putImageData(imageData, 0, 0);
  return canvas;
}

/** Load a File (image) into a canvas element for OCR preprocessing */
function loadImageAsCanvas(file: File): Promise<HTMLCanvasElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      // Target: at least 2400px on longest side for good OCR
      const minDim = 2400;
      const srcW = img.naturalWidth;
      const srcH = img.naturalHeight;
      const scale = Math.max(1, minDim / Math.max(srcW, srcH));
      const w = Math.round(srcW * scale);
      const h = Math.round(srcH * scale);

      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        resolve(canvas);
        return;
      }

      // Draw scaled image
      ctx.drawImage(img, 0, 0, w, h);

      // Apply contrast boost for better OCR accuracy on printed text
      const imageData = ctx.getImageData(0, 0, w, h);
      const data = imageData.data;
      const contrast = 1.4; // 40% contrast boost
      const intercept = 128 * (1 - contrast);
      for (let i = 0; i < data.length; i += 4) {
        // Convert to greyscale (luminance formula)
        const gray =
          0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
        // Apply contrast
        const adjusted = Math.min(
          255,
          Math.max(0, gray * contrast + intercept),
        );
        data[i] = adjusted;
        data[i + 1] = adjusted;
        data[i + 2] = adjusted;
        // alpha stays
      }
      ctx.putImageData(imageData, 0, 0);
      resolve(canvas);
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Failed to load image"));
    };
    img.src = objectUrl;
  });
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
  const [newProducts, setNewProducts] = useState<NewProductFromScan[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [activeTab, setActiveTab] = useState<
    "seller" | "buyer" | "invoice" | "items" | "totals" | "bank"
  >("buyer");
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleReset() {
    setStep("upload");
    setScanProgress(0);
    setScanStatus("Initialising OCR engine…");
    setExtractedData(null);
    setNewProducts([]);
    setIsDragging(false);
    setActiveTab("buyer");
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setShowPreview(false);
  }

  function handleClose() {
    handleReset();
    onClose();
  }

  const processFile = useCallback(async (file: File) => {
    setStep("scanning");
    setScanProgress(5);
    setScanStatus("Loading file…");

    const url = URL.createObjectURL(file);
    setPreviewUrl(url);

    try {
      setScanStatus("Preparing image for OCR…");
      setScanProgress(10);

      // ── Render source to a preprocessed canvas ────────────────────
      let ocrCanvas: HTMLCanvasElement;

      if (file.type === "application/pdf") {
        setScanStatus("Rendering PDF page to image…");
        setScanProgress(14);
        try {
          const pdfjsLib = (await import(
            // @ts-expect-error dynamic CDN URL
            /* @vite-ignore */ "https://cdn.jsdelivr.net/npm/pdfjs-dist@4.4.168/build/pdf.mjs"
          )) as Record<string, unknown> & {
            GlobalWorkerOptions: { workerSrc: string };
            getDocument: (options: { data: ArrayBuffer }) => {
              promise: Promise<{
                getPage: (num: number) => Promise<{
                  getViewport: (opts: { scale: number }) => {
                    width: number;
                    height: number;
                  };
                  render: (opts: {
                    canvasContext: CanvasRenderingContext2D;
                    viewport: { width: number; height: number };
                  }) => { promise: Promise<void> };
                }>;
              }>;
            };
          };
          pdfjsLib.GlobalWorkerOptions.workerSrc =
            "https://cdn.jsdelivr.net/npm/pdfjs-dist@4.4.168/build/pdf.worker.mjs";
          const arrayBuffer = await file.arrayBuffer();
          const pdfDoc = await pdfjsLib.getDocument({ data: arrayBuffer })
            .promise;
          const page = await pdfDoc.getPage(1);
          const viewport = page.getViewport({ scale: 3.0 }); // High-res render
          const rawCanvas = document.createElement("canvas");
          rawCanvas.width = viewport.width;
          rawCanvas.height = viewport.height;
          const ctx = rawCanvas.getContext("2d");
          if (ctx) {
            await page.render({ canvasContext: ctx, viewport }).promise;
            ocrCanvas = preprocessImageForOcr(rawCanvas);
            rawCanvas.toBlob((blob) => {
              if (blob) {
                URL.revokeObjectURL(url);
                setPreviewUrl(URL.createObjectURL(blob));
              }
            });
          } else {
            // Fallback — load as image
            ocrCanvas = document.createElement("canvas");
          }
        } catch (pdfErr) {
          console.warn("PDF render failed, will OCR raw file:", pdfErr);
          // Create an image from the file and preprocess it
          ocrCanvas = await loadImageAsCanvas(file);
        }
      } else {
        // For images: load into canvas then preprocess
        setScanStatus("Preprocessing image for accuracy…");
        setScanProgress(14);
        ocrCanvas = await loadImageAsCanvas(file);
      }

      setScanProgress(18);
      setScanStatus("Loading OCR engine (Tesseract.js)…");

      // ── Load Tesseract.js ─────────────────────────────────────────
      // Try npm package first, fallback to CDN
      type TesseractWorker = {
        setParameters: (p: Record<string, string>) => Promise<void>;
        recognize: (src: HTMLCanvasElement) => Promise<{
          data: { text: string; words: Array<{ confidence: number }> };
        }>;
        terminate: () => Promise<void>;
      };
      type CreateWorkerFn = (
        lang: string,
        oem?: number,
        options?: Record<string, unknown>,
      ) => Promise<TesseractWorker>;

      let createWorker: CreateWorkerFn;
      try {
        const mod = (await import("tesseract.js")) as unknown as {
          createWorker: CreateWorkerFn;
        };
        createWorker = mod.createWorker;
      } catch {
        // Fallback to CDN if npm package unavailable
        const mod = (await import(
          // @ts-expect-error CDN fallback
          /* @vite-ignore */ "https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.esm.min.js"
        )) as { createWorker: CreateWorkerFn };
        createWorker = mod.createWorker;
      }

      const worker = await createWorker("eng", 1, {
        logger: (m: { status: string; progress: number }) => {
          if (m.status === "recognizing text") {
            const pct = Math.round(28 + m.progress * 55);
            setScanProgress(pct);
            setScanStatus(`Recognising text… ${Math.round(m.progress * 100)}%`);
          } else if (m.status.includes("loading tesseract")) {
            setScanStatus("Loading OCR core…");
            setScanProgress(20);
          } else if (m.status.includes("language")) {
            setScanStatus("Loading English language model…");
            setScanProgress(22);
          } else if (m.status.includes("initializing")) {
            setScanStatus("Starting OCR API…");
            setScanProgress(25);
          }
        },
      });

      // Tuned parameters for printed Indian GST invoice text
      await worker.setParameters({
        tessedit_char_whitelist: "",
        preserve_interword_spaces: "1",
        // PSM 6 = single uniform block of text — good for invoices
        tessedit_pageseg_mode: "6",
      });

      setScanStatus("Scanning invoice — this may take 20–40 seconds…");
      setScanProgress(27);

      const { data } = await worker.recognize(ocrCanvas);
      await worker.terminate();

      setScanProgress(88);
      setScanStatus("Parsing GST invoice fields…");

      const wordConf = data.words.map(
        (w: { confidence: number }) => w.confidence,
      );
      const parsed = normaliseOcrData(parseInvoiceText(data.text, wordConf));

      setScanProgress(100);
      const wordCount = data.words.length;
      setScanStatus(
        `Done! Extracted ${wordCount} words at ${parsed.confidence}% confidence. Review all fields.`,
      );
      setExtractedData(parsed);
      setTimeout(() => setStep("review"), 400);
    } catch (err) {
      console.error("OCR error:", err);
      const today = new Date().toISOString().split("T")[0];
      const fallback = parseInvoiceText(`Invoice No.\nDate: ${today}\n`, []);
      fallback.invoiceDate = today;
      fallback.confidence = 10;
      setExtractedData(fallback);
      setScanStatus(
        "OCR failed — please fill in the fields manually or try a clearer image (300 DPI+).",
      );
      setTimeout(() => setStep("review"), 2000);
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

  function updateData<K extends keyof OcrExtractedData>(
    field: K,
    value: OcrExtractedData[K],
  ) {
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
          {
            srNo: String(prev.items.length + 1),
            productName: "",
            hsnSac: "",
            qty: "1",
            unit: "Pcs",
            rateInclTax: "",
            rate: "0",
            discountPct: "0",
            gstRate: "5",
            amount: "0",
          },
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

  /** Move from review → product approval step */
  function handleReviewNext() {
    if (!extractedData) return;
    // Build list of new products from items that have HSN codes
    const prods: NewProductFromScan[] = extractedData.items
      .filter((it) => it.productName.trim() && it.hsnSac.trim())
      .map((it) => ({
        productName: it.productName.trim(),
        hsnSac: it.hsnSac.trim(),
        gstRate: it.gstRate,
        rate: it.rate || it.amount,
        unit: it.unit,
        selected: true, // selected by default
      }));
    setNewProducts(prods);
    setStep("products");
  }

  function toggleProduct(idx: number) {
    setNewProducts((prev) =>
      prev.map((p, i) => (i === idx ? { ...p, selected: !p.selected } : p)),
    );
  }

  function updateNewProduct(
    idx: number,
    field: keyof NewProductFromScan,
    value: string | boolean,
  ) {
    setNewProducts((prev) =>
      prev.map((p, i) => (i === idx ? { ...p, [field]: value } : p)),
    );
  }

  async function handleFinalApprove() {
    if (!extractedData) return;
    setIsApproving(true);
    try {
      const selectedProducts = newProducts.filter((p) => p.selected);
      await onApprove(extractedData, selectedProducts);
    } finally {
      setIsApproving(false);
    }
  }

  const TABS = [
    { key: "buyer" as const, label: "Buyer" },
    { key: "seller" as const, label: "Seller" },
    { key: "invoice" as const, label: "Header" },
    { key: "items" as const, label: "Items" },
    { key: "totals" as const, label: "Totals" },
    { key: "bank" as const, label: "Bank" },
  ];

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent
        className="sm:max-w-3xl max-h-[92vh] overflow-y-auto p-0"
        data-ocid="ocr.modal"
      >
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-border">
          <DialogTitle className="font-display text-xl flex items-center gap-2">
            <ScanLine className="w-5 h-5 text-primary" />
            Scan Tax Invoice
            <span className="ml-auto text-xs font-normal text-muted-foreground bg-primary/10 text-primary px-2 py-0.5 rounded-full">
              AI-Powered OCR
            </span>
          </DialogTitle>
        </DialogHeader>

        <div className="px-6 pb-6">
          {/* ── Step 1: Upload ── */}
          {step === "upload" && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="space-y-4 mt-5"
            >
              <p className="text-sm text-muted-foreground">
                Upload a GST tax invoice image or PDF. The OCR engine extracts
                all fields — seller, buyer, line items, HSN/SAC, GST split, bank
                details — and pre-fills the form for your review.
              </p>

              <label
                data-ocid="ocr.upload.dropzone"
                htmlFor="ocr-file-input"
                onDrop={handleDrop}
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
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
                    PDF, PNG, JPG, WebP — high resolution (300 DPI+) gives best
                    results
                  </p>
                </div>
                <div className="flex items-center gap-3 mt-2">
                  {[
                    { icon: FileText, label: "PDF", color: "text-red-500" },
                    {
                      icon: FileImage,
                      label: "PNG/JPG",
                      color: "text-blue-500",
                    },
                    { icon: FileScan, label: "WebP", color: "text-purple-500" },
                  ].map(({ icon: Icon, label, color }) => (
                    <div
                      key={label}
                      className="flex flex-col items-center gap-1"
                    >
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

              <div className="flex items-start gap-2 p-3 rounded-lg bg-info/5 border border-info/20">
                <Info className="w-4 h-4 text-info mt-0.5 flex-shrink-0" />
                <p className="text-xs text-muted-foreground">
                  OCR runs entirely in your browser — no invoice data leaves
                  your device. First scan may take 20–40 seconds to load the
                  language model.
                </p>
              </div>
            </motion.div>
          )}

          {/* ── Step 2: Scanning ── */}
          {step === "scanning" && (
            <motion.div
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col items-center gap-6 py-10 mt-2"
            >
              <div className="relative w-24 h-24">
                <div className="absolute inset-0 rounded-full border-4 border-primary/15" />
                <div
                  className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin"
                  style={{ animationDuration: "0.9s" }}
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <ScanLine className="w-9 h-9 text-primary" />
                </div>
              </div>
              <div className="text-center w-full max-w-sm">
                <p className="font-semibold text-foreground text-base mb-1">
                  Scanning invoice…
                </p>
                <p className="text-sm text-muted-foreground mb-4">
                  {scanStatus}
                </p>
                <Progress value={scanProgress} className="h-3 rounded-full" />
                <p className="text-xs text-muted-foreground mt-2 tabular-nums">
                  {scanProgress}%
                </p>
              </div>
              <p className="text-xs text-muted-foreground text-center max-w-xs">
                First run downloads the Tesseract language model (~10 MB).
                Subsequent scans are faster.
              </p>
            </motion.div>
          )}

          {/* ── Step 3: Review ── */}
          {step === "review" && extractedData && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="space-y-5 mt-5"
            >
              {/* Accuracy + preview toggle */}
              <div className="flex gap-3 items-start">
                <div className="flex-1">
                  <AccuracyMeter confidence={extractedData.confidence} />
                </div>
                {previewUrl && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    data-ocid="ocr.preview.toggle"
                    onClick={() => setShowPreview((v) => !v)}
                    className="gap-1.5 mt-1 flex-shrink-0"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    {showPreview ? "Hide" : "Preview"}
                  </Button>
                )}
              </div>

              {/* Image preview */}
              {showPreview && previewUrl && (
                <div className="rounded-xl border border-border overflow-hidden">
                  <img
                    src={previewUrl}
                    alt="Scanned invoice"
                    className="w-full max-h-80 object-contain bg-white"
                  />
                </div>
              )}

              {/* Tab navigation */}
              <div className="flex gap-1 flex-wrap border-b border-border pb-2">
                {TABS.map((tab) => (
                  <button
                    key={tab.key}
                    type="button"
                    data-ocid={`ocr.tab.${tab.key}`}
                    onClick={() => setActiveTab(tab.key)}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
                      activeTab === tab.key
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-muted",
                    )}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* ── Buyer tab ── */}
              {activeTab === "buyer" && (
                <div className="space-y-3">
                  <SectionHeader icon={Building2} title="Buyer / Bill To" />
                  <div className="grid grid-cols-2 gap-3">
                    <div className="col-span-2 space-y-1.5">
                      <Label className="text-xs">
                        Customer / Company Name *
                      </Label>
                      <Input
                        value={extractedData.customerName}
                        onChange={(e) =>
                          updateData("customerName", e.target.value)
                        }
                        placeholder="Customer name"
                        className="h-9 text-sm"
                        data-ocid="ocr.buyer.name_input"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Department / Division</Label>
                      <Input
                        value={extractedData.customerDepartment}
                        onChange={(e) =>
                          updateData("customerDepartment", e.target.value)
                        }
                        placeholder="Department"
                        className="h-9 text-sm"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">GSTIN/UIN (15 chars)</Label>
                      <Input
                        value={extractedData.customerGstin}
                        onChange={(e) =>
                          updateData("customerGstin", e.target.value)
                        }
                        placeholder="27AAIFR5286M1ZG"
                        className="h-9 text-sm font-mono"
                        maxLength={15}
                        data-ocid="ocr.buyer.gstin_input"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">State</Label>
                      <Input
                        value={extractedData.customerState}
                        onChange={(e) =>
                          updateData("customerState", e.target.value)
                        }
                        placeholder="Maharashtra"
                        className="h-9 text-sm"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">State Code</Label>
                      <Input
                        value={extractedData.customerStateCode}
                        onChange={(e) =>
                          updateData("customerStateCode", e.target.value)
                        }
                        placeholder="27"
                        className="h-9 text-sm font-mono"
                        maxLength={2}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Phone</Label>
                      <Input
                        value={extractedData.customerPhone}
                        onChange={(e) =>
                          updateData("customerPhone", e.target.value)
                        }
                        placeholder="9xxxxxxxxx"
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
                        placeholder="Full address"
                        className="h-9 text-sm"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* ── Seller tab ── */}
              {activeTab === "seller" && (
                <div className="space-y-3">
                  <SectionHeader icon={Building2} title="Seller / From" />
                  <div className="grid grid-cols-2 gap-3">
                    <div className="col-span-2 space-y-1.5">
                      <Label className="text-xs">Seller / Business Name</Label>
                      <Input
                        value={extractedData.sellerName}
                        onChange={(e) =>
                          updateData("sellerName", e.target.value)
                        }
                        placeholder="The Yarn Story"
                        className="h-9 text-sm"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">GSTIN/UIN</Label>
                      <Input
                        value={extractedData.sellerGstin}
                        onChange={(e) =>
                          updateData("sellerGstin", e.target.value)
                        }
                        placeholder="27CNPPS8883M1ZL"
                        className="h-9 text-sm font-mono"
                        maxLength={15}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Email</Label>
                      <Input
                        value={extractedData.sellerEmail}
                        onChange={(e) =>
                          updateData("sellerEmail", e.target.value)
                        }
                        placeholder="accounts@seller.com"
                        className="h-9 text-sm"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">State</Label>
                      <Input
                        value={extractedData.sellerState}
                        onChange={(e) =>
                          updateData("sellerState", e.target.value)
                        }
                        placeholder="Maharashtra"
                        className="h-9 text-sm"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">State Code</Label>
                      <Input
                        value={extractedData.sellerStateCode}
                        onChange={(e) =>
                          updateData("sellerStateCode", e.target.value)
                        }
                        placeholder="27"
                        className="h-9 text-sm font-mono"
                        maxLength={2}
                      />
                    </div>
                    <div className="col-span-2 space-y-1.5">
                      <Label className="text-xs">Address</Label>
                      <Input
                        value={extractedData.sellerAddress}
                        onChange={(e) =>
                          updateData("sellerAddress", e.target.value)
                        }
                        placeholder="Full address"
                        className="h-9 text-sm"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* ── Invoice Header tab ── */}
              {activeTab === "invoice" && (
                <div className="space-y-3">
                  <SectionHeader icon={FileText} title="Invoice Header" />
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs">Invoice Number *</Label>
                      <Input
                        value={extractedData.invoiceNumber}
                        onChange={(e) =>
                          updateData("invoiceNumber", e.target.value)
                        }
                        placeholder="TYS426/25-26"
                        className="h-9 text-sm font-mono"
                        data-ocid="ocr.invoice.number_input"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Invoice Date *</Label>
                      <Input
                        type="date"
                        value={extractedData.invoiceDate}
                        onChange={(e) =>
                          updateData("invoiceDate", e.target.value)
                        }
                        className="h-9 text-sm"
                        data-ocid="ocr.invoice.date_input"
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
                    <div className="space-y-1.5">
                      <Label className="text-xs">Mode/Terms of Payment</Label>
                      <Input
                        value={extractedData.modeOfPayment}
                        onChange={(e) =>
                          updateData("modeOfPayment", e.target.value)
                        }
                        placeholder="30 days net"
                        className="h-9 text-sm"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Delivery Note</Label>
                      <Input
                        value={extractedData.deliveryNote}
                        onChange={(e) =>
                          updateData("deliveryNote", e.target.value)
                        }
                        placeholder="Delivery note no."
                        className="h-9 text-sm"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Reference No. & Date</Label>
                      <Input
                        value={extractedData.referenceNo}
                        onChange={(e) =>
                          updateData("referenceNo", e.target.value)
                        }
                        placeholder="Reference"
                        className="h-9 text-sm"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Buyer's Order No.</Label>
                      <Input
                        value={extractedData.buyerOrderNo}
                        onChange={(e) =>
                          updateData("buyerOrderNo", e.target.value)
                        }
                        placeholder="PO number"
                        className="h-9 text-sm"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Buyer's Order Date</Label>
                      <Input
                        type="date"
                        value={extractedData.buyerOrderDate}
                        onChange={(e) =>
                          updateData("buyerOrderDate", e.target.value)
                        }
                        className="h-9 text-sm"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Dispatch Doc No.</Label>
                      <Input
                        value={extractedData.dispatchDocNo}
                        onChange={(e) =>
                          updateData("dispatchDocNo", e.target.value)
                        }
                        placeholder="Dispatch doc"
                        className="h-9 text-sm"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Delivery Note Date</Label>
                      <Input
                        value={extractedData.deliveryNoteDate}
                        onChange={(e) =>
                          updateData("deliveryNoteDate", e.target.value)
                        }
                        placeholder="Date"
                        className="h-9 text-sm"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Dispatched Through</Label>
                      <Input
                        value={extractedData.dispatchedThrough}
                        onChange={(e) =>
                          updateData("dispatchedThrough", e.target.value)
                        }
                        placeholder="Courier / Transport"
                        className="h-9 text-sm"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Destination</Label>
                      <Input
                        value={extractedData.destination}
                        onChange={(e) =>
                          updateData("destination", e.target.value)
                        }
                        placeholder="City"
                        className="h-9 text-sm"
                      />
                    </div>
                    <div className="col-span-2 space-y-1.5">
                      <Label className="text-xs">Terms of Delivery</Label>
                      <Input
                        value={extractedData.termsOfDelivery}
                        onChange={(e) =>
                          updateData("termsOfDelivery", e.target.value)
                        }
                        placeholder="e.g. FOB Mumbai"
                        className="h-9 text-sm"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* ── Line Items tab ── */}
              {activeTab === "items" && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <SectionHeader icon={FileText} title="Line Items" />
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={addItem}
                      className="h-7 gap-1 text-xs"
                      data-ocid="ocr.items.add_button"
                    >
                      <Plus className="w-3 h-3" /> Add Row
                    </Button>
                  </div>

                  <div className="space-y-2 overflow-x-auto">
                    <div className="grid grid-cols-12 gap-1.5 text-xs text-muted-foreground px-1 min-w-[600px]">
                      <span className="col-span-3">Description</span>
                      <span className="col-span-2">HSN/SAC</span>
                      <span className="col-span-1">Qty</span>
                      <span className="col-span-1">Unit</span>
                      <span className="col-span-1">Rate ₹</span>
                      <span className="col-span-1">Disc%</span>
                      <span className="col-span-1">GST%</span>
                      <span className="col-span-1">Amt ₹</span>
                      <span className="col-span-1" />
                    </div>

                    {extractedData.items.map((item, idx) => (
                      <div
                        // biome-ignore lint/suspicious/noArrayIndexKey: OCR items index is deterministic
                        key={idx}
                        className="grid grid-cols-12 gap-1.5 items-center min-w-[600px]"
                        data-ocid={`ocr.item.${idx + 1}`}
                      >
                        <div className="col-span-3">
                          <Input
                            value={item.productName}
                            onChange={(e) =>
                              updateItem(idx, "productName", e.target.value)
                            }
                            placeholder="Description"
                            className="h-8 text-xs"
                          />
                        </div>
                        <div className="col-span-2">
                          <Input
                            value={item.hsnSac}
                            onChange={(e) =>
                              updateItem(idx, "hsnSac", e.target.value)
                            }
                            placeholder="62141090"
                            className="h-8 text-xs font-mono"
                          />
                        </div>
                        <div className="col-span-1">
                          <Input
                            type="number"
                            value={item.qty}
                            onChange={(e) =>
                              updateItem(idx, "qty", e.target.value)
                            }
                            min="0"
                            step="0.001"
                            className="h-8 text-xs"
                          />
                        </div>
                        <div className="col-span-1">
                          <Input
                            value={item.unit}
                            onChange={(e) =>
                              updateItem(idx, "unit", e.target.value)
                            }
                            placeholder="Pcs"
                            className="h-8 text-xs"
                          />
                        </div>
                        <div className="col-span-1">
                          <Input
                            type="number"
                            value={item.rate}
                            onChange={(e) =>
                              updateItem(idx, "rate", e.target.value)
                            }
                            min="0"
                            step="0.01"
                            className="h-8 text-xs"
                          />
                        </div>
                        <div className="col-span-1">
                          <Input
                            type="number"
                            value={item.discountPct}
                            onChange={(e) =>
                              updateItem(idx, "discountPct", e.target.value)
                            }
                            min="0"
                            max="100"
                            step="0.01"
                            className="h-8 text-xs"
                          />
                        </div>
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
                                <SelectItem key={r} value={String(r)}>
                                  {r}%
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="col-span-1">
                          <Input
                            type="number"
                            value={item.amount}
                            onChange={(e) =>
                              updateItem(idx, "amount", e.target.value)
                            }
                            min="0"
                            step="0.01"
                            className="h-8 text-xs"
                          />
                        </div>
                        <div className="col-span-1 flex justify-center">
                          <button
                            type="button"
                            onClick={() => removeItem(idx)}
                            className="text-muted-foreground hover:text-destructive transition-colors"
                            data-ocid={`ocr.item.delete_button.${idx + 1}`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ── Totals tab ── */}
              {activeTab === "totals" && (
                <div className="space-y-3">
                  <SectionHeader icon={FileText} title="Tax Summary & Totals" />
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs">Taxable Value ₹</Label>
                      <Input
                        value={extractedData.taxableValue}
                        onChange={(e) =>
                          updateData("taxableValue", e.target.value)
                        }
                        placeholder="99200.02"
                        className="h-9 text-sm tabular-nums"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">CGST Rate %</Label>
                      <Input
                        value={extractedData.cgstRate}
                        onChange={(e) => updateData("cgstRate", e.target.value)}
                        placeholder="2.5"
                        className="h-9 text-sm"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">CGST Amount ₹</Label>
                      <Input
                        value={extractedData.cgstAmount}
                        onChange={(e) =>
                          updateData("cgstAmount", e.target.value)
                        }
                        placeholder="2480.00"
                        className="h-9 text-sm tabular-nums"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">SGST/UTGST Rate %</Label>
                      <Input
                        value={extractedData.sgstRate}
                        onChange={(e) => updateData("sgstRate", e.target.value)}
                        placeholder="2.5"
                        className="h-9 text-sm"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">SGST Amount ₹</Label>
                      <Input
                        value={extractedData.sgstAmount}
                        onChange={(e) =>
                          updateData("sgstAmount", e.target.value)
                        }
                        placeholder="2480.00"
                        className="h-9 text-sm tabular-nums"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">IGST Rate %</Label>
                      <Input
                        value={extractedData.igstRate}
                        onChange={(e) => updateData("igstRate", e.target.value)}
                        placeholder="0"
                        className="h-9 text-sm"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">IGST Amount ₹</Label>
                      <Input
                        value={extractedData.igstAmount}
                        onChange={(e) =>
                          updateData("igstAmount", e.target.value)
                        }
                        placeholder="0"
                        className="h-9 text-sm tabular-nums"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Round Off</Label>
                      <Input
                        value={extractedData.roundOff}
                        onChange={(e) => updateData("roundOff", e.target.value)}
                        placeholder="-0.02"
                        className="h-9 text-sm tabular-nums"
                      />
                    </div>
                    <div className="col-span-2 space-y-1.5">
                      <Label className="text-xs font-semibold">
                        Total Amount ₹
                      </Label>
                      <Input
                        value={extractedData.totalAmount}
                        onChange={(e) =>
                          updateData("totalAmount", e.target.value)
                        }
                        placeholder="104160.00"
                        className="h-9 text-sm font-bold tabular-nums border-primary/40"
                      />
                    </div>
                    <div className="col-span-2 space-y-1.5">
                      <Label className="text-xs">Amount in Words</Label>
                      {/* Auto-computed display */}
                      {extractedData.totalAmount &&
                        !Number.isNaN(
                          Number.parseFloat(extractedData.totalAmount),
                        ) && (
                          <div className="px-3 py-2 rounded-md bg-muted/50 border border-border text-xs text-muted-foreground font-medium">
                            {amountToWordsIN(
                              Number.parseFloat(extractedData.totalAmount),
                            )}
                          </div>
                        )}
                      <Input
                        value={extractedData.amountInWords}
                        onChange={(e) =>
                          updateData("amountInWords", e.target.value)
                        }
                        placeholder="Auto-computed above — type here to override"
                        className="h-9 text-sm"
                      />
                    </div>
                    <div className="col-span-2 space-y-1.5">
                      <Label className="text-xs">Tax Amount in Words</Label>
                      {/* Auto-computed display */}
                      {(() => {
                        const taxTotal =
                          (Number.parseFloat(extractedData.cgstAmount || "0") ||
                            0) +
                          (Number.parseFloat(extractedData.sgstAmount || "0") ||
                            0) +
                          (Number.parseFloat(extractedData.igstAmount || "0") ||
                            0);
                        return taxTotal > 0 ? (
                          <div className="px-3 py-2 rounded-md bg-muted/50 border border-border text-xs text-muted-foreground font-medium">
                            {amountToWordsIN(taxTotal)}
                          </div>
                        ) : null;
                      })()}
                      <Input
                        value={extractedData.taxAmountInWords}
                        onChange={(e) =>
                          updateData("taxAmountInWords", e.target.value)
                        }
                        placeholder="Auto-computed above — type here to override"
                        className="h-9 text-sm"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* ── Bank tab ── */}
              {activeTab === "bank" && (
                <div className="space-y-3">
                  <SectionHeader
                    icon={Building2}
                    title="Company Bank Details"
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <div className="col-span-2 space-y-1.5">
                      <Label className="text-xs">Bank Name</Label>
                      <Input
                        value={extractedData.bankName}
                        onChange={(e) => updateData("bankName", e.target.value)}
                        placeholder="Axis Bank A/c"
                        className="h-9 text-sm"
                        data-ocid="ocr.bank.name_input"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Account Number</Label>
                      <Input
                        value={extractedData.bankAccountNo}
                        onChange={(e) =>
                          updateData("bankAccountNo", e.target.value)
                        }
                        placeholder="917020014975603"
                        className="h-9 text-sm font-mono"
                        data-ocid="ocr.bank.account_input"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">IFSC Code</Label>
                      <Input
                        value={extractedData.bankIfscCode}
                        onChange={(e) =>
                          updateData("bankIfscCode", e.target.value)
                        }
                        placeholder="UTIB0000233"
                        className="h-9 text-sm font-mono uppercase"
                        data-ocid="ocr.bank.ifsc_input"
                      />
                    </div>
                    <div className="col-span-2 space-y-1.5">
                      <Label className="text-xs">Branch</Label>
                      <Input
                        value={extractedData.bankBranch}
                        onChange={(e) =>
                          updateData("bankBranch", e.target.value)
                        }
                        placeholder="New Marine Lines"
                        className="h-9 text-sm"
                      />
                    </div>
                    <div className="col-span-2 space-y-1.5">
                      <Label className="text-xs">Declaration</Label>
                      <Input
                        value={extractedData.declaration}
                        onChange={(e) =>
                          updateData("declaration", e.target.value)
                        }
                        placeholder="Declaration text"
                        className="h-9 text-sm"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* ── Actions ── */}
              <div className="flex gap-3 pt-3 border-t border-border">
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
                  data-ocid="ocr.review.next_button"
                  disabled={!extractedData.customerName.trim()}
                  onClick={handleReviewNext}
                  className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 gap-2"
                >
                  <Package className="w-4 h-4" />
                  Next: Review Products
                </Button>
              </div>
            </motion.div>
          )}

          {/* ── Step 4: Product Approval ── */}
          {step === "products" && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="space-y-5 mt-5"
            >
              <div className="flex items-start gap-3 p-4 rounded-xl bg-primary/5 border border-primary/20">
                <Package className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    Add products to your catalog
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    The following products with HSN/SAC codes were found on the
                    invoice. Select the ones you want to add to your Products
                    catalog automatically.
                  </p>
                </div>
              </div>

              {newProducts.length === 0 ? (
                <div
                  className="flex flex-col items-center gap-2 py-8 text-center"
                  data-ocid="ocr.products.empty_state"
                >
                  <Package className="w-10 h-10 text-muted-foreground/30" />
                  <p className="text-sm text-muted-foreground">
                    No new products with HSN codes found on this invoice.
                  </p>
                  <p className="text-xs text-muted-foreground">
                    You can add HSN codes on the Items tab if needed.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {/* Header row */}
                  <div className="grid grid-cols-12 gap-2 text-xs text-muted-foreground px-1">
                    <span className="col-span-1" />
                    <span className="col-span-3">Product Name</span>
                    <span className="col-span-2">HSN/SAC</span>
                    <span className="col-span-2">Rate ₹</span>
                    <span className="col-span-2">GST %</span>
                    <span className="col-span-2">Unit</span>
                  </div>
                  {newProducts.map((prod, idx) => (
                    <div
                      key={`${prod.hsnSac || idx}-${prod.productName}`}
                      className={cn(
                        "grid grid-cols-12 gap-2 items-center p-2 rounded-lg border transition-colors",
                        prod.selected
                          ? "border-primary/30 bg-primary/5"
                          : "border-border bg-muted/20 opacity-60",
                      )}
                      data-ocid={`ocr.products.item.${idx + 1}`}
                    >
                      <div className="col-span-1 flex justify-center">
                        <input
                          type="checkbox"
                          checked={prod.selected}
                          onChange={() => toggleProduct(idx)}
                          className="w-4 h-4 accent-primary cursor-pointer"
                          data-ocid={`ocr.products.checkbox.${idx + 1}`}
                        />
                      </div>
                      <div className="col-span-3">
                        <Input
                          value={prod.productName}
                          onChange={(e) =>
                            updateNewProduct(idx, "productName", e.target.value)
                          }
                          className="h-8 text-xs"
                          disabled={!prod.selected}
                        />
                      </div>
                      <div className="col-span-2">
                        <Input
                          value={prod.hsnSac}
                          onChange={(e) =>
                            updateNewProduct(idx, "hsnSac", e.target.value)
                          }
                          className="h-8 text-xs font-mono"
                          disabled={!prod.selected}
                        />
                      </div>
                      <div className="col-span-2">
                        <Input
                          type="number"
                          value={prod.rate}
                          onChange={(e) =>
                            updateNewProduct(idx, "rate", e.target.value)
                          }
                          className="h-8 text-xs"
                          min="0"
                          step="0.01"
                          disabled={!prod.selected}
                        />
                      </div>
                      <div className="col-span-2">
                        <Select
                          value={prod.gstRate}
                          onValueChange={(v) =>
                            updateNewProduct(idx, "gstRate", v)
                          }
                          disabled={!prod.selected}
                        >
                          <SelectTrigger className="h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {GST_RATES.map((r) => (
                              <SelectItem key={r} value={String(r)}>
                                {r}%
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="col-span-2">
                        <Input
                          value={prod.unit}
                          onChange={(e) =>
                            updateNewProduct(idx, "unit", e.target.value)
                          }
                          className="h-8 text-xs"
                          disabled={!prod.selected}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Summary */}
              <div className="p-3 rounded-lg bg-muted/40 border border-border text-sm space-y-1">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Invoice No.</span>
                  <span className="font-mono font-semibold text-primary">
                    {extractedData?.invoiceNumber || "(not extracted)"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Customer</span>
                  <span className="font-medium">
                    {extractedData?.customerName || "(not extracted)"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Amount</span>
                  <span className="font-bold text-primary">
                    ₹{" "}
                    {extractedData?.totalAmount
                      ? Number.parseFloat(
                          extractedData.totalAmount,
                        ).toLocaleString("en-IN", { minimumFractionDigits: 2 })
                      : "0.00"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Products to add</span>
                  <span className="font-medium">
                    {newProducts.filter((p) => p.selected).length} of{" "}
                    {newProducts.length}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-3 border-t border-border">
                <Button
                  type="button"
                  variant="outline"
                  data-ocid="ocr.products.back_button"
                  onClick={() => setStep("review")}
                  className="gap-2"
                >
                  Back
                </Button>
                <Button
                  type="button"
                  data-ocid="ocr.approve.submit_button"
                  disabled={isApproving || !extractedData?.customerName.trim()}
                  onClick={handleFinalApprove}
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
        </div>
      </DialogContent>
    </Dialog>
  );
}
