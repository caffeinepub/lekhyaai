import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import {
  AlertTriangle,
  CalendarCheck,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Download,
  Info,
} from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useMemo, useState } from "react";
import { useBusiness } from "../context/BusinessContext";
import { useExpenses, useInvoices } from "../hooks/useQueries";
import { formatINRNumber } from "../utils/formatINR";

// ─── Types ─────────────────────────────────────────────────────────

interface MonthFilingData {
  gstr1Filed: boolean;
  gstr1Date: string;
  gstr3bFiled: boolean;
  gstr3bDate: string;
  gstPaid: string; // ₹ as string
  paymentDate: string;
}

type FilingStatus = "filed" | "partial" | "overdue" | "pending";

const MONTHS_ORDER = [
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
  "January",
  "February",
  "March",
];

// ─── Helpers ───────────────────────────────────────────────────────

function getFYStartYear(): number {
  const now = new Date();
  const month = now.getMonth() + 1;
  return month >= 4 ? now.getFullYear() : now.getFullYear() - 1;
}

function fyLabel(startYear: number): string {
  return `FY ${startYear}-${String(startYear + 1).slice(2)}`;
}

function getMonthYear(
  monthName: string,
  fyStartYear: number,
): { month: number; year: number } {
  const idx = MONTHS_ORDER.indexOf(monthName);
  // April (idx=0) → month=4, year=fyStartYear
  // Jan (idx=9) → month=1, year=fyStartYear+1
  const calMonth = idx < 9 ? idx + 4 : idx - 8;
  const calYear = idx < 9 ? fyStartYear : fyStartYear + 1;
  return { month: calMonth, year: calYear };
}

function isMonthPast(monthName: string, fyStartYear: number): boolean {
  const now = new Date();
  const { month, year } = getMonthYear(monthName, fyStartYear);
  const monthEnd = new Date(year, month, 0);
  return monthEnd < now;
}

function isCurrentMonth(monthName: string, fyStartYear: number): boolean {
  const now = new Date();
  const { month, year } = getMonthYear(monthName, fyStartYear);
  return now.getFullYear() === year && now.getMonth() + 1 === month;
}

function dueDate(
  type: "gstr1" | "gstr3b",
  monthName: string,
  fyStartYear: number,
): Date {
  const { month, year } = getMonthYear(monthName, fyStartYear);
  const nextMonth = month === 12 ? 1 : month + 1;
  const nextYear = month === 12 ? year + 1 : year;
  const day = type === "gstr1" ? 11 : 20;
  return new Date(nextYear, nextMonth - 1, day);
}

