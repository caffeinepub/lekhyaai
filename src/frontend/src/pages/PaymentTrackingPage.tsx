import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertTriangle,
  CheckCircle2,
  CreditCard,
  Download,
  IndianRupee,
  Loader2,
  Lock,
  RefreshCw,
  TrendingUp,
  Users,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import type { PaymentRecord } from "../backend.d";
import { useActor } from "../hooks/useActor";

// ─── Locked state ─────────────────────────────────────────────────────────────
function LockedScreen() {
  return (
    <div
      data-ocid="payment_tracking.locked.error_state"
      className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center p-6"
    >
      <div className="w-16 h-16 rounded-2xl bg-destructive/10 flex items-center justify-center">
        <Lock className="w-8 h-8 text-destructive" />
      </div>
      <h2 className="font-display text-2xl text-foreground">
        SuperUser Access Required
      </h2>
      <p className="text-muted-foreground max-w-sm">
        Payment Tracking is visible only to SuperUser / Developer accounts.
        Activate Developer Mode via{" "}
        <a
          href="/app/superuser-settings"
          className="text-primary underline underline-offset-2"
        >
          SuperUser Settings
        </a>{" "}
        using your PIN.
      </p>
      <Badge variant="destructive" className="gap-1">
        <AlertTriangle className="w-3 h-3" />
        Access Denied
      </Badge>
    </div>
  );
}

// ─── Helpers ───────────────────────────────────────────────────────────────────
function formatINR(amount: number): string {
  if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(2)}Cr`;
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(2)}L`;
  return `₹${amount.toLocaleString("en-IN")}`;
}

function formatINRFull(amount: number): string {
  return `₹${amount.toLocaleString("en-IN")}`;
}

function formatDate(timeNs: bigint): string {
  // ICP Time is nanoseconds
  const ms = Number(timeNs) / 1_000_000;
  return new Date(ms).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    completed: "bg-success/10 text-success border-success/20",
    success: "bg-success/10 text-success border-success/20",
    pending:
      "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-800",
    failed: "bg-destructive/10 text-destructive border-destructive/20",
    refunded:
      "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800",
  };
  const label = status.charAt(0).toUpperCase() + status.slice(1);
  const cls =
    styles[status.toLowerCase()] ??
    "bg-muted text-muted-foreground border-border";
  return (
    <Badge className={`text-xs font-semibold border ${cls}`}>{label}</Badge>
  );
}

