import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { Link } from "@tanstack/react-router";
import {
  AlertTriangle,
  ArrowRight,
  Receipt,
  RefreshCw,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { motion } from "motion/react";
import { InvoiceStatus } from "../backend.d";
import { useBusiness } from "../context/BusinessContext";
import { useDashboard } from "../hooks/useQueries";
import { useCustomers } from "../hooks/useQueries";
import { formatDate, formatINR } from "../utils/formatINR";
import { currentFY } from "../utils/formatINR";

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
            to="/invoices"
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
            to="/invoices"
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
              <Link to="/invoices">
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
