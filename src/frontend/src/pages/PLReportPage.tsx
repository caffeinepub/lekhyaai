import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import {
  Download,
  FileDown,
  FileText,
  Printer,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { motion } from "motion/react";
import { useRef, useState } from "react";
import { useBusiness } from "../context/BusinessContext";
import { useExpenses, useInvoices } from "../hooks/useQueries";
import { downloadCSV } from "../utils/exportUtils";
import { formatINRNumber } from "../utils/formatINR";

// ─── Types ──────────────────────────────────────────────────────
interface PLSection {
  label: string;
  items: { name: string; amount: number }[];
  total: number;
}

interface PLData {
  from: string;
  to: string;
  revenue: PLSection;
  expenses: PLSection;
  grossProfit: number;
  netProfit: number;
}

// ─── Compute P&L ────────────────────────────────────────────────
function computePL(
  invoices: ReturnType<typeof useInvoices>["data"],
  expenses: ReturnType<typeof useExpenses>["data"],
  from: string,
  to: string,
): PLData {
  const fromMs = new Date(from).getTime();
  const toMs = new Date(to).getTime() + 86400000; // end of day

  // Revenue from paid invoices
  const periodInvoices = (invoices ?? []).filter((inv) => {
    const ms = Number(inv.invoiceDate / 1_000_000n);
    return ms >= fromMs && ms <= toMs && inv.status === "paid";
  });

  const salesRevenue = periodInvoices.reduce(
    (s, inv) => s + Number(inv.subtotal) / 100,
    0,
  );
  const otherIncome = 0; // placeholder

  // Expense categories
  const periodExpenses = (expenses ?? []).filter((exp) => {
    const ms = Number(exp.expenseDate / 1_000_000n);
    return ms >= fromMs && ms <= toMs;
  });

  const expensesByCategory = periodExpenses.reduce(
    (acc, exp) => {
      const cat = exp.category || "Miscellaneous";
      acc[cat] = (acc[cat] || 0) + Number(exp.amount) / 100;
      return acc;
    },
    {} as Record<string, number>,
  );

  const totalRevenue = salesRevenue + otherIncome;
  const totalExpenses = Object.values(expensesByCategory).reduce(
    (s, v) => s + v,
    0,
  );

  return {
    from,
    to,
    revenue: {
      label: "Revenue",
      items: [
        { name: "Sales Revenue (Net of GST)", amount: salesRevenue },
        ...(otherIncome > 0
          ? [{ name: "Other Income", amount: otherIncome }]
          : []),
      ],
      total: totalRevenue,
    },
    expenses: {
      label: "Expenses",
      items: Object.entries(expensesByCategory).map(([name, amount]) => ({
        name,
        amount,
      })),
      total: totalExpenses,
    },
    grossProfit: salesRevenue - totalExpenses,
    netProfit: totalRevenue - totalExpenses,
  };
}

// ─── P&L Section ─────────────────────────────────────────────────
function PLSectionRow({
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
  highlight?: "profit" | "loss" | "neutral";
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-between py-2 px-4",
        indent && "pl-8",
        bold && "font-semibold",
        highlight === "profit" && "bg-success/10 rounded-lg mt-1",
        highlight === "loss" && "bg-destructive/10 rounded-lg mt-1",
        highlight === "neutral" && "bg-muted/20 rounded-lg mt-1",
      )}
    >
      <span
        className={cn(
          "text-sm",
          bold ? "text-foreground" : "text-muted-foreground",
          indent && "text-sm",
        )}
      >
        {label}
      </span>
      <span
        className={cn(
          "font-mono text-sm",
          bold && "text-base font-bold",
          highlight === "profit" && "text-success",
          highlight === "loss" && "text-destructive",
          !highlight && (amount >= 0 ? "text-foreground" : "text-destructive"),
        )}
      >
        {amount < 0 ? "(" : ""}₹ {formatINRNumber(Math.abs(amount))}
        {amount < 0 ? ")" : ""}
      </span>
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────
export default function PLReportPage() {
  const { activeBusiness } = useBusiness();
  const { data: invoices, isLoading: invLoading } = useInvoices();
  const { data: expenses, isLoading: expLoading } = useExpenses();
  const printAreaRef = useRef<HTMLDivElement>(null);

  // Default: current financial year
  const now = new Date();
  const fyStart =
    now.getMonth() >= 3
      ? `${now.getFullYear()}-04-01`
      : `${now.getFullYear() - 1}-04-01`;
  const fyEnd =
    now.getMonth() >= 3
      ? `${now.getFullYear() + 1}-03-31`
      : `${now.getFullYear()}-03-31`;

  const [from, setFrom] = useState(fyStart);
  const [to, setTo] = useState(fyEnd);
  const [generated, setGenerated] = useState(false);
  const [plData, setPlData] = useState<PLData | null>(null);

  const isLoading = invLoading || expLoading;

  function handleGenerate() {
    if (!from || !to) return;
    const data = computePL(invoices, expenses, from, to);
    setPlData(data);
    setGenerated(true);
  }

  function handleExportCSV() {
    if (!plData) return;
    const headers = ["Category", "Item", "Amount (₹)"];
    const rows: (string | number)[][] = [];

    rows.push(["REVENUE", "", ""]);
    for (const item of plData.revenue.items) {
      rows.push(["Revenue", item.name, item.amount.toFixed(2)]);
    }
    rows.push(["TOTAL REVENUE", "", plData.revenue.total.toFixed(2)]);
    rows.push(["", "", ""]);
    rows.push(["EXPENSES", "", ""]);
    for (const item of plData.expenses.items) {
      rows.push(["Expense", item.name, item.amount.toFixed(2)]);
    }
    rows.push(["TOTAL EXPENSES", "", plData.expenses.total.toFixed(2)]);
    rows.push(["", "", ""]);
    rows.push(["GROSS PROFIT", "", plData.grossProfit.toFixed(2)]);
    rows.push(["NET PROFIT / LOSS", "", plData.netProfit.toFixed(2)]);

    downloadCSV(`PL_Report_${plData.from}_${plData.to}.csv`, headers, rows);
  }

  function handlePrint() {
    window.print();
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
            <FileText className="w-7 h-7 text-primary/80" />
            Profit & Loss Report
          </motion.h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {activeBusiness?.name}
          </p>
        </div>
        {plData && (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              data-ocid="pl_report.export_csv.button"
              onClick={handleExportCSV}
              className="gap-1.5"
            >
              <Download className="w-4 h-4" />
              CSV
            </Button>
            <Button
              variant="outline"
              size="sm"
              data-ocid="pl_report.export_pdf.button"
              onClick={handlePrint}
              className="gap-1.5"
            >
              <Printer className="w-4 h-4" />
              Print / PDF
            </Button>
          </div>
        )}
      </div>

      {/* Date Range Selector */}
      <div className="bg-card border border-border rounded-xl p-5 mb-6">
        <h3 className="font-semibold text-foreground mb-4">Select Period</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
          <div className="space-y-1.5">
            <Label>From</Label>
            <Input
              type="date"
              data-ocid="pl_report.from_date.input"
              value={from}
              onChange={(e) => {
                setFrom(e.target.value);
                setGenerated(false);
              }}
            />
          </div>
          <div className="space-y-1.5">
            <Label>To</Label>
            <Input
              type="date"
              data-ocid="pl_report.to_date.input"
              value={to}
              onChange={(e) => {
                setTo(e.target.value);
                setGenerated(false);
              }}
            />
          </div>
          <Button
            data-ocid="pl_report.generate.button"
            onClick={handleGenerate}
            disabled={isLoading || !from || !to}
            className="bg-primary text-primary-foreground gap-2"
          >
            <FileDown className="w-4 h-4" />
            Generate Report
          </Button>
        </div>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="space-y-3" data-ocid="pl_report.loading_state">
          {[1, 2, 3, 4].map((n) => (
            <Skeleton key={n} className="h-16 w-full" />
          ))}
        </div>
      )}

      {/* P&L Report */}
      {!isLoading && plData && (
        <motion.div
          id="pl-print-area"
          ref={printAreaRef}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card border border-border rounded-xl overflow-hidden shadow-card"
          data-ocid="pl_report.result.card"
        >
          {/* Report Header */}
          <div className="px-6 py-5 border-b border-border bg-muted/20">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="font-display text-xl text-foreground">
                  Statement of Profit & Loss
                </h2>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {activeBusiness?.name}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Period:{" "}
                  {new Date(plData.from).toLocaleDateString("en-IN", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })}{" "}
                  to{" "}
                  {new Date(plData.to).toLocaleDateString("en-IN", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Generated on</p>
                <p className="text-xs font-medium text-foreground">
                  {new Date().toLocaleDateString("en-IN", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })}
                </p>
              </div>
            </div>
          </div>

          <div className="py-4">
            {/* Revenue Section */}
            <div className="mb-2">
              <div className="flex items-center gap-2 px-4 py-2">
                <TrendingUp className="w-4 h-4 text-success" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-success">
                  Revenue
                </h4>
              </div>
              {plData.revenue.items.length === 0 ? (
                <PLSectionRow
                  label="No revenue transactions"
                  amount={0}
                  indent
                />
              ) : (
                plData.revenue.items.map((item) => (
                  <PLSectionRow
                    key={item.name}
                    label={item.name}
                    amount={item.amount}
                    indent
                  />
                ))
              )}
              <PLSectionRow
                label="Total Revenue"
                amount={plData.revenue.total}
                bold
              />
            </div>

            <Separator className="my-3 mx-4" />

            {/* Expenses Section */}
            <div className="mb-2">
              <div className="flex items-center gap-2 px-4 py-2">
                <TrendingDown className="w-4 h-4 text-destructive" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-destructive">
                  Expenses
                </h4>
              </div>
              {plData.expenses.items.length === 0 ? (
                <PLSectionRow
                  label="No expense transactions"
                  amount={0}
                  indent
                />
              ) : (
                plData.expenses.items.map((item) => (
                  <PLSectionRow
                    key={item.name}
                    label={item.name}
                    amount={item.amount}
                    indent
                  />
                ))
              )}
              <PLSectionRow
                label="Total Expenses"
                amount={plData.expenses.total}
                bold
              />
            </div>

            <Separator className="my-3 mx-4" />

            {/* Gross Profit */}
            <PLSectionRow
              label="Gross Profit"
              amount={plData.grossProfit}
              bold
              highlight={plData.grossProfit >= 0 ? "profit" : "loss"}
            />

            <Separator className="my-2 mx-4" />

            {/* Net Profit */}
            <div className="px-4 pb-4 pt-2">
              <div
                className={cn(
                  "flex items-center justify-between p-4 rounded-xl border-2",
                  plData.netProfit >= 0
                    ? "bg-success/10 border-success/30"
                    : "bg-destructive/10 border-destructive/30",
                )}
                data-ocid="pl_report.net_profit.card"
              >
                <span className="text-base font-bold text-foreground">
                  Net {plData.netProfit >= 0 ? "Profit" : "Loss"}
                </span>
                <span
                  className={cn(
                    "font-mono text-2xl font-bold",
                    plData.netProfit >= 0 ? "text-success" : "text-destructive",
                  )}
                >
                  {plData.netProfit < 0 ? "(" : ""}₹{" "}
                  {formatINRNumber(Math.abs(plData.netProfit))}
                  {plData.netProfit < 0 ? ")" : ""}
                </span>
              </div>
            </div>
          </div>

          <div className="px-6 pb-4">
            <p className="text-xs text-muted-foreground">
              * This report is based on data entered in LekhyaAI. Revenue
              reflects paid invoices only. Please verify with your CA before
              filing.
            </p>
          </div>
        </motion.div>
      )}

      {!isLoading && !generated && (
        <div
          className="text-center py-16 text-muted-foreground"
          data-ocid="pl_report.empty_state"
        >
          <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-sm">
            Select a period and generate your P&L report
          </p>
        </div>
      )}

      {/* Print styles */}
      <style>{`
        @media print {
          body > *:not(#pl-print-area) { display: none !important; }
          #pl-print-area { display: block !important; border: none !important; box-shadow: none !important; }
          .no-print { display: none !important; }
        }
      `}</style>
    </div>
  );
}
