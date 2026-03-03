import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  Customer,
  DashboardData,
  Expense,
  Invoice,
  InvoiceStatus,
  Product,
  SubscriptionStatus,
  Vendor,
} from "../backend.d";
import { useBusiness } from "../context/BusinessContext";
import { useActor } from "./useActor";

// ─── Dashboard ────────────────────────────────────────────────────
export function useDashboard() {
  const { actor, isFetching } = useActor();
  const { activeBusinessId } = useBusiness();
  return useQuery<DashboardData>({
    queryKey: ["dashboard", activeBusinessId?.toString()],
    queryFn: async () => {
      if (!actor || activeBusinessId === null) throw new Error("Not ready");
      return actor.getDashboardData(activeBusinessId);
    },
    enabled: !!actor && !isFetching && activeBusinessId !== null,
    staleTime: 30_000,
  });
}

// ─── Customers ────────────────────────────────────────────────────
export function useCustomers() {
  const { actor, isFetching } = useActor();
  const { activeBusinessId } = useBusiness();
  return useQuery<Customer[]>({
    queryKey: ["customers", activeBusinessId?.toString()],
    queryFn: async () => {
      if (!actor || activeBusinessId === null) return [];
      return actor.getCustomers(activeBusinessId);
    },
    enabled: !!actor && !isFetching && activeBusinessId !== null,
    staleTime: 30_000,
  });
}

export function useCreateCustomer() {
  const { actor } = useActor();
  const { activeBusinessId } = useBusiness();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      name: string;
      gstin: string;
      phone: string;
      email: string;
      address: string;
      state?: string;
    }) => {
      if (!actor || activeBusinessId === null) throw new Error("Not ready");
      const id = await actor.createCustomer(
        activeBusinessId,
        data.name,
        data.gstin,
        data.phone,
        data.email,
        data.address,
      );
      // Store state in localStorage since backend doesn't have it yet
      if (data.state) {
        const stateMap = JSON.parse(
          localStorage.getItem("customer_states") || "{}",
        ) as Record<string, string>;
        stateMap[id.toString()] = data.state;
        localStorage.setItem("customer_states", JSON.stringify(stateMap));
      }
      return id;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["customers"] });
    },
  });
}

export function useUpdateCustomer() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      id: bigint;
      name: string;
      gstin: string;
      phone: string;
      email: string;
      address: string;
      state?: string;
    }) => {
      if (!actor) throw new Error("Not ready");
      await actor.updateCustomer(
        data.id,
        data.name,
        data.gstin,
        data.phone,
        data.email,
        data.address,
      );
      // Store state in localStorage since backend doesn't have it yet
      if (data.state !== undefined) {
        const stateMap = JSON.parse(
          localStorage.getItem("customer_states") || "{}",
        ) as Record<string, string>;
        stateMap[data.id.toString()] = data.state;
        localStorage.setItem("customer_states", JSON.stringify(stateMap));
      }
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["customers"] });
    },
  });
}

export function useDeleteCustomer() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error("Not ready");
      return actor.deleteCustomer(id);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["customers"] });
    },
  });
}

// ─── Vendors ──────────────────────────────────────────────────────
export function useVendors() {
  const { actor, isFetching } = useActor();
  const { activeBusinessId } = useBusiness();
  return useQuery<Vendor[]>({
    queryKey: ["vendors", activeBusinessId?.toString()],
    queryFn: async () => {
      if (!actor || activeBusinessId === null) return [];
      return actor.getVendors(activeBusinessId);
    },
    enabled: !!actor && !isFetching && activeBusinessId !== null,
    staleTime: 30_000,
  });
}

export function useCreateVendor() {
  const { actor } = useActor();
  const { activeBusinessId } = useBusiness();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      name: string;
      gstin: string;
      phone: string;
      email: string;
      address: string;
    }) => {
      if (!actor || activeBusinessId === null) throw new Error("Not ready");
      return actor.createVendor(
        activeBusinessId,
        data.name,
        data.gstin,
        data.phone,
        data.email,
        data.address,
      );
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["vendors"] });
    },
  });
}

