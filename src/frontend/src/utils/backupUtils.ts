/**
 * Backup utilities for LekhyaAI.
 * Exports all localStorage data as a JSON file download.
 */

const LS_LAST_BACKUP = "lekhya_last_backup_time";

/**
 * Export all localStorage data as a JSON file and trigger browser download.
 */
export function exportAllDataAsJSON(): void {
  const allData: Record<string, unknown> = {};

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key) {
      const value = localStorage.getItem(key);
      if (value) {
        try {
          allData[key] = JSON.parse(value);
        } catch {
          allData[key] = value;
        }
      }
    }
  }

  const payload = {
    exportedAt: new Date().toISOString(),
    appVersion: "LekhyaAI v2C",
    data: allData,
  };

  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `lekhyaai-backup-${new Date().toISOString().split("T")[0]}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  setLastBackupTime();
}

export function getLastBackupTime(): string | null {
  return localStorage.getItem(LS_LAST_BACKUP);
}

export function setLastBackupTime(): void {
  localStorage.setItem(LS_LAST_BACKUP, new Date().toISOString());
}

/**
 * Check if a backup is overdue based on frequency setting.
 */
export function isBackupOverdue(
  frequency: "daily" | "weekly" | "monthly",
): boolean {
  const lastBackup = getLastBackupTime();
  if (!lastBackup) return true;

  const lastMs = new Date(lastBackup).getTime();
  const nowMs = Date.now();
  const diffMs = nowMs - lastMs;

  const thresholds: Record<typeof frequency, number> = {
    daily: 86400000, // 24h
    weekly: 604800000, // 7 days
    monthly: 2592000000, // 30 days
  };

  return diffMs > thresholds[frequency];
}
