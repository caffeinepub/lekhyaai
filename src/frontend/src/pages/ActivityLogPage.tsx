import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AlertTriangle, Download, Lock } from "lucide-react";
import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  Legend,
  Tooltip as RechartTooltip,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts";

// ─── Types ─────────────────────────────────────────────────────────

interface ActivityLogEntry {
  id: string;
  userId: string;
  userName: string;
  action: string;
  module: string;
  details?: string;
  timestamp: number;
}

// ─── Constants ─────────────────────────────────────────────────────

const LS_KEY = "lekhya_activity_log";

const MODULES = [
  "Dashboard",
  "Invoices",
  "GST Reports",
  "Customers",
  "Ledger",
  "Settings",
  "AI Assistant",
  "Bank Accounts",
  "Expenses",
];

const MODULE_COLORS: Record<string, string> = {
  Dashboard: "#6366f1",
  Invoices: "#f59e0b",
  "GST Reports": "#10b981",
  Customers: "#3b82f6",
  Ledger: "#8b5cf6",
  Settings: "#64748b",
  "AI Assistant": "#ec4899",
  "Bank Accounts": "#0ea5e9",
  Expenses: "#ef4444",
};

const USERS = [
  { id: "usr-001", name: "Rajesh Kumar" },
  { id: "usr-002", name: "Priya Sharma" },
  { id: "usr-003", name: "Sanjay Mehta" },
  { id: "usr-004", name: "Anita Patel" },
  { id: "usr-005", name: "Vikram Singh" },
];

const ACTIONS_BY_MODULE: Record<string, string[]> = {
  Dashboard: ["Viewed dashboard", "Exported summary", "Refreshed widgets"],
  Invoices: [
    "Created invoice",
    "Sent invoice",
    "Recorded payment",
    "Downloaded PDF",
    "Scanned invoice OCR",
  ],
  "GST Reports": [
    "Generated GSTR-3B",
    "Filed GSTR-1",
    "Downloaded reconciliation",
    "Viewed GSTIN mismatch",
  ],
  Customers: [
    "Added new customer",
    "Edited customer details",
    "Exported customer list",
  ],
  Ledger: ["Viewed ledger", "Posted journal entry", "Ran trial balance"],
  Settings: ["Changed company logo", "Updated GSTIN", "Modified RBAC matrix"],
  "AI Assistant": [
    "Asked GST query",
    "Requested expense analysis",
    "Generated invoice draft",
  ],
  "Bank Accounts": [
    "Added bank account",
    "Reconciled transactions",
    "Imported statement",
  ],
  Expenses: [
    "Added expense",
    "Categorised expenses",
    "Exported expense report",
  ],
};

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateSeedLogs(): ActivityLogEntry[] {
  const now = Date.now();
  const DAY = 1000 * 60 * 60 * 24;
  const logs: ActivityLogEntry[] = [];

  // Generate ~20 entries spread over 30 days
  const entries = [
    { daysAgo: 0, userId: "usr-001", module: "Invoices", actionIdx: 0 },
    { daysAgo: 0, userId: "usr-002", module: "GST Reports", actionIdx: 0 },
    { daysAgo: 1, userId: "usr-001", module: "Invoices", actionIdx: 2 },
    { daysAgo: 1, userId: "usr-003", module: "AI Assistant", actionIdx: 0 },
    { daysAgo: 2, userId: "usr-004", module: "Customers", actionIdx: 0 },
    { daysAgo: 2, userId: "usr-001", module: "Dashboard", actionIdx: 0 },
    { daysAgo: 3, userId: "usr-002", module: "Ledger", actionIdx: 1 },
    { daysAgo: 3, userId: "usr-005", module: "Expenses", actionIdx: 0 },
    { daysAgo: 5, userId: "usr-001", module: "GST Reports", actionIdx: 1 },
    { daysAgo: 5, userId: "usr-003", module: "Bank Accounts", actionIdx: 0 },
    { daysAgo: 7, userId: "usr-002", module: "Invoices", actionIdx: 1 },
    { daysAgo: 7, userId: "usr-004", module: "Settings", actionIdx: 0 },
    { daysAgo: 10, userId: "usr-001", module: "AI Assistant", actionIdx: 2 },
    { daysAgo: 10, userId: "usr-005", module: "Customers", actionIdx: 1 },
    { daysAgo: 12, userId: "usr-003", module: "Ledger", actionIdx: 0 },
    { daysAgo: 15, userId: "usr-002", module: "Expenses", actionIdx: 1 },
    { daysAgo: 18, userId: "usr-001", module: "Dashboard", actionIdx: 2 },
    { daysAgo: 20, userId: "usr-004", module: "GST Reports", actionIdx: 2 },
    { daysAgo: 25, userId: "usr-005", module: "Invoices", actionIdx: 4 },
    { daysAgo: 28, userId: "usr-002", module: "Bank Accounts", actionIdx: 2 },
  ];

  entries.forEach((e, idx) => {
    const user = USERS.find((u) => u.id === e.userId)!;
    const actions = ACTIONS_BY_MODULE[e.module] ?? ["Accessed module"];
    const action = actions[e.actionIdx % actions.length];
    logs.push({
      id: `log-${idx + 1}`,
      userId: e.userId,
      userName: user.name,
      action,
      module: e.module,
      details: `${e.module} session — duration ${randomInt(1, 20)}m`,
      timestamp: now - e.daysAgo * DAY - randomInt(0, 8) * 1000 * 60 * 60,
    });
  });

  return logs.sort((a, b) => b.timestamp - a.timestamp);
}

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
  const seed = generateSeedLogs();
  localStorage.setItem(LS_KEY, JSON.stringify(seed));
  return seed;
}