export function useUpdateVendor() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      id: bigint;
      name: string;
      gstin: string;
      phone: string;
      email: string;
      address: string;
    }) => {
      if (!actor) throw new Error("Not ready");
      return actor.updateVendor(
        data.id,
        data.name,
        data.gstin,
        data.phone,
        data.email,
        data.address,
      );
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["vendors"] });
    },
  });
}

export function useDeleteVendor() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error("Not ready");
      return actor.deleteVendor(id);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["vendors"] });
    },
  });
}

// ─── Products ─────────────────────────────────────────────────────
export function useProducts() {
  const { actor, isFetching } = useActor();
  const { activeBusinessId } = useBusiness();
  return useQuery<Product[]>({
    queryKey: ["products", activeBusinessId?.toString()],
    queryFn: async () => {
      if (!actor || activeBusinessId === null) return [];
      return actor.getProducts(activeBusinessId);
    },
    enabled: !!actor && !isFetching && activeBusinessId !== null,
    staleTime: 30_000,
  });
}

export function useCreateProduct() {
  const { actor } = useActor();
  const { activeBusinessId } = useBusiness();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      name: string;
      hsnCode: string;
      gstRate: bigint;
      purchasePrice: bigint;
      sellingPrice: bigint;
      stockQuantity: bigint;
    }) => {
      if (!actor || activeBusinessId === null) throw new Error("Not ready");
      return actor.createProduct(
        activeBusinessId,
        data.name,
        data.hsnCode,
        data.gstRate,
        data.purchasePrice,
        data.sellingPrice,
        data.stockQuantity,
      );
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["products"] });
    },
  });
}

export function useUpdateProduct() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      id: bigint;
      name: string;
      hsnCode: string;
      gstRate: bigint;
      purchasePrice: bigint;
      sellingPrice: bigint;
      stockQuantity: bigint;
    }) => {
      if (!actor) throw new Error("Not ready");
      return actor.updateProduct(
        data.id,
        data.name,
        data.hsnCode,
        data.gstRate,
        data.purchasePrice,
        data.sellingPrice,
        data.stockQuantity,
      );
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["products"] });
    },
  });
}

export function useDeleteProduct() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error("Not ready");
      return actor.deleteProduct(id);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["products"] });
    },
  });
}

// ─── Invoices ─────────────────────────────────────────────────────
export function useInvoices() {
  const { actor, isFetching } = useActor();
  const { activeBusinessId } = useBusiness();
  return useQuery<Invoice[]>({
    queryKey: ["invoices", activeBusinessId?.toString()],
    queryFn: async () => {
      if (!actor || activeBusinessId === null) return [];
      return actor.getInvoices(activeBusinessId);
    },
    enabled: !!actor && !isFetching && activeBusinessId !== null,
    staleTime: 30_000,
  });
}

export function useCreateInvoice() {
  const { actor } = useActor();
  const { activeBusinessId } = useBusiness();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      customerId: bigint;
      invoiceNumber: string;
      invoiceDate: bigint;
      dueDate: bigint;
      items: Array<[bigint, string, bigint, bigint, bigint]>;
    }) => {
      if (!actor || activeBusinessId === null) throw new Error("Not ready");
      return actor.createInvoice(
        activeBusinessId,
        data.customerId,
        data.invoiceNumber,
        data.invoiceDate,
        data.dueDate,
        data.items,
      );
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["invoices"] });
      void qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

export function useUpdateInvoiceStatus() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: { id: bigint; status: InvoiceStatus }) => {
      if (!actor) throw new Error("Not ready");
      return actor.updateInvoiceStatus(data.id, data.status);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["invoices"] });
      void qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

