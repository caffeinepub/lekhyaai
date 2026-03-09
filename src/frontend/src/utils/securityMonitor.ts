/**
 * Security Monitor utility for LekhyaAI
 * Detects anomalous behavior in activity logs
 */

export type RiskLevel = "Low" | "Medium" | "High";

export type AnomalyType =
  | "Rapid Actions"
  | "Bulk Export"
  | "Odd Hours"
  | "Rapid Module Switching";

export interface ActivityLogEntry {
  id: string;
  userId: string;
  userName: string;
  action: string;
  module: string;
  details?: string;
  timestamp: number;
}

export interface AnomalyFlag {
  id: string;
  userId: string;
  userName: string;
  anomalyType: AnomalyType;
  timestamp: number;
  riskLevel: RiskLevel;
  details: string;
}

const TEN_MINUTES = 10 * 60 * 1000; // 10 minutes in ms
const FIFTEEN_MINUTES = 15 * 60 * 1000; // 15 minutes in ms
const ONE_DAY = 24 * 60 * 60 * 1000; // 1 day in ms

export function getFlaggedUsers(logs: ActivityLogEntry[]): AnomalyFlag[] {
  const flags: AnomalyFlag[] = [];

  // Group logs by user
  const byUser = new Map<string, ActivityLogEntry[]>();
  for (const log of logs) {
    const arr = byUser.get(log.userId) ?? [];
    arr.push(log);
    byUser.set(log.userId, arr);
  }

  for (const [userId, userLogs] of byUser.entries()) {
    const userName = userLogs[0]?.userName ?? userId;
    const sorted = [...userLogs].sort((a, b) => a.timestamp - b.timestamp);
    for (let i = 0; i < sorted.length; i++) {
      const windowStart = sorted[i].timestamp;
      const windowEnd = windowStart + TEN_MINUTES;
      const inWindow = sorted.filter(
        (l) => l.timestamp >= windowStart && l.timestamp <= windowEnd,
      );
      if (inWindow.length > 5) {
        const alreadyFlagged = flags.some(
          (f) =>
            f.userId === userId &&
            f.anomalyType === "Rapid Actions" &&
            Math.abs(f.timestamp - sorted[i].timestamp) < TEN_MINUTES,
        );
        if (!alreadyFlagged) {
          flags.push({
            id: `rapid-actions-${userId}-${sorted[i].timestamp}`,
            userId,
            userName,
            anomalyType: "Rapid Actions",
            timestamp: sorted[i].timestamp,
            riskLevel: "Medium",
            details: `${inWindow.length} actions within 10 minutes`,
          });
        }
        break; // one flag per user for this rule
      }
    }

    // ── Rule 2: Bulk Export — ≥3 export/download actions in one day ──────────
    {
      const exportKeywords = ["export", "download", "csv", "pdf", "backup"];
      const exportLogs = sorted.filter((l) =>
        exportKeywords.some(
          (kw) =>
            l.action.toLowerCase().includes(kw) ||
            (l.details ?? "").toLowerCase().includes(kw),
        ),
      );

      // Group by day
      const byDay = new Map<string, ActivityLogEntry[]>();
      for (const log of exportLogs) {
        const day = new Date(log.timestamp).toDateString();
        const arr = byDay.get(day) ?? [];
        arr.push(log);
        byDay.set(day, arr);
      }

      for (const [, dayLogs] of byDay.entries()) {
        if (dayLogs.length >= 3) {
          const alreadyFlagged = flags.some(
            (f) => f.userId === userId && f.anomalyType === "Bulk Export",
          );
          if (!alreadyFlagged) {
            flags.push({
              id: `bulk-export-${userId}-${dayLogs[0].timestamp}`,
              userId,
              userName,
              anomalyType: "Bulk Export",
              timestamp: dayLogs[0].timestamp,
              riskLevel: "Medium",
              details: `${dayLogs.length} export/download actions in one day`,
            });
          }
          break;
        }
      }
    }

    // ── Rule 3: Odd Hours — actions between midnight and 5am ─────────────────
    {
      const oddHourLogs = sorted.filter((l) => {
        const hour = new Date(l.timestamp).getHours();
        return hour >= 0 && hour < 5;
      });

      if (oddHourLogs.length > 0) {
        const alreadyFlagged = flags.some(
          (f) => f.userId === userId && f.anomalyType === "Odd Hours",
        );
        if (!alreadyFlagged) {
          const latestOddHour = oddHourLogs[oddHourLogs.length - 1];
          flags.push({
            id: `odd-hours-${userId}-${latestOddHour.timestamp}`,
            userId,
            userName,
            anomalyType: "Odd Hours",
            timestamp: latestOddHour.timestamp,
            riskLevel: "Low",
            details: `${oddHourLogs.length} action(s) between midnight and 5am`,
          });
        }
      }
    }
    for (let i = 0; i < sorted.length; i++) {
      const windowStart = sorted[i].timestamp;
      const windowEnd = windowStart + FIFTEEN_MINUTES;
      const inWindow = sorted.filter(
        (l) => l.timestamp >= windowStart && l.timestamp <= windowEnd,
      );
      const uniqueModules = new Set(inWindow.map((l) => l.module));
      if (uniqueModules.size >= 5) {
        const alreadyFlagged = flags.some(
          (f) =>
            f.userId === userId &&
            f.anomalyType === "Rapid Module Switching" &&
            Math.abs(f.timestamp - sorted[i].timestamp) < FIFTEEN_MINUTES,
        );
        if (!alreadyFlagged) {
          flags.push({
            id: `rapid-switch-${userId}-${sorted[i].timestamp}`,
            userId,
            userName,
            anomalyType: "Rapid Module Switching",
            timestamp: sorted[i].timestamp,
            riskLevel: "High",
            details: `${uniqueModules.size} different modules in 15 minutes`,
          });
        }
        break;
      }
    }
  }

  // Deduplicate: one flag per user per anomaly type (keep latest)
  const uniqueFlags: AnomalyFlag[] = [];
  const seen = new Set<string>();
  for (const flag of flags) {
    const key = `${flag.userId}-${flag.anomalyType}`;
    if (!seen.has(key)) {
      seen.add(key);
      uniqueFlags.push(flag);
    }
  }

  return uniqueFlags.sort((a, b) => {
    const riskOrder = { High: 0, Medium: 1, Low: 2 };
    return riskOrder[a.riskLevel] - riskOrder[b.riskLevel];
  });
}