// ─── Gantt-style chart using recharts BarChart ──────────────────────

function GanttChart({ logs }: { logs: ActivityLogEntry[] }) {
  // Build chart data: per day, count per module
  const data = useMemo(() => {
    const dayMap = new Map<string, Record<string, number | string>>();

    for (const log of logs) {
      const d = new Date(log.timestamp);
      const key = `${d.getDate()}/${d.getMonth() + 1}`;
      if (!dayMap.has(key)) {
        dayMap.set(key, { date: key });
      }
      const entry = dayMap.get(key)!;
      const current = entry[log.module];
      entry[log.module] = (typeof current === "number" ? current : 0) + 1;
    }

    return Array.from(dayMap.values()).reverse();
  }, [logs]);

  const activeModules = useMemo(() => {
    const mods = new Set<string>();
    for (const log of logs) mods.add(log.module);
    return Array.from(mods);
  }, [logs]);

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-40 text-muted-foreground text-sm">
        No activity data in selected range
      </div>
    );
  }

  return (
    <div data-ocid="activity.gantt.chart_point" className="w-full h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 8, right: 16, left: 0, bottom: 4 }}
        >
          <XAxis
            dataKey="date"
            tick={{ fontSize: 10, fill: "currentColor" }}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 10, fill: "currentColor" }}
            tickLine={false}
            allowDecimals={false}
          />
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
          {activeModules.map((mod) => (
            <Bar
              key={mod}
              dataKey={mod}
              stackId="a"
              fill={MODULE_COLORS[mod] ?? "#888"}
              radius={[0, 0, 0, 0]}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// ─── Page ──────────────────────────────────────────────────────────

const PAGE_SIZE = 10;

export default function ActivityLogPage() {
  const isDeveloperMode =
    typeof localStorage !== "undefined" &&
    localStorage.getItem("lekhya_superuser_active") === "1";

  const [logs] = useState<ActivityLogEntry[]>(() => loadLogs());
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [userFilter, setUserFilter] = useState("all");
  const [moduleFilter, setModuleFilter] = useState("all");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    return logs.filter((log) => {
      if (dateFrom) {
        const from = new Date(dateFrom).setHours(0, 0, 0, 0);
        if (log.timestamp < from) return false;
      }
      if (dateTo) {
        const to = new Date(dateTo).setHours(23, 59, 59, 999);
        if (log.timestamp > to) return false;
      }
      if (userFilter !== "all" && log.userId !== userFilter) return false;
      if (moduleFilter !== "all" && log.module !== moduleFilter) return false;
      return true;
    });
  }, [logs, dateFrom, dateTo, userFilter, moduleFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function exportCsv() {
    const header = "Timestamp,User,Module,Action,Details\n";
    const rows = filtered
      .map(
        (l) =>
          `"${new Date(l.timestamp).toLocaleString()}","${l.userName}","${l.module}","${l.action}","${l.details ?? ""}"`,
      )
      .join("\n");
    const blob = new Blob([header + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `lekhya-activity-log-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (!isDeveloperMode) {
    return (
      <div
        data-ocid="activity.locked.error_state"
        className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center p-6"
      >
        <div className="w-16 h-16 rounded-2xl bg-destructive/10 flex items-center justify-center">
          <Lock className="w-8 h-8 text-destructive" />
        </div>
        <h2 className="font-display text-2xl text-foreground">
          SuperUser Access Required
        </h2>
        <p className="text-muted-foreground max-w-sm">
          The Activity Log is visible only to SuperUser / Developer accounts.
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

  return (
    <div data-ocid="activity.page" className="p-4 md:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="font-display text-2xl md:text-3xl text-foreground">
            Activity Log
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            SuperUser Only — Client Usage Monitor
          </p>
        </div>
        <Button
          variant="outline"
          data-ocid="activity.export.button"
          onClick={exportCsv}
          className="gap-2"
        >
          <Download className="w-4 h-4" />
          Export CSV
        </Button>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <div>
          <Label className="text-xs mb-1 block">From Date</Label>
          <Input
            type="date"
            data-ocid="activity.date-from.input"
            value={dateFrom}
            onChange={(e) => {
              setDateFrom(e.target.value);
              setPage(1);
            }}
            className="text-sm"
          />
        </div>
        <div>
          <Label className="text-xs mb-1 block">To Date</Label>
          <Input
            type="date"
            data-ocid="activity.date-to.input"
            value={dateTo}
            onChange={(e) => {
              setDateTo(e.target.value);
              setPage(1);
            }}
            className="text-sm"
          />
        </div>
        <div>
          <Label className="text-xs mb-1 block">User</Label>
          <Select
            value={userFilter}
            onValueChange={(v) => {
              setUserFilter(v);
              setPage(1);
            }}
          >
            <SelectTrigger
              data-ocid="activity.user-filter.select"
              className="text-sm"
            >
              <SelectValue placeholder="All Users" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Users</SelectItem>
              {USERS.map((u) => (
                <SelectItem key={u.id} value={u.id}>
                  {u.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs mb-1 block">Module</Label>
          <Select
            value={moduleFilter}
            onValueChange={(v) => {
              setModuleFilter(v);
              setPage(1);
            }}
          >
            <SelectTrigger
              data-ocid="activity.module-filter.select"
              className="text-sm"
            >
              <SelectValue placeholder="All Modules" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Modules</SelectItem>
              {MODULES.map((m) => (
                <SelectItem key={m} value={m}>
                  {m}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Gantt Chart */}
      <div className="rounded-xl border border-border bg-card p-4 mb-6">
        <h2 className="font-semibold text-sm text-foreground mb-4">
          Usage Timeline{" "}
          <span className="text-xs font-normal text-muted-foreground ml-1">
            (activity count per day per module)
          </span>
        </h2>
        <GanttChart logs={filtered} />
      </div>

      {/* Raw Log Table */}
      <div className="rounded-xl border border-border overflow-hidden">
        <Table data-ocid="activity.log.table">
          <TableHeader>
            <TableRow>
              <TableHead>Timestamp</TableHead>
              <TableHead>User</TableHead>
              <TableHead>Module</TableHead>
              <TableHead>Action</TableHead>
              <TableHead className="hidden lg:table-cell">Details</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginated.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="text-center py-12 text-muted-foreground"
                >
                  No activity found for selected filters.
                </TableCell>
              </TableRow>
            ) : (
              paginated.map((log, i) => (
                <TableRow
                  key={log.id}
                  data-ocid={`activity.log.row.item.${i + 1}`}
                >
                  <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                    {new Date(log.timestamp).toLocaleString("en-IN", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-primary/15 flex items-center justify-center flex-shrink-0">
                        <span className="text-[9px] font-bold text-primary">
                          {log.userName
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                            .slice(0, 2)}
                        </span>
                      </div>
                      <span className="text-sm font-medium">
                        {log.userName}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span
                      className="text-xs px-2 py-1 rounded-full font-medium text-white"
                      style={{
                        background: MODULE_COLORS[log.module] ?? "#888",
                      }}
                    >
                      {log.module}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm">{log.action}</TableCell>
                  <TableCell className="hidden lg:table-cell text-xs text-muted-foreground">
                    {log.details ?? "—"}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-xs text-muted-foreground">
            Showing {(page - 1) * PAGE_SIZE + 1}–
            {Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}{" "}
            entries
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              Previous
            </Button>
            <span className="text-sm text-muted-foreground">
              {page} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