export function useAddPayment() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      invoiceId: bigint;
      amount: bigint;
      paymentDate: bigint;
      paymentMode: string;
      referenceNo: string;
    }) => {
      if (!actor) throw new Error("Not ready");
      return actor.addPaymentToInvoice(
        data.invoiceId,
        data.amount,
        data.paymentDate,
        data.paymentMode,
        data.referenceNo,
      );
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["invoices"] });
      void qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

export function useDeleteInvoice() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error("Not ready");
      return actor.deleteInvoice(id);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["invoices"] });
      void qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

// ─── Expenses ─────────────────────────────────────────────────────
export function useExpenses() {
  const { actor, isFetching } = useActor();
  const { activeBusinessId } = useBusiness();
  return useQuery<Expense[]>({
    queryKey: ["expenses", activeBusinessId?.toString()],
    queryFn: async () => {
      if (!actor || activeBusinessId === null) return [];
      return actor.getExpenses(activeBusinessId);
    },
    enabled: !!actor && !isFetching && activeBusinessId !== null,
    staleTime: 30_000,
  });
}

export function useCreateExpense() {
  const { actor } = useActor();
  const { activeBusinessId } = useBusiness();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      vendorId: bigint | null;
      category: string;
      amount: bigint;
      gstAmount: bigint;
      expenseDate: bigint;
      description: string;
    }) => {
      if (!actor || activeBusinessId === null) throw new Error("Not ready");
      return actor.createExpense(
        activeBusinessId,
        data.vendorId,
        data.category,
        data.amount,
        data.gstAmount,
        data.expenseDate,
        data.description,
      );
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["expenses"] });
      void qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

export function useUpdateExpense() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      id: bigint;
      category: string;
      amount: bigint;
      gstAmount: bigint;
      expenseDate: bigint;
      description: string;
    }) => {
      if (!actor) throw new Error("Not ready");
      return actor.updateExpense(
        data.id,
        data.category,
        data.amount,
        data.gstAmount,
        data.expenseDate,
        data.description,
      );
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["expenses"] });
    },
  });
}

export function useDeleteExpense() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error("Not ready");
      return actor.deleteExpense(id);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["expenses"] });
    },
  });
}

// ─── Subscription ─────────────────────────────────────────────────
export function useSubscriptionStatus() {
  const { actor, isFetching } = useActor();
  const { identity } = useInternetIdentityHook();
  return useQuery<SubscriptionStatus>({
    queryKey: ["subscription", identity?.getPrincipal().toString()],
    queryFn: async () => {
      if (!actor || !identity) throw new Error("Not ready");
      return actor.getSubscriptionStatus(identity.getPrincipal());
    },
    enabled: !!actor && !isFetching && !!identity,
    staleTime: 60_000,
  });
}

// Import hook inline to avoid circular dependency
import { useInternetIdentity as useInternetIdentityHook } from "./useInternetIdentity";

// ─── Ledger (Local Double-Entry Accounting) ────────────────────────
// These use localStorage for persistence since the backend doesn't support
// double-entry accounting yet. In a future upgrade, these will call actor methods.

export interface LocalChartOfAccount {
  id: string;
  businessId: string;
  code: string;
  name: string;
  accountType: "Asset" | "Liability" | "Income" | "Expense" | "Capital";
  isSystem: boolean;
  createdAt: number;
}

export interface LocalJournalEntryLine {
  accountId: string;
  debit: number; // in paise
  credit: number; // in paise
}

export interface LocalJournalEntry {
  id: string;
  businessId: string;
  entryDate: number;
  narration: string;
  reference: string;
  lines: LocalJournalEntryLine[];
  createdAt: number;
}

export interface LedgerLineLocal {
  journalEntryId: string;
  entryDate: number;
  narration: string;
  reference: string;
  debit: number;
  credit: number;
  balance: number;
}

export interface LedgerResultLocal {
  account: LocalChartOfAccount;
  lines: LedgerLineLocal[];
  totalDebit: number;
  totalCredit: number;
  closingBalance: number;
}

const DEFAULT_ACCOUNTS: Omit<
  LocalChartOfAccount,
  "id" | "businessId" | "createdAt"