// ─── Summary Card ──────────────────────────────────────────────────────────────
function SummaryCard({
  icon: Icon,
  label,
  value,
  valueClass = "",
  ocid,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  valueClass?: string;
  ocid: string;
}) {
  return (
    <Card data-ocid={ocid} className="border border-border">
      <CardHeader className="pb-2">
        <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
          <Icon className="w-3.5 h-3.5" />
          {label}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p
          className={`text-2xl font-display font-bold ${valueClass || "text-foreground"}`}
        >
          {value}
        </p>
      </CardContent>
    </Card>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function PaymentTrackingPage() {
  const devModeActive = localStorage.getItem("lekhya_superuser_active") === "1";

  const { actor, isFetching: actorFetching } = useActor();
  const [loading, setLoading] = useState(true);
  const [records, setRecords] = useState<PaymentRecord[]>([]);
  const [summary, setSummary] = useState<{
    totalRevenue: bigint;
    activeSubscriptions: bigint;
    expiringIn30Days: bigint;
    suspendedAccounts: bigint;
  } | null>(null);

  async function fetchData() {
    if (!actor || actorFetching) return;
    setLoading(true);
    try {
      const [recs, summ] = await Promise.all([
        actor.getPaymentRecords(),
        actor.getPaymentSummary(),
      ]);
      setRecords(recs);
      setSummary(summ);
    } catch (err) {
      console.error("Failed to fetch payment data", err);
      toast.error("Failed to load payment data");
    } finally {
      setLoading(false);
    }
  }

  // biome-ignore lint/correctness/useExhaustiveDependencies: fetchData is stable within render
  useEffect(() => {
    if (!devModeActive) return;
    fetchData();
  }, [devModeActive, actor, actorFetching]);

  if (!devModeActive) {
    return <LockedScreen />;
  }

  function handleExportCSV() {
    if (records.length === 0) {
      toast.info("No records to export");
      return;
    }
    const headers = [
      "Order ID",
      "Client Name",
      "Plan",
      "Amount (₹)",
      "Method",
      "Status",
      "Date",
    ];
    const rows = records.map((r) => [
      r.orderId,
      r.clientName,
      r.subscriptionPlan,
      Number(r.amountInr).toString(),
      r.paymentMethod,
      r.paymentStatus,
      formatDate(r.createdAt),
    ]);
    const csv = [headers, ...rows]
      .map((row) => row.map((cell) => `"${cell}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `lekhya_payments_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("CSV exported");
  }

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-6 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <CreditCard className="w-5 h-5 text-primary" />
            <h1 className="text-2xl font-display font-bold text-foreground">
              Payment Tracking
            </h1>
            <span className="px-2 py-0.5 bg-destructive/10 text-destructive text-xs font-bold rounded-full border border-destructive/20">
              SUPERUSER
            </span>
          </div>
          <p className="text-muted-foreground text-sm">
            All client subscription payments and revenue overview
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            data-ocid="payment_tracking.refresh.button"
            variant="outline"
            size="sm"
            onClick={fetchData}
            disabled={loading || actorFetching}
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
          </Button>
          <Button
            data-ocid="payment_tracking.export_csv.button"
            variant="outline"
            size="sm"
            onClick={handleExportCSV}
            disabled={records.length === 0}
          >
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      {loading ? (
        <div
          className="grid grid-cols-2 md:grid-cols-4 gap-4"
          data-ocid="payment_tracking.summary.loading_state"
        >
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-24 rounded-xl bg-muted/50 animate-pulse"
            />
          ))}
        </div>
      ) : summary ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <SummaryCard
            icon={IndianRupee}
            label="Total Revenue"
            value={formatINR(Number(summary.totalRevenue))}
            valueClass="text-success"
            ocid="payment_tracking.total_revenue.card"
          />
          <SummaryCard
            icon={Users}
            label="Active Subscriptions"
            value={Number(summary.activeSubscriptions).toString()}
            valueClass="text-primary"
            ocid="payment_tracking.active_subscriptions.card"
          />
          <SummaryCard
            icon={TrendingUp}
            label="Expiring in 30 Days"
            value={Number(summary.expiringIn30Days).toString()}
            valueClass="text-amber-600"
            ocid="payment_tracking.expiring.card"
          />
          <SummaryCard
            icon={AlertTriangle}
            label="Suspended Accounts"
            value={Number(summary.suspendedAccounts).toString()}
            valueClass="text-destructive"
            ocid="payment_tracking.suspended.card"
          />
        </div>
      ) : null}

      {/* Records Table */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-primary" />
            Payment Records
            {records.length > 0 && (
              <span className="text-xs text-muted-foreground font-normal">
                ({records.length} total)
              </span>
            )}
          </h2>
        </div>

        {loading ? (
          <div
            className="py-16 flex flex-col items-center gap-3"
            data-ocid="payment_tracking.records.loading_state"
          >
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">
              Loading payment records…
            </p>
          </div>
        ) : records.length === 0 ? (
          <div
            className="py-16 flex flex-col items-center gap-3 text-center"
            data-ocid="payment_tracking.records.empty_state"
          >
            <CreditCard className="w-10 h-10 text-muted-foreground/30" />
            <p className="text-muted-foreground text-sm">
              No payment records yet. Records will appear here once clients
              subscribe.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table data-ocid="payment_tracking.records.table">
              <TableHeader>
                <TableRow>
                  <TableHead>Order ID</TableHead>
                  <TableHead>Client Name</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {records.map((rec, idx) => (
                  <TableRow
                    key={rec.id.toString()}
                    data-ocid={`payment_tracking.record.item.${idx + 1}`}
                  >
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {rec.orderId}
                    </TableCell>
                    <TableCell className="font-medium text-foreground">
                      {rec.clientName}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs capitalize">
                        {rec.subscriptionPlan}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-mono font-semibold text-foreground">
                      {formatINRFull(Number(rec.amountInr))}
                    </TableCell>
                    <TableCell className="capitalize text-sm text-muted-foreground">
                      {rec.paymentMethod}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={rec.paymentStatus} />
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(rec.createdAt)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* Footer */}
      <p className="text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()}. Built with love using{" "}
        <a
          href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(typeof window !== "undefined" ? window.location.hostname : "")}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary hover:underline"
        >
          caffeine.ai
        </a>
      </p>
    </div>
  );
}
