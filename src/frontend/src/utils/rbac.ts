/**
 * RBAC (Role-Based Access Control) permission store.
 * Permissions are stored in localStorage as a JSON matrix.
 * Admin always has full access and cannot be restricted.
 */

export type RbacModule =
  | "dashboard"
  | "invoices"
  | "customers"
  | "vendors"
  | "products"
  | "expenses"
  | "gst-reports"
  | "ledger"
  | "pl-report"
  | "balance-sheet"
  | "bank-accounts"
  | "petty-cash"
  | "tally-import"
  | "gst-filing"
  | "b2b-reconciliation"
  | "ai-assistant"
  | "company-categories"
  | "subscriptions"
  | "settings"
  | "user-manual"
  | "whatsapp-send"
  | "email-send"
  | "pdf-export"
  | "ocr-scanner"
  | "users";

export type RbacRole = "admin" | "accountant" | "ca";

export const RBAC_MODULE_LABELS: Record<RbacModule, string> = {
  dashboard: "Dashboard",
  invoices: "Invoices",
  customers: "Customers",
  vendors: "Vendors",
  products: "Products",
  expenses: "Expenses",
  "gst-reports": "GST Reports",
  ledger: "Ledger & Journal",
  "pl-report": "P&L Report",
  "balance-sheet": "Balance Sheet",
  "bank-accounts": "Bank Accounts",
  "petty-cash": "Petty Cash",
  "tally-import": "Tally Import",
  "gst-filing": "GST Filing Calendar",
  "b2b-reconciliation": "B2B Reconciliation",
  "ai-assistant": "AI Assistant",
  "company-categories": "Company Categories",
  subscriptions: "Subscription",
  settings: "Settings",
  "user-manual": "User Manual",
  "whatsapp-send": "Send via WhatsApp",
  "email-send": "Send via Email",
  "pdf-export": "Export to PDF",
  "ocr-scanner": "OCR Scanner",
  users: "Users & RBAC",
};

export const ALL_MODULES: RbacModule[] = Object.keys(
  RBAC_MODULE_LABELS,
) as RbacModule[];

type RolePerms = Record<"accountant" | "ca", boolean>;

const DEFAULT_PERMISSIONS: Record<RbacModule, RolePerms> = {
  dashboard: { accountant: true, ca: true },
  invoices: { accountant: true, ca: true },
  customers: { accountant: true, ca: true },
  vendors: { accountant: true, ca: false },
  products: { accountant: true, ca: false },
  expenses: { accountant: true, ca: false },
  "gst-reports": { accountant: true, ca: true },
  ledger: { accountant: true, ca: true },
  "pl-report": { accountant: true, ca: true },
  "balance-sheet": { accountant: true, ca: true },
  "bank-accounts": { accountant: true, ca: false },
  "petty-cash": { accountant: true, ca: false },
  "tally-import": { accountant: false, ca: false },
  "gst-filing": { accountant: true, ca: true },
  "b2b-reconciliation": { accountant: true, ca: false },
  "ai-assistant": { accountant: true, ca: true },
  "company-categories": { accountant: true, ca: false },
  subscriptions: { accountant: false, ca: false },
  settings: { accountant: false, ca: false },
  "user-manual": { accountant: true, ca: true },
  "whatsapp-send": { accountant: true, ca: false },
  "email-send": { accountant: true, ca: false },
  "pdf-export": { accountant: true, ca: true },
  "ocr-scanner": { accountant: true, ca: false },
  users: { accountant: false, ca: false },
};

const LS_KEY = "lekhya_rbac_permissions_v2";
const LS_USER_ROLE = "lekhya_user_role";

export function getRbacPermissions(): Record<RbacModule, RolePerms> {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Record<RbacModule, RolePerms>;
      // Merge: add any new modules that weren't in the stored version
      const merged: Record<RbacModule, RolePerms> = { ...DEFAULT_PERMISSIONS };
      for (const mod of ALL_MODULES) {
        if (parsed[mod] !== undefined) {
          merged[mod] = parsed[mod];
        }
      }
      return merged;
    }
  } catch {
    // ignore
  }
  return { ...DEFAULT_PERMISSIONS };
}

export function saveRbacPermissions(
  perms: Record<RbacModule, RolePerms>,
): void {
  localStorage.setItem(LS_KEY, JSON.stringify(perms));
}

export function resetRbacPermissions(): void {
  localStorage.removeItem(LS_KEY);
}

/**
 * Check if a role has permission for a module.
 * Admin always returns true. SuperUser always returns true.
 */
export function hasPermission(module: RbacModule, role: RbacRole): boolean {
  if (role === "admin") return true;
  const perms = getRbacPermissions();
  return perms[module]?.[role] ?? false;
}

export function getCurrentUserRole(): RbacRole {
  const stored = localStorage.getItem(LS_USER_ROLE);
  if (stored === "admin" || stored === "accountant" || stored === "ca") {
    return stored;
  }
  return "admin";
}

export function setCurrentUserRole(role: RbacRole): void {
  localStorage.setItem(LS_USER_ROLE, role);
}