>[] = [
  { code: "1001", name: "Cash", accountType: "Asset", isSystem: true },
  { code: "1002", name: "Bank Account", accountType: "Asset", isSystem: true },
  {
    code: "1100",
    name: "Accounts Receivable",
    accountType: "Asset",
    isSystem: true,
  },
  {
    code: "1200",
    name: "GST Input Credit",
    accountType: "Asset",
    isSystem: true,
  },
  {
    code: "1300",
    name: "Inventory / Stock",
    accountType: "Asset",
    isSystem: true,
  },
  {
    code: "2001",
    name: "Accounts Payable",
    accountType: "Liability",
    isSystem: true,
  },
  {
    code: "2100",
    name: "GST Output Payable",
    accountType: "Liability",
    isSystem: true,
  },
  {
    code: "2200",
    name: "TDS Payable",
    accountType: "Liability",
    isSystem: true,
  },
  {
    code: "3001",
    name: "Owner's Capital",
    accountType: "Capital",
    isSystem: true,
  },
  {
    code: "3100",
    name: "Retained Earnings",
    accountType: "Capital",
    isSystem: true,
  },
  {
    code: "4001",
    name: "Sales Revenue",
    accountType: "Income",
    isSystem: true,
  },
  {
    code: "4100",
    name: "Service Income",
    accountType: "Income",
    isSystem: true,
  },
  {
    code: "5001",
    name: "Cost of Goods Sold",
    accountType: "Expense",
    isSystem: true,
  },
  {
    code: "5100",
    name: "Office Expenses",
    accountType: "Expense",
    isSystem: true,
  },
  {
    code: "5200",
    name: "Rent Expense",
    accountType: "Expense",
    isSystem: true,
  },
  {
    code: "5300",
    name: "Salary & Wages",
    accountType: "Expense",
    isSystem: true,
  },
  { code: "5400", name: "Utilities", accountType: "Expense", isSystem: true },
  {
    code: "5500",
    name: "Marketing & Advertising",
    accountType: "Expense",
    isSystem: true,
  },
];

function getLedgerAccounts(businessId: string): LocalChartOfAccount[] {
  const key = `ledger_accounts_${businessId}`;
  const stored = localStorage.getItem(key);
  if (stored) {
    try {
      return JSON.parse(stored) as LocalChartOfAccount[];
    } catch {
      // fall through to initialize
    }
  }
  // Initialize with default accounts
  const accounts: LocalChartOfAccount[] = DEFAULT_ACCOUNTS.map((a, i) => ({
    ...a,
    id: `sys_${i + 1}`,
    businessId,
    createdAt: Date.now() - i * 1000,
  }));
  localStorage.setItem(key, JSON.stringify(accounts));
  return accounts;
}

function saveLedgerAccounts(
  businessId: string,
  accounts: LocalChartOfAccount[],
) {
  localStorage.setItem(
    `ledger_accounts_${businessId}`,
    JSON.stringify(accounts),
  );
}

function getJournalEntries(businessId: string): LocalJournalEntry[] {
  const stored = localStorage.getItem(`journal_entries_${businessId}`);
  if (!stored) return [];
  try {
    return JSON.parse(stored) as LocalJournalEntry[];
  } catch {
    return [];
  }
}

function saveJournalEntries(businessId: string, entries: LocalJournalEntry[]) {
  localStorage.setItem(
    `journal_entries_${businessId}`,
    JSON.stringify(entries),
  );
}

export function useAccounts() {
  const { activeBusinessId } = useBusiness();
  return useQuery<LocalChartOfAccount[]>({
    queryKey: ["accounts", activeBusinessId?.toString()],
    queryFn: () => {
      if (!activeBusinessId) return [];
      return getLedgerAccounts(activeBusinessId.toString());
    },
    enabled: activeBusinessId !== null,
    staleTime: 0,
  });
}

