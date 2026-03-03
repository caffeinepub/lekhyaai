/**
 * Standard Indian Chart of Accounts (~50 accounts)
 * Used in Journal Entry account picker
 */

export type AccountCategory =
  | "Asset"
  | "Liability"
  | "Capital"
  | "Revenue"
  | "Expense";

export interface StandardAccount {
  code: string;
  name: string;
  category: AccountCategory;
}

export const STANDARD_ACCOUNTS: StandardAccount[] = [
  // ── Assets ─────────────────────────────────────────────────────
  { code: "1001", name: "Cash in Hand", category: "Asset" },
  { code: "1002", name: "Petty Cash", category: "Asset" },
  { code: "1003", name: "Bank Current Account", category: "Asset" },
  { code: "1004", name: "Bank Savings Account", category: "Asset" },
  { code: "1100", name: "Accounts Receivable (Debtors)", category: "Asset" },
  { code: "1110", name: "Advance to Suppliers", category: "Asset" },
  { code: "1120", name: "Prepaid Expenses", category: "Asset" },
  { code: "1200", name: "Inventory / Stock", category: "Asset" },
  {
    code: "1300",
    name: "Fixed Assets – Plant & Machinery",
    category: "Asset",
  },
  { code: "1310", name: "Fixed Assets – Furniture", category: "Asset" },
  { code: "1320", name: "Fixed Assets – Computers", category: "Asset" },
  { code: "1390", name: "Accumulated Depreciation", category: "Asset" },
  { code: "1400", name: "Security Deposits", category: "Asset" },
  { code: "1500", name: "TDS Receivable", category: "Asset" },
  { code: "1600", name: "GST Input Credit (CGST)", category: "Asset" },
  { code: "1610", name: "GST Input Credit (SGST)", category: "Asset" },
  { code: "1620", name: "GST Input Credit (IGST)", category: "Asset" },

  // ── Liabilities ────────────────────────────────────────────────
  { code: "2001", name: "Accounts Payable (Creditors)", category: "Liability" },
  { code: "2010", name: "Advance from Customers", category: "Liability" },
  { code: "2100", name: "Salary Payable", category: "Liability" },
  { code: "2200", name: "GST Payable (CGST)", category: "Liability" },
  { code: "2210", name: "GST Payable (SGST)", category: "Liability" },
  { code: "2220", name: "GST Payable (IGST)", category: "Liability" },
  { code: "2300", name: "TDS Payable", category: "Liability" },
  { code: "2310", name: "TCS Payable", category: "Liability" },
  { code: "2400", name: "PF Payable", category: "Liability" },
  { code: "2410", name: "ESI Payable", category: "Liability" },
  { code: "2500", name: "Rent Payable", category: "Liability" },
  { code: "2600", name: "Short Term Bank Loan", category: "Liability" },
  { code: "2700", name: "Long Term Bank Loan", category: "Liability" },
  { code: "2800", name: "Vehicle Loan", category: "Liability" },

  // ── Capital ────────────────────────────────────────────────────
  { code: "3001", name: "Capital Account", category: "Capital" },
  { code: "3100", name: "Drawings Account", category: "Capital" },
  {
    code: "3200",
    name: "Retained Earnings / Profit & Loss Account",
    category: "Capital",
  },

  // ── Revenue ────────────────────────────────────────────────────
  { code: "4001", name: "Sales Revenue", category: "Revenue" },
  { code: "4010", name: "Service Revenue", category: "Revenue" },
  { code: "4100", name: "Other Operating Income", category: "Revenue" },
  { code: "4200", name: "Interest Income", category: "Revenue" },
  { code: "4300", name: "Discount Received", category: "Revenue" },
  { code: "4400", name: "Commission Received", category: "Revenue" },

  // ── Expenses ───────────────────────────────────────────────────
  { code: "5001", name: "Purchase of Goods", category: "Expense" },
  { code: "5010", name: "Cost of Services", category: "Expense" },
  { code: "5100", name: "Salaries and Wages", category: "Expense" },
  { code: "5200", name: "Rent Expense", category: "Expense" },
  { code: "5300", name: "Electricity Expense", category: "Expense" },
  { code: "5310", name: "Telephone & Internet Expense", category: "Expense" },
  { code: "5400", name: "Office Supplies", category: "Expense" },
  { code: "5500", name: "Travel and Conveyance", category: "Expense" },
  { code: "5600", name: "Advertising and Marketing", category: "Expense" },
  { code: "5700", name: "Professional Fees (CA/Legal)", category: "Expense" },
  { code: "5710", name: "Audit Fees", category: "Expense" },
  { code: "5800", name: "Bank Charges", category: "Expense" },
  { code: "5900", name: "Depreciation Expense", category: "Expense" },
  { code: "6000", name: "Repairs and Maintenance", category: "Expense" },
  { code: "6100", name: "Insurance Premium", category: "Expense" },
  { code: "6200", name: "Miscellaneous Expenses", category: "Expense" },
  { code: "6300", name: "Bad Debts Written Off", category: "Expense" },
];

export const ACCOUNTS_BY_CATEGORY = STANDARD_ACCOUNTS.reduce(
  (acc, account) => {
    if (!acc[account.category]) acc[account.category] = [];
    acc[account.category].push(account);
    return acc;
  },
  {} as Record<AccountCategory, StandardAccount[]>,
);
