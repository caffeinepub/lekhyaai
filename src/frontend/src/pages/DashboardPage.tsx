import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { Link } from "@tanstack/react-router";
import {
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  Info,
  Landmark,
  Receipt,
  RefreshCw,
  TrendingDown,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useBusiness } from "../context/BusinessContext";
import { useActor } from "../hooks/useActor";
import { useDashboard } from "../hooks/useQueries";
import { useCustomers } from "../hooks/useQueries";
import { InvoiceStatus } from "../types/backend-types";
import type { ExtendedActor } from "../types/extended-actor";
import { formatDate, formatINR, formatINRNumber } from "../utils/formatINR";
import { currentFY } from "../utils/formatINR";

// ─── Cash Flow Forecast ───────────────────────────────────────────
interface ForecastPoint {
  month: string;
  inflow: number;
  outflow: number;
  isForecast: boolean;
}

function linearRegression(points: number[]): (x: number) => number {
  const n = points.length;
  if (n === 0) return () => 0;
  const xs = points.map((_, i) => i);
  const ys = points;
  const sumX = xs.reduce((a, b) => a + b, 0);
  const sumY = ys.reduce((a, b) => a + b, 0);
  const sumXY = xs.reduce((a, x, i) => a + x * (ys[i] ?? 0), 0);
  const sumXX = xs.reduce((a, x) => a + x * x, 0);
  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX || 1);
  const intercept = (sumY - slope * sumX) / n;
  return (x: number) => Math.max(0, slope * x + intercept);
}

function formatYAxis(value: number): string {
  if (value >= 100000) return `₹${(value / 100000).toFixed(1)}L`;
  if (value >= 1000) return `₹${(value / 1000).toFixed(1)}K`;
  return `₹${value}`;
}