function daysUntil(d: Date): number {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  d.setHours(0, 0, 0, 0);
  return Math.round((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

function getFilingStatus(
  data: MonthFilingData,
  monthName: string,
  fyStartYear: number,
): FilingStatus {
  const past = isMonthPast(monthName, fyStartYear);
  const current = isCurrentMonth(monthName, fyStartYear);

  if (data.gstr1Filed && data.gstr3bFiled) return "filed";
  if (data.gstr1Filed || data.gstr3bFiled) return "partial";
  if (past || current) return "overdue";
  return "pending";
}

function formatINR(amount: number): string {
  return `₹${formatINRNumber(amount).replace("₹\u00A0", "")}`;
}

// ─── Local storage helpers ─────────────────────────────────────────

function loadFilingData(
  businessId: string,
  fy: number,
): Record<string, MonthFilingData> {
  const key = `gst_filing_${businessId}_${fy}`;
  try {
    const stored = localStorage.getItem(key);
    return stored
      ? (JSON.parse(stored) as Record<string, MonthFilingData>)
      : {};
  } catch {
    return {};
  }
}

function saveFilingData(
  businessId: string,
  fy: number,
  data: Record<string, MonthFilingData>,
) {
  const key = `gst_filing_${businessId}_${fy}`;
  localStorage.setItem(key, JSON.stringify(data));
}

function emptyMonthData(): MonthFilingData {
  return {
    gstr1Filed: false,
    gstr1Date: "",
    gstr3bFiled: false,
    gstr3bDate: "",
    gstPaid: "",
    paymentDate: "",
  };
}

// ─── Components ────────────────────────────────────────────────────

function StatusBadge({ status }: { status: FilingStatus }) {
  const map: Record<
    FilingStatus,
    { label: string; className: string; icon: React.ReactNode }
  > = {
    filed: {
      label: "Filed",
      className: "bg-green-500/10 text-green-600 border-green-500/20",
      icon: <CheckCircle2 className="w-3 h-3" />,
    },
    partial: {
      label: "Partial",
      className: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
      icon: <Clock className="w-3 h-3" />,
    },
    overdue: {
      label: "Overdue",
      className: "bg-red-500/10 text-red-600 border-red-500/20",
      icon: <AlertTriangle className="w-3 h-3" />,
    },
    pending: {
      label: "Pending",
      className: "bg-muted text-muted-foreground border-border",
      icon: <Info className="w-3 h-3" />,
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

// ─── Main Page ─────────────────────────────────────────────────────

export default function GstFilingPage() {
  const { activeBusiness, activeBusinessId } = useBusiness();
  const { data: invoices = [] } = useInvoices();
  const { data: expenses = [] } = useExpenses();

  const defaultFY = getFYStartYear();
  const [fy, setFy] = useState(defaultFY);

  const bizIdStr = activeBusinessId?.toString() ?? "";

  const [filingMap, setFilingMap] = useState<Record<string, MonthFilingData>>(
    () => (bizIdStr ? loadFilingData(bizIdStr, fy) : {}),
  );

  // Reload when business or FY changes
  useEffect(() => {
    if (bizIdStr) {
      setFilingMap(loadFilingData(bizIdStr, fy));
    }
  }, [bizIdStr, fy]);

  function updateMonth(monthName: string, update: Partial<MonthFilingData>) {
    setFilingMap((prev) => {
      const current = prev[monthName] ?? emptyMonthData();
      const updated = { ...prev, [monthName]: { ...current, ...update } };
      if (bizIdStr) saveFilingData(bizIdStr, fy, updated);
      return updated;
    });
  }

  // ── Compute GST liability per month from invoices + expenses ──────
  const monthlyGst = useMemo(() => {
    const result: Record<string, { outputGst: number; inputGst: number }> = {};
    for (const month of MONTHS_ORDER) {
      const { month: calMonth, year: calYear } = getMonthYear(month, fy);
      const monthStart = new Date(calYear, calMonth - 1, 1).getTime();
      const monthEnd = new Date(calYear, calMonth, 0, 23, 59, 59).getTime();

      let outputGst = 0;
      for (const inv of invoices) {
        const invDate = Number(inv.invoiceDate) / 1_000_000;
        if (invDate >= monthStart && invDate <= monthEnd) {
          outputGst +=
            (Number(inv.cgst) + Number(inv.sgst) + Number(inv.igst)) / 100;
        }
      }

      let inputGst = 0;
      for (const exp of expenses) {
        const expDate = Number(exp.expenseDate) / 1_000_000;
        if (expDate >= monthStart && expDate <= monthEnd) {
          inputGst += Number(exp.gstAmount) / 100;
        }
      }

      result[month] = { outputGst, inputGst };
    }
    return result;
  }, [invoices, expenses, fy]);

  // ── Summary totals ─────────────────────────────────────────────────
  const summary = useMemo(() => {
    let filed = 0;
    let partial = 0;
    let overdue = 0;
    let pending = 0;
    for (const month of MONTHS_ORDER) {
      const data = filingMap[month] ?? emptyMonthData();
      const status = getFilingStatus(data, month, fy);
      if (status === "filed") filed++;
      else if (status === "partial") partial++;
      else if (status === "overdue") overdue++;
      else pending++;
    }
    return { filed, partial, overdue, pending };
  }, [filingMap, fy]);

  // ── Due date reminders ─────────────────────────────────────────────
  const now = new Date();
  const currentMonthName = MONTHS_ORDER.find((m) => {
    const { month, year } = getMonthYear(m, fy);
    return now.getMonth() + 1 === month && now.getFullYear() === year;
  });

  // ── CSV Export ────────────────────────────────────────────────────
  function handleExport() {
    const rows = [
      [
        "Month",
        "GSTR-1 Filed",
        "GSTR-1 Date",
        "GSTR-3B Filed",
        "GSTR-3B Date",
        "GST Paid (₹)",
        "Payment Date",
        "Output GST (₹)",
        "Input GST (₹)",
        "Net Liability (₹)",
        "Status",
      ],
    ];
    for (const month of MONTHS_ORDER) {
      const d = filingMap[month] ?? emptyMonthData();
      const gst = monthlyGst[month] ?? { outputGst: 0, inputGst: 0 };
      const net = Math.max(0, gst.outputGst - gst.inputGst);
      const status = getFilingStatus(d, month, fy);
      const { year } = getMonthYear(month, fy);
      rows.push([
        `${month} ${year}`,
        d.gstr1Filed ? "Yes" : "No",
        d.gstr1Date,
        d.gstr3bFiled ? "Yes" : "No",
        d.gstr3bDate,
        d.gstPaid,
        d.paymentDate,
        gst.outputGst.toFixed(2),
        gst.inputGst.toFixed(2),
        net.toFixed(2),
        status,
      ]);
    }
    const csv = rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `gst-filing-${fyLabel(fy).replace(" ", "-")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto" data-ocid="gst_filing.page">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="font-display text-2xl md:text-3xl text-foreground flex items-center gap-2">
            <CalendarCheck className="w-7 h-7 text-primary" />
            GST Filing Calendar
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Track your GSTR-1 and GSTR-3B filing status for{" "}
            {activeBusiness?.name ?? "your business"}
          </p>
        </div>
        <Button
          variant="outline"
          data-ocid="gst_filing.export.button"
          onClick={handleExport}
          className="gap-2 self-start sm:self-center"
        >
          <Download className="w-4 h-4" />
          Export CSV
        </Button>
      </div>

      {/* FY Switcher */}
      <div className="flex items-center gap-3 mb-5">
        <button
          type="button"
          data-ocid="gst_filing.prev_fy.button"
          onClick={() => setFy((p) => p - 1)}
          className="w-8 h-8 rounded-lg border border-border flex items-center justify-center hover:bg-muted transition-colors"
          aria-label="Previous financial year"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <span className="font-semibold text-foreground text-base min-w-[100px] text-center">
          {fyLabel(fy)}
        </span>
        <button
          type="button"
          data-ocid="gst_filing.next_fy.button"
          onClick={() => setFy((p) => p + 1)}
          className="w-8 h-8 rounded-lg border border-border flex items-center justify-center hover:bg-muted transition-colors"
          aria-label="Next financial year"
          disabled={fy >= defaultFY}
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          {
            label: "Filed",
            count: summary.filed,
            color: "text-green-600",
            bg: "bg-green-500/10",
          },
          {
            label: "Partial",
            count: summary.partial,
            color: "text-yellow-600",
            bg: "bg-yellow-500/10",
          },
          {
            label: "Overdue",
            count: summary.overdue,
            color: "text-red-600",
            bg: "bg-red-500/10",
          },
          {
            label: "Pending",
            count: summary.pending,
            color: "text-muted-foreground",
            bg: "bg-muted",
          },
        ].map((s) => (
          <div
            key={s.label}
            className={cn("rounded-xl p-4 border border-border", s.bg)}
          >
            <p className={cn("text-2xl font-bold", s.color)}>{s.count}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Due date reminders */}
      {currentMonthName && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6"
        >
          {(["gstr1", "gstr3b"] as const).map((type) => {
            const due = dueDate(type, currentMonthName, fy);
            const days = daysUntil(due);
            const isOverdue = days < 0;
            return (
              <div
                key={type}
                className={cn(
                  "flex items-center gap-3 p-4 rounded-xl border",
                  isOverdue
                    ? "bg-red-500/5 border-red-500/20"
                    : days <= 5
                      ? "bg-yellow-500/5 border-yellow-500/20"
                      : "bg-primary/5 border-primary/20",
                )}
              >
                <div
                  className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0",
                    isOverdue
                      ? "bg-red-500/10"
                      : days <= 5
                        ? "bg-yellow-500/10"
                        : "bg-primary/10",
                  )}
                >
                  <CalendarCheck
                    className={cn(
                      "w-5 h-5",
                      isOverdue
                        ? "text-red-500"
                        : days <= 5
                          ? "text-yellow-500"
                          : "text-primary",
                    )}
                  />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    {type === "gstr1" ? "GSTR-1" : "GSTR-3B"} Due
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {due.toLocaleDateString("en-IN", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}{" "}
                    &mdash;{" "}
                    <span
                      className={cn(
                        "font-medium",
                        isOverdue ? "text-red-600" : "text-primary",
                      )}
                    >
                      {isOverdue
                        ? `${Math.abs(days)} days overdue`
                        : days === 0
                          ? "Due today!"
                          : `${days} days remaining`}
                    </span>
                  </p>
                </div>
              </div>
            );
          })}
        </motion.div>
      )}

      {/* Month cards grid */}
      <div
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
        data-ocid="gst_filing.months.list"
      >
        {MONTHS_ORDER.map((monthName, idx) => {
          const data = filingMap[monthName] ?? emptyMonthData();
          const status = getFilingStatus(data, monthName, fy);
          const gst = monthlyGst[monthName] ?? { outputGst: 0, inputGst: 0 };
          const netLiability = Math.max(0, gst.outputGst - gst.inputGst);
          const { year } = getMonthYear(monthName, fy);

          return (
            <motion.div
              key={monthName}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.04 }}
              data-ocid={`gst_filing.month.item.${idx + 1}`}
              className="bg-card rounded-xl border border-border p-4 shadow-sm"
            >
              {/* Month header */}
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="font-semibold text-foreground text-sm">
                    {monthName} {year}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Net GST Liability:{" "}
                    <span className="font-medium text-foreground">
                      {formatINR(netLiability)}
                    </span>
                  </p>
                </div>
                <StatusBadge status={status} />
              </div>

              {/* GST computed summary */}
              {(gst.outputGst > 0 || gst.inputGst > 0) && (
                <div className="flex gap-2 mb-3">
                  <div className="flex-1 bg-primary/5 rounded-lg p-2">
                    <p className="text-[10px] text-muted-foreground">
                      Output GST
                    </p>
                    <p className="text-xs font-semibold text-foreground">
                      {formatINR(gst.outputGst)}
                    </p>
                  </div>
                  <div className="flex-1 bg-muted/50 rounded-lg p-2">
                    <p className="text-[10px] text-muted-foreground">
                      Input Credit
                    </p>
                    <p className="text-xs font-semibold text-foreground">
                      {formatINR(gst.inputGst)}
                    </p>
                  </div>
                </div>
              )}

              <div className="space-y-3">
                {/* GSTR-1 */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-medium">GSTR-1</Label>
                    <Switch
                      data-ocid={`gst_filing.gstr1.switch.${idx + 1}`}
                      checked={data.gstr1Filed}
                      onCheckedChange={(v) =>
                        updateMonth(monthName, { gstr1Filed: v })
                      }
                      aria-label="GSTR-1 filed"
                    />
                  </div>
                  {data.gstr1Filed && (
                    <Input
                      type="date"
                      data-ocid={`gst_filing.gstr1_date.input.${idx + 1}`}
                      value={data.gstr1Date}
                      onChange={(e) =>
                        updateMonth(monthName, { gstr1Date: e.target.value })
                      }
                      className="h-7 text-xs"
                      placeholder="Filed date"
                    />
                  )}
                </div>

                {/* GSTR-3B */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-medium">GSTR-3B</Label>
                    <Switch
                      data-ocid={`gst_filing.gstr3b.switch.${idx + 1}`}
                      checked={data.gstr3bFiled}
                      onCheckedChange={(v) =>
                        updateMonth(monthName, { gstr3bFiled: v })
                      }
                      aria-label="GSTR-3B filed"
                    />
                  </div>
                  {data.gstr3bFiled && (
                    <Input
                      type="date"
                      data-ocid={`gst_filing.gstr3b_date.input.${idx + 1}`}
                      value={data.gstr3bDate}
                      onChange={(e) =>
                        updateMonth(monthName, { gstr3bDate: e.target.value })
                      }
                      className="h-7 text-xs"
                      placeholder="Filed date"
                    />
                  )}
                </div>

                {/* GST Paid */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">GST Paid (₹)</Label>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      data-ocid={`gst_filing.gst_paid.input.${idx + 1}`}
                      value={data.gstPaid}
                      onChange={(e) =>
                        updateMonth(monthName, { gstPaid: e.target.value })
                      }
                      className="h-7 text-xs"
                      placeholder="Amount"
                    />
                    <Input
                      type="date"
                      data-ocid={`gst_filing.payment_date.input.${idx + 1}`}
                      value={data.paymentDate}
                      onChange={(e) =>
                        updateMonth(monthName, { paymentDate: e.target.value })
                      }
                      className="h-7 text-xs w-auto"
                      title="Payment date"
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Footer info */}
      <div className="mt-6 p-4 rounded-xl bg-muted/30 border border-border flex items-start gap-3">
        <Info className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
        <p className="text-xs text-muted-foreground">
          <span className="font-medium text-foreground">Due dates:</span> GSTR-1
          is due on the 11th of the following month. GSTR-3B is due on the 20th.
          Output GST and Input GST are computed from your invoices and expenses
          for each month.
        </p>
      </div>
    </div>
  );
}