// ── localStorage helpers ───────────────────────────────────────────────────

const LS_BLOCKED_USERS = "lekhya_blocked_users";

export function getBlockedUsers(): string[] {
  try {
    return JSON.parse(localStorage.getItem(LS_BLOCKED_USERS) ?? "[]");
  } catch {
    return [];
  }
}

export function blockUser(userId: string): void {
  const blocked = getBlockedUsers();
  if (!blocked.includes(userId)) {
    blocked.push(userId);
    localStorage.setItem(LS_BLOCKED_USERS, JSON.stringify(blocked));
  }
}

export function unblockUser(userId: string): void {
  const blocked = getBlockedUsers().filter((id) => id !== userId);
  localStorage.setItem(LS_BLOCKED_USERS, JSON.stringify(blocked));
}

export function isUserBlocked(userId: string): boolean {
  return getBlockedUsers().includes(userId);
}

// Seed some anomalous activity data so the monitor shows results on first load
export function seedAnomalousActivity(): void {
  const LS_KEY = "lekhya_activity_log";
  const existing = localStorage.getItem(LS_KEY);
  if (existing) return; // Don't overwrite existing logs

  const now = Date.now();
  const MINUTE = 60 * 1000;

  // Seed: usr-001 performs rapid module switching (5 different modules in 12 min)
  const rapidSwitchLogs = [
    { module: "Invoices", actionOffset: 0 },
    { module: "Customers", actionOffset: 2 * MINUTE },
    { module: "GST Reports", actionOffset: 5 * MINUTE },
    { module: "Ledger", actionOffset: 8 * MINUTE },
    { module: "Expenses", actionOffset: 10 * MINUTE },
    { module: "Bank Accounts", actionOffset: 11 * MINUTE },
  ].map((entry, idx) => ({
    id: `seed-rapid-${idx}`,
    userId: "usr-001",
    userName: "Rajesh Kumar",
    action: `Accessed ${entry.module}`,
    module: entry.module,
    details: "Rapid switching session",
    timestamp: now - ONE_DAY * 2 - entry.actionOffset,
  }));

  // Seed: usr-002 performs bulk exports (3 downloads in one day)
  const bulkExportLogs = [
    { action: "Downloaded PDF", module: "Invoices" },
    { action: "Exported customer list", module: "Customers" },
    { action: "Exported expense report", module: "Expenses" },
  ].map((entry, idx) => ({
    id: `seed-export-${idx}`,
    userId: "usr-002",
    userName: "Priya Sharma",
    action: entry.action,
    module: entry.module,
    details: "Bulk download activity",
    timestamp: now - ONE_DAY * 3 - idx * 2 * 60 * 1000,
  }));

  // Seed: usr-003 works at 2am (odd hours)
  const oddHourDate = new Date(now - ONE_DAY);
  oddHourDate.setHours(2, 30, 0, 0);
  const oddHourLogs = [
    {
      id: "seed-odd-1",
      userId: "usr-003",
      userName: "Sanjay Mehta",
      action: "Viewed ledger",
      module: "Ledger",
      details: "Late night access",
      timestamp: oddHourDate.getTime(),
    },
  ];

  const allLogs = [...rapidSwitchLogs, ...bulkExportLogs, ...oddHourLogs].sort(
    (a, b) => b.timestamp - a.timestamp,
  );

  localStorage.setItem(LS_KEY, JSON.stringify(allLogs));
}