function CashFlowForecast({ businessId }: { businessId: string }) {
  const { actor } = useActor();
  const { activeBusinessId } = useBusiness();
  const [forecastData, setForecastData] = useState<ForecastPoint[]>([]);
  const [isLoadingForecast, setIsLoadingForecast] = useState(false);
  const [nextMonthRevenue, setNextMonthRevenue] = useState(0);
  const [nextMonthExpenses, setNextMonthExpenses] = useState(0);

  // biome-ignore lint/correctness/useExhaustiveDependencies: compute on businessId change
  useEffect(() => {
    if (!actor || !activeBusinessId || !businessId) return;
    setIsLoadingForecast(true);

    async function computeForecast() {
      if (!actor || !activeBusinessId) return;
      try {
        const ext = actor as unknown as ExtendedActor;
        const [allInvoices, allExpenses] = await Promise.all([
          ext.getInvoices(activeBusinessId),
          ext.getExpenses(activeBusinessId),
        ]);

        // Group invoices (paid) and expenses by month over the last 6 months
        const now = new Date();
        const monthlyInflow: number[] = [];
        const monthlyOutflow: number[] = [];
        const monthLabels: string[] = [];

        for (let i = 5; i >= 0; i--) {
          const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
          const monthMs = d.getTime();
          const nextMonthMs = new Date(
            d.getFullYear(),
            d.getMonth() + 1,
            1,
          ).getTime();
          const monthStartNs = BigInt(monthMs) * 1_000_000n;
          const monthEndNs = BigInt(nextMonthMs) * 1_000_000n;

          const inflow = allInvoices
            .filter(
              (inv) =>
                inv.status === "paid" &&
                inv.invoiceDate >= monthStartNs &&
                inv.invoiceDate < monthEndNs,
            )
            .reduce((s, inv) => s + Number(inv.totalAmount) / 100, 0);

          const outflow = allExpenses
            .filter(
              (exp) =>
                exp.expenseDate >= monthStartNs && exp.expenseDate < monthEndNs,
            )
            .reduce((s, exp) => s + Number(exp.amount) / 100, 0);

          monthlyInflow.push(inflow);
          monthlyOutflow.push(outflow);
          monthLabels.push(
            d.toLocaleDateString("en-IN", { month: "short", year: "2-digit" }),
          );
        }

        // Linear regression for 3 future months
        const inflowFn = linearRegression(monthlyInflow);
        const outflowFn = linearRegression(monthlyOutflow);

        const chartData: ForecastPoint[] = monthLabels.map((label, i) => ({
          month: label,
          inflow: Math.round(monthlyInflow[i] ?? 0),
          outflow: Math.round(monthlyOutflow[i] ?? 0),
          isForecast: false,
        }));

        for (let i = 1; i <= 3; i++) {
          const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
          const label = d.toLocaleDateString("en-IN", {
            month: "short",
            year: "2-digit",
          });
          const projInflow = Math.round(inflowFn(monthlyInflow.length + i - 1));
          const projOutflow = Math.round(
            outflowFn(monthlyOutflow.length + i - 1),
          );
          chartData.push({
            month: label,
            inflow: projInflow,
            outflow: projOutflow,
            isForecast: true,
          });
          if (i === 1) {
            setNextMonthRevenue(projInflow);
            setNextMonthExpenses(projOutflow);
          }
        }

        setForecastData(chartData);
      } finally {
        setIsLoadingForecast(false);
      }
    }

    void computeForecast();
  }, [businessId]);

  const netCashFlow = nextMonthRevenue - nextMonthExpenses;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.32 }}
      className="bg-card rounded-xl shadow-card border border-border p-5 mb-6"
      data-ocid="dashboard.cash_flow_forecast.card"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-foreground">Cash Flow Forecast</h3>
        <span className="text-xs text-muted-foreground bg-muted/50 px-2 py-1 rounded-full">
          6 months history + 3 months projection
        </span>
      </div>

      {isLoadingForecast ? (
        <div className="space-y-2">
          <Skeleton className="h-48 w-full" />
          <div className="grid grid-cols-3 gap-3">
            {[1, 2, 3].map((n) => (
              <Skeleton key={n} className="h-16 w-full" />
            ))}
          </div>
        </div>
      ) : forecastData.length > 0 ? (
        <>
          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={forecastData}
                margin={{ top: 4, right: 4, left: 0, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="inflowGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="outflowGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="currentColor"
                  strokeOpacity={0.1}
                />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 10, fill: "currentColor", opacity: 0.5 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tickFormatter={formatYAxis}
                  tick={{ fontSize: 10, fill: "currentColor", opacity: 0.5 }}
                  axisLine={false}
                  tickLine={false}
                  width={52}
                />
                <Tooltip
                  formatter={(value: number) =>
                    `₹${value.toLocaleString("en-IN")}`
                  }
                  labelStyle={{ fontSize: 12, fontWeight: 600 }}
                  contentStyle={{
                    fontSize: 11,
                    borderRadius: 8,
                    border: "1px solid var(--border)",
                    background: "var(--card)",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="inflow"
                  name="Revenue"
                  stroke="#22c55e"
                  fill="url(#inflowGrad)"
                  strokeWidth={2}
                  dot={false}
                />
                <Area
                  type="monotone"
                  dataKey="outflow"
                  name="Expenses"
                  stroke="#ef4444"
                  fill="url(#outflowGrad)"
                  strokeWidth={2}
                  dot={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Legend */}
          <div className="flex items-center gap-4 mt-2 mb-4">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-0.5 bg-success rounded" />
              <span className="text-[10px] text-muted-foreground">Revenue</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-0.5 bg-destructive rounded" />
              <span className="text-[10px] text-muted-foreground">
                Expenses
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-0.5 border-t-2 border-dashed border-muted-foreground rounded" />
              <span className="text-[10px] text-muted-foreground">
                Projected
              </span>
            </div>
          </div>

          {/* Insight cards */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-success/10 border border-success/20 rounded-xl p-3 text-center">
              <p className="text-[10px] text-muted-foreground mb-1">
                Expected Revenue
              </p>
              <p className="text-sm font-bold text-success tabular-nums">
                ₹{nextMonthRevenue.toLocaleString("en-IN")}
              </p>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                Next month
              </p>
            </div>
            <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-3 text-center">
              <p className="text-[10px] text-muted-foreground mb-1">
                Expected Expenses
              </p>
              <p className="text-sm font-bold text-destructive tabular-nums">
                ₹{nextMonthExpenses.toLocaleString("en-IN")}
              </p>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                Next month
              </p>
            </div>
            <div
              className={cn(
                "border rounded-xl p-3 text-center",
                netCashFlow >= 0
                  ? "bg-success/10 border-success/20"
                  : "bg-destructive/10 border-destructive/20",
              )}
            >
              <p className="text-[10px] text-muted-foreground mb-1">
                Net Cash Flow
              </p>
              <p
                className={cn(
                  "text-sm font-bold tabular-nums",
                  netCashFlow >= 0 ? "text-success" : "text-destructive",
                )}
              >
                {netCashFlow >= 0 ? "+" : ""}₹
                {Math.abs(netCashFlow).toLocaleString("en-IN")}
              </p>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                Revenue − Expenses
              </p>
            </div>
          </div>

          {/* Advisory chip */}
          <div className="flex items-center gap-1.5 mt-3 text-muted-foreground">
            <Info className="w-3 h-3 flex-shrink-0" />
            <p className="text-[10px]">
              Advisory based on historical trends. Market conditions may vary.
            </p>
          </div>
        </>
      ) : (
        <div className="flex flex-col items-center gap-2 py-8 text-center">
          <TrendingUp className="w-8 h-8 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">
            Not enough data for forecast
          </p>
          <p className="text-xs text-muted-foreground/70">
            Add invoices and expenses to see cash flow predictions
          </p>
        </div>
      )}
    </motion.div>
  );
}

// ─── Bank & Petty Cash Widgets ───────────────────────────────────
function BankPettyCashWidgets({ businessId }: { businessId: string }) {
  if (!businessId) return null;

  // Read bank accounts from localStorage
  let bankAccounts: {
    id: string;
    bankName: string;
    accountNumber: string;
    openingBalance: number;
  }[] = [];
  try {
    bankAccounts = JSON.parse(
      localStorage.getItem(`lekhya_bank_accounts_${businessId}`) || "[]",
    );
  } catch {
    bankAccounts = [];
  }

  // Compute bank balances
  const bankData = bankAccounts.map((acc) => {
    let txns: { credit: number; debit: number; reconciled: boolean }[] = [];
    try {
      txns = JSON.parse(
        localStorage.getItem(`lekhya_bank_transactions_${acc.id}`) || "[]",
      );
    } catch {
      txns = [];
    }
    const balance =
      acc.openingBalance +
      txns.reduce(
        (s: number, t: { credit: number; debit: number }) =>
          s + t.credit - t.debit,
        0,
      );
    const unreconciled = txns.filter((t) => !t.reconciled).length;
    return { ...acc, balance, unreconciled };
  });

  const totalBankBalance = bankData.reduce((s, a) => s + a.balance, 0);
  const totalUnreconciled = bankData.reduce((s, a) => s + a.unreconciled, 0);

  // Read petty cash
  let pettyBalance = 0;
  try {
    const pcAcc = JSON.parse(
      localStorage.getItem(`lekhya_petty_cash_${businessId}`) || "null",
    );
    if (pcAcc) {
      const pcTxns: { amount: number; type: string }[] = JSON.parse(
        localStorage.getItem(`lekhya_petty_cash_txns_${pcAcc.id}`) || "[]",
      );
      pettyBalance =
        (pcAcc.openingBalance || 0) +
        pcTxns.reduce(
          (s: number, t: { amount: number; type: string }) =>
            s + (t.type === "Receipt" ? t.amount : -t.amount),
          0,
        );
    }
  } catch {
    pettyBalance = 0;
  }

  if (bankData.length === 0 && pettyBalance === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.28 }}
      className="bg-card rounded-xl shadow-card border border-border p-5 mb-6"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-foreground">Cash & Bank</h3>
        {totalUnreconciled > 0 && (
          <div className="flex items-center gap-1.5 text-warning text-xs font-medium">
            <AlertCircle className="w-3.5 h-3.5" />
            {totalUnreconciled} unreconciled txn
            {totalUnreconciled > 1 ? "s" : ""}
          </div>
        )}
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {bankData.map((acc) => (
          <div key={acc.id} className="bg-muted/30 rounded-lg px-3 py-2.5">
            <div className="flex items-center gap-1.5 mb-1">
              <Landmark className="w-3 h-3 text-muted-foreground/60" />
              <p className="text-[10px] text-muted-foreground truncate">
                {acc.bankName}
              </p>
            </div>
            <p
              className={cn(
                "font-mono text-sm font-bold",
                acc.balance >= 0 ? "text-foreground" : "text-destructive",
              )}
            >
              ₹ {formatINRNumber(acc.balance)}
            </p>
            {acc.unreconciled > 0 && (
              <p className="text-[10px] text-warning mt-0.5">
                {acc.unreconciled} unreconciled
              </p>
            )}
          </div>
        ))}
        {pettyBalance > 0 && (
          <div className="bg-muted/30 rounded-lg px-3 py-2.5">
            <div className="flex items-center gap-1.5 mb-1">
              <Wallet className="w-3 h-3 text-muted-foreground/60" />
              <p className="text-[10px] text-muted-foreground">Petty Cash</p>
            </div>
            <p
              className={cn(
                "font-mono text-sm font-bold",
                pettyBalance >= 500 ? "text-foreground" : "text-warning",
              )}
            >
              ₹ {formatINRNumber(pettyBalance)}
            </p>
            {pettyBalance < 500 && (
              <p className="text-[10px] text-warning mt-0.5">Low balance</p>
            )}
          </div>
        )}
        {bankData.length > 0 && (
          <div className="bg-primary/5 border border-primary/20 rounded-lg px-3 py-2.5 col-span-2 sm:col-span-1">
            <p className="text-[10px] text-muted-foreground mb-1">
              Total Bank Balance
            </p>
            <p className="font-mono text-base font-bold text-primary">
              ₹ {formatINRNumber(totalBankBalance)}
            </p>
          </div>
        )}
      </div>
    </motion.div>
  );
}

function StatusBadge({ status }: { status: InvoiceStatus }) {
  const map = {
    [InvoiceStatus.paid]: "bg-success/15 text-success border-success/20",
    [InvoiceStatus.sent]: "bg-info/15 text-info border-info/20",
    [InvoiceStatus.overdue]:
      "bg-destructive/15 text-destructive border-destructive/20",
    [InvoiceStatus.draft]: "bg-muted text-muted-foreground border-border",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border",
        map[status],
      )}
    >
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

export default function DashboardPage() {
  const { activeBusiness } = useBusiness();
  const { data, isLoading, refetch, isRefetching } = useDashboard();
  const { data: customers = [] } = useCustomers();

  const customerMap = new Map(customers.map((c) => [c.id.toString(), c.name]));

  const cards = [
    {
      title: "Total Receivables",
      value: data ? formatINR(data.totalReceivables) : null,
      icon: TrendingUp,
      color: "text-success",
      bg: "bg-success/10",
      desc: "Outstanding from customers",
    },
    {
      title: "Total Payables",
      value: data ? formatINR(data.totalPayables) : null,
      icon: TrendingDown,
      color: "text-destructive",
      bg: "bg-destructive/10",
      desc: "Owed to vendors",
    },
    {
      title: "Net GST Payable",
      value: data ? formatINR(data.netGstPayable) : null,
      icon: Receipt,
      color: "text-primary",
      bg: "bg-primary/10",
      desc: "Output GST − Input GST",
    },
    {
      title: "Overdue Invoices",
      value: data ? data.overdueInvoiceCount.toString() : null,
      icon: AlertTriangle,
      color: "text-warning",
      bg: "bg-warning/10",
      desc: "Require immediate attention",
    },
  ];

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <motion.h1
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="font-display text-2xl md:text-3xl text-foreground"
          >
            Dashboard
          </motion.h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {activeBusiness?.name} · {currentFY()}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          data-ocid="dashboard.refresh_button"
          onClick={() => refetch()}
          disabled={isRefetching}
          className="gap-2"
        >
          <RefreshCw
            className={cn("w-3.5 h-3.5", isRefetching && "animate-spin")}
          />
          Refresh
        </Button>
      </div>

      {/* Overdue Alert */}
      {data && data.overdueInvoiceCount > 0n && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-5 flex items-center gap-3 p-4 bg-destructive/10 border border-destructive/20 rounded-xl"
          data-ocid="dashboard.overdue_alert"
        >
          <AlertTriangle className="w-5 h-5 text-destructive flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-destructive">
              {data.overdueInvoiceCount.toString()} overdue invoice
              {data.overdueInvoiceCount > 1n ? "s" : ""} need attention
            </p>
          </div>
          <Link
            to="/app/invoices"
            className="text-xs text-destructive underline whitespace-nowrap"
          >
            View all →
          </Link>
        </motion.div>
      )}

      {/* Stats cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {cards.map((card, i) => (
          <motion.div
            key={card.title}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07 }}
            className="bg-card rounded-xl shadow-card border border-border p-4"
            data-ocid={`dashboard.${card.title.toLowerCase().replace(/\s/g, "_")}.card`}
          >
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-medium text-muted-foreground leading-tight">
                {card.title}
              </p>
              <div
                className={cn(
                  "w-8 h-8 rounded-lg flex items-center justify-center",
                  card.bg,
                )}
              >
                <card.icon className={cn("w-4 h-4", card.color)} />
              </div>
            </div>
            {isLoading || card.value === null ? (
              <Skeleton className="h-7 w-24 mb-1" />
            ) : (
              <p
                className={cn(
                  "text-xl font-bold font-sans tabular-nums",
                  card.color,
                )}
              >
                {card.value}
              </p>
            )}
            <p className="text-xs text-muted-foreground mt-1 truncate">
              {card.desc}
            </p>
          </motion.div>
        ))}
      </div>

      {/* GST Comparison */}
      {data && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-card rounded-xl shadow-card border border-border p-5 mb-6"
        >
          <h3 className="font-semibold text-foreground mb-4">
            This Month — GST Summary
          </h3>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-xs text-muted-foreground mb-1">Output GST</p>
              <p className="text-lg font-bold text-success tabular-nums">
                {formatINR(data.currentMonthOutputGst)}
              </p>
              <p className="text-xs text-muted-foreground">From invoices</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-muted-foreground mb-1">Input GST</p>
              <p className="text-lg font-bold text-info tabular-nums">
                {formatINR(data.currentMonthInputGst)}
              </p>
              <p className="text-xs text-muted-foreground">From expenses</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-muted-foreground mb-1">Net Payable</p>
              <p className="text-lg font-bold text-primary tabular-nums">
                {formatINR(data.netGstPayable)}
              </p>
              <p className="text-xs text-muted-foreground">Output − Input</p>
            </div>
          </div>
          {/* Visual bar */}
          <div className="mt-4 space-y-2">
            <div>
              <div className="flex justify-between text-xs text-muted-foreground mb-1">
                <span>Output GST</span>
                <span>{formatINR(data.currentMonthOutputGst)}</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-success rounded-full transition-all"
                  style={{
                    width: data.currentMonthOutputGst > 0n ? "100%" : "0%",
                  }}
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-xs text-muted-foreground mb-1">
                <span>Input GST (credit)</span>
                <span>{formatINR(data.currentMonthInputGst)}</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-info rounded-full transition-all"
                  style={{
                    width:
                      data.currentMonthOutputGst > 0n
                        ? `${Math.min(
                            100,
                            Number(
                              (data.currentMonthInputGst * 100n) /
                                (data.currentMonthOutputGst || 1n),
                            ),
                          )}%`
                        : "0%",
                  }}
                />
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Cash Flow Forecast */}
      <CashFlowForecast businessId={activeBusiness?.id.toString() ?? ""} />

      {/* Bank & Petty Cash Widgets */}
      <BankPettyCashWidgets businessId={activeBusiness?.id.toString() ?? ""} />

      {/* Recent Invoices */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
        className="bg-card rounded-xl shadow-card border border-border"
        data-ocid="dashboard.recent_invoices.table"
      >
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h3 className="font-semibold text-foreground">Recent Invoices</h3>
          <Link
            to="/app/invoices"
            data-ocid="dashboard.view_all_invoices.link"
            className="text-sm text-primary hover:underline flex items-center gap-1"
          >
            View all <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="p-5 space-y-3">
              {[1, 2, 3].map((n) => (
                <Skeleton key={n} className="h-10 w-full" />
              ))}
            </div>
          ) : !data || data.recentInvoices.length === 0 ? (
            <div
              className="flex flex-col items-center gap-2 py-10 text-center"
              data-ocid="dashboard.recent_invoices.empty_state"
            >
              <Receipt className="w-8 h-8 text-muted-foreground/50" />
              <p className="text-muted-foreground text-sm">No invoices yet</p>
              <Link to="/app/invoices">
                <Button size="sm" variant="outline" className="mt-1">
                  Create your first invoice
                </Button>
              </Link>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground">
                    Invoice #
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">
                    Customer
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
                </tr>
              </thead>
              <tbody>
                {data.recentInvoices.map((inv, idx) => (
                  <tr
                    key={inv.id.toString()}
                    className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors"
                    data-ocid={`dashboard.recent_invoices.item.${idx + 1}`}
                  >
                    <td className="px-5 py-3 font-mono text-xs text-primary font-medium">
                      {inv.invoiceNumber}
                    </td>
                    <td className="px-4 py-3 text-foreground">
                      {customerMap.get(inv.customerId.toString()) ??
                        `#${inv.customerId}`}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">
                      {formatDate(inv.invoiceDate)}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold tabular-nums">
                      {formatINR(inv.totalAmount)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <StatusBadge status={inv.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </motion.div>

      {/* Footer */}
      <p className="text-center text-xs text-muted-foreground mt-8 py-2">
        © {new Date().getFullYear()}. Built with ❤️ using{" "}
        <a
          href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
          className="underline hover:text-foreground transition-colors"
          target="_blank"
          rel="noopener noreferrer"
        >
          caffeine.ai
        </a>
      </p>
    </div>
  );
}
