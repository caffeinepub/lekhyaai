import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
  Lock,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  UserX,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  Cell,
  Legend,
  Pie,
  PieChart,
  Tooltip as RechartTooltip,
  ResponsiveContainer,
} from "recharts";
import { toast } from "sonner";
import {
  type ActivityLogEntry,
  type AnomalyFlag,
  blockUser,
  getFlaggedUsers,
  isUserBlocked,
} from "../utils/securityMonitor";

// ─── Locked state ───────────────────────────────────────────────────────────

function LockedScreen() {
  return (
    <div
      data-ocid="security.locked.error_state"
      className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center p-6"
    >
      <div className="w-16 h-16 rounded-2xl bg-destructive/10 flex items-center justify-center">
        <Lock className="w-8 h-8 text-destructive" />
      </div>
      <h2 className="font-display text-2xl text-foreground">
        SuperUser Access Required
      </h2>
      <p className="text-muted-foreground max-w-sm">
        The Security Monitor is visible only to SuperUser / Developer accounts.
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

// ─── Risk badge ─────────────────────────────────────────────────────────────

function RiskBadge({ level }: { level: "Low" | "Medium" | "High" }) {
  const styles = {
    Low: "bg-blue-100 text-blue-700 border border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800",
    Medium:
      "bg-amber-100 text-amber-700 border border-amber-200 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-800",
    High: "bg-destructive/15 text-destructive border border-destructive/30",
  };
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ${styles[level]}`}
    >
      <AlertTriangle className="w-3 h-3" />
      {level}
    </span>
  );
}

// ─── Stat card ──────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  variant = "default",
}: {
  label: string;
  value: number;
  variant?: "default" | "high" | "medium" | "low";
}) {
  const colors = {
    default: "bg-card border-border",
    high: "bg-destructive/5 border-destructive/20",
    medium:
      "bg-amber-50 border-amber-200 dark:bg-amber-950/20 dark:border-amber-800",
    low: "bg-blue-50 border-blue-200 dark:bg-blue-950/20 dark:border-blue-800",
  };
  const textColors = {
    default: "text-foreground",
    high: "text-destructive",
    medium: "text-amber-700 dark:text-amber-300",
    low: "text-blue-700 dark:text-blue-300",
  };

  return (
    <div className={`rounded-xl border p-4 ${colors[variant]}`}>
      <p className={`text-2xl font-bold ${textColors[variant]}`}>{value}</p>
      <p className="text-xs text-muted-foreground mt-1">{label}</p>
    </div>
  );
}

// ─── Risk Pie Chart ─────────────────────────────────────────────────────────

const PIE_COLORS = {
  High: "#ef4444",
  Medium: "#f59e0b",
  Low: "#3b82f6",
};

function RiskPieChart({ flags }: { flags: AnomalyFlag[] }) {
  const data = useMemo(() => {
    const counts = { High: 0, Medium: 0, Low: 0 };
    for (const f of flags) counts[f.riskLevel]++;
    return Object.entries(counts)
      .filter(([, v]) => v > 0)
      .map(([name, value]) => ({ name, value }));
  }, [flags]);

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-36 text-muted-foreground text-sm">
        No anomalies to chart
      </div>
    );
  }

  return (
    <div className="w-full h-44" data-ocid="security.risk.chart_point">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={44}
            outerRadius={68}
            paddingAngle={3}
            dataKey="value"
          >
            {data.map((entry) => (
              <Cell
                key={entry.name}
                fill={PIE_COLORS[entry.name as keyof typeof PIE_COLORS]}
              />
            ))}
          </Pie>
          <RechartTooltip
            contentStyle={{
              fontSize: 12,
              borderRadius: 8,
              border: "1px solid var(--border)",
              background: "var(--card)",
              color: "var(--foreground)",
            }}
          />
          <Legend
            wrapperStyle={{ fontSize: 11 }}
            iconType="circle"
            iconSize={8}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

// ─── Main Page ──────────────────────────────────────────────────────────────

const LS_KEY = "lekhya_activity_log";

function loadLogs(): ActivityLogEntry[] {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as ActivityLogEntry[];
      if (parsed.length > 0) return parsed;
    }
  } catch {
    // ignore
  }
  return [];
}

export default function SecurityMonitorPage() {
  const isDeveloperMode =
    typeof localStorage !== "undefined" &&
    localStorage.getItem("lekhya_superuser_active") === "1";

  const [flags, setFlags] = useState<AnomalyFlag[]>([]);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [blocked, setBlocked] = useState<Set<string>>(new Set());
  const [scanning, setScanning] = useState(false);
  const [lastScanned, setLastScanned] = useState<Date | null>(null);

  function runScan() {
    setScanning(true);
    // Run asynchronously to allow spinner to render
    setTimeout(() => {
      const logs = loadLogs();
      const detected = getFlaggedUsers(logs);
      setFlags(detected);
      setLastScanned(new Date());
      setScanning(false);
    }, 600);
  }

  // Initial scan on mount — intentionally only runs once
  // biome-ignore lint/correctness/useExhaustiveDependencies: runScan is stable; re-running on every render would cause infinite loops
  useEffect(() => {
    if (!isDeveloperMode) return;
    runScan();
  }, [isDeveloperMode]);

  if (!isDeveloperMode) {
    return <LockedScreen />;
  }

  const visibleFlags = flags.filter((f) => !dismissed.has(f.id));

  const highCount = visibleFlags.filter((f) => f.riskLevel === "High").length;
  const mediumCount = visibleFlags.filter(
    (f) => f.riskLevel === "Medium",
  ).length;
  const lowCount = visibleFlags.filter((f) => f.riskLevel === "Low").length;

  function handleDismiss(flagId: string) {
    setDismissed((prev) => new Set([...prev, flagId]));
    toast.success("Flag dismissed");
  }

  function handleBlock(flag: AnomalyFlag) {
    blockUser(flag.userId);
    setBlocked((prev) => new Set([...prev, flag.userId]));
    setDismissed((prev) => new Set([...prev, flag.id]));
    toast.warning(`User ${flag.userName} has been flagged and blocked`, {
      icon: <UserX className="w-4 h-4 text-destructive" />,
    });
  }

  return (
    <div data-ocid="security.page" className="p-4 md:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-destructive/10 flex items-center justify-center flex-shrink-0">
            <ShieldAlert className="w-5 h-5 text-destructive" />
          </div>
          <div>
            <h1 className="font-display text-2xl md:text-3xl text-foreground">
              Security Monitor
            </h1>
            <p className="text-muted-foreground text-sm mt-0.5">
              AI-powered anomaly detection — SuperUser Only
            </p>
            {lastScanned && (
              <p className="text-[11px] text-muted-foreground mt-1">
                Last scan:{" "}
                {lastScanned.toLocaleString("en-IN", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            )}
          </div>
        </div>
        <Button
          data-ocid="security.rescan.button"
          variant="outline"
          onClick={runScan}
          disabled={scanning}
          className="gap-2 flex-shrink-0"
        >
          <RefreshCw className={`w-4 h-4 ${scanning ? "animate-spin" : ""}`} />
          {scanning ? "Scanning…" : "Re-Scan"}
        </Button>
      </div>

      {/* Summary Stats + Pie */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard
          label="Total Anomalies"
          value={visibleFlags.length}
          variant="default"
        />
        <StatCard label="High Risk" value={highCount} variant="high" />
        <StatCard label="Medium Risk" value={mediumCount} variant="medium" />
        <StatCard label="Low Risk" value={lowCount} variant="low" />
      </div>

      {/* Chart + Empty state side by side */}
      {visibleFlags.length > 0 && (
        <div className="grid md:grid-cols-3 gap-4 mb-6">
          <div className="md:col-span-1 rounded-xl border border-border bg-card p-4">
            <h2 className="font-semibold text-sm text-foreground mb-3">
              Risk Distribution
            </h2>
            <RiskPieChart flags={visibleFlags} />
          </div>

          <div className="md:col-span-2 rounded-xl border border-destructive/20 bg-destructive/5 p-4 flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-destructive text-sm mb-1">
                {visibleFlags.length} anomal
                {visibleFlags.length === 1 ? "y" : "ies"} detected
              </p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Review and take action on flagged users below. Block suspicious
                users to revoke their access immediately. All actions are
                logged.
              </p>
              {highCount > 0 && (
                <p className="mt-2 text-xs font-semibold text-destructive">
                  ⚠ {highCount} HIGH risk flag{highCount > 1 ? "s" : ""} require
                  immediate attention.
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Flagged Users Table */}
      <div className="rounded-xl border border-border overflow-hidden">
        <div className="px-4 py-3 bg-muted/30 border-b border-border flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-muted-foreground" />
          <h2 className="font-semibold text-sm text-foreground">
            Flagged Users
          </h2>
          {visibleFlags.length > 0 && (
            <Badge variant="destructive" className="ml-auto text-xs">
              {visibleFlags.length} flag
              {visibleFlags.length !== 1 ? "s" : ""}
            </Badge>
          )}
        </div>

        <Table data-ocid="security.flags.table">
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Anomaly Type</TableHead>
              <TableHead>Detected At</TableHead>
              <TableHead>Details</TableHead>
              <TableHead>Risk Level</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {scanning ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="text-center py-12"
                  data-ocid="security.flags.loading_state"
                >
                  <div className="flex items-center justify-center gap-2 text-muted-foreground">
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span className="text-sm">Scanning activity logs…</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : visibleFlags.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="text-center py-16"
                  data-ocid="security.flags.empty_state"
                >
                  <div className="flex flex-col items-center gap-3 text-muted-foreground">
                    <ShieldCheck className="w-12 h-12 opacity-30" />
                    <div>
                      <p className="font-medium text-sm">
                        No anomalies detected
                      </p>
                      <p className="text-xs mt-0.5">
                        All user activity looks normal. Run a re-scan to check
                        again.
                      </p>
                    </div>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              visibleFlags.map((flag, i) => {
                const isBlocked = blocked.has(flag.userId);
                return (
                  <TableRow
                    key={flag.id}
                    data-ocid={`security.flags.item.${i + 1}`}
                    className={
                      flag.riskLevel === "High"
                        ? "bg-destructive/5 hover:bg-destructive/10"
                        : flag.riskLevel === "Medium"
                          ? "bg-amber-50/50 hover:bg-amber-50 dark:bg-amber-950/10 dark:hover:bg-amber-950/20"
                          : ""
                    }
                  >
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-primary/15 flex items-center justify-center flex-shrink-0">
                          <span className="text-[9px] font-bold text-primary">
                            {flag.userName
                              .split(" ")
                              .map((n) => n[0])
                              .join("")
                              .slice(0, 2)}
                          </span>
                        </div>
                        <div>
                          <span className="text-sm font-medium">
                            {flag.userName}
                          </span>
                          <p className="text-[10px] text-muted-foreground font-mono">
                            {flag.userId}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">{flag.anomalyType}</span>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                      {new Date(flag.timestamp).toLocaleString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground max-w-[200px]">
                      {flag.details}
                    </TableCell>
                    <TableCell>
                      <RiskBadge level={flag.riskLevel} />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        {!isBlocked && (
                          <Button
                            size="sm"
                            variant="destructive"
                            data-ocid={`security.block_user.button.${i + 1}`}
                            onClick={() => handleBlock(flag)}
                            className="gap-1 text-xs h-7 px-2"
                          >
                            <UserX className="w-3 h-3" />
                            Block
                          </Button>
                        )}
                        {isBlocked && (
                          <Badge
                            variant="destructive"
                            className="text-xs font-semibold"
                          >
                            Blocked
                          </Badge>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          data-ocid={`security.dismiss.button.${i + 1}`}
                          onClick={() => handleDismiss(flag.id)}
                          className="gap-1 text-xs h-7 px-2"
                        >
                          <X className="w-3 h-3" />
                          Dismiss
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Legend */}
      <div className="mt-4 flex flex-wrap gap-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <AlertTriangle className="w-3 h-3 text-destructive" />
          <span>
            <strong className="text-destructive">High</strong> — Rapid module
            switching (data scraping risk)
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <AlertTriangle className="w-3 h-3 text-amber-500" />
          <span>
            <strong className="text-amber-600 dark:text-amber-400">
              Medium
            </strong>{" "}
            — Rapid actions / bulk exports
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <AlertTriangle className="w-3 h-3 text-blue-500" />
          <span>
            <strong className="text-blue-600 dark:text-blue-400">Low</strong> —
            Odd-hour access
          </span>
        </div>
      </div>
    </div>
  );
}
