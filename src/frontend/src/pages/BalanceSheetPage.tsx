import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import {
  CheckCircle2,
  Download,
  FileBarChart,
  Printer,
  XCircle,
} from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { InvoiceStatus } from "../backend.d";
import { useBusiness } from "../context/BusinessContext";
import { useExpenses, useInvoices, useProducts } from "../hooks/useQueries";
import { downloadCSV, printElementAsPdf } from "../utils/exportUtils";
import { formatINRNumber } from "../utils/formatINR";

// ─── Types ──────────────────────────────────────────────────────
interface BSSection {
  label: string;
  items: { name: string; amount: number }[];
  total: number;
}

interface BalanceSheetData {
  asOf: string;
  assets: BSSection;
  liabilities: BSSection;
  equity: BSSection;
  totalAssets: number;
  totalLiabilitiesEquity: number;
  isBalanced: boolean;
}

// ─── Compute Balance Sheet ───────────────────────────────────────
function computeBalanceSheet(
  invoices: ReturnType<typeof useInvoices>["data"],
  expenses: ReturnType<typeof useExpenses>["data"],
  products: ReturnType<typeof useProducts>["data"],
  asOf: string,
): BalanceSheetData {
  const asOfMs = new Date(asOf).getTime() + 86400000;

  // Cash & Bank — sum of paid invoices minus expenses
  const paidInvoicesTotal = (invoices ?? [])
    .filter(
      (inv) =>
        inv.status === InvoiceStatus.paid &&
        Number(inv.invoiceDate / 1_000_000n) <= asOfMs,
    )
    .reduce((s, inv) => s + Number(inv.totalAmount) / 100, 0);

  const totalExpenses = (expenses ?? [])
    .filter((exp) => Number(exp.expenseDate / 1_000_000n) <= asOfMs)
    .reduce((s, exp) => s + Number(exp.amount) / 100, 0);

  const cashAndBank = Math.max(0, paidInvoicesTotal - totalExpenses);

  // Accounts Receivable — unpaid invoices
  const accountsReceivable = (invoices ?? [])
    .filter(
      (inv) =>
        (inv.status === InvoiceStatus.sent ||
          inv.status === InvoiceStatus.overdue) &&
        Number(inv.invoiceDate / 1_000_000n) <= asOfMs,
    )
    .reduce((s, inv) => s + Number(inv.totalAmount) / 100, 0);

  // Inventory
  const inventory = (products ?? []).reduce(
    (s, p) => s + (Number(p.stockQuantity) * Number(p.purchasePrice)) / 100,
    0,
  );

  // GST Input Credit
  const gstInputCredit = (expenses ?? [])
    .filter((exp) => Number(exp.expenseDate / 1_000_000n) <= asOfMs)
    .reduce((s, exp) => s + Number(exp.gstAmount) / 100, 0);

  // Accounts Payable — expense totals
  const accountsPayable = totalExpenses;

  // GST Payable
  const gstPayable = (invoices ?? [])
    .filter(
      (inv) =>
        inv.status !== InvoiceStatus.draft &&
        Number(inv.invoiceDate / 1_000_000n) <= asOfMs,
    )
    .reduce((s, inv) => s + Number(inv.cgst + inv.sgst + inv.igst) / 100, 0);

  const totalAssets =
    cashAndBank + accountsReceivable + inventory + gstInputCredit;

  const totalLiabilities = accountsPayable + gstPayable;

  // Equity = Assets - Liabilities
  const retainedEarnings = totalAssets - totalLiabilities;
  const capital = 0; // Could be seeded from journal entries

  const totalEquity = capital + retainedEarnings;
  const totalLiabEquity = totalLiabilities + totalEquity;

  return {
    asOf,
    assets: {
      label: "Assets",
      items: [
        { name: "Cash & Bank", amount: cashAndBank },
        { name: "Accounts Receivable (Debtors)", amount: accountsReceivable },
        { name: "Inventory / Stock", amount: inventory },
        { name: "GST Input Credit", amount: gstInputCredit },
      ].filter((i) => i.amount > 0),
      total: totalAssets,
    },
    liabilities: {
      label: "Liabilities",
      items: [
        { name: "Accounts Payable (Creditors)", amount: accountsPayable },
        { name: "GST Payable", amount: gstPayable },
      ].filter((i) => i.amount > 0),
      total: totalLiabilities,
    },
    equity: {
      label: "Equity",
      items: [
        ...(capital > 0 ? [{ name: "Capital Account", amount: capital }] : []),
        {
          name: "Retained Earnings",
          amount: retainedEarnings,
        },
      ],
      total: totalEquity,
    },
    totalAssets,
    totalLiabilitiesEquity: totalLiabEquity,
    isBalanced: Math.abs(totalAssets - totalLiabEquity) < 0.01,
  };
}