export function useCreateAccount() {
  const { activeBusinessId } = useBusiness();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      code: string;
      name: string;
      accountType: LocalChartOfAccount["accountType"];
    }) => {
      if (!activeBusinessId) throw new Error("No business");
      const accounts = getLedgerAccounts(activeBusinessId.toString());
      const newAcc: LocalChartOfAccount = {
        id: `custom_${Date.now()}`,
        businessId: activeBusinessId.toString(),
        code: data.code,
        name: data.name,
        accountType: data.accountType,
        isSystem: false,
        createdAt: Date.now(),
      };
      saveLedgerAccounts(activeBusinessId.toString(), [...accounts, newAcc]);
      return newAcc.id;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["accounts"] });
    },
  });
}

export function useDeleteAccount() {
  const { activeBusinessId } = useBusiness();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      if (!activeBusinessId) throw new Error("No business");
      const accounts = getLedgerAccounts(activeBusinessId.toString());
      const filtered = accounts.filter((a) => a.id !== id);
      saveLedgerAccounts(activeBusinessId.toString(), filtered);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["accounts"] });
      void qc.invalidateQueries({ queryKey: ["journal_entries"] });
    },
  });
}

export function useJournalEntries() {
  const { activeBusinessId } = useBusiness();
  return useQuery<LocalJournalEntry[]>({
    queryKey: ["journal_entries", activeBusinessId?.toString()],
    queryFn: () => {
      if (!activeBusinessId) return [];
      return getJournalEntries(activeBusinessId.toString());
    },
    enabled: activeBusinessId !== null,
    staleTime: 0,
  });
}

export function useCreateJournalEntry() {
  const { activeBusinessId } = useBusiness();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      narration: string;
      reference: string;
      entryDate: number;
      lines: LocalJournalEntryLine[];
    }) => {
      if (!activeBusinessId) throw new Error("No business");
      const entries = getJournalEntries(activeBusinessId.toString());
      const entry: LocalJournalEntry = {
        id: `je_${Date.now()}`,
        businessId: activeBusinessId.toString(),
        entryDate: data.entryDate,
        narration: data.narration,
        reference: data.reference,
        lines: data.lines,
        createdAt: Date.now(),
      };
      saveJournalEntries(activeBusinessId.toString(), [...entries, entry]);
      return entry.id;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["journal_entries"] });
      void qc.invalidateQueries({ queryKey: ["ledger"] });
    },
  });
}

export function useLedger(accountId: string | null) {
  const { activeBusinessId } = useBusiness();
  return useQuery<LedgerResultLocal | null>({
    queryKey: ["ledger", activeBusinessId?.toString(), accountId],
    queryFn: () => {
      if (!activeBusinessId || !accountId) return null;
      const accounts = getLedgerAccounts(activeBusinessId.toString());
      const account = accounts.find((a) => a.id === accountId);
      if (!account) return null;
      const entries = getJournalEntries(activeBusinessId.toString());
      const lines: LedgerLineLocal[] = [];
      let balance = 0;
      // Sort entries by date
      const sorted = [...entries].sort((a, b) => a.entryDate - b.entryDate);
      for (const entry of sorted) {
        for (const line of entry.lines) {
          if (line.accountId === accountId) {
            const isDebit = line.debit > 0;
            if (isDebit) {
              balance += line.debit;
            } else {
              balance -= line.credit;
            }
            lines.push({
              journalEntryId: entry.id,
              entryDate: entry.entryDate,
              narration: entry.narration,
              reference: entry.reference,
              debit: line.debit,
              credit: line.credit,
              balance,
            });
          }
        }
      }
      const totalDebit = lines.reduce((s, l) => s + l.debit, 0);
      const totalCredit = lines.reduce((s, l) => s + l.credit, 0);
      return {
        account,
        lines,
        totalDebit,
        totalCredit,
        closingBalance: totalDebit - totalCredit,
      };
    },
    enabled: activeBusinessId !== null && accountId !== null,
    staleTime: 0,
  });
}