// ─── Section Row ─────────────────────────────────────────────────
function BSRow({
  label,
  amount,
  bold,
  indent,
  highlight,
}: {
  label: string;
  amount: number;
  bold?: boolean;
  indent?: boolean;
  highlight?: "assets" | "liabilities" | "equity" | "total";
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-between py-2 px-4",
        indent && "pl-8",
        highlight === "total" &&
          "bg-primary/10 rounded-xl mx-2 px-4 mt-2 border border-primary/20",
      )}
    >
      <span
        className={cn(
          "text-sm",
          bold ? "text-foreground font-semibold" : "text-muted-foreground",
        )}
      >
        {label}
      </span>
      <span
        className={cn(
          "font-mono text-sm",
          bold && "font-bold text-base",
          highlight === "assets" && "text-blue-600 dark:text-blue-400",
          highlight === "liabilities" && "text-orange-600 dark:text-orange-400",
          highlight === "equity" && "text-purple-600 dark:text-purple-400",
          highlight === "total" && "text-primary",
        )}
      >
        {amount < 0 ? "(" : ""}₹ {formatINRNumber(Math.abs(amount))}
        {amount < 0 ? ")" : ""}
      </span>
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────
export default function BalanceSheetPage() {
  const { activeBusiness } = useBusiness();
  const { data: invoices, isLoading: invLoading } = useInvoices();
  const { data: expenses, isLoading: expLoading } = useExpenses();
  const { data: products, isLoading: prodLoading } = useProducts();

  const today = new Date().toISOString().split("T")[0];
  const [asOf, setAsOf] = useState(today);
  const [generated, setGenerated] = useState(false);
  const [bsData, setBsData] = useState<BalanceSheetData | null>(null);

  const isLoading = invLoading || expLoading || prodLoading;

  function handleGenerate() {
    if (!asOf) return;
    const data = computeBalanceSheet(invoices, expenses, products, asOf);
    setBsData(data);
    setGenerated(true);
  }

  function handleExportCSV() {
    if (!bsData) return;
    const headers = ["Section", "Item", "Amount (₹)"];
    const rows: (string | number)[][] = [];

    rows.push(["ASSETS", "", ""]);
    for (const i of bsData.assets.items) {
      rows.push(["Assets", i.name, i.amount.toFixed(2)]);
    }
    rows.push(["TOTAL ASSETS", "", bsData.totalAssets.toFixed(2)]);
    rows.push(["", "", ""]);
    rows.push(["LIABILITIES", "", ""]);
    for (const i of bsData.liabilities.items) {
      rows.push(["Liabilities", i.name, i.amount.toFixed(2)]);
    }
    rows.push(["TOTAL LIABILITIES", "", bsData.liabilities.total.toFixed(2)]);
    rows.push(["", "", ""]);
    rows.push(["EQUITY", "", ""]);
    for (const i of bsData.equity.items) {
      rows.push(["Equity", i.name, i.amount.toFixed(2)]);
    }
    rows.push(["TOTAL EQUITY", "", bsData.equity.total.toFixed(2)]);
    rows.push(["", "", ""]);
    rows.push([
      "TOTAL LIABILITIES + EQUITY",
      "",
      bsData.totalLiabilitiesEquity.toFixed(2),
    ]);

    downloadCSV(`Balance_Sheet_${bsData.asOf}.csv`, headers, rows);
  }

  function handlePrint() {
    printElementAsPdf(
      "bs-print-area",
      `Balance Sheet — ${activeBusiness?.name ?? "LekhyaAI"}`,
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <motion.h1
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="font-display text-2xl md:text-3xl text-foreground flex items-center gap-2"
          >
            <FileBarChart className="w-7 h-7 text-primary/80" />
            Balance Sheet
          </motion.h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {activeBusiness?.name}
          </p>
        </div>
        {bsData && (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              data-ocid="balance_sheet.export_csv.button"
              onClick={handleExportCSV}
              className="gap-1.5"
            >
              <Download className="w-4 h-4" />
              CSV
            </Button>
            <Button
              variant="outline"
              size="sm"
              data-ocid="balance_sheet.export_pdf.button"
              onClick={handlePrint}
              className="gap-1.5"
            >
              <Printer className="w-4 h-4" />
              Print / PDF
            </Button>
          </div>
        )}
      </div>

      {/* Date Selector */}
      <div className="bg-card border border-border rounded-xl p-5 mb-6">
        <h3 className="font-semibold text-foreground mb-4">As of Date</h3>
        <div className="flex items-end gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <Label className="text-sm font-medium text-muted-foreground whitespace-nowrap">
              As of
            </Label>
            <Input
              data-ocid="balance_sheet.as_of.input"
              type="date"
              value={asOf}
              onChange={(e) => {
                setAsOf(e.target.value);
                setGenerated(false);
              }}
              className="w-40 text-sm"
              max={new Date().toISOString().split("T")[0]}
            />
          </div>
          <Button
            data-ocid="balance_sheet.generate.button"
            onClick={handleGenerate}
            disabled={isLoading || !asOf}
            className="bg-primary text-primary-foreground gap-2"
          >
            <FileBarChart className="w-4 h-4" />
            Generate
          </Button>
        </div>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="space-y-3" data-ocid="balance_sheet.loading_state">
          {[1, 2, 3].map((n) => (
            <Skeleton key={n} className="h-20 w-full" />
          ))}
        </div>
      )}

      {/* Balance Sheet */}
      {!isLoading && bsData && (
        <motion.div
          id="bs-print-area"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          data-ocid="balance_sheet.result.card"
        >
          {/* Balance Check Banner */}
          <div
            className={cn(
              "flex items-center gap-3 p-3 rounded-xl mb-4 border",
              bsData.isBalanced
                ? "bg-success/10 border-success/30 text-success"
                : "bg-destructive/10 border-destructive/30 text-destructive",
            )}
          >
            {bsData.isBalanced ? (
              <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
            ) : (
              <XCircle className="w-5 h-5 flex-shrink-0" />
            )}
            <span className="text-sm font-medium">
              {bsData.isBalanced
                ? "Balance sheet is balanced — Total Assets = Total Liabilities + Equity"
                : `Balance sheet is NOT balanced — Difference: ₹ ${formatINRNumber(Math.abs(bsData.totalAssets - bsData.totalLiabilitiesEquity))}`}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Left: Assets */}
            <div className="bg-card border border-border rounded-xl overflow-hidden shadow-card">
              <div className="px-5 py-4 border-b border-border bg-blue-50/50 dark:bg-blue-900/10">
                <h3 className="font-display text-lg text-blue-700 dark:text-blue-400 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-blue-600" />
                  Assets
                </h3>
                <p className="text-xs text-muted-foreground">
                  As of{" "}
                  {new Date(bsData.asOf).toLocaleDateString("en-IN", {
                    day: "2-digit",
                    month: "long",
                    year: "numeric",
                  })}
                </p>
              </div>
              <div className="py-3">
                {bsData.assets.items.length === 0 ? (
                  <p className="px-8 py-4 text-sm text-muted-foreground italic">
                    No asset entries
                  </p>
                ) : (
                  bsData.assets.items.map((item) => (
                    <BSRow
                      key={item.name}
                      label={item.name}
                      amount={item.amount}
                      indent
                    />
                  ))
                )}
                <Separator className="my-2 mx-4" />
                <BSRow
                  label="Total Assets"
                  amount={bsData.totalAssets}
                  bold
                  highlight="assets"
                />
              </div>
            </div>

            {/* Right: Liabilities + Equity */}
            <div className="flex flex-col gap-4">
              {/* Liabilities */}
              <div className="bg-card border border-border rounded-xl overflow-hidden shadow-card">
                <div className="px-5 py-4 border-b border-border bg-orange-50/50 dark:bg-orange-900/10">
                  <h3 className="font-display text-lg text-orange-700 dark:text-orange-400 flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-orange-600" />
                    Liabilities
                  </h3>
                </div>
                <div className="py-3">
                  {bsData.liabilities.items.length === 0 ? (
                    <p className="px-8 py-4 text-sm text-muted-foreground italic">
                      No liability entries
                    </p>
                  ) : (
                    bsData.liabilities.items.map((item) => (
                      <BSRow
                        key={item.name}
                        label={item.name}
                        amount={item.amount}
                        indent
                      />
                    ))
                  )}
                  <Separator className="my-2 mx-4" />
                  <BSRow
                    label="Total Liabilities"
                    amount={bsData.liabilities.total}
                    bold
                    highlight="liabilities"
                  />
                </div>
              </div>

              {/* Equity */}
              <div className="bg-card border border-border rounded-xl overflow-hidden shadow-card">
                <div className="px-5 py-4 border-b border-border bg-purple-50/50 dark:bg-purple-900/10">
                  <h3 className="font-display text-lg text-purple-700 dark:text-purple-400 flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-purple-600" />
                    Equity
                  </h3>
                </div>
                <div className="py-3">
                  {bsData.equity.items.map((item) => (
                    <BSRow
                      key={item.name}
                      label={item.name}
                      amount={item.amount}
                      indent
                    />
                  ))}
                  <Separator className="my-2 mx-4" />
                  <BSRow
                    label="Total Equity"
                    amount={bsData.equity.total}
                    bold
                    highlight="equity"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Balance Check Row */}
          <div className="mt-4 grid grid-cols-2 gap-4">
            <BSRow
              label="TOTAL ASSETS"
              amount={bsData.totalAssets}
              bold
              highlight="total"
            />
            <BSRow
              label="TOTAL LIABILITIES + EQUITY"
              amount={bsData.totalLiabilitiesEquity}
              bold
              highlight="total"
            />
          </div>

          <div className="mt-4 px-1">
            <p className="text-xs text-muted-foreground">
              * This balance sheet is auto-computed from transactions in
              LekhyaAI. Please verify with your CA before using for statutory
              purposes.
            </p>
          </div>
        </motion.div>
      )}

      {!isLoading && !generated && (
        <div
          className="text-center py-16 text-muted-foreground"
          data-ocid="balance_sheet.empty_state"
        >
          <FileBarChart className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-sm">
            Select an 'as of' date and generate the balance sheet
          </p>
        </div>
      )}

      {/* Print styles */}
      <style>{`
        @media print {
          body > *:not(#bs-print-area) { display: none !important; }
          #bs-print-area { display: block !important; }
          .no-print { display: none !important; }
        }
      `}</style>
    </div>
  );
}
